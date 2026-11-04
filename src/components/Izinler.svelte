<script lang="ts">
  import { onMount } from "svelte";
  import { izinDurumu, izinIste, bildirimGonder } from "$lib/native";
  import type { IzinDurumu } from "$lib/types";

  let izinler = $state<IzinDurumu[]>([]);
  let native = $state(true);
  let mesaj = $state("");

  const etiket: Record<string, string> = {
    granted: "izin verildi",
    denied: "reddedildi",
    prompt: "henüz sorulmadı",
    unsupported: "bu platformda yok",
    unknown: "bilinmiyor",
  };

  async function yenile() {
    try { izinler = await izinDurumu(); } catch { izinler = []; }
  }
  async function iste(id: string) {
    try { izinler = await izinIste(id); }
    catch (e) { mesaj = "İzin istenemedi: " + String(e); }
  }
  async function test() {
    try {
      await bildirimGonder("NetCheck", "Ağ bağlantısı durumu bildirimi");
      mesaj = "Bildirim gönderildi (izin verildiyse görürsünüz).";
    } catch (e) { mesaj = "Bildirim gönderilemedi: " + String(e); }
  }
  onMount(() => {
    native = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    if (native) yenile();
  });
</script>

<section class="izinler">
  <h1>İzinler</h1>
  <p class="aciklama">Bu uygulama yalnız gerçekten kullandığı izni ister. Açıklayamadığımız bir izni istemeyiz.</p>
  {#if !native}
    <p class="not">İzinler yalnız uygulama (Tauri) içinde görünür; tarayıcı önizlemesinde sistem izni yoktur.</p>
  {:else}
    {#if izinler.length === 0}<p class="not">Tanımlı izin yok.</p>{/if}
    <ul>
      {#each izinler as izin (izin.id)}
        <li>
          <div class="ust"><strong>{izin.title}</strong><span class="rozet rozet-{izin.status}">{etiket[izin.status] ?? izin.status}</span></div>
          <p class="notlar">{izin.notes}</p>
          {#if izin.can_request}<button onclick={() => iste(izin.id)}>İzin iste</button>{/if}
        </li>
      {/each}
    </ul>
    <button class="test" onclick={test}>Test bildirimi gönder</button>
  {/if}
  {#if mesaj}<p class="mesaj">{mesaj}</p>{/if}
</section>

<style>
  .izinler { max-width: 640px; margin: 0 auto; padding: var(--bosluk-l, 1rem); display: flex; flex-direction: column; gap: var(--bosluk-m, 0.75rem); }
  .aciklama, .not { color: var(--renk-metin-soluk, #666); }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bosluk-m, 0.75rem); }
  li { border: 1px solid var(--renk-kenarlik, #e2e2e2); border-radius: var(--kose, 12px); padding: var(--bosluk-m, 0.75rem); display: flex; flex-direction: column; gap: 0.35rem; }
  .ust { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
  .rozet { font-size: 0.8rem; padding: 0.1rem 0.5rem; border-radius: 999px; border: 1px solid var(--renk-kenarlik, #e2e2e2); }
  .rozet-granted { color: var(--renk-basari, #137333); }
  .rozet-denied { color: var(--renk-hata, #b00020); }
  .notlar { margin: 0; color: var(--renk-metin-soluk, #666); font-size: 0.9rem; }
  button { align-self: flex-start; padding: 0.4rem 0.9rem; border-radius: var(--kose, 10px); border: 1px solid var(--renk-vurgu, #6b4f3b); background: var(--renk-vurgu, #6b4f3b); color: #fff; cursor: pointer; }
  .mesaj { color: var(--renk-metin-soluk, #666); font-size: 0.9rem; }
</style>
