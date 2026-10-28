<script lang="ts">
  // Boş durum (Görev 13): kayıt yokken ya da arama/süzgeç sonucu boşken ne olduğunu söyler.
  import type { BosDurumOzellikleri } from "$lib/types";

  let { baslik, aciklama, dugmeMetni, dugmeHref, onclick }: BosDurumOzellikleri = $props();
</script>

<div class="bos-durum">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M4 12h10M4 17h7" />
    <path d="M17 15l4 4M19.5 15.5l-3 3" />
  </svg>
  <p class="baslik">{baslik}</p>
  {#if aciklama}<p class="aciklama">{aciklama}</p>{/if}
  {#if dugmeMetni && dugmeHref}
    <a class="btn" href={dugmeHref}>{dugmeMetni}</a>
  {:else if dugmeMetni && onclick}
    <button type="button" class="btn ikincil" {onclick}>{dugmeMetni}</button>
  {/if}
</div>

<style>
  .bos-durum {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--bosluk-2);
    padding: var(--bosluk-6) var(--bosluk-4);
    border: 1px dashed var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
    text-align: center;
  }

  svg {
    width: var(--dokunma);
    height: var(--dokunma);
    fill: none;
    stroke: var(--yazi-soluk);
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  p {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .baslik {
    font-size: var(--yazi-orta);
    font-weight: 600;
  }

  .aciklama {
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
  }

  .btn {
    margin-top: var(--bosluk-2);
  }
</style>
