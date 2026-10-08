// ICMP echo (ping) — platforma özgü arka uçlar. Hedef her zaman doğrulanmış bir `IpAddr`'dir;
// kullanıcı girdisi kabuğa veya komut satırına aktarılmaz.
//
// | Derleme hedefi          | Arka uç       | Not                                                    |
// |-------------------------|---------------|--------------------------------------------------------|
// | Windows                 | `IcmpApi`     | iphlpapi `IcmpSendEcho`; yönetici yetkisi gerekmez      |
// | macOS / Linux (desktop) | `SystemPing`  | sistem `ping` ikilisi, sabit argümanlar                  |
// | Android                 | `IcmpSocket`  | ayrıcalıksız ICMP datagram soketi (gerçek ICMP echo)      |
// | iOS                     | `IcmpSocket`  | Darwin ICMP datagram soketi; iOS cihaz/simülatörde **doğrulanmadı** |
use serde::Serialize;

/// Her derleme hedefi yalnızca kendi arka ucunu kurar; diğer varyantlar o hedefte kullanılmaz.
#[allow(dead_code)]
#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "kebab-case")]
pub enum Backend {
    IcmpApi,
    SystemPing,
    /// `socket(AF_INET, SOCK_DGRAM, IPPROTO_ICMP)` — gerçek ICMP echo, root gerektirmez.
    IcmpSocket,
    Unavailable,
}

/// Tanılama katmanı bu hataları kendi durum/kod modeline çevirir.
#[allow(dead_code)]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum EchoError {
    /// Yanıt zaman aşımında gelmedi.
    Timeout,
    /// Hedefe ulaşılamadı veya yanıt okunamadı.
    Unreachable,
    /// Bu platformda / bu adres ailesi için ICMP kullanılamıyor.
    Unsupported,
}

pub use imp::{echo, BACKEND};

#[cfg(windows)]
mod imp {
    use super::{Backend, EchoError};
    use std::mem::size_of;
    use std::net::IpAddr;
    use std::ptr;
    use std::time::Duration;
    use windows_sys::Win32::Foundation::{GetLastError, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::NetworkManagement::IpHelper::{
        IcmpCloseHandle, IcmpCreateFile, IcmpSendEcho, ICMP_ECHO_REPLY, IP_REQ_TIMED_OUT, IP_SUCCESS,
    };

    pub const BACKEND: Backend = Backend::IcmpApi;

    /// iphlpapi `IcmpSendEcho` — gerçek RTT (ms) döner.
    pub fn echo(addr: IpAddr, timeout: Duration) -> Result<f64, EchoError> {
        // IPv6 hedefler (yalnızca IPv6 gateway) bu sürümde desteklenmez.
        let IpAddr::V4(v4) = addr else { return Err(EchoError::Unsupported) };

        let payload = *b"NetCheck";
        // Yanıt arabelleği: yanıt yapısı + veri + ICMP hata mesajı için pay (MS belgelerindeki öneri).
        let mut reply = vec![0u8; size_of::<ICMP_ECHO_REPLY>() + payload.len() + 8 + 64];

        unsafe {
            let handle = IcmpCreateFile();
            if handle == INVALID_HANDLE_VALUE {
                return Err(EchoError::Unsupported);
            }
            let count = IcmpSendEcho(
                handle,
                u32::from_ne_bytes(v4.octets()), // ağ bayt sırası
                payload.as_ptr().cast(),
                payload.len() as u16,
                ptr::null(),
                reply.as_mut_ptr().cast(),
                reply.len() as u32,
                timeout.as_millis() as u32,
            );
            let last_error = GetLastError();
            IcmpCloseHandle(handle);

            if count == 0 {
                return Err(if last_error == IP_REQ_TIMED_OUT { EchoError::Timeout } else { EchoError::Unreachable });
            }
            // Vec<u8> hizalı değildir; yapı hizasız okunur.
            let echo = ptr::read_unaligned(reply.as_ptr().cast::<ICMP_ECHO_REPLY>());
            match echo.Status {
                IP_SUCCESS => Ok(echo.RoundTripTime as f64),
                IP_REQ_TIMED_OUT => Err(EchoError::Timeout),
                _ => Err(EchoError::Unreachable),
            }
        }
    }
}

#[cfg(all(desktop, not(windows)))]
mod imp {
    use super::{Backend, EchoError};
    use std::net::IpAddr;
    use std::process::Command;
    use std::time::Duration;

    pub const BACKEND: Backend = Backend::SystemPing;

    /// Sistem `ping` ikilisi; kabuk kullanılmaz, argümanlar sabit, hedef yalnızca doğrulanmış `IpAddr`.
    pub fn echo(addr: IpAddr, timeout: Duration) -> Result<f64, EchoError> {
        let IpAddr::V4(v4) = addr else { return Err(EchoError::Unsupported) };
        let secs = timeout.as_secs().max(1).to_string();
        let mut cmd = Command::new("ping");
        cmd.args(["-n", "-c", "1"]);
        if cfg!(target_os = "macos") {
            cmd.args(["-t", &secs]);
        } else {
            cmd.args(["-W", &secs]);
        }
        cmd.arg(v4.to_string());

        let output = cmd.output().map_err(|_| EchoError::Unsupported)?;
        if !output.status.success() {
            return Err(EchoError::Timeout);
        }
        let stdout = String::from_utf8_lossy(&output.stdout);
        stdout
            .split("time=")
            .nth(1)
            .and_then(|rest| rest.split(|c: char| !(c.is_ascii_digit() || c == '.')).next())
            .and_then(|ms| ms.parse::<f64>().ok())
            .ok_or(EchoError::Unreachable)
    }
}

/// ICMP echo paketi yardımcıları (saf fonksiyonlar; host üzerinde birim testlenir).
#[cfg(any(target_os = "android", target_os = "ios", test))]
mod packet {
    const ECHO_REQUEST: u8 = 8;
    const ECHO_REPLY: u8 = 0;

    /// RFC 1071 internet sağlama toplamı.
    pub fn checksum(data: &[u8]) -> u16 {
        let mut sum: u32 = 0;
        for chunk in data.chunks(2) {
            let word = if chunk.len() == 2 { u16::from_be_bytes([chunk[0], chunk[1]]) } else { u16::from(chunk[0]) << 8 };
            sum += u32::from(word);
        }
        while sum >> 16 != 0 {
            sum = (sum & 0xffff) + (sum >> 16);
        }
        !(sum as u16)
    }

    /// Echo request: tür 8, kod 0, tanımlayıcı, sıra no. Linux/Android datagram ICMP soketinde çekirdek
    /// tanımlayıcıyı yerel portla değiştirir (0 verilir); Darwin değiştirmez (benzersiz değer verilir).
    pub fn echo_request(id: u16, seq: u16, payload: &[u8]) -> Vec<u8> {
        let mut p = vec![ECHO_REQUEST, 0, 0, 0];
        p.extend_from_slice(&id.to_be_bytes());
        p.extend_from_slice(&seq.to_be_bytes());
        p.extend_from_slice(payload);
        let c = checksum(&p);
        p[2..4].copy_from_slice(&c.to_be_bytes());
        p
    }

    /// Datagram ICMP soketi IP başlığı olmadan ICMP mesajını döndürür.
    pub fn is_echo_reply(buf: &[u8], seq: u16) -> bool {
        buf.len() >= 8 && buf[0] == ECHO_REPLY && buf[1] == 0 && u16::from_be_bytes([buf[6], buf[7]]) == seq
    }

    /// Darwin datagram ICMP soketi IPv4 yanıtını IP başlığıyla döndürür ve çekirdek yanıtları kimliğe göre
    /// ayırmaz: başlık atlanır, tanımlayıcı da eşleşmelidir.
    #[cfg(any(target_os = "ios", test))]
    pub fn is_echo_reply_with_ip_header(buf: &[u8], id: u16, seq: u16) -> bool {
        if buf.len() < 20 || buf[0] >> 4 != 4 {
            return false;
        }
        let Some(icmp) = buf.get(usize::from(buf[0] & 0x0f) * 4..) else { return false };
        is_echo_reply(icmp, seq) && u16::from_be_bytes([icmp[4], icmp[5]]) == id
    }
}

/// Darwin (iOS; birim testi macOS'ta) ayrıcalıksız ICMP datagram soketi — Apple'ın SimplePing örneğiyle
/// aynı genel BSD soket API'si; özel API, yetki (entitlement) veya süreç başlatma yok.
#[cfg(any(target_os = "ios", all(test, target_os = "macos")))]
mod darwin {
    use super::{packet, EchoError};
    use socket2::{Domain, Protocol, Socket, Type};
    use std::io::ErrorKind;
    use std::net::{IpAddr, SocketAddr, UdpSocket};
    use std::sync::atomic::{AtomicU16, Ordering};
    use std::time::{Duration, Instant};

    const SEQ: u16 = 1;
    /// Eşzamanlı istekler aynı yanıtları görür; her soket süreç içinde benzersiz bir tanımlayıcı kullanır.
    static NEXT_ID: AtomicU16 = AtomicU16::new(0);

    pub fn echo(addr: IpAddr, timeout: Duration) -> Result<f64, EchoError> {
        let IpAddr::V4(v4) = addr else { return Err(EchoError::Unsupported) };
        let socket: UdpSocket = Socket::new(Domain::IPV4, Type::DGRAM, Some(Protocol::ICMPV4))
            .map_err(|_| EchoError::Unsupported)?
            .into();
        let id = (std::process::id() as u16).wrapping_add(NEXT_ID.fetch_add(1, Ordering::Relaxed));
        let request = packet::echo_request(id, SEQ, b"NetCheck");
        let start = Instant::now();
        socket.send_to(&request, SocketAddr::new(addr, 0)).map_err(|_| EchoError::Unreachable)?;

        let mut buf = [0u8; 512];
        loop {
            let remaining = timeout.checked_sub(start.elapsed()).filter(|d| !d.is_zero()).ok_or(EchoError::Timeout)?;
            socket.set_read_timeout(Some(remaining)).map_err(|_| EchoError::Unreachable)?;
            match socket.recv_from(&mut buf) {
                Ok((n, from)) if from.ip() == IpAddr::V4(v4) && packet::is_echo_reply_with_ip_header(&buf[..n], id, SEQ) => {
                    return Ok((start.elapsed().as_secs_f64() * 1000.0 * 10.0).round() / 10.0);
                }
                Ok(_) => continue, // başka bir isteğin yanıtı veya başka bir ICMP mesajı
                Err(e) if matches!(e.kind(), ErrorKind::WouldBlock | ErrorKind::TimedOut) => return Err(EchoError::Timeout),
                Err(_) => return Err(EchoError::Unreachable),
            }
        }
    }
}

#[cfg(target_os = "android")]
mod imp {
    use super::{packet, Backend, EchoError};
    use socket2::{Domain, Protocol, Socket, Type};
    use std::io::ErrorKind;
    use std::net::{IpAddr, SocketAddr, UdpSocket};
    use std::time::{Duration, Instant};

    pub const BACKEND: Backend = Backend::IcmpSocket;

    /// Her istek kendi soketini kullanır ve çekirdek her sokete ayrı ICMP kimliği atar; sıra no 1 yeterli
    /// (iputils `ping` gibi). Süreç genelinde artan sayaç, eşzamanlı isteklerde emülatör NAT'ında yanıt kaybına yol açtı.
    const SEQ: u16 = 1;

    /// Android: ayrıcalıksız ICMP datagram soketi (`net.ipv4.ping_group_range` uygulamalara izin verir).
    /// Masaüstü `ping` ikilisine veya süreç başlatmaya bağlı değildir. Soket açılamazsa `Unsupported`.
    pub fn echo(addr: IpAddr, timeout: Duration) -> Result<f64, EchoError> {
        let IpAddr::V4(v4) = addr else { return Err(EchoError::Unsupported) };
        let socket: UdpSocket = Socket::new(Domain::IPV4, Type::DGRAM, Some(Protocol::ICMPV4))
            .map_err(|_| EchoError::Unsupported)?
            .into();
        // Bağlanmamış soket + send_to/recv_from (iputils `ping` ile aynı); çekirdek yanıtları soket
        // kimliğine göre ayırır, burada ayrıca tür ve sıra numarası doğrulanır.
        let seq = SEQ;
        let request = packet::echo_request(0, seq, b"NetCheck");
        let start = Instant::now();
        socket.send_to(&request, SocketAddr::new(IpAddr::V4(v4), 0)).map_err(|_| EchoError::Unreachable)?;

        let mut buf = [0u8; 256];
        loop {
            let remaining = timeout.checked_sub(start.elapsed()).filter(|d| !d.is_zero()).ok_or(EchoError::Timeout)?;
            socket.set_read_timeout(Some(remaining)).map_err(|_| EchoError::Unreachable)?;
            match socket.recv_from(&mut buf) {
                Ok((n, _)) if packet::is_echo_reply(&buf[..n], seq) => {
                    return Ok((start.elapsed().as_secs_f64() * 1000.0 * 10.0).round() / 10.0);
                }
                Ok(_) => continue, // başka bir yanıt; bekleme süresi içinde okumaya devam
                Err(e) if matches!(e.kind(), ErrorKind::WouldBlock | ErrorKind::TimedOut) => return Err(EchoError::Timeout),
                Err(_) => return Err(EchoError::Unreachable),
            }
        }
    }
}

#[cfg(target_os = "ios")]
mod imp {
    use super::Backend;

    /// iOS: Darwin ICMP datagram soketi. Soket açılamazsa `Unsupported` → "Kullanılamıyor"; sahte sonuç yok.
    pub const BACKEND: Backend = Backend::IcmpSocket;
    pub use super::darwin::echo;
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr};
    use std::time::Duration;

    #[test]
    fn echo_request_has_valid_checksum() {
        let p = packet::echo_request(0x1234, 7, b"NetCheck");
        assert_eq!(&p[..2], &[8, 0]);
        assert_eq!(u16::from_be_bytes([p[4], p[5]]), 0x1234);
        assert_eq!(u16::from_be_bytes([p[6], p[7]]), 7);
        assert_eq!(packet::checksum(&p), 0, "checksum over a packet including its checksum must be 0");
    }

    #[test]
    fn echo_reply_matching() {
        let mut reply = packet::echo_request(0, 9, b"NetCheck");
        reply[0] = 0; // echo reply
        assert!(packet::is_echo_reply(&reply, 9));
        assert!(!packet::is_echo_reply(&reply, 10));
        assert!(!packet::is_echo_reply(&packet::echo_request(0, 9, b""), 9)); // request, not reply
        assert!(!packet::is_echo_reply(&[0, 0, 0], 9));
    }

    #[test]
    fn darwin_reply_with_ip_header_matching() {
        let mut icmp = packet::echo_request(0xbeef, 1, b"NetCheck");
        icmp[0] = 0;
        let mut datagram = vec![0x45, 0, 0, 0, 0, 0, 0, 0, 64, 1, 0, 0, 127, 0, 0, 1, 127, 0, 0, 1];
        datagram.extend_from_slice(&icmp);
        assert!(packet::is_echo_reply_with_ip_header(&datagram, 0xbeef, 1));
        assert!(!packet::is_echo_reply_with_ip_header(&datagram, 0xbeee, 1)); // başka bir soketin yanıtı
        assert!(!packet::is_echo_reply_with_ip_header(&datagram, 0xbeef, 2));
        assert!(!packet::is_echo_reply_with_ip_header(&icmp, 0xbeef, 1)); // IP başlığı yok
        assert!(!packet::is_echo_reply_with_ip_header(&datagram[..22], 0xbeef, 1));
    }

    /// iOS ile aynı XNU çekirdek yolu macOS CI'da gerçek soketle denenir (geri döngü adresine eşzamanlı ping).
    #[cfg(target_os = "macos")]
    #[test]
    fn darwin_icmp_socket_concurrent_loopback() {
        let handles: Vec<_> = (0..3)
            .map(|_| std::thread::spawn(|| darwin::echo(IpAddr::V4(Ipv4Addr::LOCALHOST), Duration::from_secs(2))))
            .collect();
        for h in handles {
            let r = h.join().unwrap();
            assert!(matches!(r, Ok(ms) if ms >= 0.0), "{r:?}");
        }
    }

    #[test]
    fn ipv6_targets_are_unsupported() {
        let r = echo(IpAddr::V6("2001:db8::1".parse().unwrap()), Duration::from_secs(1));
        assert_eq!(r, Err(EchoError::Unsupported));
    }

    #[cfg(desktop)]
    #[test]
    fn unroutable_address_fails_cleanly() {
        // TEST-NET-1 (RFC 5737) — yanıt vermemesi beklenir.
        let r = echo(IpAddr::V4(Ipv4Addr::new(192, 0, 2, 1)), Duration::from_secs(2));
        assert!(matches!(r, Err(EchoError::Timeout | EchoError::Unreachable)), "{r:?}");
    }
}
