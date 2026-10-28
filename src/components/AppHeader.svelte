<script lang="ts">
  // Ortak başlık: NetCheck logosu ve gece / gündüz modu düğmesi
  import { tema } from "$lib/tema.svelte";
  import { dil } from "$lib/dil.svelte";
</script>

<header class="ust">
  <a href="/" class="logo" aria-label={dil.metin.logoEtiketi}>
    <svg class="isaret" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 8.5a14 14 0 0 1 19 0" />
      <path d="M5.5 12a9.5 9.5 0 0 1 13 0" />
      <path d="M8.5 15.5a5 5 0 0 1 7 0" />
      <path class="tik" d="M9.8 19.2l1.7 1.7 3.2-3.4" />
    </svg>
    <span>net<b>check</b></span>
  </a>
  <button
    class="tema-dugme"
    onclick={() => tema.degistir()}
    aria-label={tema.mod === "gece" ? dil.metin.gunduzeGec : dil.metin.geceyeGec}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {#if tema.mod === "gece"}
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      {:else}
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      {/if}
    </svg>
  </button>
</header>

<style>
  /* Yükseklik = --ust-yukseklik (0.75 + 2.75 + 0.75 rem + üst güvenli alan); menü rayı buna yaslanır. */
  .ust {
    --odak: var(--renk-vurgu);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 10;
    padding: calc(0.75rem + env(safe-area-inset-top)) var(--sayfa-bosluk) 0.75rem;
    padding-left: max(var(--sayfa-bosluk), env(safe-area-inset-left));
    padding-right: max(var(--sayfa-bosluk), env(safe-area-inset-right));
    background: var(--renk-koyu);
  }

  .logo {
    display: flex;
    align-items: center;
    min-height: var(--dokunma);
    gap: var(--bosluk-2);
    color: #fff;
    font-size: var(--yazi-baslik);
    font-weight: 800;
    letter-spacing: -0.5px;
    text-decoration: none;
  }

  .logo b {
    font-weight: 800;
    color: var(--renk-vurgu);
  }

  .isaret {
    width: 1.75rem;
    height: 1.75rem;
    fill: none;
    stroke: var(--renk-vurgu);
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .isaret .tik {
    stroke: #fff;
  }

  .tema-dugme {
    width: var(--dokunma);
    height: var(--dokunma);
    border: 1px solid #ffffff33;
    border-radius: 50%;
    background: #ffffff14;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tema-dugme svg {
    width: 1.125rem;
    height: 1.125rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
