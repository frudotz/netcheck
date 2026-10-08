// Kullanıcıya görünen Türkçe metinler — kod tanımlayıcıları İngilizce kalır.
import type { ConnectionType, DiagnosticKind, DiagnosticOutcome, DiagnosticStatus, IcmpBackend, PlatformInfo } from "../types/netcheck";
import { NativeUnavailableError } from "./native";

export const UNAVAILABLE = "Kullanılamıyor";
export const NOT_FOUND = "Bulunamadı";

export const connectionTypeLabel: Record<ConnectionType, string> = {
  ethernet: "Ethernet (kablolu)",
  wifi: "Wi-Fi (kablosuz)",
  cellular: "Mobil veri (hücresel)",
  unknown: "Bilinmiyor",
};

export const DESKTOP_ONLY =
  "Ağ bilgileri yalnızca NetCheck uygulamasında alınabilir. Tarayıcı önizlemesinde gerçek ağ verisine erişilemez.";

const osName: Record<string, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  android: "Android",
  ios: "iOS",
};

/** Ör. "Masaüstü uygulaması · Windows", "Mobil uygulama · Android". */
export function platformLabel(info: PlatformInfo): string {
  const family = info.family === "mobile" ? "Mobil uygulama" : "Masaüstü uygulaması";
  return `${family} · ${osName[info.os] ?? info.os}`;
}

export const icmpBackendLabel: Record<IcmpBackend, string> = {
  "icmp-api": "Windows ICMP API",
  "system-ping": "Sistem ping komutu",
  unavailable: "Bu platformda kullanılamıyor",
};

export const statusLabel: Record<DiagnosticStatus, string> = {
  pending: "Bekliyor",
  running: "Çalışıyor",
  success: "Başarılı",
  failed: "Başarısız",
  unavailable: "Kullanılamıyor",
};

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

const failureMessages: Record<string, string> = {
  no_gateway: "Gateway bulunamadı.",
  timeout: "Zaman aşımı: yanıt alınamadı.",
  unreachable: "Hedefe ulaşılamadı.",
  ping_unsupported: "Bu platformda ping testi kullanılamıyor.",
  resolve_failed: "DNS çözümlemesi başarısız.",
  http_error: "Sunucu beklenmeyen bir yanıt döndürdü.",
  connection_failed: "HTTPS bağlantısı kurulamadı.",
};

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
  return failureMessages[outcome.code] ?? "Test tamamlanamadı.";
}

export function formatLatency(ms?: number): string {
  if (ms === undefined) return "—";
  if (ms < 1) return "<1 ms";
  return `${ms < 10 ? ms.toFixed(1).replace(/\.0$/, "") : Math.round(ms)} ms`;
}

/** Ham Rust/IPC hatasını kullanıcıya göstermeden anlaşılır bir mesaja çevirir. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof NativeUnavailableError) return DESKTOP_ONLY;
  return fallback;
}
