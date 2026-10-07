// Bilgi sayfaları için dil tanımları (görev 06: TR / EN / AR / FA).
// Uygulama ekranları Türkçedir; yalnızca bilgi sayfaları çok dillidir.

export type Locale = "tr" | "en" | "ar" | "fa";
export type InfoSlug = "hakkinda" | "iletisim" | "kosullar" | "gizlilik";

export const LOCALES: Locale[] = ["tr", "en", "ar", "fa"];

export const localeName: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  ar: "العربية",
  fa: "فارسی",
};

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" || locale === "fa" ? "rtl" : "ltr";
}

/** Türkçe sayfalar kök dizinde, diğer diller /<dil>/ altında. */
export function infoHref(locale: Locale, slug: InfoSlug): string {
  return locale === "tr" ? `/${slug}` : `/${locale}/${slug}`;
}

export const INFO_SLUGS: InfoSlug[] = ["hakkinda", "iletisim", "kosullar", "gizlilik"];

export const pageTitle: Record<Locale, Record<InfoSlug, string>> = {
  tr: { hakkinda: "Hakkında", iletisim: "İletişim", kosullar: "Kullanım Koşulları", gizlilik: "Gizlilik Politikası" },
  en: { hakkinda: "About", iletisim: "Contact", kosullar: "Terms of Use", gizlilik: "Privacy Policy" },
  ar: { hakkinda: "حول التطبيق", iletisim: "اتصل بنا", kosullar: "شروط الاستخدام", gizlilik: "سياسة الخصوصية" },
  fa: { hakkinda: "درباره", iletisim: "تماس", kosullar: "شرایط استفاده", gizlilik: "سیاست حریم خصوصی" },
};

export const ui: Record<Locale, { language: string; otherPages: string; updated: string }> = {
  tr: { language: "Dil", otherPages: "Diğer bilgi sayfaları", updated: "Son güncelleme: 7 Ekim 2026" },
  en: { language: "Language", otherPages: "Other information pages", updated: "Last updated: 7 October 2026" },
  ar: { language: "اللغة", otherPages: "صفحات معلومات أخرى", updated: "آخر تحديث: 7 أكتوبر 2026" },
  fa: { language: "زبان", otherPages: "صفحات اطلاعات دیگر", updated: "آخرین به‌روزرسانی: ۷ اکتبر ۲۰۲۶" },
};
