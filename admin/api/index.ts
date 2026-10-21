// Yönetim panelinin veri arayüzü. Panel bu aşamada hiçbir veri kaynağına bağlı değildir:
// örnek/sahte veri yoktur, giriş yoktur, SQLite'a bağlanmaz (karar C-3 bekliyor).
// Ekranlar `bagli` false iken kendi içeriklerini değil "bağlı değil" durumunu gösterir (App.tsx).
// Bağlantı yapıldığında bu dosya aynı imzalarla `src/lib/native.ts` üzerinden çalışan sürümle değişir.
import type {
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

export interface AdminApi {
  getReports(query?: Partial<ListQuery>): Promise<Paged<ReportRecord>>;
  getReportById(id: string): Promise<ReportRecord | null>;
  updateReportSharing(id: string, shared: boolean, reason?: string): Promise<ReportRecord>;
  deleteReport(id: string, reason: string): Promise<void>;
  getDevices(query?: Partial<ListQuery>): Promise<Paged<Device>>;
  getDeviceById(id: string): Promise<Device | null>;
  deleteDeviceData(deviceId: string, reason: string): Promise<void>;
  getMessages(query?: Partial<ListQuery>): Promise<Paged<ContactMessage>>;
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
  inviteAdmin(data: Omit<AdminUser, "id" | "lastLoginAt">): Promise<AdminUser>;
  updateAdmin(admin: AdminUser): Promise<AdminUser>;
  getAuditLogs(query?: Partial<ListQuery>): Promise<Paged<AuditLogEntry>>;
  /** İşlemi yapan yönetici istemciden gönderilmez; arka uç oturumdan belirler. */
  logAuditEvent(entry: Omit<AuditLogEntry, "id" | "at" | "actorId">): Promise<void>;
}

/** Panel bir veri kaynağına bağlı mı. Bu aşamada her zaman false. */
export const bagli: boolean = false;

/** Bağlı olmayan panelde bir veri işlemi çağrılırsa fırlatılır. */
export class PanelBagliDegil extends Error {
  constructor() {
    super("panel_not_connected");
    this.name = "PanelBagliDegil";
  }
}

const reddet = (): Promise<never> => Promise.reject(new PanelBagliDegil());

export const api: AdminApi = {
  getReports: reddet,
  getReportById: reddet,
  updateReportSharing: reddet,
  deleteReport: reddet,
  getDevices: reddet,
  getDeviceById: reddet,
  deleteDeviceData: reddet,
  getMessages: reddet,
  replyMessage: reddet,
  updateMessageStatus: reddet,
  assignMessage: reddet,
  markMessageSpam: reddet,
  getScoreRules: reddet,
  saveDraftScoreRule: reddet,
  publishScoreRule: reddet,
  rollbackScoreRule: reddet,
  getTargets: reddet,
  updateTarget: reddet,
  resetTargetsToDefault: reddet,
  getContentPages: reddet,
  updateContentPage: reddet,
  getAdmins: reddet,
  inviteAdmin: reddet,
  updateAdmin: reddet,
  getAuditLogs: reddet,
  logAuditEvent: reddet,
};
