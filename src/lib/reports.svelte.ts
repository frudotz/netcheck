// Tanılama raporları — paylaşılan durum (store), localStorage'da saklanır.
// Veritabanı yok; veriler yalnızca bu cihazda kalır.
import type { DiagnosticReport } from "./types";

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

/** Depodaki raporları okur. Depo okunamazsa ya da kayıt bozuksa hata fırlatır. */
function read(): DiagnosticReport[] {
  if (typeof localStorage === "undefined") return [];
  const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  if (!Array.isArray(parsed)) throw new Error("rapor deposu bozuk");
  return parsed.filter(isReport);
}

function load(): DiagnosticReport[] {
  try {
    return read();
  } catch {
    return [];
  }
}

class Reports {
  list = $state<DiagnosticReport[]>(load());

  latest = $derived(this.list[0]);

  /**
   * Listeleri besleyen tek yükleme işlevi (Görev 13): raporları depodan yeniden okur.
   * Okunamazsa hata fırlatır; mevcut liste değişmez ve ekran hata halini gösterir.
   * Depoya yazılamamış (yalnız bellekte duran) raporlar korunur; yoksa `save()` başarısız olunca
   * yeni rapor geçmişten ve detay ekranından kaybolurdu.
   */
  async yukle(): Promise<DiagnosticReport[]> {
    const depodaki = read();
    const yalnizBellekte = this.list.filter((r) => !depodaki.some((d) => d.id === r.id));
    this.list = [...yalnizBellekte, ...depodaki].slice(0, MAX_REPORTS);
    return this.list;
  }

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

/** Rapor detayının adresi; kimlik sorgu dizesindedir çünkü statik derleme kimlikli yol üretemez. */
export function reportHref(id: string): string {
  return `/rapor?id=${encodeURIComponent(id)}`;
}

/** Geçmiş listesinin arama ve süzgeçle birlikte son adresi (sessionStorage anahtarı). */
export const GECMIS_ADRESI = "netcheck.gecmis.adres";

/** Rapor ekranından dönülecek adres: listenin son adresi, yoksa /gecmis. */
export function gecmisAdresi(): string {
  try {
    const kayit = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(GECMIS_ADRESI) : null;
    return kayit?.startsWith("/gecmis") ? kayit : "/gecmis";
  } catch {
    return "/gecmis";
  }
}
