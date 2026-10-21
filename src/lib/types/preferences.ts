// Kullanıcı tercihleri ve bilgi sayfası dilleri; yalnız ön yüzde, Rust'tan gelmez.

/** Uygulanan tema; `<html data-tema>` değeri. */
export type Tema = "gunduz" | "gece";

/** Kullanıcının seçimi; "sistem" işletim sistemi temasını izler. */
export type TemaTercihi = Tema | "sistem";

/** Bilgi sayfası dilleri (görev 06). */
export type Locale = "tr" | "en" | "ar" | "fa";

/** Dört bilgi sayfası. */
export type InfoSlug = "hakkinda" | "iletisim" | "kosullar" | "gizlilik";
