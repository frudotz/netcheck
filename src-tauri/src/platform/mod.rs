// Platform sınırı: işletim sistemine göre değişen kod yalnızca bu modülde yaşar.
// Diğer modüller (network, diagnostics, report_id) platformdan bağımsızdır ve buradaki
// arayüzleri kullanır. Tauri'nin `desktop` / `mobile` cfg takma adları kullanılır.
pub mod icmp;

use serde::Serialize;

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Family {
    Desktop,
    Mobile,
}

/// Ön yüzün çalışma ortamını doğru göstermesi için (ör. Ayarlar → "Çalışma ortamı").
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PlatformInfo {
    /// `std::env::consts::OS`: "windows", "macos", "linux", "android", "ios"
    pub os: &'static str,
    pub family: Family,
    /// Bu derlemede ICMP (ping) testlerini hangi yöntemin yaptığı.
    pub icmp: icmp::Backend,
}

pub fn info() -> PlatformInfo {
    PlatformInfo {
        os: std::env::consts::OS,
        family: if cfg!(mobile) { Family::Mobile } else { Family::Desktop },
        icmp: icmp::BACKEND,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn desktop_build_reports_desktop_family() {
        let info = info();
        assert_eq!(info.os, std::env::consts::OS);
        if cfg!(desktop) {
            assert_eq!(info.family, Family::Desktop);
            assert_ne!(info.icmp, icmp::Backend::Unavailable);
        }
    }
}
