<script lang="ts">
  // Genel Bakış — Rust'tan alınan gerçek ağ anlık görüntüsü, hızlı bağlantı kontrolü ve son skor
  import { onMount } from "svelte";
  import type { DiagnosticOutcome, LinkState, NetworkSnapshot } from "$lib/types";
  import { getNetworkSnapshot, runDiagnostic } from "$lib/native";
  import { connectionTypeLabel, errorMessage, formatLatency, NOT_FOUND, UNAVAILABLE } from "$lib/labels";
  import { reports, reportHref, formatDateTime } from "$lib/reports.svelte";
  import { SCORE_NOTE } from "$lib/score";
  import ScoreGauge from "./ScoreGauge.svelte";

  let snapshot = $state<NetworkSnapshot | null>(null);
  let internet = $state<DiagnosticOutcome | null>(null);
  let ping = $state<DiagnosticOutcome | null>(null);
  let loading = $state(true);
  let checking = $state(false);
  let error = $state("");
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
    error = "";
    try {
      snapshot = await getNetworkSnapshot();
      void quickCheck();
    } catch (e) {
      snapshot = null;
      error = errorMessage(e, "Ağ bilgileri alınamadı. Lütfen tekrar deneyin.");
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

  const linkLabel: Record<LinkState, string> = {
    checking: "Kontrol ediliyor...",
    online: "Bağlı",
    "no-internet": "İnternet Yok",
    offline: "Bağlantı Yok",
    unknown: "Bilinmiyor",
  };

  const linkHint = $derived.by(() => {
    if (!snapshot) return "";
    switch (linkState) {
      case "online":
        return `${connectionTypeLabel[snapshot.connectionType]}${snapshot.interfaceName ? ` · ${snapshot.interfaceName}` : ""}`;
      case "no-internet":
        return snapshot.gateway ? "Yerel ağa bağlı, ancak internete erişilemiyor." : "Gateway bulunamadı.";
      case "offline":
        return "Etkin bir ağ bağlantısı bulunamadı.";
      case "checking":
        return "HTTPS bağlantısı test ediliyor.";
      default:
        return "Bağlantı durumu belirlenemedi.";
    }
  });

  const latencyText = $derived(
    ping?.status === "success" ? formatLatency(ping.latencyMs) : checking ? "…" : UNAVAILABLE,
  );

  const rows = $derived(
    snapshot
      ? [
          {
            label: "Genel IP",
            value: internet?.status === "success" && internet.detail ? internet.detail : checking ? "…" : "Alınamadı",
            mono: true,
          },
          { label: "Yerel IPv4", value: snapshot.localIPv4 ?? UNAVAILABLE, mono: true },
          { label: "IPv6", value: snapshot.localIPv6 ?? UNAVAILABLE, mono: true },
          { label: "Gateway", value: snapshot.gateway ?? NOT_FOUND, mono: true },
          {
            label: "DNS",
            value: snapshot.dnsServers.length ? snapshot.dnsServers.join(", ") : NOT_FOUND,
            mono: true,
          },
          { label: "Cihaz adı", value: snapshot.hostname ?? UNAVAILABLE, mono: false },
          { label: "Bağlantı türü", value: connectionTypeLabel[snapshot.connectionType], mono: false },
        ]
      : [],
  );

  const latest = $derived(mounted ? reports.latest : undefined);
</script>

<div class="sayfa">
  <div class="baslik">
    <h1>Genel Bakış</h1>
    <button class="yenile" onclick={load} disabled={loading || checking} aria-label="Ağ bilgilerini yenile">
      <svg viewBox="0 0 24 24" aria-hidden="true" class:doner={loading || checking}>
        <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />
      </svg>
      {loading ? "Yenileniyor…" : "Yenile"}
    </button>
  </div>

  {#if loading && !snapshot}
    <p class="kart durum-metin" role="status">Ağ bilgileri alınıyor...</p>
  {:else if error}
    <div class="kart durum-metin" role="alert">
      <p>{error}</p>
      <button class="btn ikincil" onclick={load}>Tekrar dene</button>
    </div>
  {:else if snapshot}
    <div class="pano">
      <section class="kart durum {linkState}" aria-live="polite">
        <div class="durum-ust">
          <span class="nokta" aria-hidden="true"></span>
          <div>
            <span class="etiket">Bağlantı Durumu</span>
            <strong>{linkLabel[linkState]}</strong>
          </div>
        </div>
        <p class="ipucu">{linkHint}</p>
        <div class="olcu">
          <div>
            <span class="etiket">Gecikme (1.1.1.1)</span>
            <strong class="mono">{latencyText}</strong>
          </div>
          <div>
            <span class="etiket">Bağlantı türü</span>
            <strong>{connectionTypeLabel[snapshot.connectionType]}</strong>
          </div>
        </div>
      </section>

      <section class="kart skor">
        {#if latest}
          <ScoreGauge score={latest.score} size={96} />
          <div class="skor-metin">
            <span class="etiket">Bağlantı Skoru</span>
            <p class="not">{SCORE_NOTE}</p>
            <a class="satir-link" href={reportHref(latest.id)}>Son rapor · {formatDateTime(latest.createdAt)} →</a>
          </div>
        {:else}
          <div class="skor-metin">
            <span class="etiket">Bağlantı Skoru</span>
            <p class="not">Henüz tanılama yapılmadı. Skor, ilk tanılamadan sonra burada görünür.</p>
            <a class="btn" href="/tanilama">Tanılamayı Başlat</a>
          </div>
        {/if}
      </section>

      <section class="kart bilgiler-kart">
        <h2>Ağ Bilgileri</h2>
        <dl class="anahtar-deger bilgiler">
          {#each rows as r (r.label)}
            <div>
              <dt>{r.label}</dt>
              <dd class:mono={r.mono}>{r.value}</dd>
            </div>
          {/each}
        </dl>
      </section>

      <section class="kart arayuzler">
        <h2>Ağ Arayüzleri</h2>
        <div class="arayuz-liste">
        <!-- Arayüz adı benzersiz değildir (macOS'ta iki "iPhone" arayüzü görüldü); anahtar sıra + ad. -->
        {#each snapshot.interfaces as i, n (`${n}:${i.name}`)}
          <div class="arayuz">
            <div class="ad">
              <strong>{i.name}</strong>
              {#if i.isDefault}<span class="rozet">Varsayılan</span>{/if}
            </div>
            <p class="mono">{i.ipv4 ?? UNAVAILABLE}{i.ipv6 ? ` · ${i.ipv6}` : ""}</p>
            <p>{connectionTypeLabel[i.type]}{i.mac ? ` · ${i.mac}` : ""}</p>
          </div>
        {:else}
          <p class="bos-metin">Etkin ağ arayüzü bulunamadı.</p>
        {/each}
        </div>
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
    margin: 0;
    padding: 0.875rem var(--bosluk-4) 0.375rem;
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

  .durum-metin {
    margin: 0;
    padding: var(--bosluk-4);
    color: var(--yazi-soluk);
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
  }

  .durum-metin p {
    margin: 0;
    color: var(--yazi);
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

    .bilgiler-kart {
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

  .skor-metin .satir-link {
    font-size: var(--yazi-ince);
  }

  .bilgiler {
    padding: 0 var(--bosluk-4) var(--bosluk-2);
  }

  /* Arayüz listesi: geniş ekranda birden çok sütuna yayılır. */
  .arayuz-liste {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
    column-gap: var(--bosluk-4);
    padding: 0 var(--bosluk-4) 0.375rem;
  }

  .arayuz {
    min-width: 0;
    padding: 0.625rem 0;
    border-top: 1px solid var(--kenar);
  }

  .arayuz .ad {
    display: flex;
    align-items: center;
    gap: var(--bosluk-2);
  }

  .arayuz p {
    margin: 0.125rem 0 0;
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  .rozet {
    padding: 1px var(--bosluk-2);
    border-radius: 999px;
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
    font-size: var(--yazi-mini);
    font-weight: 600;
  }

  .bos-metin {
    margin: 0;
    padding: var(--bosluk-2) 0 var(--bosluk-4);
    color: var(--yazi-soluk);
  }
</style>
