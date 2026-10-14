// ---- Ortak yönetim tipleri (tüm paneller) ----
export type Lang = "tr" | "en" | "ar" | "fa" | "de";
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
  lang: Lang;
  status: "new" | "in-progress" | "answered" | "spam";
  assignee?: string;          // AdminUser.id
  createdAt: string;          // ISO
  replies: { id: string; authorId: string; body: string; at: string; internal: boolean }[];
}

export interface ContentPage {
  id: string;
  slug: "hakkinda" | "gizlilik" | "kosullar" | "iletisim";
  lang: Lang;
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

export interface AdminAssignee {
  id: string;
  name: string;
}

export interface AuditLogEntry {
  id: string;
  at: string;                 // ISO
  actorId: string;
  action: string;             // örn. "listing.remove", "rule.publish", "pii.reveal"
  entity: string;             // örn. "Listing"
  entityId: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
}

// ---- NetCheck çekirdek tipleri ----
export type ConnectionType = "ethernet" | "wifi" | "cellular" | "unknown";
export type DiagnosticKind = "gateway" | "cloudflare" | "google" | "dns" | "internet";
export type DiagnosticStatus = "pending" | "running" | "success" | "failed" | "unavailable";
export type ScoreLevel = "iyi" | "orta" | "zayif";
export type PlatformFamily = "desktop" | "mobile";
export type Os = "windows" | "macos" | "linux" | "android" | "ios";
export type IcmpBackend = "icmp-api" | "system-ping" | "icmp-socket" | "unavailable";
export type OutcomeCode =
  | "no_gateway" | "timeout" | "unreachable" | "ping_unsupported"
  | "resolve_failed" | "http_error" | "connection_failed";

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

export interface DiagnosticTest {
  id: DiagnosticKind;
  name: string;               // Gateway · Cloudflare · Google DNS · DNS Çözümleme · İnternet (HTTPS)
  target?: string;            // varsayılan ağ geçidi · 1.1.1.1 · 8.8.8.8 · cloudflare.com · www.cloudflare.com
  status: DiagnosticStatus;
  latencyMs?: number;
  code?: OutcomeCode;
  message?: string;           // kullanıcıya gösterilen Türkçe açıklama
}

export interface DiagnosticReport {
  id: string;                 // NCHK-YYYY-XXXXXXXX
  createdAt: string;          // ISO 8601 UTC
  score: number;              // 0–100
  passed: number;
  failed: number;
  network: NetworkSnapshot;
  tests: DiagnosticTest[];    // her zaman 5 kayıt
}

export interface PlatformInfo { os: Os; family: PlatformFamily; icmp: IcmpBackend }

// ---- Yönetim varlıkları ----
export interface Device {
  id: string;
  platform: PlatformInfo;
  appVersion: string;
  locale: Lang;
  lastSeenAt: string;
  reportCount: number;
}

export interface ReportRecord extends DiagnosticReport {
  deviceId?: string | null;
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
