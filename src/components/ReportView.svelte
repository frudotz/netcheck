<script lang="ts">
  // Tanılama Raporu — Rust tarafından üretilen NCHK kimliği, skor, test sonuçları ve ağ bilgisi
  import { onMount } from "svelte";
  import { reports, formatDateTime } from "$lib/reports.svelte";
  import { connectionTypeLabel, formatLatency, NOT_FOUND, UNAVAILABLE } from "$lib/labels";
  import { SCORE_NOTE } from "$lib/score";
  import ScoreGauge from "./ScoreGauge.svelte";
  import StatusBadge from "./StatusBadge.svelte";

  let id = $state("");
  let ready = $state(false);

  // URL parametresi yalnızca istemcide okunur (SSR güvenliği).
  onMount(() => {
    id = new URLSearchParams(window.location.search).get("id") ?? "";
    ready = true;
  });

  const report = $derived(id ? reports.find(id) : undefined);
</script>

<div class="sayfa">
  <a class="satir-link geri" href="/gecmis">← Geçmiş</a>

  {#if !ready}
    <p class="kart bilgi" role="status">Rapor yükleniyor...</p>
  {:else if !report}
    <div class="kart bilgi" role="alert">
      <strong>Rapor bulunamadı.</strong>
      <p>{id ? `${id} kimlikli rapor bu cihazda kayıtlı değil.` : "Görüntülenecek bir rapor seçilmedi."}</p>
      <a class="btn" href="/tanilama">Yeni tanılama başlat</a>
    </div>
  {:else}
    <div class="izgara iki rapor">
    <section class="kart kimlik">
      <span class="etiket">Tanılama Raporu</span>
      <code class="kod">{report.id}</code>
      <span class="tarih">{formatDateTime(report.createdAt)}</span>
    </section>

    <section class="kart skor">
      <ScoreGauge score={report.score} />
      <div>
        <h2>Bağlantı Skoru</h2>
        <p class="not">{SCORE_NOTE}</p>
        <p class="sayac">
          <span class="ok">{report.passed} başarılı</span> · <span class="hayir">{report.failed} başarısız</span>
        </p>
      </div>
    </section>

    <section class="kart">
      <h2 class="bolum">Test Sonuçları</h2>
      <ul class="liste">
        {#each report.tests as t (t.id)}
          <li>
            <div class="satir">
              <strong>{t.name}</strong>
              <StatusBadge status={t.status} />
            </div>
            <div class="satir alt">
              <span>{t.message ?? ""}</span>
              <span class="mono">{formatLatency(t.latencyMs)}</span>
            </div>
          </li>
        {/each}
      </ul>
    </section>

    <section class="kart">
      <h2 class="bolum">Ağ Bilgileri</h2>
      <dl class="anahtar-deger ag">
        <div><dt>Cihaz adı</dt><dd>{report.network.hostname ?? UNAVAILABLE}</dd></div>
        <div><dt>Bağlantı türü</dt><dd>{connectionTypeLabel[report.network.connectionType]}</dd></div>
        <div><dt>Yerel IPv4</dt><dd class="mono">{report.network.localIPv4 ?? UNAVAILABLE}</dd></div>
        <div><dt>IPv6</dt><dd class="mono">{report.network.localIPv6 ?? UNAVAILABLE}</dd></div>
        <div><dt>Gateway</dt><dd class="mono">{report.network.gateway ?? NOT_FOUND}</dd></div>
        <div>
          <dt>DNS</dt>
          <dd class="mono">{report.network.dnsServers.length ? report.network.dnsServers.join(", ") : NOT_FOUND}</dd>
        </div>
      </dl>
    </section>
    </div>
  {/if}
</div>

<style>
  /* Bölümler .izgara içinde: dar ekranda tek sütun, ≥ ~45rem içerik genişliğinde iki sütun. */
  .rapor {
    --kart-min: 22rem;
  }

  .geri {
    align-self: flex-start;
    margin-bottom: -0.375rem;
  }

  .bilgi {
    margin: 0;
    padding: var(--bosluk-4);
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-2);
  }

  .bilgi p {
    margin: 0;
    color: var(--yazi-soluk);
    font-size: var(--yazi-govde);
  }

  .kimlik {
    align-self: stretch;
    padding: 1.125rem var(--bosluk-4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    text-align: center;
    border-top: 4px solid var(--renk-ana);
  }

  .kimlik .etiket {
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .kod {
    font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
    font-size: 1.375rem;
    font-weight: 800;
    letter-spacing: 1px;
    overflow-wrap: anywhere;
  }

  .tarih {
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
  }

  .skor {
    align-self: stretch;
    padding: var(--bosluk-4);
    display: flex;
    align-items: center;
    gap: var(--bosluk-4);
  }

  .skor h2 {
    margin: 0;
    font-size: 1rem;
  }

  .not {
    margin: var(--bosluk-1) 0 var(--bosluk-2);
    font-size: var(--yazi-kucuk);
    color: var(--yazi-soluk);
  }

  .sayac {
    margin: 0;
    font-size: var(--yazi-govde);
    font-weight: 600;
  }

  .ok {
    color: var(--durum-basarili);
  }

  .hayir {
    color: var(--durum-hata);
  }

  .bolum {
    margin: 0;
    padding: 0.875rem var(--bosluk-4) 0.375rem;
    font-size: var(--yazi-orta);
  }

  .liste {
    list-style: none;
    margin: 0;
    padding: 0 var(--bosluk-4) var(--bosluk-2);
  }

  .liste li {
    padding: 0.625rem 0;
    border-top: 1px solid var(--kenar);
  }

  .liste li:first-child {
    border-top: 0;
  }

  .ag {
    padding: 0 var(--bosluk-4) var(--bosluk-2);
  }

  .satir {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--bosluk-3);
  }

  .alt {
    margin-top: var(--bosluk-1);
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
  }
</style>
