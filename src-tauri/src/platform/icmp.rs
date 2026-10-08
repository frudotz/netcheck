// ICMP echo (ping) — platforma özgü arka uçlar. Hedef her zaman doğrulanmış bir `IpAddr`'dir;
// kullanıcı girdisi kabuğa veya komut satırına aktarılmaz.
//
// | Derleme hedefi          | Arka uç       | Not                                                    |
// |-------------------------|---------------|--------------------------------------------------------|
// | Windows                 | `IcmpApi`     | iphlpapi `IcmpSendEcho`; yönetici yetkisi gerekmez      |
// | macOS / Linux (desktop) | `SystemPing`  | sistem `ping` ikilisi, sabit argümanlar                  |
// | Android / iOS (mobile)  | `Unavailable` | Mobil ICMP henüz uygulanmadı → test "Kullanılamıyor"     |
use serde::Serialize;

/// Her derleme hedefi yalnızca kendi arka ucunu kurar; diğer varyantlar o hedefte kullanılmaz.
#[allow(dead_code)]
#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "kebab-case")]
pub enum Backend {
    IcmpApi,
    SystemPing,
    Unavailable,
}

/// Tanılama katmanı bu hataları kendi durum/kod modeline çevirir.
/// Mobil arka uç yalnızca `Unsupported` üretir; diğer varyantlar orada kullanılmaz.
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

#[cfg(mobile)]
mod imp {
    use super::{Backend, EchoError};
    use std::net::IpAddr;
    use std::time::Duration;

    pub const BACKEND: Backend = Backend::Unavailable;

    /// Android/iOS: masaüstü yöntemleri (iphlpapi, süreç başlatma) mobilde uygun değil.
    /// Platforma özgü ICMP uygulanana kadar açıkça "kullanılamıyor" döner; sahte sonuç üretilmez.
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
