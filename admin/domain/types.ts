// Yönetim paneline özgü tipler. NetCheck'in çekirdek tipleri (rapor, test, ağ, platform) burada
// tekrar tanımlanmaz; veri sözleşmesinin tek kaynağı src/lib/types/ (docs/veri-modeli.md).
import type {
  DiagnosticKind,
  DiagnosticReport,
  Locale,
  PlatformInfo,
} from "../../src/lib/types";

export type {
  ConnectionType,
  DiagnosticCode,
  DiagnosticKind,
  DiagnosticReport,
  DiagnosticStatus,
  DiagnosticTest,
  IcmpBackend,
  Locale,
  NetworkInterface,
  NetworkSnapshot,
  OsName,
  PlatformFamily,
  PlatformInfo,
  ScoreLevel,
} from "../../src/lib/types";

export type AdminRole = "owner" | "support" | "content" | "viewer";

export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }
export interface ListQuery {
  search?: string;
  page: number;               // 1'den başlar
  pageSize: 10 | 25 | 50;
  sort?: { key: string; dir: "asc" | "desc" };
  filters?: Record<string, string | string[] | number | boolean | undefined>;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;            // en az 10 karakter
  lang: Locale;
  status: "new" | "in-progress" | "answered" | "spam";
  assignee?: string;          // AdminUser.id
  createdAt: string;          // ISO
  replies: { id: string; authorId: string; body: string; at: string; internal: boolean }[];
}

export interface ContentPage {
  id: string;
  slug: "hakkinda" | "gizlilik" | "kosullar" | "iletisim";
  lang: Locale;
  title: string;
  body: string;               // basit biçimlendirilmiş metin
  status: "draft" | "published";
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt?: string;
}

export interface AuditLogEntry {
  id: string;
  at: string;                 // ISO
  actorId: string;
  action: string;             // örn. "report.delete", "rule.publish", "pii.reveal"
  entity: string;             // örn. "Report"
  entityId: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
}

// ---- Yönetim varlıkları ----
export interface Device {
  id: string;
  platform: PlatformInfo;
  appVersion: string;
  locale: Locale;
  lastSeenAt: string;
  reportCount: number;
}

export interface ReportRecord extends DiagnosticReport {
  deviceId: string;
  shared: boolean;            // kullanıcı paylaşımı açık mı
  receivedAt: string;
  ruleVersion: number;        // skoru hesaplayan kural sürümü
}

export interface ScoreRule {
  version: number;
  status: "draft" | "published";
  weights: Record<DiagnosticKind, number>;               // toplam 90
  latencyBands: { maxMs: number | null; bonus: number }[];  // artan maxMs; son satır null (üst sınırsız)
  levels: { iyi: number; orta: number };                  // alt eşikler (80, 50)
  publishedAt?: string;
  note?: string;
}

export interface DiagnosticTarget {
  kind: DiagnosticKind;
  target: string;             // gateway için "auto"
  enabled: boolean;
  timeoutMs: number;
}
