<script lang="ts">
  // Genel Bakış — Rust'tan alınan gerçek ağ anlık görüntüsü, hızlı bağlantı kontrolü ve son skor.
  // Ağ bilgileri ve arayüzler genel Kart bileşeniyle listelenir (Görev 12); metinler sözlükten gelir.
  import { onMount } from "svelte";
  import type { DiagnosticOutcome, KartOzellikleri, LinkState, NetworkSnapshot } from "$lib/types";
  import { getNetworkSnapshot, NativeUnavailableError, runDiagnostic } from "$lib/native";
  import { formatLatency } from "$lib/labels";
  import { reports, reportHref } from "$lib/reports.svelte";
  import { dil } from "$lib/dil.svelte";
  import { baglantiTuruEtiketi, tarihSaat } from "$lib/sozluk";
  import Kart from "$lib/components/ui/Kart.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import ScoreGauge from "./ScoreGauge.svelte";

  const m = $derived(dil.metin);
  const ok = $derived(dil.kod === "ar" || dil.kod === "fa" ? "←" : "→");

  let snapshot = $state<NetworkSnapshot | null>(null);
  let internet = $state<DiagnosticOutcome | null>(null);
  let ping = $state<DiagnosticOutcome | null>(null);
  let loading = $state(true);
  let checking = $state(false);
  // Hata metni dil değişince yeniden çizilsin diye tür olarak saklanır.
  let hata = $state<"yalniz-uygulamada" | "alinamadi" | null>(null);
  let mounted = $state(false);

  async function quickCheck() {
    checking = true;
    try {
      // Durum için HTTPS, gecikme için 1.1.1.1 kullanılır; hata yalnızca bu karta yansır.
      [internet, ping] = await Promise.all([runDiagnostic("internet"), runDiagnostic("cloudflare")]);
    } catch {
      internet = null;
      ping = null;
    } finally {
      checking = false;
    }
  }

  async function load() {
    loading = true;
    hata = null;
    try {
      snapshot = await getNetworkSnapshot();
      void quickCheck();
    } catch (e) {
      snapshot = null;
      hata = e instanceof NativeUnavailableError ? "yalniz-uygulamada" : "alinamadi";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    mounted = true;
    load();
  });

  const linkState = $derived.by((): LinkState => {
    if (checking) return "checking";
    if (!snapshot) return "unknown";
    if (internet?.status === "success") return "online";
    if (!snapshot.localIPv4 && !snapshot.localIPv6) return "offline";
    return internet ? "no-internet" : "unknown";
  });

  const linkLabel = $derived<Record<LinkState, string>>({
    checking: m.linkKontrol,
    online: m.linkBagli,
    "no-internet": m.linkInternetYok,
    offline: m.linkBaglantiYok,
    unknown: m.bilinmiyor,
  });

  const linkHint = $derived.by(() => {
    if (!snapshot) return "";
    switch (linkState) {
      case "online":
        return `${baglantiTuruEtiketi(m, snapshot.connectionType)}${snapshot.interfaceName ? ` · ${snapshot.interfaceName}` : ""}`;
      case "no-internet":
        return snapshot.gateway ? m.ipucuYerelAg : m.ipucuGatewayYok;
      case "offline":
        return m.ipucuBaglantiYok;
      case "checking":
        return m.ipucuKontrol;
      default:
        return m.ipucuBilinmiyor;
    }
  });

  const latencyText = $derived(
    ping?.status === "success" ? formatLatency(ping.latencyMs) : checking ? "…" : m.kullanilamiyor,
  );

  /** Ağ bilgileri kartları: ekran veriyi kartın genel girdilerine dönüştürür. */
  const bilgiKartlari = $derived<KartOzellikleri[]>(
    snapshot
      ? [
          {
            baslik: m.genelIp,
            altMetin: internet?.status === "success" && internet.detail ? internet.detail : checking ? "…" : m.alinamadi,
            altMetinEsAralikli: true,
          },
          { baslik: m.yerelIpv4, altMetin: snapshot.localIPv4 ?? m.kullanilamiyor, altMetinEsAralikli: true },
          { baslik: "IPv6", altMetin: snapshot.localIPv6 ?? m.kullanilamiyor, altMetinEsAralikli: true },
          { baslik: m.gateway, altMetin: snapshot.gateway ?? m.bulunamadi, altMetinEsAralikli: true },
          {
            baslik: "DNS",
            altMetin: snapshot.dnsServers.length ? snapshot.dnsServers.join(", ") : m.bulunamadi,
            altMetinEsAralikli: true,
          },
          { baslik: m.cihazAdi, altMetin: snapshot.hostname ?? m.kullanilamiyor },
          { baslik: m.baglantiTuru, altMetin: baglantiTuruEtiketi(m, snapshot.connectionType) },
        ]
      : [],
  );

  const latest = $derived(mounted ? reports.latest : undefined);
</script>

<div class="sayfa">
  <div class="baslik">
    <h1>{m.menuGenelBakis}</h1>
    <button class="yenile" onclick={load} disabled={loading || checking} aria-label={m.agBilgileriniYenile}>
      <svg viewBox="0 0 24 24" aria-hidden="true" class:doner={loading || checking}>
        <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />
      </svg>
      {loading ? m.yenileniyor : m.yenile}
    </button>
  </div>

  {#if loading && !snapshot}
    <Yukleniyor satir={4} etiket={m.agBilgileriAliniyor} />
  {:else if hata}
    <HataDurumu mesaj={hata === "yalniz-uygulamada" ? m.yalnizUygulamada : m.agBilgileriAlinamadi} tekrarDene={load} />
  {:else if snapshot}
    <div class="pano">
      <section class="kart durum {linkState}" aria-live="polite">
        <div class="durum-ust">
          <span class="nokta" aria-hidden="true"></span>
          <div>
            <span class="etiket">{m.baglantiDurumu}</span>
            <strong>{linkLabel[linkState]}</strong>
          </div>
        </div>
        <p class="ipucu">{linkHint}</p>
        <div class="olcu">
          <div>
            <span class="etiket">{m.gecikme}</span>
            <strong class="mono">{latencyText}</strong>
          </div>
          <div>
            <span class="etiket">{m.baglantiTuru}</span>
            <strong>{baglantiTuruEtiketi(m, snapshot.connectionType)}</strong>
          </div>
        </div>
      </section>

      <section class="kart skor">
        {#if latest}
          <ScoreGauge score={latest.score} size={96} />
          <div class="skor-metin">
            <span class="etiket">{m.baglantiSkoru}</span>
            <p class="not">{m.skorNotu}</p>
            <Kart href={reportHref(latest.id)} baslik={`${m.sonRapor} ${ok}`} altMetin={tarihSaat(latest.createdAt, dil.kod)} />
          </div>
        {:else}
          <div class="skor-metin">
            <span class="etiket">{m.baglantiSkoru}</span>
            <p class="not">{m.henuzTanilamaYok}</p>
            <a class="btn" href="/tanilama">{m.tanilamayiBaslat}</a>
          </div>
        {/if}
      </section>

      <section class="bilgiler" aria-labelledby="ag-bilgileri">
        <h2 id="ag-bilgileri">{m.agBilgileri}</h2>
        <ul class="kart-listesi">
          {#each bilgiKartlari as k (k.baslik)}
            <li><Kart {...k} /></li>
          {/each}
        </ul>
      </section>

      <section class="arayuzler" aria-labelledby="ag-arayuzleri">
        <h2 id="ag-arayuzleri">{m.agArayuzleri}</h2>
        {#if snapshot.interfaces.length}
          <ul class="kart-listesi">
            <!-- Arayüz adı benzersiz değildir (macOS'ta iki "iPhone" arayüzü görüldü); anahtar sıra + ad. -->
            {#each snapshot.interfaces as i, n (`${n}:${i.name}`)}
              <li>
                <Kart
                  baslik={i.name}
                  altMetin={[i.ipv4 ?? m.kullanilamiyor, i.ipv6, baglantiTuruEtiketi(m, i.type), i.mac].filter(Boolean).join(" · ")}
                  etiket={i.isDefault ? m.varsayilan : undefined}
                  etiketTuru="bilgi"
                />
              </li>
            {/each}
          </ul>
        {:else}
          <BosDurum baslik={m.arayuzYok} />
        {/if}
      </section>
    </div>
  {/if}
</div>

<style>
  .baslik {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--bosluk-2);
  }

  h2 {
    margin: 0 0 var(--bosluk-2);
    font-size: var(--yazi-orta);
  }

  .yenile {
    display: inline-flex;
    align-items: center;
    min-height: var(--dokunma);
    gap: 0.375rem;
    padding: var(--bosluk-2) 0.875rem;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    background: var(--kart);
    font-size: var(--yazi-ince);
    font-weight: 600;
  }

  .yenile svg {
    width: 0.875rem;
    height: 0.875rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .doner {
    animation: don 0.9s linear infinite;
  }

  @keyframes don {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .doner {
      animation: none;
    }
  }

  /* Telefon: tek sütun. Tablet ve üzeri (≥ 48em): durum + skor solda, ağ bilgileri sağda,
     arayüzler tam genişlikte. Sütunlar yazı yönünü izler (RTL'de yer değiştirir). */
  .pano {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--bosluk-4);
  }

  @media (min-width: 48em) {
    .pano {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas:
        "durum bilgi"
        "skor bilgi"
        "arayuz arayuz";
      align-items: start;
    }

    .durum {
      grid-area: durum;
    }

    .skor {
      grid-area: skor;
    }

    .bilgiler {
      grid-area: bilgi;
    }

    .arayuzler {
      grid-area: arayuz;
    }
  }

  .durum {
    padding: var(--bosluk-4);
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    border-inline-start: 4px solid var(--kenar);
  }

  .durum-ust {
    display: flex;
    align-items: center;
    gap: var(--bosluk-3);
  }

  .durum-ust strong {
    font-size: 1.25rem;
  }

  .nokta {
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    background: var(--yazi-soluk);
    flex-shrink: 0;
  }

  .online {
    border-inline-start-color: var(--durum-basarili);
  }

  .online .nokta {
    background: var(--durum-basarili);
    box-shadow: 0 0 0 4px var(--durum-basarili-zemin);
  }

  .no-internet {
    border-inline-start-color: var(--durum-uyari);
  }

  .no-internet .nokta {
    background: var(--durum-uyari);
    box-shadow: 0 0 0 4px var(--durum-uyari-zemin);
  }

  .offline {
    border-inline-start-color: var(--durum-hata);
  }

  .offline .nokta {
    background: var(--durum-hata);
    box-shadow: 0 0 0 4px var(--durum-hata-zemin);
  }

  .checking .nokta {
    background: var(--renk-ana);
  }

  .ipucu {
    margin: 0;
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  .olcu {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--bosluk-3);
    padding-top: 0.625rem;
    border-top: 1px solid var(--kenar);
  }

  .olcu strong {
    font-size: 1rem;
  }

  .skor {
    padding: var(--bosluk-4);
    display: flex;
    align-items: center;
    gap: var(--bosluk-4);
  }

  .skor-metin {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-1);
    flex: 1;
    min-width: 0;
  }

  .skor-metin .not {
    margin: 0 0 0.375rem;
    font-size: var(--yazi-kucuk);
    color: var(--yazi-soluk);
  }

  /* Kart listesi: dar ekranda tek sütun, genişte kartlar birden çok sütuna yayılır. */
  .kart-listesi {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
    gap: var(--bosluk-2);
  }

  .kart-listesi li {
    display: flex;
    min-width: 0;
  }
</style>
