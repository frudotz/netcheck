<script lang="ts">
  // Tanılama test durumu rozeti
  import type { DiagnosticStatus } from "../types/netcheck";
  import { statusLabel } from "$lib/labels";

  let { status }: { status: DiagnosticStatus } = $props();
</script>

<span class="rozet {status}">
  {#if status === "running"}<span class="donen" aria-hidden="true"></span>{/if}
  {statusLabel[status]}
</span>

<style>
  .rozet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid var(--kenar);
    color: var(--yazi-soluk);
  }

  .success {
    border-color: transparent;
    background: var(--durum-basarili-zemin);
    color: var(--durum-basarili);
  }

  .failed {
    border-color: transparent;
    background: var(--durum-hata-zemin);
    color: var(--durum-hata);
  }

  .unavailable {
    border-color: transparent;
    background: var(--durum-uyari-zemin);
    color: var(--durum-uyari);
  }

  .running {
    color: var(--renk-ana);
    border-color: var(--renk-ana);
  }

  .donen {
    width: 10px;
    height: 10px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: don 0.8s linear infinite;
  }

  @keyframes don {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .donen {
      animation: none;
    }
  }
</style>
