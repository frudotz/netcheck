<script lang="ts">
  // Alt menü navigasyonu — NetCheck ana bölümleri
  import { onMount } from "svelte";
  import { dil } from "$lib/dil.svelte";

  let { currentPath = "/" }: { currentPath?: string } = $props();

  // İstemcide gezinme (ClientRouter) sonrası güncellenen yol; ilk çizimde sunucunun verdiği yol kullanılır.
  let navPath = $state<string | null>(null);
  const yol = $derived(navPath ?? currentPath);

  const menu = $derived([
    { href: "/", ad: dil.metin.menuGenelBakis, ikon: "M3 12h4l3-8 4 16 3-8h4", ek: [] as string[] },
    { href: "/tanilama", ad: dil.metin.menuTanilama, ikon: "M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z", ek: ["M7.5 10.5h2l1-2 2 4 1-2h1"] },
    { href: "/gecmis", ad: dil.metin.menuGecmis, ikon: "M3 12a9 9 0 1 0 3-6.7L3 8", ek: ["M3 3v5h5", "M12 7v5l3 2"] },
    { href: "/ayarlar", ad: dil.metin.menuAyarlar, ikon: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0", ek: ["M16 4v4", "M10 10v4", "M18 16v4"] },
  ]);

  // Rapor detayı Geçmiş'in; bilgi sayfaları (tüm dillerde) Ayarlar'ın parçasıdır.
  const BILGI_SAYFASI = /^(\/(en|ar|fa))?\/(hakkinda|iletisim|kosullar|gizlilik)(\/|$)/;

  function aktif(href: string, path: string): boolean {
    if (href === "/") return path === "/";
    if (href === "/gecmis" && path.startsWith("/rapor")) return true;
    if (href === "/ayarlar" && BILGI_SAYFASI.test(path)) return true;
    return path.startsWith(href);
  }

  onMount(() => {
    const handleNav = () => {
      navPath = window.location.pathname;
    };
    handleNav();
    document.addEventListener("astro:page-load", handleNav);
    window.addEventListener("popstate", handleNav);
    return () => {
      document.removeEventListener("astro:page-load", handleNav);
      window.removeEventListener("popstate", handleNav);
    };
  });
</script>

<nav class="alt-menu" aria-label={dil.metin.menuAna}>
  {#each menu as m (m.href)}
    <a href={m.href} class:aktif={aktif(m.href, yol)} aria-current={aktif(m.href, yol) ? "page" : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={m.ikon} />
        {#each m.ek as d}<path {d} />{/each}
      </svg>
      {m.ad}
    </a>
  {/each}
</nav>

<style>
  /* Dar ekran: sabit alt sekme çubuğu. Geniş / kısa yatay ekran: Layout ızgarasında dikey ray.
     Kesme noktası Layout.astro ile aynıdır (docs/mimari-agac.md §3). */
  .alt-menu {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    background: var(--kart);
    border-top: 1px solid var(--kenar);
    z-index: 20;
  }

  .alt-menu a {
    flex: 1;
    max-width: 12.5rem;
    min-height: var(--alt-menu-yukseklik);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1875rem;
    padding: var(--bosluk-2) var(--bosluk-1);
    font-size: var(--yazi-mini);
    text-align: center;
    color: var(--yazi-soluk);
    text-decoration: none;
  }

  .alt-menu a.aktif {
    color: var(--renk-ana);
    font-weight: 600;
  }

  .alt-menu a:focus-visible {
    outline-offset: -3px;
  }

  svg {
    width: 1.375rem;
    height: 1.375rem;
    flex-shrink: 0;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (min-width: 64em), (orientation: landscape) and (min-width: 33em) and (max-height: 31.25em) {
    .alt-menu {
      position: sticky;
      top: var(--ust-yukseklik);
      align-self: start;
      height: calc(100vh - var(--ust-yukseklik));
      height: calc(100dvh - var(--ust-yukseklik));
      flex-direction: column;
      justify-content: flex-start;
      gap: var(--bosluk-1);
      padding: var(--bosluk-3) var(--bosluk-2) env(safe-area-inset-bottom);
      border-top: 0;
      border-inline-end: 1px solid var(--kenar);
      overflow-y: auto;
    }

    /* Çentik yalnız ekranın fiziksel kenarındadır: ray LTR'de solda, RTL'de sağda. */
    :global([dir="ltr"]) .alt-menu {
      padding-left: max(var(--bosluk-2), env(safe-area-inset-left));
    }

    :global([dir="rtl"]) .alt-menu {
      padding-right: max(var(--bosluk-2), env(safe-area-inset-right));
    }

    .alt-menu a {
      flex: 0 0 auto;
      max-width: none;
      min-height: 4rem;
      border-radius: var(--radius);
      font-size: var(--yazi-kucuk);
    }

    .alt-menu a.aktif {
      background: var(--zemin);
    }
  }

  /* Kısa yatay ekranda (telefon yatay) ray öğeleri sıkışır; ekran yüksekliğine sığar. */
  @media (orientation: landscape) and (max-height: 31.25em) {
    .alt-menu a {
      min-height: var(--dokunma);
      gap: 0.125rem;
      padding-block: var(--bosluk-1);
    }
  }
</style>
