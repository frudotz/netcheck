import {
  ReportRecord,
  Device,
  ContactMessage,
  ScoreRule,
  DiagnosticTarget,
  ContentPage,
  AdminUser,
  AuditLogEntry,
  ListQuery,
  Paged,
} from "../domain/types";
import {
  seedReports,
  seedDevices,
  seedMessages,
  seedRule,
  seedTargets,
  seedContentPages,
  seedAdmins,
  seedAuditLogs,
} from "./seedData";

const STORAGE_PREFIX = "netcheck-admin:";
const SIMULATE_ERRORS = true; // 5% chance of random error for testing error UI

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error("LocalStorage write error", err);
  }
}

// 300 - 600 ms artificial latency
const delay = (ms?: number) =>
  new Promise<void>((resolve, reject) => {
    const waitTime = ms ?? Math.floor(Math.random() * 300) + 300;
    setTimeout(() => {
      // 5% error simulation, disabled if specific flag passed
      if (SIMULATE_ERRORS && Math.random() < 0.04) {
        reject(new Error("Ağ/Sunucu simülasyon hatası (Geçici 500 API yanıtı)"));
      } else {
        resolve();
      }
    }, waitTime);
  });

export const api = {
  // ---- Reports ----
  async getReports(query?: Partial<ListQuery>): Promise<Paged<ReportRecord>> {
    await delay();
    let all = getStorageItem<ReportRecord[]>("reports", seedReports);

    // Apply search
    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      all = all.filter(
        r =>
          r.id.toLowerCase().includes(q) ||
          r.deviceId.toLowerCase().includes(q) ||
          r.network.localIPv4?.includes(q) ||
          r.network.hostname?.toLowerCase().includes(q)
      );
    }

    // Apply filters
    if (query?.filters) {
      const f = query.filters;
      if (f.scoreLevel) {
        if (f.scoreLevel === "iyi") all = all.filter(r => r.score >= 80);
        else if (f.scoreLevel === "orta") all = all.filter(r => r.score >= 50 && r.score < 80);
        else if (f.scoreLevel === "zayif") all = all.filter(r => r.score < 50);
      }
      if (f.minScore !== undefined) {
        all = all.filter(r => r.score >= Number(f.minScore));
      }
      if (f.maxScore !== undefined) {
        all = all.filter(r => r.score <= Number(f.maxScore));
      }
      if (f.connectionType) {
        all = all.filter(r => r.network.connectionType === f.connectionType);
      }
      if (f.shared !== undefined && f.shared !== "") {
        const isShared = f.shared === true || f.shared === "true";
        all = all.filter(r => r.shared === isShared);
      }
      if (f.platform) {
        // Find devices with matching platform
        const devices = getStorageItem<Device[]>("devices", seedDevices);
        const matchingDevIds = new Set(
          devices.filter(d => d.platform.os === f.platform).map(d => d.id)
        );
        all = all.filter(r => matchingDevIds.has(r.deviceId));
      }
      if (f.testStatus) {
        all = all.filter(r => r.tests.some(t => t.status === f.testStatus));
      }
      if (f.dateRange) {
        const now = new Date("2026-10-14T05:57:00Z").getTime();
        const days = f.dateRange === "7d" ? 7 : f.dateRange === "30d" ? 30 : null;
        if (days) {
          const threshold = now - days * 24 * 3600 * 1000;
          all = all.filter(r => new Date(r.createdAt).getTime() >= threshold);
        }
      }
    }

    // Sorting
    if (query?.sort) {
      const { key, dir } = query.sort;
      all.sort((a, b) => {
        let valA: any = (a as any)[key];
        let valB: any = (b as any)[key];
        if (key === "createdAt") {
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
        }
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return dir === "asc" ? -1 : 1;
        if (valA > valB) return dir === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by createdAt desc
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 10;
    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  },

  async getReportById(id: string): Promise<ReportRecord | null> {
    await delay();
    const all = getStorageItem<ReportRecord[]>("reports", seedReports);
    return all.find(r => r.id === id) || null;
  },

  async updateReportSharing(id: string, shared: boolean, reason?: string): Promise<ReportRecord> {
    await delay();
    const all = getStorageItem<ReportRecord[]>("reports", seedReports);
    const index = all.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Rapor bulunamadı");
    const updated = { ...all[index], shared };
    all[index] = updated;
    setStorageItem("reports", all);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: shared ? "report.enable_sharing" : "report.disable_sharing",
      entity: "Report",
      entityId: id,
      reason: reason || "Rapor paylaşım durumu güncellendi",
      before: { shared: !shared },
      after: { shared },
    });

    return updated;
  },

  async deleteReport(id: string, reason: string): Promise<void> {
    await delay();
    const all = getStorageItem<ReportRecord[]>("reports", seedReports);
    const existing = all.find(r => r.id === id);
    if (!existing) throw new Error("Silinecek rapor bulunamadı");
    const filtered = all.filter(r => r.id !== id);
    setStorageItem("reports", filtered);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "report.delete",
      entity: "Report",
      entityId: id,
      reason,
      before: { id: existing.id, score: existing.score },
    });
  },

  // ---- Devices ----
  async getDevices(query?: Partial<ListQuery>): Promise<Paged<Device>> {
    await delay();
    let all = getStorageItem<Device[]>("devices", seedDevices);

    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      all = all.filter(
        d =>
          d.id.toLowerCase().includes(q) ||
          d.platform.os.toLowerCase().includes(q) ||
          d.platform.family.toLowerCase().includes(q) ||
          d.appVersion.toLowerCase().includes(q)
      );
    }

    if (query?.filters?.os) {
      all = all.filter(d => d.platform.os === query.filters?.os);
    }

    if (query?.sort) {
      const { key, dir } = query.sort;
      all.sort((a, b) => {
        let valA: any = (a as any)[key];
        let valB: any = (b as any)[key];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return dir === "asc" ? -1 : 1;
        if (valA > valB) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 10;
    const total = all.length;
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), total, page, pageSize };
  },

  async getDeviceById(id: string): Promise<Device | null> {
    await delay();
    const all = getStorageItem<Device[]>("devices", seedDevices);
    return all.find(d => d.id === id) || null;
  },

  async deleteDeviceData(deviceId: string, reason: string): Promise<void> {
    await delay();
    // Delete device reports
    const reports = getStorageItem<ReportRecord[]>("reports", seedReports);
    const remainingReports = reports.filter(r => r.deviceId !== deviceId);
    setStorageItem("reports", remainingReports);

    // Update or delete device
    const devices = getStorageItem<Device[]>("devices", seedDevices);
    const updatedDevices = devices.filter(d => d.id !== deviceId);
    setStorageItem("devices", updatedDevices);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "device.delete_data",
      entity: "Device",
      entityId: deviceId,
      reason,
    });
  },

  // ---- Contact Messages ----
  async getMessages(query?: Partial<ListQuery>): Promise<Paged<ContactMessage>> {
    await delay();
    let all = getStorageItem<ContactMessage[]>("messages", seedMessages);

    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      all = all.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          m.subject?.toLowerCase().includes(q)
      );
    }

    if (query?.filters?.status) {
      all = all.filter(m => m.status === query.filters?.status);
    }
    if (query?.filters?.lang) {
      all = all.filter(m => m.lang === query.filters?.lang);
    }

    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 10;
    const total = all.length;
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), total, page, pageSize };
  },

  async replyMessage(
    messageId: string,
    body: string,
    internal: boolean,
    authorId = "adm-001"
  ): Promise<ContactMessage> {
    await delay();
    const all = getStorageItem<ContactMessage[]>("messages", seedMessages);
    const index = all.findIndex(m => m.id === messageId);
    if (index === -1) throw new Error("Mesaj bulunamadı");

    const reply = {
      id: "rep-" + Math.random().toString(36).substring(2, 7),
      authorId,
      body,
      at: new Date().toISOString(),
      internal,
    };

    const updated: ContactMessage = {
      ...all[index],
      status: internal ? all[index].status : "answered",
      replies: [...all[index].replies, reply],
    };
    all[index] = updated;
    setStorageItem("messages", all);

    await this.logAuditEvent({
      actorId: authorId,
      action: internal ? "message.add_internal_note" : "message.reply",
      entity: "ContactMessage",
      entityId: messageId,
      reason: internal ? "Dahili not eklendi" : "Kullanıcıya yanıt gönderildi",
    });

    return updated;
  },

  async updateMessageStatus(
    messageId: string,
    status: ContactMessage["status"]
  ): Promise<ContactMessage> {
    await delay();
    const all = getStorageItem<ContactMessage[]>("messages", seedMessages);
    const index = all.findIndex(m => m.id === messageId);
    if (index === -1) throw new Error("Mesaj bulunamadı");
    const oldStatus = all[index].status;
    all[index] = { ...all[index], status };
    setStorageItem("messages", all);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "message.status_change",
      entity: "ContactMessage",
      entityId: messageId,
      before: { status: oldStatus },
      after: { status },
    });

    return all[index];
  },

  async assignMessage(messageId: string, assignee?: string): Promise<ContactMessage> {
    await delay();
    const all = getStorageItem<ContactMessage[]>("messages", seedMessages);
    const index = all.findIndex(m => m.id === messageId);
    if (index === -1) throw new Error("Mesaj bulunamadı");
    all[index] = { ...all[index], assignee };
    setStorageItem("messages", all);
    return all[index];
  },

  async markMessageSpam(messageIds: string[]): Promise<void> {
    await delay();
    const all = getStorageItem<ContactMessage[]>("messages", seedMessages);
    const idSet = new Set(messageIds);
    const updated = all.map(m => (idSet.has(m.id) ? { ...m, status: "spam" as const } : m));
    setStorageItem("messages", updated);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "message.mark_spam",
      entity: "ContactMessage",
      entityId: messageIds.join(","),
      reason: "Toplu spam işaretleme",
    });
  },

  // ---- Score Rules ----
  async getScoreRules(): Promise<ScoreRule[]> {
    await delay();
    const rules = getStorageItem<ScoreRule[]>("rules", [seedRule]);
    return rules;
  },

  async saveDraftScoreRule(rule: ScoreRule): Promise<ScoreRule> {
    await delay();
    const rules = getStorageItem<ScoreRule[]>("rules", [seedRule]);
    const nextVersion = Math.max(...rules.map(r => r.version)) + 1;
    const draft: ScoreRule = {
      ...rule,
      version: nextVersion,
      status: "draft",
    };
    rules.push(draft);
    setStorageItem("rules", rules);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "rule.save_draft",
      entity: "ScoreRule",
      entityId: `v${nextVersion}`,
      reason: "Yeni skor kuralı taslağı oluşturuldu",
    });

    return draft;
  },

  async publishScoreRule(rule: ScoreRule, reason?: string): Promise<ScoreRule> {
    await delay();
    const rules = getStorageItem<ScoreRule[]>("rules", [seedRule]);
    const nextVersion = Math.max(...rules.map(r => r.version)) + 1;
    const published: ScoreRule = {
      ...rule,
      version: nextVersion,
      status: "published",
      publishedAt: new Date().toISOString(),
    };
    rules.push(published);
    setStorageItem("rules", rules);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "rule.publish",
      entity: "ScoreRule",
      entityId: `v${nextVersion}`,
      reason: reason || "Yeni puanlama kuralları canlıya alındı",
    });

    return published;
  },

  async rollbackScoreRule(version: number, reason?: string): Promise<ScoreRule> {
    await delay();
    const rules = getStorageItem<ScoreRule[]>("rules", [seedRule]);
    const target = rules.find(r => r.version === version);
    if (!target) throw new Error("Hedef kural sürümü bulunamadı");
    const nextVersion = Math.max(...rules.map(r => r.version)) + 1;
    const rolledBack: ScoreRule = {
      ...target,
      version: nextVersion,
      status: "published",
      publishedAt: new Date().toISOString(),
      note: `v${version} sürümünden geri yüklendi`,
    };
    rules.push(rolledBack);
    setStorageItem("rules", rules);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "rule.rollback",
      entity: "ScoreRule",
      entityId: `v${nextVersion}`,
      reason: reason || `v${version} sürümüne geri dönüldü`,
    });

    return rolledBack;
  },

  // ---- Diagnostic Targets ----
  async getTargets(): Promise<DiagnosticTarget[]> {
    await delay();
    return getStorageItem<DiagnosticTarget[]>("targets", seedTargets);
  },

  async updateTarget(target: DiagnosticTarget): Promise<DiagnosticTarget> {
    await delay();
    const targets = getStorageItem<DiagnosticTarget[]>("targets", seedTargets);
    const index = targets.findIndex(t => t.kind === target.kind);
    if (index === -1) throw new Error("Hedef test bulunamadı");
    const before = targets[index];
    targets[index] = target;
    setStorageItem("targets", targets);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "target.update",
      entity: "DiagnosticTarget",
      entityId: target.kind,
      reason: `${target.kind} hedefi güncellendi`,
      before,
      after: target,
    });

    return target;
  },

  async resetTargetsToDefault(): Promise<DiagnosticTarget[]> {
    await delay();
    setStorageItem("targets", seedTargets);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "target.reset_default",
      entity: "DiagnosticTarget",
      entityId: "all",
      reason: "Tanılama hedefleri fabrika ayarlarına döndürüldü",
    });

    return seedTargets;
  },

  // ---- Content Pages ----
  async getContentPages(): Promise<ContentPage[]> {
    await delay();
    return getStorageItem<ContentPage[]>("content", seedContentPages);
  },

  async updateContentPage(page: ContentPage): Promise<ContentPage> {
    await delay();
    const pages = getStorageItem<ContentPage[]>("content", seedContentPages);
    const index = pages.findIndex(p => p.id === page.id);
    const updated = { ...page, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      pages[index] = updated;
    } else {
      pages.push(updated);
    }
    setStorageItem("content", pages);

    await this.logAuditEvent({
      actorId: "adm-003",
      action: "content.publish",
      entity: "ContentPage",
      entityId: page.slug + "-" + page.lang,
      reason: `${page.slug} (${page.lang}) sayfası güncellendi`,
    });

    return updated;
  },

  // ---- Admins ----
  async getAdmins(): Promise<AdminUser[]> {
    await delay();
    return getStorageItem<AdminUser[]>("admins", seedAdmins);
  },

  async inviteAdmin(data: Omit<AdminUser, "id" | "lastLoginAt">): Promise<AdminUser> {
    await delay();
    const admins = getStorageItem<AdminUser[]>("admins", seedAdmins);
    const newAdmin: AdminUser = {
      ...data,
      id: "adm-" + Math.random().toString(36).substring(2, 6),
    };
    admins.push(newAdmin);
    setStorageItem("admins", admins);

    await this.logAuditEvent({
      actorId: "adm-001",
      action: "admin.invite",
      entity: "AdminUser",
      entityId: newAdmin.id,
      reason: `Yeni yönetici davet edildi: ${newAdmin.email}`,
    });

    return newAdmin;
  },

  async updateAdmin(admin: AdminUser): Promise<AdminUser> {
    await delay();
    const admins = getStorageItem<AdminUser[]>("admins", seedAdmins);
    const index = admins.findIndex(a => a.id === admin.id);
    if (index === -1) throw new Error("Yönetici bulunamadı");
    admins[index] = admin;
    setStorageItem("admins", admins);
    return admin;
  },

  // ---- Audit Logs ----
  async getAuditLogs(query?: Partial<ListQuery>): Promise<Paged<AuditLogEntry>> {
    await delay();
    let all = getStorageItem<AuditLogEntry[]>("audit", seedAuditLogs);

    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      all = all.filter(
        a =>
          a.action.toLowerCase().includes(q) ||
          a.entity.toLowerCase().includes(q) ||
          a.entityId.toLowerCase().includes(q) ||
          a.reason?.toLowerCase().includes(q)
      );
    }

    if (query?.filters?.actorId) {
      all = all.filter(a => a.actorId === query.filters?.actorId);
    }
    if (query?.filters?.action) {
      all = all.filter(a => a.action === query.filters?.action);
    }
    if (query?.filters?.entity) {
      all = all.filter(a => a.entity === query.filters?.entity);
    }

    all.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 10;
    const total = all.length;
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), total, page, pageSize };
  },

  async logAuditEvent(entry: Omit<AuditLogEntry, "id" | "at">): Promise<void> {
    const all = getStorageItem<AuditLogEntry[]>("audit", seedAuditLogs);
    const log: AuditLogEntry = {
      ...entry,
      id: "aud-" + (1000 + all.length),
      at: new Date().toISOString(),
    };
    all.unshift(log);
    setStorageItem("audit", all);
  },

  // Reset all mock data to defaults
  resetAllMockData(): void {
    setStorageItem("reports", seedReports);
    setStorageItem("devices", seedDevices);
    setStorageItem("messages", seedMessages);
    setStorageItem("rules", [seedRule]);
    setStorageItem("targets", seedTargets);
    setStorageItem("content", seedContentPages);
    setStorageItem("admins", seedAdmins);
    setStorageItem("audit", seedAuditLogs);
  },
};
