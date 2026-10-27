// Test sonucu: Rust `run_diagnostic` yanıtı ve ekranda gösterilen test kaydı.
// Kaynak: src-tauri/src/diagnostics.rs

/** Beş sabit tanılama testi; hedefler Rust'ta sabittir. */
export type DiagnosticKind = "gateway" | "cloudflare" | "google" | "dns" | "internet";

/** Rust'un döndürebildiği sonuç durumu. */
export type OutcomeStatus = "success" | "failed" | "unavailable";

/** Ekrandaki test durumu: Rust sonucu ve çalışma öncesi/sırası halleri. */
export type DiagnosticStatus = "pending" | "running" | OutcomeStatus;

/** Rust'un makine kodu; ekranda Türkçe mesaja çevrilir (src/lib/labels.ts). */
export type DiagnosticCode =
  | "ok"
  | "no_gateway"
  | "timeout"
  | "unreachable"
  | "ping_unsupported"
  | "resolve_failed"
  | "http_error"
  | "connection_failed";

/** Rust `run_diagnostic` yanıtı. */
export interface DiagnosticOutcome {
  // Zorunlu
  /** Testin sonucu. */
  status: OutcomeStatus;
  /** Sonucu açıklayan makine kodu; başarıda "ok". */
  code: DiagnosticCode;
  // İsteğe bağlı
  /** Gerçekte denenen hedef (ör. ağ geçidi adresi). */
  target?: string;
  /** Milisaniye cinsinden gecikme; yalnız başarıda. */
  latencyMs?: number;
  /** Ek bilgi: DNS'te çözümlenen adres, HTTPS'te genel IP. */
  detail?: string;
}

/** Ekranda ve raporda tutulan tek test. */
export interface DiagnosticTest {
  // Zorunlu
  /** Testin türü. */
  id: DiagnosticKind;
  /** Görünen ad (ör. "Google DNS"). */
  name: string;
  /** Testin durumu. */
  status: DiagnosticStatus;
  // İsteğe bağlı
  /** Hedef; test bitmeden açıklama, bitince Rust'un denediği hedef. */
  target?: string;
  /** Milisaniye cinsinden gecikme. */
  latencyMs?: number;
  /** Kullanıcıya gösterilen Türkçe sonuç mesajı. */
  message?: string;
}
