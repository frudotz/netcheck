<script lang="ts">
  // Genel Bakış — Rust'tan alınan gerçek ağ anlık görüntüsü, hızlı bağlantı kontrolü ve son skor
  import { onMount } from "svelte";
  import type { DiagnosticOutcome, NetworkSnapshot } from "../types/netcheck";
  import { getNetworkSnapshot, runDiagnostic } from "$lib/native";
  import { connectionTypeLabel, errorMessage, formatLatency, NOT_FOUND, UNAVAILABLE } from "$lib/labels";
  import { reports, reportHref, formatDateTime } from "$lib/reports.svelte";
  import { SCORE_NOTE } from "$lib/score";
  import ScoreGauge from "./ScoreGauge.svelte";

  type LinkState = "checking" | "online" | "no-internet" | "offline" | "unknown";

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
    <div class="izgara">
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
            <a href={reportHref(latest.id)}>Son rapor · {formatDateTime(latest.createdAt)} →</a>
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
        <dl class="bilgiler">
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
        {#each snapshot.interfaces as i (i.name)}
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
      </section>
    </div>
  {/if}
</div>

<style>
  .baslik {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    margin: 0;
    font-size: 22px;
  }

  h2 {
    margin: 0;
    padding: 14px 16px 6px;
    font-size: 15px;
  }

  .yenile {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    background: var(--kart);
    font-size: 13px;
    font-weight: 600;
  }

  .yenile svg {
    width: 14px;
    height: 14px;
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
    padding: 16px;
    color: var(--yazi-soluk);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .durum-metin p {
    margin: 0;
    color: var(--yazi);
  }

  .ikincil {
    background: var(--kart);
    color: var(--yazi);
    border: 1px solid var(--kenar);
  }

  /* Telefon: tek sütun · Tablet: 2 sütun · Masaüstü: 3 sütun */
  .izgara {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 768px) {
    .izgara {
      grid-template-columns: repeat(2, 1fr);
    }

    .arayuzler {
      grid-column: 1 / -1;
    }
  }

  @media (min-width: 1200px) {
    .izgara {
      grid-template-columns: repeat(3, 1fr);
    }

    .bilgiler-kart {
      grid-column: auto;
    }

    .arayuzler {
      grid-column: 1 / -1;
    }
  }

  .etiket {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--yazi-soluk);
  }

  .durum {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-left: 4px solid var(--kenar);
  }

  .durum-ust {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .durum-ust strong {
    font-size: 20px;
  }

  .nokta {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--yazi-soluk);
    flex-shrink: 0;
  }

  .online {
    border-left-color: var(--durum-basarili);
  }

  .online .nokta {
    background: var(--durum-basarili);
    box-shadow: 0 0 0 4px var(--durum-basarili-zemin);
  }

  .no-internet {
    border-left-color: var(--durum-uyari);
  }

  .no-internet .nokta {
    background: var(--durum-uyari);
    box-shadow: 0 0 0 4px var(--durum-uyari-zemin);
  }

  .offline {
    border-left-color: var(--durum-hata);
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
    font-size: 13px;
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  .olcu {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--kenar);
  }

  .olcu strong {
    font-size: 16px;
  }

  .skor {
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .skor-metin {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .skor-metin .not {
    margin: 0 0 6px;
    font-size: 12px;
    color: var(--yazi-soluk);
  }

  .skor-metin a:not(.btn) {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: 13px;
    font-weight: 600;
    color: var(--renk-ana);
  }

  .bilgiler {
    margin: 0;
    padding: 0 16px 8px;
  }

  .bilgiler div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 0;
    border-top: 1px solid var(--kenar);
  }

  .bilgiler div:first-child {
    border-top: 0;
  }

  dt {
    color: var(--yazi-soluk);
    font-size: 14px;
    flex-shrink: 0;
  }

  dd {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .arayuz {
    padding: 10px 16px;
    border-top: 1px solid var(--kenar);
  }

  .arayuz:last-child {
    padding-bottom: 14px;
  }

  .arayuz .ad {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .arayuz p {
    margin: 2px 0 0;
    font-size: 13px;
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  .rozet {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
    font-size: 11px;
    font-weight: 600;
  }

  .bos-metin {
    margin: 0;
    padding: 8px 16px 16px;
    color: var(--yazi-soluk);
  }
</style>
