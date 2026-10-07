// Tanılama raporları — paylaşılan durum (store), localStorage'da saklanır.
// Veritabanı yok; veriler yalnızca bu cihazda kalır.
import type { DiagnosticReport } from "../types/netcheck";

const STORAGE_KEY = "netcheck.reports";
const MAX_REPORTS = 50;

function isReport(value: unknown): value is DiagnosticReport {
  const r = value as DiagnosticReport;
  return (
    typeof r === "object" &&
    r !== null &&
    typeof r.id === "string" &&
    typeof r.createdAt === "string" &&
    typeof r.score === "number" &&
    Array.isArray(r.tests) &&
    typeof r.network === "object"
  );
}

function load(): DiagnosticReport[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isReport) : [];
  } catch {
    return [];
  }
}

class Reports {
  list = $state<DiagnosticReport[]>(load());

  latest = $derived(this.list[0]);

  add(report: DiagnosticReport) {
    this.list.unshift(report);
    if (this.list.length > MAX_REPORTS) this.list.length = MAX_REPORTS;
    this.save();
  }

  find(id: string): DiagnosticReport | undefined {
    return this.list.find((r) => r.id === id);
  }

  clear() {
    this.list = [];
    this.save();
  }

  private save() {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.list));
    } catch {
      // Depolama dolu veya devre dışı: rapor bu oturum boyunca bellekte kalır.
    }
  }
}

export const reports = new Reports();

export function reportHref(id: string): string {
  return `/rapor?id=${encodeURIComponent(id)}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}
