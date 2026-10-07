<script lang="ts">
  // Bağlantı Skoru halkası (inline SVG)
  import { scoreLevel, scoreLevelLabel } from "$lib/score";

  let { score, size = 112 }: { score: number; size?: number } = $props();

  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const level = $derived(scoreLevel(score));
  const dash = $derived((Math.max(0, Math.min(100, score)) / 100) * CIRC);
</script>

<div class="gauge {level}" style="width:{size}px;height:{size}px" role="img" aria-label="Bağlantı Skoru {score} / 100, {scoreLevelLabel[level]}">
  <svg viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r={R} class="iz" />
    <circle cx="60" cy="60" r={R} class="dolu" stroke-dasharray="{dash} {CIRC}" />
  </svg>
  <div class="deger">
    <strong>{score}</strong>
    <span>{scoreLevelLabel[level]}</span>
  </div>
</div>

<style>
  .gauge {
    position: relative;
    flex-shrink: 0;
  }

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  circle {
    fill: none;
    stroke-width: 10;
  }

  .iz {
    stroke: var(--kenar);
  }

  .dolu {
    stroke-linecap: round;
    transition: stroke-dasharray 0.4s ease;
  }

  .iyi .dolu {
    stroke: var(--durum-basarili);
  }

  .orta .dolu {
    stroke: var(--durum-uyari);
  }

  .zayif .dolu {
    stroke: var(--durum-hata);
  }

  .deger {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1.1;
  }

  strong {
    font-size: 30px;
    font-weight: 800;
  }

  span {
    font-size: 12px;
    color: var(--yazi-soluk);
  }
</style>
