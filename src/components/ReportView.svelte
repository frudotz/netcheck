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
  {#if !ready}
    <p class="kart bilgi" role="status">Rapor yükleniyor...</p>
  {:else if !report}
    <div class="kart bilgi" role="alert">
      <strong>Rapor bulunamadı.</strong>
      <p>{id ? `${id} kimlikli rapor bu cihazda kayıtlı değil.` : "Görüntülenecek bir rapor seçilmedi."}</p>
      <a class="btn" href="/tanilama">Yeni tanılama başlat</a>
    </div>
  {:else}
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
      <dl class="liste">
        <div><dt>Hostname</dt><dd>{report.network.hostname ?? UNAVAILABLE}</dd></div>
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
  {/if}
</div>

<style>
  .bilgi {
    margin: 0;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bilgi p {
    margin: 0;
    color: var(--yazi-soluk);
    font-size: 14px;
  }

  .kimlik {
    padding: 18px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    border-top: 4px solid var(--renk-ana);
  }

  .etiket {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--yazi-soluk);
  }

  .kod {
    font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 1px;
    overflow-wrap: anywhere;
  }

  .tarih {
    font-size: 13px;
    color: var(--yazi-soluk);
  }

  .skor {
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .skor h2 {
    margin: 0;
    font-size: 16px;
  }

  .not {
    margin: 4px 0 8px;
    font-size: 12px;
    color: var(--yazi-soluk);
  }

  .sayac {
    margin: 0;
    font-size: 14px;
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
    padding: 14px 16px 6px;
    font-size: 15px;
  }

  .liste {
    list-style: none;
    margin: 0;
    padding: 0 16px 8px;
  }

  .liste li,
  .liste div {
    padding: 10px 0;
    border-top: 1px solid var(--kenar);
  }

  .liste li:first-child,
  .liste > div:first-child {
    border-top: 0;
  }

  .satir {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .liste .satir {
    padding: 0;
    border: 0;
  }

  .alt {
    margin-top: 4px;
    font-size: 13px;
    color: var(--yazi-soluk);
  }

  dl.liste div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
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

  .mono {
    font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  }
</style>
