// İzin envanteri (yetkiler): uygulamanın bu derleme hedefinde bildirdiği, gerektirmediği ve
// bilinçli olarak istemediği izinler. Statik bir sözleşmedir: işletim sisteminden okunmaz, hiçbir
// sistem diyaloğu açmaz ve çalışma zamanı izni istemez. Tek kaynak buradaki tablolardır; Android
// manifesti, iOS Info.plist ve Tauri capability dosyasıyla tutarlılığı testler denetler.
// Belge: docs/izinler.md · Ekran: /izinler · Ön yüz tipi: src/lib/types/permission.ts
use serde::Serialize;

/// İznin türü: işletim sistemi izni ya da Tauri capability yetkisi.
#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "kebab-case")]
pub enum PermissionKind {
    Os,
    Tauri,
}

/// İznin bu derleme hedefindeki durumu. Hiçbiri canlı sistem durumu değildir.
#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "kebab-case")]
pub enum PermissionStatus {
    /// Manifest, Info.plist ya da capability dosyasında bildirilmiş; kurulum anında verilir.
    Declared,
    /// Bu platform bu yetenek için izin kavramı tanımlamaz.
    NotNeeded,
    /// Uygulama bilinçli olarak istemez; yapılandırmada yoktur.
    NotRequested,
    /// Gerekip gerekmediği cihazda henüz doğrulanmadı (karar D-54).
    Unverified,
}

/// Ön yüzün /izinler ekranında gösterdiği tek izin kaydı. Metinler sözlükten `id` ile gelir.
#[derive(Serialize, Clone, Copy, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PermissionEntry {
    /// Sözlük anahtarı (ad ve gerekçe): internet, network-state, wifi-state, local-network,
    /// external-link, notifications, location, camera, microphone.
    pub id: &'static str,
    pub kind: PermissionKind,
    /// Derleme hedefi: `std::env::consts::OS`.
    pub os: &'static str,
    /// Platformun teknik kimliği (manifest izni, Info.plist anahtarı, capability adı); yoksa `None`.
    pub technical_id: Option<&'static str>,
    /// Uygulamanın temel işlevi bu izin olmadan çalışmaz.
    pub required: bool,
    /// Kullanıcıya çalışma zamanında sistem diyaloğu gösterilir mi: `Some(false)` gösterilmez,
    /// `Some(true)` gösterilir (bugün hiçbir kayıtta yok), `None` cihazda doğrulanmadı.
    pub runtime_prompt: Option<bool>,
    pub status: PermissionStatus,
    /// Etkilenen özellikler (`src/lib/types/command.ts` `Feature` değerleri).
    pub features: &'static [&'static str],
}

const NETWORK_FEATURES: &[&str] = &["network-snapshot", "ping", "dns-test", "https-test"];

const fn entry(
    id: &'static str,
    kind: PermissionKind,
    os: &'static str,
    technical_id: Option<&'static str>,
    required: bool,
    status: PermissionStatus,
    features: &'static [&'static str],
) -> PermissionEntry {
    PermissionEntry { id, kind, os, technical_id, required, runtime_prompt: Some(false), status, features }
}

/// Davranışı cihazda doğrulanmamış kayıt: sistem diyaloğu açılıp açılmayacağı bilinmiyor (D-54).
const fn unverified(id: &'static str, os: &'static str, technical_id: &'static str, features: &'static [&'static str]) -> PermissionEntry {
    PermissionEntry { id, kind: PermissionKind::Os, os, technical_id: Some(technical_id), required: false, runtime_prompt: None, status: PermissionStatus::Unverified, features }
}

/// Tauri opener yetkisi: bağlantıyı varsayılan tarayıcıda açar; beş hedefte aynı.
const fn opener(os: &'static str) -> PermissionEntry {
    entry("external-link", PermissionKind::Tauri, os, Some("opener:default"), false, PermissionStatus::Declared, &["external-link"])
}

/// Android: yalnız iki kurulum anı izni (karar: least-privilege mobile permissions).
pub const ANDROID: &[PermissionEntry] = &[
    entry("internet", PermissionKind::Os, "android", Some("android.permission.INTERNET"), true, PermissionStatus::Declared, NETWORK_FEATURES),
    entry("network-state", PermissionKind::Os, "android", Some("android.permission.ACCESS_NETWORK_STATE"), true, PermissionStatus::Declared, &["network-snapshot"]),
    opener("android"),
    entry("wifi-state", PermissionKind::Os, "android", Some("android.permission.ACCESS_WIFI_STATE"), false, PermissionStatus::NotRequested, &[]),
    entry("notifications", PermissionKind::Os, "android", Some("android.permission.POST_NOTIFICATIONS"), false, PermissionStatus::NotRequested, &[]),
    entry("location", PermissionKind::Os, "android", Some("android.permission.ACCESS_FINE_LOCATION"), false, PermissionStatus::NotRequested, &[]),
    entry("camera", PermissionKind::Os, "android", Some("android.permission.CAMERA"), false, PermissionStatus::NotRequested, &[]),
    entry("microphone", PermissionKind::Os, "android", Some("android.permission.RECORD_AUDIO"), false, PermissionStatus::NotRequested, &[]),
];

/// iOS: ağ erişimi izinsizdir; yerel ağ anahtarı cihazda doğrulanana kadar `Unverified` (D-54).
pub const IOS: &[PermissionEntry] = &[
    entry("internet", PermissionKind::Os, "ios", None, true, PermissionStatus::NotNeeded, NETWORK_FEATURES),
    unverified("local-network", "ios", "NSLocalNetworkUsageDescription", &["ping"]),
    opener("ios"),
    entry("notifications", PermissionKind::Os, "ios", Some("UNUserNotificationCenter"), false, PermissionStatus::NotRequested, &[]),
    entry("location", PermissionKind::Os, "ios", Some("NSLocationWhenInUseUsageDescription"), false, PermissionStatus::NotRequested, &[]),
    entry("camera", PermissionKind::Os, "ios", Some("NSCameraUsageDescription"), false, PermissionStatus::NotRequested, &[]),
    entry("microphone", PermissionKind::Os, "ios", Some("NSMicrophoneUsageDescription"), false, PermissionStatus::NotRequested, &[]),
];

/// macOS: ağ erişimi izinsizdir; kullanım açıklaması anahtarları Info.plist'te yoktur.
pub const MACOS: &[PermissionEntry] = &[
    entry("internet", PermissionKind::Os, "macos", None, true, PermissionStatus::NotNeeded, NETWORK_FEATURES),
    opener("macos"),
    entry("notifications", PermissionKind::Os, "macos", Some("UNUserNotificationCenter"), false, PermissionStatus::NotRequested, &[]),
    entry("location", PermissionKind::Os, "macos", Some("NSLocationUsageDescription"), false, PermissionStatus::NotRequested, &[]),
    entry("camera", PermissionKind::Os, "macos", Some("NSCameraUsageDescription"), false, PermissionStatus::NotRequested, &[]),
    entry("microphone", PermissionKind::Os, "macos", Some("NSMicrophoneUsageDescription"), false, PermissionStatus::NotRequested, &[]),
];

/// Windows ve Linux: masaüstü uygulaması için ağ izni kavramı yoktur; diğer yetenekler kullanılmaz.
const fn desktop_without_manifest(os: &'static str) -> [PermissionEntry; 6] {
    [
        entry("internet", PermissionKind::Os, os, None, true, PermissionStatus::NotNeeded, NETWORK_FEATURES),
        opener(os),
        entry("notifications", PermissionKind::Os, os, None, false, PermissionStatus::NotRequested, &[]),
        entry("location", PermissionKind::Os, os, None, false, PermissionStatus::NotRequested, &[]),
        entry("camera", PermissionKind::Os, os, None, false, PermissionStatus::NotRequested, &[]),
        entry("microphone", PermissionKind::Os, os, None, false, PermissionStatus::NotRequested, &[]),
    ]
}

pub const WINDOWS: &[PermissionEntry] = &desktop_without_manifest("windows");
pub const LINUX: &[PermissionEntry] = &desktop_without_manifest("linux");

/// Bu derleme hedefinin izin envanteri. `get_permission_inventory` komutunun yanıtıdır.
pub fn inventory() -> &'static [PermissionEntry] {
    if cfg!(target_os = "android") {
        ANDROID
    } else if cfg!(target_os = "ios") {
        IOS
    } else if cfg!(target_os = "macos") {
        MACOS
    } else if cfg!(windows) {
        WINDOWS
    } else {
        LINUX
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    fn read(rel: &str) -> String {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join(rel);
        std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
    }

    fn declared_os(table: &[PermissionEntry]) -> Vec<&'static str> {
        table
            .iter()
            .filter(|e| e.kind == PermissionKind::Os && e.status == PermissionStatus::Declared)
            .filter_map(|e| e.technical_id)
            .collect()
    }

    // @lat: [[tests#Permission inventory#Never prompts]]
    #[test]
    fn inventory_never_prompts_and_matches_target() {
        for table in [ANDROID, IOS, MACOS, WINDOWS, LINUX, inventory()] {
            for e in table {
                assert_ne!(e.runtime_prompt, Some(true), "{} must not prompt", e.id);
                assert_eq!(e.runtime_prompt.is_none(), e.status == PermissionStatus::Unverified, "{}: only unverified entries leave the prompt open", e.id);
                assert!(e.technical_id.is_some() || e.status != PermissionStatus::Declared, "{} declared without id", e.id);
            }
        }
        assert!(!inventory().is_empty());
        assert!(inventory().iter().all(|e| e.os == std::env::consts::OS));
    }

    // @lat: [[tests#Permission inventory#Android manifest agrees]]
    #[test]
    fn android_manifest_declares_exactly_the_inventory() {
        let manifest = read("gen/android/app/src/main/AndroidManifest.xml");
        let mut in_manifest: Vec<&str> = manifest
            .lines()
            .filter(|l| l.contains("<uses-permission"))
            .filter_map(|l| l.split("android:name=\"").nth(1))
            .filter_map(|rest| rest.split('"').next())
            .collect();
        in_manifest.sort_unstable();
        let mut declared = declared_os(ANDROID);
        declared.sort_unstable();
        assert_eq!(in_manifest, declared);
        assert_eq!(declared, ["android.permission.ACCESS_NETWORK_STATE", "android.permission.INTERNET"]);
        for not_requested in ANDROID.iter().filter(|e| e.status == PermissionStatus::NotRequested) {
            assert!(!manifest.contains(not_requested.technical_id.unwrap()), "{} must stay out", not_requested.id);
        }
    }

    // @lat: [[tests#Permission inventory#iOS plist agrees]]
    #[test]
    fn ios_plist_declares_no_usage_descriptions() {
        let plist = read("gen/apple/netcheck_iOS/Info.plist");
        assert!(!plist.contains("UsageDescription"));
        assert!(declared_os(IOS).is_empty());
        let unverified: Vec<_> = IOS.iter().filter(|e| e.status == PermissionStatus::Unverified).collect();
        assert_eq!(unverified.len(), 1);
        assert_eq!(unverified[0].technical_id, Some("NSLocalNetworkUsageDescription"));
        assert_eq!(unverified[0].runtime_prompt, None);
    }

    // @lat: [[tests#Permission inventory#Capability agrees]]
    #[test]
    fn capability_file_matches_tauri_entries() {
        let capability: serde_json::Value = serde_json::from_str(&read("capabilities/default.json")).unwrap();
        let permissions: Vec<&str> = capability["permissions"].as_array().unwrap().iter().filter_map(|p| p.as_str()).collect();
        assert_eq!(permissions, ["core:default", "opener:default"]);
        for table in [ANDROID, IOS, MACOS, WINDOWS, LINUX] {
            for e in table.iter().filter(|e| e.kind == PermissionKind::Tauri) {
                assert_eq!(e.status, PermissionStatus::Declared);
                assert!(permissions.contains(&e.technical_id.unwrap()), "{} not in capability", e.id);
            }
        }
    }
    /// Bir manifest metnindeki `<etiket … android:name="…">` adlarını toplar (tek ya da çok satırlı öğe).
    fn android_names<'a>(manifest: &'a str, element: &str) -> Vec<&'a str> {
        manifest
            .split('<')
            .filter(|chunk| chunk.starts_with(element) && chunk[element.len()..].starts_with(|c: char| c.is_whitespace()))
            .map(|chunk| chunk.split('>').next().unwrap_or(chunk))
            .filter_map(|open_tag| open_tag.split("android:name=\"").nth(1))
            .filter_map(|rest| rest.split('"').next())
            .collect()
    }

    // @lat: [[tests#Permission inventory#Merged Android manifest agrees]]
    #[test]
    fn merged_android_manifest_declares_exactly_the_inventory() {
        let Some(path) = std::env::var_os("NETCHECK_MERGED_MANIFEST") else {
            eprintln!("skipped: set NETCHECK_MERGED_MANIFEST to the merged AndroidManifest.xml of a debug APK build");
            return;
        };
        let manifest = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.to_string_lossy()));
        // AndroidX, uygulamanın kendi kimliğiyle bir <permission> tanımlar ve onu kullanır; bu, kullanıcıdan
        // istenen bir izin değildir ve envantere girmez. Yalnız uygulama kimliğiyle başlayanlar ayıklanır.
        let own_definitions = android_names(&manifest, "permission");
        assert!(own_definitions.iter().all(|p| p.starts_with("edu.istinye.netcheck.")), "{own_definitions:?}");
        let mut requested: Vec<&str> = android_names(&manifest, "uses-permission")
            .into_iter()
            .filter(|p| !own_definitions.contains(p))
            .collect();
        requested.sort_unstable();
        requested.dedup();
        let mut declared = declared_os(ANDROID);
        declared.sort_unstable();
        assert_eq!(requested, declared, "merged manifest requests permissions outside the inventory");
        for banned in ["POST_NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED", "WAKE_LOCK", "ACCESS_WIFI_STATE", "ACCESS_FINE_LOCATION", "CAMERA", "RECORD_AUDIO"] {
            assert!(!manifest.contains(&format!("android.permission.{banned}")), "{banned} must stay out");
        }
        assert!(!manifest.contains("app.tauri.notification"), "notification plugin receivers must stay out");
    }
}
