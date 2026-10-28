// Panel ekranları ve adresleri. Her ekran src/pages/admin/ altında ayrı bir Astro sayfasıdır;
// istemci tarafı yönlendirici kullanılmaz. Rapor kimliği, uygulamadaki gibi sorgu dizesinde taşınır
// (statik derlemede kimlik başına sayfa üretilemez; docs/mimari-agac.md).

export type Gorunum =
  | "ozet"
  | "raporlar"
  | "rapor"
  | "cihazlar"
  | "mesajlar"
  | "skor-kurallari"
  | "hedefler"
  | "icerik"
  | "yoneticiler"
  | "denetim"
  | "ayarlar";

/** `src/pages/admin/[gorunum].astro` tarafından üretilen ekranlar (özet `index.astro`'dadır). */
export const ALT_GORUNUMLER: Exclude<Gorunum, "ozet">[] = [
  "raporlar",
  "rapor",
  "cihazlar",
  "mesajlar",
  "skor-kurallari",
  "hedefler",
  "icerik",
  "yoneticiler",
  "denetim",
  "ayarlar",
];

/** Veri gerektirmeyen ekranlar; panel bağlı değilken de çalışır. */
export const YEREL_GORUNUMLER: Gorunum[] = ["ayarlar"];

/** Ekranın adresi; `sorgu` boş değerleri atlar. */
export function adres(gorunum: Gorunum, sorgu: Record<string, string | undefined> = {}): string {
  const yol = gorunum === "ozet" ? "/admin" : `/admin/${gorunum}`;
  const parametreler = new URLSearchParams();
  for (const [anahtar, deger] of Object.entries(sorgu)) {
    if (deger) parametreler.set(anahtar, deger);
  }
  const dizi = parametreler.toString();
  return dizi ? `${yol}?${dizi}` : yol;
}

/** Sayfa adresindeki sorgu parametresi. */
export function sorguDegeri(anahtar: string): string | null {
  return typeof location === "undefined" ? null : new URLSearchParams(location.search).get(anahtar);
}

export function git(hedef: string): void {
  location.assign(hedef);
}
