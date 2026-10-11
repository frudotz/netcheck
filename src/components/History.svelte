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
      <button class="btn ikincil temizle" onclick={() => (confirming = true)}>Geçmişi Temizle</button>
    {/if}
  {/if}
</div>

<style>
  .durum {
    margin: 0;
    padding: var(--bosluk-4);
    color: var(--yazi-soluk);
  }

  .bos {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
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
    gap: var(--bosluk-3);
    min-height: var(--dokunma);
    padding: var(--bosluk-3) var(--bosluk-4);
    border-radius: var(--radius);
  }

  li a:focus-visible {
    outline-offset: -3px;
  }

  .skor {
    width: var(--dokunma);
    height: var(--dokunma);
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
    font-size: var(--yazi-govde);
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .tarih {
    font-size: var(--yazi-kucuk);
    color: var(--yazi-soluk);
  }

  .sayac {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: var(--yazi-kucuk);
    font-weight: 600;
    white-space: nowrap;
  }

  .ok {
    color: var(--durum-basarili);
  }

  .hayir {
    color: var(--durum-hata);
  }

  .onay {
    padding: var(--bosluk-4);
  }

  .onay p {
    margin: 0 0 var(--bosluk-3);
    font-weight: 600;
  }

  .dugmeler {
    display: flex;
    gap: var(--bosluk-2);
  }

  .tehlike {
    background: var(--durum-hata);
    color: var(--durum-hata-zemin);
  }

  /* Tablet ve üzeri: sayaçlar yan yana; eylem düğmeleri tam genişlik yerine içerik kadar. */
  @media (min-width: 48em) {
    li a {
      gap: var(--bosluk-4);
    }

    .sayac {
      flex-direction: row;
      gap: var(--bosluk-4);
      font-size: var(--yazi-ince);
    }

    .temizle,
    .dugmeler .btn {
      width: auto;
      min-width: 12rem;
    }

    .temizle {
      align-self: flex-start;
    }
  }
</style>
