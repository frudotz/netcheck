<script lang="ts">
  // Hata durumu (Görev 13): kullanıcıya anlaşılır mesaj ve "Tekrar dene". Ham hata metni gösterilmez.
  import type { HataDurumuOzellikleri } from "$lib/types";
  import { dil } from "$lib/dil.svelte";

  let { mesaj, tekrarDene, dugmeMetni }: HataDurumuOzellikleri = $props();
</script>

<div class="hata-durumu" role="alert">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </svg>
  <p>{mesaj}</p>
  {#if tekrarDene}
    <button type="button" class="btn ikincil" onclick={tekrarDene}>{dugmeMetni ?? dil.metin.tekrarDene}</button>
  {/if}
</div>

<style>
  .hata-durumu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--bosluk-3);
    padding: var(--bosluk-5) var(--bosluk-4);
    border: 1px solid var(--durum-hata);
    border-radius: var(--radius);
    background: var(--durum-hata-zemin);
    color: var(--durum-hata);
    text-align: center;
  }

  svg {
    width: var(--dokunma);
    height: var(--dokunma);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  p {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
</style>
