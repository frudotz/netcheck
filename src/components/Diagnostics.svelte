<script lang="ts">
  // Tanılama — sabit hedeflere bağlantı testleri (hedefler Rust'ta tanımlı)
  import { diagnostics } from "$lib/diagnostics.svelte";
  import { formatLatency } from "$lib/labels";
  import { reportHref } from "$lib/reports.svelte";
  import { SCORE_NOTE } from "$lib/score";
  import ScoreGauge from "./ScoreGauge.svelte";
  import StatusBadge from "./StatusBadge.svelte";
</script>

<div class="sayfa">
  <div class="tanilama">
    <div class="giris">
      <h1>Tanılama</h1>
      <p class="aciklama">Gateway, genel DNS sunucuları, alan adı çözümleme ve HTTPS bağlantısı test edilir.</p>
    </div>

    <button class="btn" onclick={() => diagnostics.start()} disabled={diagnostics.running}>
      {diagnostics.running ? "Tanılama çalıştırılıyor..." : "Tanılamayı Başlat"}
    </button>

    {#if diagnostics.error}
      <p class="kart uyari" role="alert">{diagnostics.error}</p>
    {/if}

    {#if diagnostics.report}
      <section class="kart sonuc" aria-live="polite">
        <ScoreGauge score={diagnostics.report.score} size={88} />
        <div class="sonuc-metin">
          <span class="etiket">Rapor oluşturuldu</span>
          <code>{diagnostics.report.id}</code>
          <span class="not">Bağlantı Skoru — {SCORE_NOTE}</span>
          <a class="satir-link" href={reportHref(diagnostics.report.id)}>Raporu görüntüle →</a>
        </div>
      </section>
    {/if}

    <ul class="kart testler" aria-live="polite">
      {#each diagnostics.tests as t (t.id)}
        <li>
          <div class="ust">
            <div>
              <strong>{t.name}</strong>
              <span class="hedef">{t.target ?? "—"}</span>
            </div>
            <StatusBadge status={t.status} />
          </div>
          {#if t.status === "success" || t.status === "failed" || t.status === "unavailable"}
            <div class="alt">
              <span>{t.message}</span>
              <span class="gecikme">{formatLatency(t.latencyMs)}</span>
            </div>
          {/if}
        </li>
      {/each}
    </ul>

    {#if diagnostics.running}
      <p class="ilerleme" role="status">{diagnostics.completed} / {diagnostics.tests.length} test tamamlandı</p>
    {/if}
  </div>
</div>

<style>
  /* Telefon / tablet: tek sütun (DOM sırası). Masaüstü (≥ 64em): denetimler ve rapor özeti bir
     sütunda, test listesi yanında. */
  .tanilama {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--bosluk-4);
    align-items: start;
  }

  @media (min-width: 64em) {
    .tanilama {
      grid-template-columns: minmax(18rem, 1fr) minmax(0, 1.6fr);
      /* Sol sütunda en fazla 5 öğe; son 1fr satırı listenin fazla yüksekliğini alır (öğeler aralanmaz). */
      grid-template-rows: repeat(5, auto) 1fr;
      column-gap: var(--bosluk-5);
    }

    .tanilama > * {
      grid-column: 1;
    }

    .tanilama > .testler {
      grid-column: 2;
      grid-row: 1 / -1;
    }
  }

  .uyari {
    margin: 0;
    padding: 0.875rem var(--bosluk-4);
  }

  .sonuc {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem var(--bosluk-4);
    border-inline-start: 4px solid var(--renk-ana);
  }

  .sonuc-metin {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .sonuc-metin code {
    font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
    font-size: 1rem;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .sonuc-metin .not {
    font-size: var(--yazi-kucuk);
    color: var(--yazi-soluk);
  }

  .testler {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    padding: var(--bosluk-3) var(--bosluk-4);
    border-top: 1px solid var(--kenar);
  }

  li:first-child {
    border-top: 0;
  }

  .ust {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--bosluk-3);
  }

  .ust > div {
    min-width: 0;
  }

  .ust strong {
    display: block;
    font-size: var(--yazi-orta);
  }

  .hedef,
  .gecikme {
    font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
    font-size: var(--yazi-kucuk);
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  .alt {
    display: flex;
    justify-content: space-between;
    gap: var(--bosluk-3);
    margin-top: 0.375rem;
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
  }

  .gecikme {
    flex-shrink: 0;
    font-weight: 600;
    color: var(--yazi);
  }

  .ilerleme {
    margin: 0;
    text-align: center;
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
  }
</style>
