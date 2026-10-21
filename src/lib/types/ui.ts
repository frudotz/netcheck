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

/** `Yukleniyor.svelte` girdileri: veri gelene kadar gösterilen iskelet. */
export interface YukleniyorOzellikleri {
  // İsteğe bağlı
  /** İskelet satır sayısı; verilmezse 3. */
  satir?: number;
  /** Ekran okuyucunun duyuracağı metin; verilmezse sözlükteki "Yükleniyor…". */
  etiket?: string;
}

/** `BosDurum.svelte` girdileri: kayıt yokken ya da süzgeç sonucu boşken. */
export interface BosDurumOzellikleri {
  // Zorunlu
  /** Kısa başlık (ör. "Henüz test yapılmadı"). */
  baslik: string;
  // İsteğe bağlı
  /** Ne yapılabileceğini anlatan açıklama. */
  aciklama?: string;
  /** Düğme metni; verilmezse düğme çizilmez. */
  dugmeMetni?: string;
  /** Düğme bir sayfaya gidiyorsa adres. */
  dugmeHref?: string;
  /** Düğmeye basılınca (adres yoksa). */
  onclick?: () => void;
}

/** `HataDurumu.svelte` girdileri: veri alınamadığında. */
export interface HataDurumuOzellikleri {
  // Zorunlu
  /** Kullanıcıya gösterilen hata mesajı (ham hata değil). */
  mesaj: string;
  // İsteğe bağlı
  /** "Tekrar dene" düğmesine basılınca; verilmezse düğme çizilmez. */
  tekrarDene?: () => void;
  /** Düğme metni; verilmezse sözlükteki "Tekrar dene". */
  dugmeMetni?: string;
}
