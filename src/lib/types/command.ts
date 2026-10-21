// Uygulama komutlarının tipli hatası ve platform özellikleri.
// Kaynak: src-tauri/src/command_error.rs (serde `tag = "code"`, snake_case)

/** Rust `CommandError`: komut başarısız olduğunda dönen tipli hata. */
export type CommandError =
  /** `run_diagnostic` bilinmeyen bir test türüyle çağrıldı; `value` gelen değer. */
  | { code: "unknown_diagnostic"; value: string }
  /** Arka plandaki iş parçacığı tamamlanamadı. */
  | { code: "task_failed" };

/** `destekleniyorMu` ile sorulan uygulama özellikleri (docs/platform-destegi.md). */
export type Feature =
  | "network-snapshot" // ağ bilgisi (get_network_snapshot)
  | "ping" // ICMP testleri: gateway, 1.1.1.1, 8.8.8.8
  | "dns-test" // DNS çözümleme testi
  | "https-test" // HTTPS bağlantı testi
  | "report-id" // Rust'ta rapor kimliği
  | "external-link"; // bağlantıyı varsayılan tarayıcıda açma
