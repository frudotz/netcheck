import { invokeAdmin, NativeUnavailableError } from "../../../src/lib/native";
import type {
  AdminRole,
  AdminAssignee,
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

export interface AdminSession {
  user: {
    id: number;
    name: string;
    email: string;
    status: string;
    lastLoginAt?: string | null;
  };
  roles: string[];
  superAdmin: boolean;
  permissions: string[];
}

export interface DashboardData {
  reports: ReportRecord[];
  devices: Device[];
  scoreThresholds: { iyi: number; orta: number };
}

export class AdminApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "AdminApiError";
  }
}

function errorPayload(error: unknown): { code?: string; message?: string } {
  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.code === "string") {
      return {
        code: candidate.code,
        message: typeof candidate.message === "string" ? candidate.message : undefined,
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

function normalizeError(error: unknown): Error {
  if (error instanceof NativeUnavailableError) {
    return new AdminApiError("native_unavailable", "Yönetim paneli yalnızca NetCheck masaüstü uygulamasında kullanılabilir.");
  }
  if (error instanceof AdminApiError) return error;
  const { code } = errorPayload(error);
  const messages: Record<string, string> = {
    unauthenticated: "Oturumun sona erdi. Yeniden giriş yap.",
    forbidden: "Bu işlem için yetkin bulunmuyor.",
    not_found: "İstenen kayıt bulunamadı.",
    validation: "Girilen bilgiler geçerli değil. Alanları kontrol edip yeniden dene.",
    conflict: "Bu işlem mevcut verilerle çakışıyor.",
    db: "Veritabanı işlemi tamamlanamadı.",
    internal: "İşlem tamamlanamadı.",
  };
  return new AdminApiError(code ?? "unknown", messages[code ?? ""] ?? "İşlem tamamlanamadı.");
}

async function call<T>(command: Parameters<typeof invokeAdmin>[0], args?: Record<string, unknown>): Promise<T> {
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

async function listAll<T>(resource: string, query: Record<string, unknown> = {}): Promise<T[]> {
  const pageSize = 100;
  const first = await call<BackendPage<T>>("crud_index", {
    resource,
    query: { ...query, page: 1, pageSize },
  });
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page += 1) {
    const next = await call<BackendPage<T>>("crud_index", {
      resource,
      query: { ...query, page, pageSize },
    });
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
  return call<ScoreRule>("crud_store", {
    resource: "ScoreRule",
    data: {
      status: rule.status,
      weights: rule.weights,
      latencyBands: rule.latencyBands,
      levels: rule.levels,
      publishedAt: rule.publishedAt ?? null,
      note: rule.note ?? null,
    },
  });
}

async function currentScoreThresholds(): Promise<{ iyi: number; orta: number }> {
  const dashboard = await call<{ thresholds: { iyi: number; orta: number } }>("report_dashboard");
  return dashboard.thresholds;
}

export const api = {
  async getAuthSession(): Promise<AdminSession | null> {
    return call<AdminSession | null>("auth_me");
  },

  async isFirstRun(): Promise<boolean> {
    return call<boolean>("auth_setup_required");
  },

  async login(email: string, password: string): Promise<AdminSession> {
    return call<AdminSession>("auth_login", { email, password });
  },

  async registerFirstAdmin(name: string, email: string, password: string): Promise<AdminSession> {
    return call<AdminSession>("auth_register", { name, email, password });
  },

  async logout(): Promise<void> {
    return call<void>("auth_logout");
  },

  async getReports(query?: Partial<ListQuery>): Promise<Paged<ReportRecord>> {
    let reports = await listAll<ReportRecord>("Report");
    const filters = query?.filters;
    if (query?.search?.trim()) {
      const needle = query.search.trim().toLocaleLowerCase();
      reports = reports.filter(report =>
        report.id.toLocaleLowerCase().includes(needle) ||
        report.deviceId?.toLocaleLowerCase().includes(needle)
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
    if (filters?.connectionType) {
      reports = reports.filter(report => report.network.connectionType === filters.connectionType);
    }
    if (filters?.testStatus) {
      reports = reports.filter(report => report.tests.some(test => test.status === filters.testStatus));
    }
    if (filters?.dateRange) {
      reports = reports.filter(report => withinDateRange(report.createdAt, filters.dateRange));
    }
    if (filters?.platform) {
      const devices = await listAll<Device>("Device");
      const deviceIds = new Set(
        devices.filter(device => device.platform.os === filters.platform).map(device => device.id)
      );
      reports = reports.filter(report => report.deviceId != null && deviceIds.has(report.deviceId));
    }
    return pageItems(reports, query);
  },

  async getDashboardData(dateRange: string, platform: string): Promise<DashboardData> {
    let [reports, devices, scoreThresholds] = await Promise.all([
      listAll<ReportRecord>("Report"),
      listAll<Device>("Device"),
      currentScoreThresholds(),
    ]);
    if (dateRange !== "all") reports = reports.filter(report => withinDateRange(report.createdAt, dateRange));
    if (platform) {
      const deviceIds = new Set(devices.filter(device => device.platform.os === platform).map(device => device.id));
      reports = reports.filter(report => report.deviceId && deviceIds.has(report.deviceId));
      devices = devices.filter(device => device.platform.os === platform);
    }
    return { reports, devices, scoreThresholds };
  },

  async getScoreThresholds(): Promise<{ iyi: number; orta: number }> {
    return currentScoreThresholds();
  },

  async getReportById(id: string, reveal = false): Promise<ReportRecord | null> {
    try {
      return await call<ReportRecord>("report_show", { id, reveal });
    } catch (error) {
      if (error instanceof AdminApiError && error.code === "not_found") return null;
      throw error;
    }
  },

  async updateReportSharing(id: string, shared: boolean, reason?: string): Promise<ReportRecord> {
    return call<ReportRecord>("report_set_sharing", { id, shared, reason: reason ?? null });
  },

  async deleteReport(id: string, reason: string): Promise<void> {
    return call<void>("crud_destroy", { resource: "Report", id, reason });
  },

  async getDevices(query?: Partial<ListQuery>): Promise<Paged<Device>> {
    let devices = await listAll<Device>("Device");
    if (query?.search?.trim()) {
      const needle = query.search.trim().toLocaleLowerCase();
      devices = devices.filter(device =>
        device.id.toLocaleLowerCase().includes(needle) ||
        device.platform.os.toLocaleLowerCase().includes(needle) ||
        device.platform.family.toLocaleLowerCase().includes(needle) ||
        device.appVersion.toLocaleLowerCase().includes(needle)
      );
    }
    if (query?.filters?.os) devices = devices.filter(device => device.platform.os === query.filters?.os);
    return pageItems(devices, query);
  },

  async getDeviceById(id: string): Promise<Device | null> {
    try {
      return await call<Device>("crud_show", { resource: "Device", id });
    } catch (error) {
      if (error instanceof AdminApiError && error.code === "not_found") return null;
      throw error;
    }
  },

  async deleteDeviceData(deviceId: string, reason: string): Promise<void> {
    const reports = await listAll<ReportRecord>("Report", { filters: { deviceId } });
    if (reports.length > 0) {
      await call<number>("crud_destroy_many", {
        resource: "Report",
        ids: reports.map(report => report.id),
        reason,
      });
    }
    await call<void>("crud_destroy", { resource: "Device", id: deviceId, reason });
  },

  async getMessages(query?: Partial<ListQuery>): Promise<Paged<ContactMessage>> {
    const items = await listAll<ContactMessage>("ContactMessage", {
      search: query?.search,
      filters: query?.filters,
      sort: query?.sort ?? { key: "createdAt", dir: "desc" },
    });
    return pageItems(items, query);
  },

  async replyMessage(messageId: string, body: string, internal: boolean, authorId?: string): Promise<ContactMessage> {
    const [message, session] = await Promise.all([
      call<ContactMessage>("crud_show", { resource: "ContactMessage", id: messageId }),
      call<AdminSession | null>("auth_me"),
    ]);
    if (!session) throw new AdminApiError("unauthenticated", "Oturumun sona erdi. Yeniden giriş yap.");
    const reply = {
      id: crypto.randomUUID(),
      authorId: authorId ?? String(session.user.id),
      body,
      at: new Date().toISOString(),
      internal,
    };
    return call<ContactMessage>("crud_update", {
      resource: "ContactMessage",
      id: messageId,
      data: {
        replies: [...(message.replies ?? []), reply],
        ...(!internal ? { status: "answered" } : {}),
      },
    });
  },

  async updateMessageStatus(messageId: string, status: ContactMessage["status"]): Promise<ContactMessage> {
    return call<ContactMessage>("crud_update", {
      resource: "ContactMessage",
      id: messageId,
      data: { status },
    });
  },

  async assignMessage(messageId: string, assignee?: string): Promise<ContactMessage> {
    return call<ContactMessage>("crud_update", {
      resource: "ContactMessage",
      id: messageId,
      data: { assignee: assignee ?? null },
    });
  },

  async markMessageSpam(messageIds: string[]): Promise<void> {
    for (const id of messageIds) {
      await call<ContactMessage>("crud_update", {
        resource: "ContactMessage",
        id,
        data: { status: "spam" },
      });
    }
  },

  async getScoreRules(): Promise<ScoreRule[]> {
    const rules = await listAll<ScoreRule>("ScoreRule");
    return rules.sort((a, b) => a.version - b.version);
  },

  async saveDraftScoreRule(rule: ScoreRule): Promise<ScoreRule> {
    return storeRule({ ...rule, status: "draft", publishedAt: undefined });
  },

  async publishScoreRule(rule: ScoreRule, reason?: string): Promise<ScoreRule> {
    let draft: ScoreRule;
    if (rule.status === "draft") {
      try {
        const current = await call<ScoreRule>("crud_show", {
          resource: "ScoreRule",
          id: rule.version,
        });
        draft = current.status === "draft"
          ? await call<ScoreRule>("crud_update", {
              resource: "ScoreRule",
              id: rule.version,
              data: {
                weights: rule.weights,
                latencyBands: rule.latencyBands,
                levels: rule.levels,
                note: rule.note ?? null,
              },
            })
          : await storeRule({ ...rule, status: "draft", publishedAt: undefined });
      } catch (error) {
        if (!(error instanceof AdminApiError) || error.code !== "not_found") throw error;
        draft = await storeRule({ ...rule, status: "draft", publishedAt: undefined });
      }
    } else {
      draft = await storeRule({ ...rule, status: "draft", publishedAt: undefined });
    }
    return call<ScoreRule>("score_rule_publish", { version: draft.version, note: reason ?? null });
  },

  async rollbackScoreRule(version: number, reason?: string): Promise<ScoreRule> {
    const target = await call<ScoreRule>("crud_show", { resource: "ScoreRule", id: version });
    const draft = await storeRule({
      ...target,
      status: "draft",
      publishedAt: undefined,
      note: `v${version} sürümünden geri yüklendi`,
    });
    return call<ScoreRule>("score_rule_publish", {
      version: draft.version,
      note: reason ?? `v${version} sürümüne geri dönüldü`,
    });
  },

  async getTargets(): Promise<DiagnosticTarget[]> {
    return listAll<DiagnosticTarget>("DiagnosticTarget");
  },

  async updateTarget(target: DiagnosticTarget): Promise<DiagnosticTarget> {
    return call<DiagnosticTarget>("crud_update", {
      resource: "DiagnosticTarget",
      id: target.kind,
      data: { target: target.target, enabled: target.enabled, timeoutMs: target.timeoutMs },
    });
  },

  async resetTargetsToDefault(): Promise<DiagnosticTarget[]> {
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

  async getContentPages(): Promise<ContentPage[]> {
    return listAll<ContentPage>("ContentPage");
  },

  async updateContentPage(page: ContentPage): Promise<ContentPage> {
    const pages = await this.getContentPages();
    const existing = pages.find(item => item.id === page.id);
    const data = {
      slug: page.slug,
      lang: page.lang,
      title: page.title,
      body: page.body,
      status: page.status,
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      return call<ContentPage>("crud_update", {
        resource: "ContentPage",
        id: page.id,
        data,
      });
    }
    return call<ContentPage>("crud_store", { resource: "ContentPage", data });
  },

  async getAdmins(): Promise<AdminUser[]> {
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

  async getMessageAssignees(): Promise<AdminAssignee[]> {
    const users = await call<Array<{ id: number; name: string }>>("contact_message_assignees");
    return users.map(user => ({ id: String(user.id), name: user.name }));
  },

  async inviteAdmin(data: Omit<AdminUser, "id" | "lastLoginAt"> & { password: string }): Promise<AdminUser> {
    const existing = (await api.getAdmins()).some(user => user.email.toLowerCase() === data.email.toLowerCase());
    if (existing) throw new AdminApiError("conflict", "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var.");
    const user = await call<Record<string, unknown>>("user_store", {
      name: data.name,
      email: data.email,
      role: roleToBackend(data.role),
      password: data.password,
    });
    return {
      id: String(user.user && typeof user.user === "object" ? Reflect.get(user.user, "id") : user.id),
      name: data.name,
      email: data.email,
      role: data.role,
      active: true,
    };
  },

  async updateAdmin(admin: AdminUser): Promise<AdminUser> {
    const id = Number(admin.id);
    await call("user_sync_roles", { userId: id, roles: [roleToBackend(admin.role)] });
    await call("user_store", { name: admin.name, email: admin.email, role: roleToBackend(admin.role) });
    await call("user_set_status", { userId: id, status: admin.active ? "active" : "suspended" });
    return admin;
  },

  async getAuditLogs(query?: Partial<ListQuery>): Promise<Paged<AuditLogEntry>> {
    const items = await listAll<AuditLogEntry>("AuditLog", {
      search: query?.search,
      filters: query?.filters,
      sort: query?.sort ?? { key: "at", dir: "desc" },
    });
    return pageItems(items, query);
  },
};
