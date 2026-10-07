<script lang="ts">
  // Harici bağlantı — Tauri penceresinde WebView'den çıkmadan varsayılan tarayıcıda açar.
  import type { Snippet } from "svelte";
  import { isTauri } from "@tauri-apps/api/core";
  import { openUrl } from "@tauri-apps/plugin-opener";

  let { href, children }: { href: string; children: Snippet } = $props();

  async function open(event: MouseEvent) {
    if (typeof window === "undefined" || !isTauri()) return; // tarayıcıda normal bağlantı davranışı
    event.preventDefault();
    try {
      await openUrl(href);
    } catch {
      // Açılamazsa sessizce yoksay; bağlantı metni görünür kalır.
    }
  }
</script>

<a {href} target="_blank" rel="noopener noreferrer" onclick={open}>{@render children()}</a>

<style>
  a {
    color: var(--renk-ana);
    font-weight: 600;
  }
</style>
