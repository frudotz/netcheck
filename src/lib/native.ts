// Rust (Tauri IPC) çağrıları. Tarayıcıda (Tauri dışı) çalışırken sahte veri üretilmez;
// NativeUnavailableError fırlatılır ve arayüz bunu "yalnızca NetCheck uygulamasında" olarak gösterir.
// Platform farkları (masaüstü/mobil) Rust tarafında `src-tauri/src/platform` içinde çözülür.
import { invoke, isTauri } from "@tauri-apps/api/core";
import type { DiagnosticKind, DiagnosticOutcome, NetworkSnapshot, PlatformInfo } from "../types/netcheck";

export type AdminCommand =
  | "auth_setup_required"
  | "auth_me"
  | "auth_login"
  | "auth_register"
  | "auth_logout"
  | "contact_message_assignees"
  | "contact_message_reply"
  | "user_index"
  | "user_store"
  | "user_sync_roles"
  | "user_set_status"
  | "user_set_password"
  | "user_update"
  | "crud_index"
  | "crud_show"
  | "crud_store"
  | "crud_update"
  | "crud_destroy"
  | "crud_destroy_many"
  | "report_dashboard"
  | "report_set_sharing"
  | "score_rule_publish"
  | "report_show"
  | "report_reveal_field"
  | "export_authorize"
  | "device_purge";

export class NativeUnavailableError extends Error {
  constructor() {
    super("native_unavailable");
  }
}

export function hasNative(): boolean {
  return typeof window !== "undefined" && isTauri();
}

async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!hasNative()) throw new NativeUnavailableError();
  return invoke<T>(command, args);
}

/** Yönetim paneli de dahil tüm SQLite erişimi bu Tauri IPC sınırından geçer. */
export function invokeAdmin<T>(command: AdminCommand, args?: Record<string, unknown>): Promise<T> {
  return call<T>(command, args);
}

export function getNetworkSnapshot(): Promise<NetworkSnapshot> {
  return call<NetworkSnapshot>("get_network_snapshot");
}

export function runDiagnostic(kind: DiagnosticKind): Promise<DiagnosticOutcome> {
  return call<DiagnosticOutcome>("run_diagnostic", { kind });
}

/** Çalışma ortamı: işletim sistemi, masaüstü/mobil ailesi ve ping yöntemi. */
export function getPlatformInfo(): Promise<PlatformInfo> {
  return call<PlatformInfo>("get_platform_info");
}

/** Rapor kimliği yalnızca Rust tarafında üretilir (NCHK-YYYY-XXXXXXXX). */
export function generateReportId(): Promise<string> {
  return call<string>("generate_report_id");
}
