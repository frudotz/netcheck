<script lang="ts">
  // Tanılama — sabit hedeflere bağlantı testleri (hedefler Rust'ta tanımlı)
  import { diagnostics } from "$lib/diagnostics.svelte";
  import { formatLatency } from "$lib/labels";
  import StatusBadge from "./StatusBadge.svelte";
</script>

<div class="sayfa">
  <div>
    <h1>Tanılama</h1>
    <p class="aciklama">Gateway, genel DNS sunucuları, alan adı çözümleme ve HTTPS bağlantısı test edilir.</p>
  </div>

  <button class="btn" onclick={() => diagnostics.start()} disabled={diagnostics.running}>
    {diagnostics.running ? "Tanılama çalıştırılıyor..." : "Tanılamayı Başlat"}
  </button>

  {#if diagnostics.error}
    <p class="kart uyari" role="alert">{diagnostics.error}</p>
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

<style>
  h1 {
    margin: 0;
    font-size: 22px;
  }

  .aciklama {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--yazi-soluk);
  }

  .uyari {
    margin: 0;
    padding: 14px 16px;
  }

  .testler {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    padding: 12px 16px;
    border-top: 1px solid var(--kenar);
  }

  li:first-child {
    border-top: 0;
  }

  .ust {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .ust strong {
    display: block;
    font-size: 15px;
  }

  .hedef,
  .gecikme {
    font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
    font-size: 12px;
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  .alt {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 6px;
    font-size: 13px;
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
    font-size: 13px;
    color: var(--yazi-soluk);
  }
</style>
