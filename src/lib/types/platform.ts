// Çalışma ortamı: Rust `get_platform_info` yanıtı.
// Kaynak: src-tauri/src/platform/mod.rs

/** Rust `std::env::consts::OS`; uygulama bu beş platform için derlenir. */
export type OsName = "windows" | "macos" | "linux" | "android" | "ios";

/** Masaüstü ya da mobil derleme. */
export type PlatformFamily = "desktop" | "mobile";

/** Ping testlerini yapan yöntem (src-tauri/src/platform/icmp.rs). */
export type IcmpBackend = "icmp-api" | "system-ping" | "icmp-socket" | "unavailable";

/** Uygulamanın çalıştığı ortam. */
export interface PlatformInfo {
  // Zorunlu (bütün alanlar zorunludur)
  /** İşletim sistemi. */
  os: OsName;
  /** Masaüstü ya da mobil. */
  family: PlatformFamily;
  /** Bu derlemedeki ping yöntemi. */
  icmp: IcmpBackend;
}
