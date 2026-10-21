// Rust (Tauri IPC) çağrılarının tek giriş noktası; bileşenler Tauri'yi doğrudan çağırmaz (Görev 15).
// Tarayıcıda (Tauri dışı) çalışırken sahte veri üretilmez: NativeUnavailableError fırlatılır ve arayüz
// bunu "yalnızca NetCheck uygulamasında" olarak gösterir. Komut hataları tiplidir (CommandFailure).
// Platform farkları Rust tarafında `src-tauri/src/platform` içinde çözülür; ekranlar platform adını
// kendileri sorgulamaz, `destekleniyorMu` kullanır. Komut listesi: docs/komutlar.md
import { invoke, isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { CommandError, DiagnosticKind, DiagnosticOutcome, Feature, NetworkSnapshot, PlatformInfo } from "./types";

export class NativeUnavailableError extends Error {
  constructor() {
    super("native_unavailable");
  }
}

/** Rust komutunun tipli hatası (`CommandError`) ile başarısız olması. */
export class CommandFailure extends Error {
  constructor(readonly error: CommandError) {
    super(error.code);
  }
}

function isCommandError(value: unknown): value is CommandError {
  if (typeof value !== "object" || value === null || !("code" in value)) return false;
  return value.code === "unknown_diagnostic" || value.code === "task_failed";
}

export function hasNative(): boolean {
  return typeof window !== "undefined" && isTauri();
}

async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!hasNative()) throw new NativeUnavailableError();
  try {
    return await invoke<T>(command, args);
  } catch (e) {
    throw isCommandError(e) ? new CommandFailure(e) : e;
  }
}

export function getNetworkSnapshot(): Promise<NetworkSnapshot> {
  return call<NetworkSnapshot>("get_network_snapshot");
}

export function runDiagnostic(kind: DiagnosticKind): Promise<DiagnosticOutcome> {
  return call<DiagnosticOutcome>("run_diagnostic", { kind });
}

/** Rapor kimliği yalnızca Rust tarafında üretilir (NCHK-YYYY-XXXXXXXX). */
export function generateReportId(): Promise<string> {
  return call<string>("generate_report_id");
}

let platformBilgisi: Promise<PlatformInfo> | null = null;

/** Çalışma ortamı: işletim sistemi, masaüstü/mobil ailesi ve ping yöntemi (oturum boyunca bir kez okunur). */
export function platform(): Promise<PlatformInfo> {
  platformBilgisi ??= call<PlatformInfo>("get_platform_info").catch((e: unknown) => {
    platformBilgisi = null;
    throw e;
  });
  return platformBilgisi;
}

/**
 * Bu ortamda bir özelliğin kullanılıp kullanılamayacağı. Desteklenmeyen özellik arayüzde gösterilmez.
 * Tarayıcı önizlemesinde (Rust yok) hiçbir özellik desteklenmez. Beş hedef platformun hepsinde her
 * özelliğin bir yolu vardır; yalnız ping, ICMP yöntemi olmayan bir derlemede düşer (docs/platform-destegi.md).
 */
export async function destekleniyorMu(ozellik: Feature): Promise<boolean> {
  if (!hasNative()) return false;
  if (ozellik === "ping") return (await platform()).icmp !== "unavailable";
  return true;
}

/** Bağlantıyı WebView'den çıkmadan varsayılan tarayıcıda açar; uygulama dışında `false` döner. */
export async function openExternal(url: string): Promise<boolean> {
  if (!(await destekleniyorMu("external-link"))) return false;
  await openUrl(url);
  return true;
}
