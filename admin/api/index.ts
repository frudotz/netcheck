// Yönetim panelinin veri arayüzü: bu cihazdaki SQLite veritabanına yalnız Tauri IPC üzerinden,
// src/lib/native.ts sınırından ulaşır (docs/backend.md). Örnek/sahte veri yoktur. Tarayıcı önizlemesinde
// (`bun run dev`) IPC olmadığı için `bagli` false kalır ve App.tsx veri ekranları yerine durum açıklaması gösterir.
// Yetki denetimi arka uçtadır; buradaki ve ekranlardaki izin kontrolleri yalnız görünürlük içindir.
// Not: panelin veri bağlantısı C-3 kapsam kararına bağlıdır (docs/course-compliance.md); karar bekleyen bir
// konudur ve bu dosya o kararı vermez.
import { hasNative, invokeAdmin, NativeUnavailableError } from "../../src/lib/native";
import type {
  AdminRole,
  AdminUser,
  AuditLogEntry,
  ContactMessage,
  ContentPage,
  Device,
  DiagnosticTarget,
  ListQuery,
  Paged,
  ReportRecord,
  ScoreRule,
} from "../domain/types";

/** Arka uç hata kodları (`AppError::code`); metinler ekranda sözlükten üretilir. */
export type AdminErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "db"
  | "internal"
  | "native_unavailable"
  | "unknown";

export class AdminApiError extends Error {
  constructor(
    public readonly code: AdminErrorCode,
    message: string,
    public readonly fields: { field: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

/** Oturumdaki kullanıcı; `auth_me` ve giriş komutlarının döndürdüğü biçim. */
export interface AdminSession {
  user: { id: number; name: string; email: string; status: string; lastLoginAt?: string | null };
  roles: string[];
  superAdmin: boolean;
  permissions: string[];
}

export interface AdminApi {
  getReports(query?: Partial<ListQuery>): Promise<Paged<ReportRecord>>;
  /** Rapor her zaman maskeli gelir; hassas alanlar tek tek `revealReportField` ile açılır. */
  getReportById(id: string): Promise<ReportRecord | null>;
  /** Tek bir hassas alan (`Reveal:PII`); her çağrı arka uçta denetim kaydına yazılır. */
  revealReportField(id: string, field: string): Promise<string | null>;
  /** CSV / yazdırma yetkisi (`Export:Report`); başarılı çağrı denetim kaydına yazılır. */
  authorizeExport(kind: "csv" | "pdf"): Promise<void>;
  updateReportSharing(id: string, shared: boolean, reason?: string): Promise<ReportRecord>;
  deleteReport(id: string, reason: string): Promise<void>;
  getDevices(query?: Partial<ListQuery>): Promise<Paged<Device>>;
  getDeviceById(id: string): Promise<Device | null>;
  /** Cihaz ve bütün raporları tek arka uç işleminde silinir. */
  deleteDeviceData(deviceId: string, reason: string): Promise<void>;
  getMessages(query?: Partial<ListQuery>): Promise<Paged<ContactMessage>>;
  /** Yanıt arka uçta oluşturulur: yazar kimliği oturumdan, zaman damgası veritabanından. */
  replyMessage(messageId: string, body: string, internal: boolean): Promise<ContactMessage>;
  updateMessageStatus(messageId: string, status: ContactMessage["status"]): Promise<ContactMessage>;
  assignMessage(messageId: string, assignee?: string): Promise<ContactMessage>;
  markMessageSpam(messageIds: string[]): Promise<void>;
  getScoreRules(): Promise<ScoreRule[]>;
  saveDraftScoreRule(rule: ScoreRule): Promise<ScoreRule>;
  publishScoreRule(rule: ScoreRule, reason?: string): Promise<ScoreRule>;
  rollbackScoreRule(version: number, reason?: string): Promise<ScoreRule>;
  getTargets(): Promise<DiagnosticTarget[]>;
  updateTarget(target: DiagnosticTarget): Promise<DiagnosticTarget>;
  resetTargetsToDefault(): Promise<DiagnosticTarget[]>;
  getContentPages(): Promise<ContentPage[]>;
  updateContentPage(page: ContentPage): Promise<ContentPage>;
  getAdmins(): Promise<AdminUser[]>;
  /** Mesaj atanabilecek etkin, rollü kullanıcılar (`ViewAny:ContactMessage` yeter; kullanıcı listesi izni gerekmez). */
  getMessageAssignees(): Promise<{ id: string; name: string }[]>;
  /** Yeni kullanıcı; var olan e-posta `conflict` verir, var olan hesabı değiştirmez. */
  inviteAdmin(data: Omit<AdminUser, "id" | "lastLoginAt"> & { password: string }): Promise<AdminUser>;
  /** Ad, rol ve durum ayrı komutlarla güncellenir; e-posta ve parola bu yoldan değişmez. */
  updateAdmin(admin: AdminUser): Promise<AdminUser>;
  getAuditLogs(query?: Partial<ListQuery>): Promise<Paged<AuditLogEntry>>;
}

export interface AuthApi {
  getSession(): Promise<AdminSession | null>;
  isFirstRun(): Promise<boolean>;
  login(email: string, password: string): Promise<AdminSession>;
  registerFirstAdmin(name: string, email: string, password: string): Promise<AdminSession>;
  logout(): Promise<void>;
}

/** Panel bir veri kaynağına bağlı mı: yalnız Tauri içinde (IPC varken) true. */
export const bagli: boolean = hasNative();

/** Bağlı olmayan panelde (tarayıcı önizlemesi) bir veri işlemi çağrılırsa fırlatılır. */
export class PanelBagliDegil extends Error {
  constructor() {
    super("panel_not_connected");
    this.name = "PanelBagliDegil";
  }
}

function errorPayload(error: unknown): { code?: string; message?: string; errors?: { field: string; message: string }[] } {
  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.code === "string") {
      return {
        code: candidate.code,
        message: typeof candidate.message === "string" ? candidate.message : undefined,
        errors: Array.isArray(candidate.errors) ? (candidate.errors as { field: string; message: string }[]) : undefined,
      };
    }
    if (typeof candidate.message === "string") return errorPayload(candidate.message);
  }
  if (typeof error === "string") {
    try {
      return errorPayload(JSON.parse(error));
    } catch {
      return {};
    }
  }
  return {};
}

const KNOWN: AdminErrorCode[] = ["unauthenticated", "forbidden", "not_found", "validation", "conflict", "db", "internal"];

function normalizeError(error: unknown): Error {
  if (error instanceof NativeUnavailableError) return new PanelBagliDegil();
  if (error instanceof AdminApiError || error instanceof PanelBagliDegil) return error;
  const { code, message, errors } = errorPayload(error);
  const known = KNOWN.find(k => k === code) ?? "unknown";
  return new AdminApiError(known, message ?? known, errors ?? []);
}

async function call<T>(command: Parameters<typeof invokeAdmin>[0], args?: Record<string, unknown>): Promise<T> {
  if (!bagli) throw new PanelBagliDegil();
  try {
    return await invokeAdmin<T>(command, args);
  } catch (error) {
    throw normalizeError(error);
  }
}

interface BackendPage<T> {
  items: T[];
  total: number;
}

/** Arka uç sayfa sayfa verir (en çok 100); ekranlar bugün bütün listeyi ister ve kendi süzer. */
async function listAll<T>(resource: string, query: Record<string, unknown> = {}): Promise<T[]> {
  const pageSize = 100;
  const first = await call<BackendPage<T>>("crud_index", { resource, query: { ...query, page: 1, pageSize } });
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page += 1) {
    const next = await call<BackendPage<T>>("crud_index", { resource, query: { ...query, page, pageSize } });
    if (next.items.length === 0) break;
    items.push(...next.items);
  }
  return items;
}

function valueAt(item: object, key: string): unknown {
  return Reflect.get(item, key);
}

function compare(left: unknown, right: unknown): number {
  if (left === right) return 0;
  if (left === undefined || left === null) return 1;
  if (right === undefined || right === null) return -1;
  const a = typeof left === "string" && !Number.isNaN(Date.parse(left)) ? Date.parse(left) : left;
  const b = typeof right === "string" && !Number.isNaN(Date.parse(right)) ? Date.parse(right) : right;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
}

function pageItems<T>(items: T[], query?: Partial<ListQuery>): Paged<T> {
  const page = Math.max(1, query?.page ?? 1);
  const pageSize = query?.pageSize ?? 10;
  const sorted = [...items];
  if (query?.sort) {
    const { key, dir } = query.sort;
    sorted.sort((a, b) => compare(valueAt(a as object, key), valueAt(b as object, key)) * (dir === "asc" ? 1 : -1));
  }
  const start = (page - 1) * pageSize;
  return { items: sorted.slice(start, start + pageSize), total: sorted.length, page, pageSize };
}

/** Arka uç rol adı ↔ panel rolü (`admin` süper yöneticidir ve panelde "owner" diye görünür). */
function roleFromBackend(role: unknown): AdminRole {
  if (role === "admin") return "owner";
  if (role === "support" || role === "content" || role === "viewer") return role;
  return "viewer";
}

function roleToBackend(role: AdminRole): string {
  return role === "owner" ? "admin" : role;
}

function withinDateRange(createdAt: string, range: unknown): boolean {
  if (range !== "7d" && range !== "30d") return true;
  const days = range === "7d" ? 7 : 30;
  return new Date(createdAt).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

async function storeRule(rule: ScoreRule): Promise<ScoreRule> {
  // Yayın yalnız score_rule_publish ile; genel CRUD taslak dışında bir durum kabul etmez.
  return call<ScoreRule>("crud_store", {
    resource: "ScoreRule",
    data: { status: "draft", weights: rule.weights, latencyBands: rule.latencyBands, levels: rule.levels, note: rule.note ?? null },
  });
}

async function currentScoreThresholds(): Promise<{ iyi: number; orta: number }> {
  const dashboard = await call<{ thresholds: { iyi: number; orta: number } }>("report_dashboard");
  return dashboard.thresholds;
}

export const auth: AuthApi = {
  getSession: () => call<AdminSession | null>("auth_me"),
  isFirstRun: () => call<boolean>("auth_setup_required"),
  login: (email, password) => call<AdminSession>("auth_login", { email, password }),
  registerFirstAdmin: (name, email, password) => call<AdminSession>("auth_register", { name, email, password }),
  logout: () => call<void>("auth_logout"),
};

export const api: AdminApi = {
  async getReports(query) {
    let reports = await listAll<ReportRecord>("Report");
    const filters = query?.filters;
    if (query?.search?.trim()) {
      const needle = query.search.trim().toLocaleLowerCase();
      reports = reports.filter(
        report => report.id.toLocaleLowerCase().includes(needle) || report.deviceId?.toLocaleLowerCase().includes(needle),
      );
    }
    if (filters?.scoreLevel) {
      const thresholds = await currentScoreThresholds();
      if (filters.scoreLevel === "iyi") reports = reports.filter(report => report.score >= thresholds.iyi);
      if (filters.scoreLevel === "orta") reports = reports.filter(report => report.score >= thresholds.orta && report.score < thresholds.iyi);
      if (filters.scoreLevel === "zayif") reports = reports.filter(report => report.score < thresholds.orta);
    }
    if (filters?.minScore !== undefined) reports = reports.filter(report => report.score >= Number(filters.minScore));
    if (filters?.maxScore !== undefined) reports = reports.filter(report => report.score <= Number(filters.maxScore));
    if (filters?.shared !== undefined && filters.shared !== "") {
      const shared = filters.shared === true || filters.shared === "true";
      reports = reports.filter(report => report.shared === shared);
    }
    if (filters?.connectionType) reports = reports.filter(report => report.network.connectionType === filters.connectionType);
    if (filters?.testStatus) reports = reports.filter(report => report.tests.some(test => test.status === filters.testStatus));
    if (filters?.dateRange) reports = reports.filter(report => withinDateRange(report.createdAt, filters.dateRange));
    if (filters?.platform) {
      const devices = await listAll<Device>("Device");
      const deviceIds = new Set(devices.filter(device => device.platform.os === filters.platform).map(device => device.id));
      reports = reports.filter(report => report.deviceId != null && deviceIds.has(report.deviceId));
    }
    return pageItems(reports, query);
  },

  async getReportById(id) {
    try {
      return await call<ReportRecord>("report_show", { id });
    } catch (error) {
      if (error instanceof AdminApiError && error.code === "not_found") return null;
      throw error;
    }
  },

  async revealReportField(id, field) {
    const result = await call<{ field: string; value: string | null }>("report_reveal_field", { id, field });
    return typeof result.value === "string" ? result.value : null;
  },

  async authorizeExport(kind) {
    await call<boolean>("export_authorize", { kind });
  },

  updateReportSharing: (id, shared, reason) => call<ReportRecord>("report_set_sharing", { id, shared, reason: reason ?? null }),

  deleteReport: (id, reason) => call<void>("crud_destroy", { resource: "Report", id, reason }),

  async getDevices(query) {
    let devices = await listAll<Device>("Device");
    if (query?.search?.trim()) {
      const needle = query.search.trim().toLocaleLowerCase();
      devices = devices.filter(
        device =>
          device.id.toLocaleLowerCase().includes(needle) ||
          device.platform.os.toLocaleLowerCase().includes(needle) ||
          device.platform.family.toLocaleLowerCase().includes(needle) ||
          device.appVersion.toLocaleLowerCase().includes(needle),
      );
    }
    if (query?.filters?.os) devices = devices.filter(device => device.platform.os === query.filters?.os);
    return pageItems(devices, query);
  },

  async getDeviceById(id) {
    try {
      return await call<Device>("crud_show", { resource: "Device", id });
    } catch (error) {
      if (error instanceof AdminApiError && error.code === "not_found") return null;
      throw error;
    }
  },

  async deleteDeviceData(deviceId, reason) {
    await call<{ deviceId: string; deletedReports: number }>("device_purge", { deviceId, reason });
  },

  async getMessages(query) {
    const items = await listAll<ContactMessage>("ContactMessage", {
      search: query?.search,
      filters: query?.filters,
      sort: query?.sort ?? { key: "createdAt", dir: "desc" },
    });
    return pageItems(items, query);
  },

  replyMessage: (messageId, body, internal) => call<ContactMessage>("contact_message_reply", { messageId, body, internal }),

  updateMessageStatus: (messageId, status) => call<ContactMessage>("crud_update", { resource: "ContactMessage", id: messageId, data: { status } }),

  assignMessage: (messageId, assignee) =>
    call<ContactMessage>("crud_update", { resource: "ContactMessage", id: messageId, data: { assignee: assignee ?? null } }),

  async markMessageSpam(messageIds) {
    for (const id of messageIds) {
      await call<ContactMessage>("crud_update", { resource: "ContactMessage", id, data: { status: "spam" } });
    }
  },

  async getScoreRules() {
    const rules = await listAll<ScoreRule>("ScoreRule");
    return rules.sort((a, b) => a.version - b.version);
  },

  saveDraftScoreRule: rule => storeRule(rule),

  async publishScoreRule(rule, reason) {
    // Yayınlanmış kural değişmez: taslaksa güncellenir, değilse yeni taslak açılır; sonra yayınlanır.
    let draft: ScoreRule;
    if (rule.status === "draft") {
      try {
        const current = await call<ScoreRule>("crud_show", { resource: "ScoreRule", id: rule.version });
        draft =
          current.status === "draft"
            ? await call<ScoreRule>("crud_update", {
                resource: "ScoreRule",
                id: rule.version,
                data: { weights: rule.weights, latencyBands: rule.latencyBands, levels: rule.levels, note: rule.note ?? null },
              })
            : await storeRule(rule);
      } catch (error) {
        if (!(error instanceof AdminApiError) || error.code !== "not_found") throw error;
        draft = await storeRule(rule);
      }
    } else {
      draft = await storeRule(rule);
    }
    return call<ScoreRule>("score_rule_publish", { version: draft.version, note: reason ?? null });
  },

  async rollbackScoreRule(version, reason) {
    const target = await call<ScoreRule>("crud_show", { resource: "ScoreRule", id: version });
    const draft = await storeRule({ ...target, status: "draft", publishedAt: undefined, note: `v${version}` });
    return call<ScoreRule>("score_rule_publish", { version: draft.version, note: reason ?? `v${version}` });
  },

  getTargets: () => listAll<DiagnosticTarget>("DiagnosticTarget"),

  updateTarget: target =>
    call<DiagnosticTarget>("crud_update", {
      resource: "DiagnosticTarget",
      id: target.kind,
      data: { target: target.target, enabled: target.enabled, timeoutMs: target.timeoutMs },
    }),

  async resetTargetsToDefault() {
    // Rust'taki sabit hedeflerle aynı (migrations/2026_10_14_000030_seed_reference_data.sql).
    const defaults: DiagnosticTarget[] = [
      { kind: "gateway", target: "auto", enabled: true, timeoutMs: 2000 },
      { kind: "cloudflare", target: "1.1.1.1", enabled: true, timeoutMs: 2000 },
      { kind: "google", target: "8.8.8.8", enabled: true, timeoutMs: 2000 },
      { kind: "dns", target: "cloudflare.com", enabled: true, timeoutMs: 3000 },
      { kind: "internet", target: "www.cloudflare.com", enabled: true, timeoutMs: 5000 },
    ];
    for (const target of defaults) await this.updateTarget(target);
    return this.getTargets();
  },

  getContentPages: () => listAll<ContentPage>("ContentPage"),

  async updateContentPage(page) {
    const pages = await this.getContentPages();
    const existing = pages.find(item => item.id === page.id);
    const data = { slug: page.slug, lang: page.lang, title: page.title, body: page.body, status: page.status };
    if (existing) return call<ContentPage>("crud_update", { resource: "ContentPage", id: page.id, data });
    return call<ContentPage>("crud_store", { resource: "ContentPage", data });
  },

  async getAdmins() {
    const users = await call<Array<Record<string, unknown>>>("user_index");
    return users.map(user => ({
      id: String(user.id),
      name: String(user.name ?? ""),
      email: String(user.email ?? ""),
      role: roleFromBackend(user.role),
      active: user.active === true,
      lastLoginAt: typeof user.lastLoginAt === "string" ? user.lastLoginAt : undefined,
    }));
  },

  async getMessageAssignees() {
    const users = await call<Array<{ id: number; name: string }>>("contact_message_assignees");
    return users.map(user => ({ id: String(user.id), name: user.name }));
  },

  async inviteAdmin(data) {
    const user = await call<{ user?: { id: number } }>("user_store", {
      name: data.name,
      email: data.email,
      role: roleToBackend(data.role),
      password: data.password,
    });
    return { id: String(user.user?.id ?? ""), name: data.name, email: data.email, role: data.role, active: true };
  },

  async updateAdmin(admin) {
    const id = Number(admin.id);
    await call("user_update", { userId: id, name: admin.name });
    await call("user_sync_roles", { userId: id, roles: [roleToBackend(admin.role)] });
    await call("user_set_status", { userId: id, status: admin.active ? "active" : "suspended" });
    return admin;
  },

  async getAuditLogs(query) {
    const items = await listAll<AuditLogEntry>("AuditLog", {
      search: query?.search,
      filters: query?.filters,
      sort: query?.sort ?? { key: "at", dir: "desc" },
    });
    return pageItems(items, query);
  },
};
