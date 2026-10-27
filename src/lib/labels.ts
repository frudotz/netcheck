// Rapora kaydedilen Türkçe değerler ve dilden bağımsız biçimlendirme. Ekranda görünen metinler
// dört dilde src/lib/sozluk.ts içindedir. Buradaki ad, hedef açıklaması ve mesaj rapor anında
// `DiagnosticTest` içine yazılır; kodu olmayan eski raporlar bu Türkçe mesajı gösterir.
import type { DiagnosticCode, DiagnosticKind, DiagnosticOutcome } from "./types";

export const diagnosticName: Record<DiagnosticKind, string> = {
  gateway: "Gateway",
  cloudflare: "Cloudflare",
  google: "Google DNS",
  dns: "DNS Çözümleme",
  internet: "İnternet (HTTPS)",
};

/** Test başlamadan önce gösterilen hedef açıklaması (gerçek hedef Rust'tan gelir). */
export const diagnosticTargetHint: Record<DiagnosticKind, string> = {
  gateway: "Varsayılan ağ geçidi",
  cloudflare: "1.1.1.1",
  google: "8.8.8.8",
  dns: "cloudflare.com",
  internet: "www.cloudflare.com",
};

const failureMessages: Record<Exclude<DiagnosticCode, "ok">, string> = {
  no_gateway: "Gateway bulunamadı.",
  timeout: "Zaman aşımı: yanıt alınamadı.",
  unreachable: "Hedefe ulaşılamadı.",
  ping_unsupported: "Bu platformda ping testi kullanılamıyor.",
  resolve_failed: "DNS çözümlemesi başarısız.",
  http_error: "Sunucu beklenmeyen bir yanıt döndürdü.",
  connection_failed: "HTTPS bağlantısı kurulamadı.",
  command_failed: "Test tamamlanamadı.",
};

/** Rapora yazılan Türkçe başarısızlık mesajı (komut çağrısı başarısız olunca kullanılır). */
export function failureMessage(code: Exclude<DiagnosticCode, "ok">): string {
  return failureMessages[code];
}

export function outcomeMessage(kind: DiagnosticKind, outcome: DiagnosticOutcome): string {
  if (outcome.status === "success") {
    switch (kind) {
      case "gateway":
        return "Ağ geçidi yanıt verdi.";
      case "dns":
        return outcome.detail ? `cloudflare.com → ${outcome.detail}` : "Alan adı çözümlendi.";
      case "internet":
        return outcome.detail ? `HTTPS bağlantısı başarılı · Genel IP ${outcome.detail}` : "HTTPS bağlantısı başarılı.";
      default:
        return "Hedef yanıt verdi.";
    }
  }
  if (outcome.code === "ok") return "Test tamamlanamadı.";
  // Tip dışı bir kod gelirse (Rust daha yeni olabilir) genel mesaja düşülür.
  return failureMessages[outcome.code] ?? "Test tamamlanamadı.";
}

export function formatLatency(ms?: number): string {
  if (ms === undefined) return "—";
  if (ms < 1) return "<1 ms";
  return `${ms < 10 ? ms.toFixed(1).replace(/\.0$/, "") : Math.round(ms)} ms`;
}
