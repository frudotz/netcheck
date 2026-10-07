// Adım 15: Tema (gece / gündüz) — seçim localStorage'da saklanır
// NetCheck: "sistem" tercihi eklendi; bu durumda anahtar silinir ve işletim sistemi teması izlenir
// (Layout.astro'daki açılış betiği de anahtar yoksa sistem temasını uygular).
export type Tema = "gunduz" | "gece";
export type TemaTercihi = Tema | "sistem";

const ANAHTAR = "tema";

function sistemTemasi(): Tema {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "gece" : "gunduz";
}

function kayitliTercih(): TemaTercihi {
  try {
    const deger = typeof localStorage !== "undefined" ? localStorage.getItem(ANAHTAR) : null;
    return deger === "gece" || deger === "gunduz" ? deger : "sistem";
  } catch {
    return "sistem";
  }
}

class TemaYonetici {
  mod = $state<Tema>(
    typeof document !== "undefined" && document.documentElement.dataset.tema === "gece"
      ? "gece"
      : "gunduz"
  );
  tercih = $state<TemaTercihi>(kayitliTercih());

  constructor() {
    // Sistem teması değişirse ve kullanıcı "sistem" seçtiyse uygula.
    if (typeof matchMedia !== "undefined") {
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (this.tercih === "sistem") this.uygula(sistemTemasi());
      });
    }
  }

  private uygula(mod: Tema) {
    this.mod = mod;
    if (typeof document !== "undefined") {
      document.documentElement.dataset.tema = mod;
    }
  }

  degistir() {
    this.sec(this.mod === "gece" ? "gunduz" : "gece");
  }

  sec(tercih: TemaTercihi) {
    this.tercih = tercih;
    this.uygula(tercih === "sistem" ? sistemTemasi() : tercih);
    try {
      if (typeof localStorage === "undefined") return;
      if (tercih === "sistem") localStorage.removeItem(ANAHTAR);
      else localStorage.setItem(ANAHTAR, tercih);
    } catch {
      // Depolama kullanılamıyorsa tercih yalnızca bu oturumda geçerlidir.
    }
  }
}

export const tema = new TemaYonetici();
