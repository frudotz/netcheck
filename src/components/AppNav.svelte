<script lang="ts">
  // Alt menü navigasyonu — NetCheck ana bölümleri
  import { onMount } from "svelte";

  let { currentPath = "/" }: { currentPath?: string } = $props();

  // İstemcide gezinme (ClientRouter) sonrası güncellenen yol; ilk çizimde sunucunun verdiği yol kullanılır.
  let navPath = $state<string | null>(null);
  const yol = $derived(navPath ?? currentPath);

  const menu = [
    { href: "/", ad: "Genel Bakış", ikon: "M3 12h4l3-8 4 16 3-8h4", ek: [] as string[] },
    { href: "/tanilama", ad: "Tanılama", ikon: "M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z", ek: ["M7.5 10.5h2l1-2 2 4 1-2h1"] },
    { href: "/gecmis", ad: "Geçmiş", ikon: "M3 12a9 9 0 1 0 3-6.7L3 8", ek: ["M3 3v5h5", "M12 7v5l3 2"] },
  ];

  // Rapor detayı Geçmiş bölümünün parçasıdır.
  function aktif(href: string, path: string): boolean {
    if (href === "/") return path === "/";
    if (href === "/gecmis" && path.startsWith("/rapor")) return true;
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

<nav class="alt-menu" aria-label="Ana menü">
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
  .alt-menu {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--kart);
    border-top: 1px solid var(--kenar);
    z-index: 20;
  }

  .alt-menu a {
    flex: 1;
    max-width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 10px 0;
    font-size: 11px;
    color: var(--yazi-soluk);
    text-decoration: none;
  }

  .alt-menu a.aktif {
    color: var(--renk-ana);
    font-weight: 600;
  }

  svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
