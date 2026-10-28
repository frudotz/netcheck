// Uygulama dili (TR / EN / AR / FA) — seçim localStorage'da saklanır, varsayılan Türkçe.
// Uygulama ekranlarında <html lang dir> buna göre ayarlanır; bilgi sayfaları kendi dil rotalarını
// kullandığı için (`data-sabit-dil`) etkilenmez. Açılıştaki ilk uygulama Layout.astro betiğindedir.
import { dirOf, LOCALES } from "./i18n";
import { sozluk, type Metinler } from "./sozluk";
import type { Locale } from "./types";

const ANAHTAR = "dil";

function kayitliDil(): Locale {
  try {
    const deger = typeof localStorage !== "undefined" ? localStorage.getItem(ANAHTAR) : null;
    return LOCALES.find((l) => l === deger) ?? "tr";
  } catch {
    return "tr";
  }
}

class DilYonetici {
  kod = $state<Locale>(kayitliDil());
  metin = $derived<Metinler>(sozluk[this.kod]);

  sec(kod: Locale) {
    this.kod = kod;
    if (typeof document !== "undefined" && document.documentElement.dataset.sabitDil === undefined) {
      document.documentElement.lang = kod;
      document.documentElement.dir = dirOf(kod);
    }
    try {
      if (typeof localStorage === "undefined") return;
      if (kod === "tr") localStorage.removeItem(ANAHTAR);
      else localStorage.setItem(ANAHTAR, kod);
    } catch {
      // Depolama kullanılamıyorsa seçim yalnızca bu oturumda geçerlidir.
    }
  }
}

export const dil = new DilYonetici();
