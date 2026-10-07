// NetCheck veri modelleri — Rust tarafındaki serde yapılarıyla birebir (camelCase).

export type ConnectionType = "ethernet" | "wifi" | "unknown";

export interface NetworkInterface {
  name: string;
  ipv4?: string;
  ipv6?: string;
  mac?: string;
  type: ConnectionType;
  isUp: boolean;
  isDefault: boolean;
}

export interface NetworkSnapshot {
  hostname?: string;
  localIPv4?: string;
  localIPv6?: string;
  gateway?: string;
  dnsServers: string[];
  connectionType: ConnectionType;
  interfaceName?: string;
  interfaces: NetworkInterface[];
}

export type DiagnosticKind = "gateway" | "cloudflare" | "google" | "dns" | "internet";

export type DiagnosticStatus = "pending" | "running" | "success" | "failed" | "unavailable";

/** Rust `run_diagnostic` yanıtı; `code` Türkçe mesaja ön yüzde çevrilir. */
export interface DiagnosticOutcome {
  status: "success" | "failed" | "unavailable";
  target?: string;
  latencyMs?: number;
  code: string;
  detail?: string;
}

export interface DiagnosticTest {
  id: DiagnosticKind;
  name: string;
  target?: string;
  status: DiagnosticStatus;
  latencyMs?: number;
  message?: string;
}

export interface DiagnosticReport {
  /** Rust `generate_report_id`: NCHK-YYYY-XXXXXXXX */
  id: string;
  /** ISO 8601 (UTC) */
  createdAt: string;
  /** 0–100, bkz. src/lib/score.ts */
  score: number;
  passed: number;
  failed: number;
  network: NetworkSnapshot;
  tests: DiagnosticTest[];
}
