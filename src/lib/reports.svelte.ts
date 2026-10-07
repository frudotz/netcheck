// Tanılama raporları — paylaşılan durum (store).
import type { DiagnosticReport } from "../types/netcheck";

class Reports {
  list = $state<DiagnosticReport[]>([]);

  latest = $derived(this.list[0]);

  add(report: DiagnosticReport) {
    this.list.unshift(report);
  }

  find(id: string): DiagnosticReport | undefined {
    return this.list.find((r) => r.id === id);
  }
}

export const reports = new Reports();

export function reportHref(id: string): string {
  return `/rapor?id=${encodeURIComponent(id)}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}
