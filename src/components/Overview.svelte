<script lang="ts">
  // Genel Bakış — Rust'tan alınan gerçek ağ anlık görüntüsü
  import { onMount } from "svelte";
  import type { NetworkSnapshot } from "../types/netcheck";
  import { getNetworkSnapshot } from "$lib/native";
  import { connectionTypeLabel, errorMessage, NOT_FOUND, UNAVAILABLE } from "$lib/labels";

  let snapshot = $state<NetworkSnapshot | null>(null);
  let loading = $state(true);
  let error = $state("");

  async function load() {
    loading = true;
    error = "";
    try {
      snapshot = await getNetworkSnapshot();
    } catch (e) {
      snapshot = null;
      error = errorMessage(e, "Ağ bilgileri alınamadı. Lütfen tekrar deneyin.");
    } finally {
      loading = false;
    }
  }

  onMount(load);

  const rows = $derived(
    snapshot
      ? [
          { label: "Yerel IPv4", value: snapshot.localIPv4 ?? UNAVAILABLE, mono: true },
          { label: "IPv6", value: snapshot.localIPv6 ?? UNAVAILABLE, mono: true },
          { label: "Gateway", value: snapshot.gateway ?? NOT_FOUND, mono: true },
          {
            label: "DNS",
            value: snapshot.dnsServers.length ? snapshot.dnsServers.join(", ") : NOT_FOUND,
            mono: true,
          },
          { label: "Hostname", value: snapshot.hostname ?? UNAVAILABLE, mono: false },
          { label: "Bağlantı türü", value: connectionTypeLabel[snapshot.connectionType], mono: false },
        ]
      : [],
  );
</script>

<div class="sayfa">
  <div class="baslik">
    <h1>Genel Bakış</h1>
    <button class="yenile" onclick={load} disabled={loading} aria-label="Ağ bilgilerini yenile">
      {loading ? "Yenileniyor…" : "Yenile"}
    </button>
  </div>

  {#if loading && !snapshot}
    <p class="kart durum" role="status">Ağ bilgileri alınıyor...</p>
  {:else if error}
    <p class="kart durum hata" role="alert">{error}</p>
  {:else if snapshot}
    <section class="kart">
      <h2>Ağ Bilgileri</h2>
      <dl class="bilgiler">
        {#each rows as r (r.label)}
          <div>
            <dt>{r.label}</dt>
            <dd class:mono={r.mono}>{r.value}</dd>
          </div>
        {/each}
      </dl>
    </section>

    <section class="kart">
      <h2>Ağ Arayüzleri</h2>
      {#each snapshot.interfaces as i (i.name)}
        <div class="arayuz">
          <div class="ad">
            <strong>{i.name}</strong>
            {#if i.isDefault}<span class="etiket">Varsayılan</span>{/if}
          </div>
          <p class="mono">{i.ipv4 ?? UNAVAILABLE}{i.ipv6 ? ` · ${i.ipv6}` : ""}</p>
          <p>{connectionTypeLabel[i.type]}{i.mac ? ` · ${i.mac}` : ""}</p>
        </div>
      {:else}
        <p class="bos">Etkin ağ arayüzü bulunamadı.</p>
      {/each}
    </section>
  {/if}
</div>

<style>
  .baslik {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    margin: 0;
    font-size: 22px;
  }

  h2 {
    margin: 0;
    padding: 14px 16px 6px;
    font-size: 15px;
  }

  .yenile {
    padding: 8px 14px;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    background: var(--kart);
    font-size: 13px;
    font-weight: 600;
  }

  .durum {
    margin: 0;
    padding: 16px;
    color: var(--yazi-soluk);
  }

  .hata {
    color: var(--yazi);
  }

  .bilgiler {
    margin: 0;
    padding: 0 16px 8px;
  }

  .bilgiler div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 0;
    border-top: 1px solid var(--kenar);
  }

  .bilgiler div:first-child {
    border-top: 0;
  }

  dt {
    color: var(--yazi-soluk);
    font-size: 14px;
    flex-shrink: 0;
  }

  dd {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .mono {
    font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  }

  .arayuz {
    padding: 10px 16px;
    border-top: 1px solid var(--kenar);
  }

  .arayuz:last-child {
    padding-bottom: 14px;
  }

  .arayuz .ad {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .arayuz p {
    margin: 2px 0 0;
    font-size: 13px;
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  .etiket {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--renk-ana);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
  }
</style>
