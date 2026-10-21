// Genel arayüz bileşenlerinin girdileri; bileşenler uygulamanın veri tiplerini tanımaz.

/** Kart etiketinin anlamı; rengi `--durum-*` değişkenlerinden gelir. */
export type EtiketTuru = "bilgi" | "basari" | "uyari" | "hata";

/** Karttaki isteğe bağlı görsel; alternatif metin zorunludur. */
export interface KartGorseli {
  /** Görsel adresi. */
  src: string;
  /** Ekran okuyucu için alternatif metin; yalnız süs ise boş dize. */
  alt: string;
}

/** `Kart.svelte` girdileri. `href` verilirse bağlantı, `onclick` verilirse düğme, ikisi yoksa düz kart olur. */
export interface KartOzellikleri {
  // Zorunlu
  /** Kartın başlığı. */
  baslik: string;
  // İsteğe bağlı
  /** Başlığın altındaki kısa metin. */
  altMetin?: string;
  /** Alt metin bir adres ya da kod ise eşit aralıklı yazıyla gösterilir. */
  altMetinEsAralikli?: boolean;
  /** Başlığın başında gösterilen görsel. */
  gorsel?: KartGorseli;
  /** Köşedeki kısa etiket (ör. "Varsayılan"). */
  etiket?: string;
  /** Etiketin anlamı; verilmezse "bilgi". */
  etiketTuru?: EtiketTuru;
  /** Tıklanınca gidilecek adres. */
  href?: string;
  /** Tıklama davranışı (`href` yoksa). */
  onclick?: () => void;
}
