<script lang="ts">
  // Ayarlar — tema ve dil seçimi, uygulama bilgisi ve yerel veri
  import { onMount } from "svelte";
  import { tema } from "$lib/tema.svelte";
  import { dil } from "$lib/dil.svelte";
  import type { PlatformInfo, TemaTercihi } from "$lib/types";
  import { reports } from "$lib/reports.svelte";
  import { getPlatformInfo, hasNative } from "$lib/native";
  import { dirOf, infoHref, INFO_SLUGS, LOCALES, localeName, pageTitle } from "$lib/i18n";
  import { icmpEtiketi, platformEtiketi } from "$lib/sozluk";
  import pkg from "../../package.json";
  import ExternalLink from "./ExternalLink.svelte";

  const m = $derived(dil.metin);
  const ok = $derived(dirOf(dil.kod) === "rtl" ? "←" : "→");

  const secenekler = $derived<{ deger: TemaTercihi; ad: string }[]>([
    { deger: "sistem", ad: m.temaSistem },
    { deger: "gunduz", ad: m.temaGunduz },
    { deger: "gece", ad: m.temaGece },
  ]);

  // localStorage ve Tauri tespiti yalnızca istemcide anlamlıdır.
  let mounted = $state(false);
  // Çalışma ortamı: tarayıcıda "browser", Rust'tan okunamazsa "unknown"; metin dile göre çizilir.
  let ortam = $state<PlatformInfo | "browser" | "unknown" | null>(null);

  onMount(() => {
    mounted = true;
    if (!hasNative()) {
      ortam = "browser";
      return;
    }
    // Çalışma ortamı Rust'tan okunur (masaüstü/mobil, işletim sistemi, ping yöntemi).
    getPlatformInfo()
      .then((info) => {
        ortam = info;
      })
      .catch(() => {
        ortam = "unknown";
      });
  });

  function ortamMetni(o: typeof ortam): string {
    if (o === null) return "—";
    if (o === "browser") return m.tarayiciOnizlemesi;
    if (o === "unknown") return m.bilinmiyor;
    return platformEtiketi(m, o.family, o.os);
  }
</script>

<div class="sayfa">
  <h1>{m.ayarlarBaslik}</h1>

  <div class="izgara iki ayarlar">
  <section class="kart bolum">
    <h2 id="tema-baslik">{m.temaBaslik}</h2>
    <div class="secim" role="radiogroup" aria-labelledby="tema-baslik">
      {#each secenekler as s (s.deger)}
        <button
          role="radio"
          aria-checked={mounted && tema.tercih === s.deger}
          class:secili={mounted && tema.tercih === s.deger}
          onclick={() => tema.sec(s.deger)}
        >
          {s.ad}
        </button>
      {/each}
    </div>
    <p class="not">{m.temaNot}</p>
  </section>

  <section class="kart bolum">
    <h2 id="dil-baslik">{m.dilBaslik}</h2>
    <div class="secim dil" role="radiogroup" aria-labelledby="dil-baslik">
      {#each LOCALES as l (l)}
        <button
          role="radio"
          lang={l}
          dir={dirOf(l)}
          aria-checked={mounted && dil.kod === l}
          class:secili={mounted && dil.kod === l}
          onclick={() => dil.sec(l)}
        >
          {localeName[l]}
        </button>
      {/each}
    </div>
    <p class="not">{m.dilNot}</p>
  </section>

  <section class="kart bolum">
    <h2>{m.yerelVeriBaslik}</h2>
    <dl class="anahtar-deger">
      <div><dt>{m.kayitliRapor}</dt><dd>{mounted ? reports.list.length : "—"}</dd></div>
      <div><dt>{m.depolama}</dt><dd>{m.depolamaDeger}</dd></div>
    </dl>
    <a class="satir-link" href="/gecmis">{m.gecmisBaglantisi}</a>
  </section>

  <section class="kart bolum">
    <h2>{m.bilgiSayfalariBaslik}</h2>
    <ul class="bilgi-listesi">
      {#each INFO_SLUGS as s (s)}
        <li><a class="satir-link" href={infoHref(dil.kod, s)}>{pageTitle[dil.kod][s]} {ok}</a></li>
      {/each}
    </ul>
    <p class="not">{m.bilgiSayfalariNot}</p>
  </section>

  <section class="kart bolum">
    <h2>{m.uygulamaBilgisiBaslik}</h2>
    <dl class="anahtar-deger">
      <div><dt>{m.uygulama}</dt><dd>NetCheck</dd></div>
      <div><dt>{m.aciklama}</dt><dd>{m.aciklamaDeger}</dd></div>
      <div><dt>{m.surum}</dt><dd class="mono">{pkg.version}</dd></div>
      <div><dt>{m.calismaOrtami}</dt><dd>{ortamMetni(ortam)}</dd></div>
      <div><dt>{m.pingYontemi}</dt><dd>{ortam !== null && typeof ortam === "object" ? icmpEtiketi(m, ortam.icmp) : "—"}</dd></div>
      <div><dt>{m.ders}</dt><dd>{m.dersDeger}</dd></div>
    </dl>
    <div class="baglantilar">
      <ExternalLink href="https://github.com/frudotz/netcheck">{m.kaynakKod}</ExternalLink>
    </div>
  </section>
  </div>
</div>

<style>
  /* Bölümler .izgara içinde: geniş ekranda iki sütun. */
  .ayarlar {
    --kart-min: 22rem;
  }

  .bolum {
    padding: 0.875rem var(--bosluk-4);
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  h2 {
    margin: 0;
    font-size: var(--yazi-orta);
  }

  .secim {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--bosluk-1);
    padding: var(--bosluk-1);
    border-radius: 0.75rem;
    background: var(--zemin);
    border: 1px solid var(--kenar);
  }

  .secim button {
    padding: 0.625rem 0;
    min-height: var(--dokunma);
    border: 0;
    border-radius: 0.5625rem;
    background: transparent;
    font-size: var(--yazi-govde);
    font-weight: 600;
    color: var(--yazi-soluk);
  }

  /* Dört dil düğmesi: dar ekranda 2 × 2, genişte tek satır. */
  .secim.dil {
    grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
  }

  .secim button.secili {
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
  }

  .not {
    margin: 0;
    font-size: var(--yazi-kucuk);
    color: var(--yazi-soluk);
  }

  .anahtar-deger > div {
    padding-block: var(--bosluk-2);
  }

  .bilgi-listesi {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--bosluk-2) var(--bosluk-4);
  }

  .baglantilar :global(a) {
    display: inline-flex;
    align-items: center;
    min-height: var(--dokunma);
  }

  .baglantilar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--bosluk-2) 1.25rem;
    font-size: var(--yazi-govde);
  }
</style>
