// ICMP echo (ping) — platforma özgü arka uçlar. Hedef her zaman doğrulanmış bir `IpAddr`'dir;
// kullanıcı girdisi kabuğa veya komut satırına aktarılmaz.
//
// | Derleme hedefi          | Arka uç       | Not                                                    |
// |-------------------------|---------------|--------------------------------------------------------|
// | Windows                 | `IcmpApi`     | iphlpapi `IcmpSendEcho`; yönetici yetkisi gerekmez      |
// | macOS / Linux (desktop) | `SystemPing`  | sistem `ping` ikilisi, sabit argümanlar                  |
// | Android                 | `IcmpSocket`  | ayrıcalıksız ICMP datagram soketi (gerçek ICMP echo)      |
// | iOS                     | `Unavailable` | henüz uygulanmadı → test "Kullanılamıyor"                |
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
/// iOS arka ucu yalnızca `Unsupported` üretir; diğer varyantlar orada kullanılmaz.
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
#[cfg(any(target_os = "android", test))]
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

    /// Echo request: tür 8, kod 0, tanımlayıcı 0 (datagram ICMP soketinde çekirdek yerel portu yazar), sıra no.
    pub fn echo_request(seq: u16, payload: &[u8]) -> Vec<u8> {
        let mut p = vec![ECHO_REQUEST, 0, 0, 0, 0, 0];
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
        let request = packet::echo_request(seq, b"NetCheck");
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
    use super::{Backend, EchoError};
    use std::net::IpAddr;
    use std::time::Duration;

    pub const BACKEND: Backend = Backend::Unavailable;

    /// iOS: henüz uygulanmadı (feature/ios). Açıkça "kullanılamıyor" döner; sahte sonuç üretilmez.
    pub fn echo(_addr: IpAddr, _timeout: Duration) -> Result<f64, EchoError> {
        Err(EchoError::Unsupported)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr};
    use std::time::Duration;

    #[test]
    fn echo_request_has_valid_checksum() {
        let p = packet::echo_request(7, b"NetCheck");
        assert_eq!(&p[..2], &[8, 0]);
        assert_eq!(u16::from_be_bytes([p[6], p[7]]), 7);
        assert_eq!(packet::checksum(&p), 0, "checksum over a packet including its checksum must be 0");
    }

    #[test]
    fn echo_reply_matching() {
        let mut reply = packet::echo_request(9, b"NetCheck");
        reply[0] = 0; // echo reply
        assert!(packet::is_echo_reply(&reply, 9));
        assert!(!packet::is_echo_reply(&reply, 10));
        assert!(!packet::is_echo_reply(&packet::echo_request(9, b""), 9)); // request, not reply
        assert!(!packet::is_echo_reply(&[0, 0, 0], 9));
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
