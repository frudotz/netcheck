<script lang="ts">
  // Harici bağlantı — Tauri penceresinde WebView'den çıkmadan varsayılan tarayıcıda açar.
  // Tauri çağrısı yalnız src/lib/native.ts üzerinden yapılır (Görev 15).
  import type { Snippet } from "svelte";
  import { hasNative, openExternal } from "$lib/native";

  let { href, children }: { href: string; children: Snippet } = $props();

  async function open(event: MouseEvent) {
    if (!hasNative()) return; // tarayıcıda normal bağlantı davranışı
    event.preventDefault();
    try {
      await openExternal(href);
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
