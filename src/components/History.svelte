<script lang="ts">
  // Geçmiş — bu cihazda (localStorage) saklanan tanılama raporları
  import { onMount } from "svelte";
  import { reports, reportHref, formatDateTime } from "$lib/reports.svelte";
  import { scoreLevel } from "$lib/score";

  // Liste yalnızca istemcide çizilir; sunucu çıktısı localStorage'ı göremez.
  let mounted = $state(false);
  let confirming = $state(false);

  onMount(() => {
    mounted = true;
  });

  function clearHistory() {
    reports.clear();
    confirming = false;
  }
</script>

<div class="sayfa">
  <div>
    <h1>Geçmiş</h1>
    <p class="aciklama">Raporlar yalnızca bu cihazda saklanır.</p>
  </div>

  {#if !mounted}
    <p class="kart durum" role="status">Geçmiş yükleniyor...</p>
  {:else if reports.list.length === 0}
    <div class="bos">
      <p>Henüz kayıtlı rapor yok.</p>
      <a class="btn" href="/tanilama">Tanılamayı Başlat</a>
    </div>
  {:else}
    <ul class="kart liste">
      {#each reports.list as r (r.id)}
        <li>
          <a href={reportHref(r.id)}>
            <span class="skor {scoreLevel(r.score)}" aria-label="Skor {r.score}">{r.score}</span>
            <span class="metin">
              <code>{r.id}</code>
              <span class="tarih">{formatDateTime(r.createdAt)}</span>
            </span>
            <span class="sayac">
              <span class="ok">{r.passed} başarılı</span>
              <span class="hayir">{r.failed} başarısız</span>
            </span>
          </a>
        </li>
      {/each}
    </ul>

    {#if confirming}
      <div class="kart onay" role="alertdialog" aria-label="Geçmişi temizleme onayı">
        <p>{reports.list.length} rapor kalıcı olarak silinecek.</p>
        <div class="dugmeler">
          <button class="btn tehlike" onclick={clearHistory}>Evet, temizle</button>
          <button class="btn ikincil" onclick={() => (confirming = false)}>Vazgeç</button>
        </div>
      </div>
    {:else}
      <button class="btn ikincil" onclick={() => (confirming = true)}>Geçmişi Temizle</button>
    {/if}
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

  .durum {
    margin: 0;
    padding: 16px;
    color: var(--yazi-soluk);
  }

  .bos {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .bos p {
    margin: 0;
  }

  .liste {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li + li {
    border-top: 1px solid var(--kenar);
  }

  li a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
  }

  .skor {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-weight: 800;
  }

  .iyi {
    background: var(--durum-basarili-zemin);
    color: var(--durum-basarili);
  }

  .orta {
    background: var(--durum-uyari-zemin);
    color: var(--durum-uyari);
  }

  .zayif {
    background: var(--durum-hata-zemin);
    color: var(--durum-hata);
  }

  .metin {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  code {
    font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
    font-size: 14px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .tarih {
    font-size: 12px;
    color: var(--yazi-soluk);
  }

  .sayac {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  .ok {
    color: var(--durum-basarili);
  }

  .hayir {
    color: var(--durum-hata);
  }

  .ikincil {
    background: var(--kart);
    color: var(--yazi);
    border: 1px solid var(--kenar);
  }

  .onay {
    padding: 16px;
  }

  .onay p {
    margin: 0 0 12px;
    font-weight: 600;
  }

  .dugmeler {
    display: flex;
    gap: 8px;
  }

  .tehlike {
    background: var(--durum-hata);
    color: var(--durum-hata-zemin);
  }
</style>
