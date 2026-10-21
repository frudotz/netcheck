<script lang="ts">
  // Yükleniyor (Görev 13): veri gelene kadar iskelet görünüm. Ekran okuyucuya tek bir durum metni duyurulur.
  import type { YukleniyorOzellikleri } from "$lib/types";
  import { dil } from "$lib/dil.svelte";

  let { satir = 3, etiket }: YukleniyorOzellikleri = $props();
</script>

<div class="yukleniyor" role="status" aria-live="polite">
  <span class="gorunmez">{etiket ?? dil.metin.yukleniyor}</span>
  {#each { length: satir } as _, i (i)}
    <div class="iskelet" aria-hidden="true">
      <span class="cizgi uzun"></span>
      <span class="cizgi kisa"></span>
    </div>
  {/each}
</div>

<style>
  .yukleniyor {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-2);
  }

  .iskelet {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-2);
    padding: var(--bosluk-3) var(--bosluk-4);
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
  }

  .cizgi {
    display: block;
    height: var(--bosluk-3);
    border-radius: var(--bosluk-1);
    background: var(--kenar);
    animation: nabiz 1.2s ease-in-out infinite;
  }

  .uzun {
    width: 70%;
  }

  .kisa {
    width: 40%;
  }

  @keyframes nabiz {
    50% {
      opacity: 0.45;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cizgi {
      animation: none;
    }
  }

  .gorunmez {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
