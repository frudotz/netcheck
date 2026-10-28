<script lang="ts">
  // Tanılama — sabit hedeflere bağlantı testleri (hedefler Rust'ta tanımlı).
  // Görev 15: hata HataDurumu ile gösterilir; metinler dört dilde sözlükten gelir.
  import type { DiagnosticTest } from "$lib/types";
  import { diagnostics } from "$lib/diagnostics.svelte";
  import { diagnosticTargetHint, formatLatency } from "$lib/labels";
  import { reportHref } from "$lib/reports.svelte";
  import { dil } from "$lib/dil.svelte";
  import { bicim, testAdi, testMesaji } from "$lib/sozluk";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import ScoreGauge from "./ScoreGauge.svelte";
  import StatusBadge from "./StatusBadge.svelte";

  const m = $derived(dil.metin);
  const ok = $derived(dil.kod === "ar" || dil.kod === "fa" ? "←" : "→");

  /** Ağ geçidi bilinmezken gösterilen açıklama seçili dilde; diğer hedefler adres olduğu için olduğu gibi. */
  function hedef(t: DiagnosticTest): string {
    if (t.id === "gateway" && (!t.target || t.target === diagnosticTargetHint.gateway)) return m.hedefVarsayilanGecit;
    return t.target ?? "—";
  }
</script>

<div class="sayfa">
  <div class="tanilama">
    <div class="giris">
      <h1>{m.menuTanilama}</h1>
      <p class="aciklama">{m.tanilamaAciklama}</p>
    </div>

    <button class="btn" onclick={() => diagnostics.start()} disabled={diagnostics.running}>
      {diagnostics.running ? m.tanilamaCalisiyor : m.tanilamayiBaslat}
    </button>

    {#if diagnostics.hata}
      <HataDurumu
        mesaj={diagnostics.hata === "yalniz-uygulamada" ? m.yalnizUygulamada : m.tanilamaCalistirilamadi}
        tekrarDene={() => diagnostics.start()}
      />
    {/if}

    {#if diagnostics.report}
      <section class="kart sonuc" aria-live="polite">
        <ScoreGauge score={diagnostics.report.score} size={88} />
        <div class="sonuc-metin">
          <span class="etiket">{m.raporOlusturuldu}</span>
          <code class="mono">{diagnostics.report.id}</code>
          <span class="not">{m.baglantiSkoru} — {m.skorNotu}</span>
          <a class="satir-link" href={reportHref(diagnostics.report.id)}>{m.raporuGoruntule} {ok}</a>
        </div>
      </section>
    {/if}

    <ul class="kart testler" aria-live="polite">
      {#each diagnostics.tests as t (t.id)}
        <li>
          <div class="ust">
            <div>
              <strong>{testAdi(m, t.id)}</strong>
              <span class="hedef mono">{hedef(t)}</span>
            </div>
            <StatusBadge status={t.status} />
          </div>
          {#if t.status === "success" || t.status === "failed" || t.status === "unavailable"}
            <div class="alt">
              <span dir="auto">{testMesaji(m, t)}</span>
              <span class="gecikme">{formatLatency(t.latencyMs)}</span>
            </div>
          {/if}
        </li>
      {/each}
    </ul>

    {#if diagnostics.running}
      <p class="ilerleme" role="status">{bicim(m.testlerTamamlandi, { n: diagnostics.completed, toplam: diagnostics.tests.length })}</p>
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
