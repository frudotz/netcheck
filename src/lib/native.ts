// Rust (Tauri IPC) çağrıları. Tarayıcıda (Tauri dışı) çalışırken sahte veri üretilmez;
// NativeUnavailableError fırlatılır ve arayüz bunu "yalnızca masaüstü uygulamasında" olarak gösterir.
import { invoke, isTauri } from "@tauri-apps/api/core";
import type { DiagnosticKind, DiagnosticOutcome, NetworkSnapshot } from "../types/netcheck";

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
