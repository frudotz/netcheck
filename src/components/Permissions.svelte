<script lang="ts">
  // İzinler (/izinler): uygulamanın bu platform için bildirdiği ve bilinçli olarak istemediği izinlerin
  // envanteri. Liste Rust'tan statik gelir (get_permission_inventory); işletim sisteminden izin durumu
  // okunmaz ve hiçbir sistem diyaloğu açılmaz. Üç durum: yükleniyor / hata / dolu (docs/izinler.md).
  import { onMount } from "svelte";
  import { dil } from "$lib/dil.svelte";
  import { hasNative, permissionInventory } from "$lib/native";
  import { izinDurumEtiketi, izinMetni, ozellikAdi, platformEtiketi } from "$lib/sozluk";
  import type { EkranHatasi, PermissionEntry } from "$lib/types";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";

  const m = $derived(dil.metin);

  let kayitlar = $state<PermissionEntry[] | null>(null);
  let hata = $state<EkranHatasi | null>(null);

  const bildirilen = $derived((kayitlar ?? []).filter((k) => k.status !== "not-requested"));
  const istenmeyen = $derived((kayitlar ?? []).filter((k) => k.status === "not-requested"));
  const os = $derived(kayitlar?.[0]?.os);

  async function yukle() {
    hata = null;
    kayitlar = null;
    if (!hasNative()) {
      hata = "yalniz-uygulamada";
      return;
    }
    try {
      kayitlar = await permissionInventory();
    } catch {
      hata = "alinamadi";
    }
  }

  onMount(() => {
    yukle();
  });
</script>

<div class="sayfa">
  <h1>{m.izinlerBaslik}</h1>
  <p class="aciklama">{m.izinlerAciklama}</p>

  {#if hata === "yalniz-uygulamada"}
    <HataDurumu mesaj={m.izinlerYalnizUygulamada} />
  {:else if hata === "alinamadi"}
    <HataDurumu mesaj={m.izinlerHata} tekrarDene={yukle} />
  {:else if kayitlar === null}
    <Yukleniyor satir={4} />
  {:else}
    <p class="not">
      {m.izinlerNot}
      {#if os}
        <span class="platform">{m.izinlerPlatform}: {platformEtiketi(m, os === "android" || os === "ios" ? "mobile" : "desktop", os)}</span>
      {/if}
    </p>

    {#each [{ baslik: m.izinlerBildirilen, liste: bildirilen }, { baslik: m.izinlerIstenmeyen, liste: istenmeyen }] as grup (grup.baslik)}
      {#if grup.liste.length > 0}
        <section class="grup" aria-labelledby={"grup-" + grup.liste[0].status}>
          <h2 id={"grup-" + grup.liste[0].status}>{grup.baslik}</h2>
          <ul class="liste">
            {#each grup.liste as kayit (kayit.id)}
              {@const metin = izinMetni(m, kayit.id)}
              <li class="kart izin" class:istenmiyor={kayit.status === "not-requested"}>
                <div class="ust">
                  <h3>{metin.ad}</h3>
                  {#if kayit.status !== "not-requested"}
                    <span class="rozet" class:gerekli={kayit.required}>{kayit.required ? m.izinGerekli : m.izinIstegeBagli}</span>
                  {/if}
                </div>
                <p class="gerekce">{metin.gerekce}</p>
                <dl class="anahtar-deger">
                  <div><dt>{m.izinTur}</dt><dd>{kayit.kind === "os" ? m.izinTurOs : m.izinTurTauri}</dd></div>
                  <div><dt>{m.izinTeknikKimlik}</dt><dd class="mono">{kayit.technicalId ?? "—"}</dd></div>
                  <div><dt>{m.izinDurum}</dt><dd>{izinDurumEtiketi(m, kayit.status)}</dd></div>
                  <div><dt>{m.izinCalismaZamani}</dt><dd>{kayit.runtimePrompt === null ? m.izinCalismaZamaniDogrulanmadi : kayit.runtimePrompt ? m.izinCalismaZamaniVar : m.izinCalismaZamaniYok}</dd></div>
                  <div>
                    <dt>{m.izinEtkilenen}</dt>
                    <dd>{kayit.features.length > 0 ? kayit.features.map((f) => ozellikAdi(m, f)).join(" · ") : m.izinEtkilenenYok}</dd>
                  </div>
                </dl>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    {/each}
  {/if}
</div>

<style>
  .not {
    margin: 0 0 var(--bosluk-3);
    font-size: var(--yazi-kucuk);
    color: var(--yazi-soluk);
  }

  .platform {
    display: block;
    margin-top: var(--bosluk-1);
    font-weight: 600;
  }

  .grup {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
    margin-top: var(--bosluk-4);
  }

  h2 {
    margin: 0;
    font-size: var(--yazi-orta);
  }

  .liste {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
  }

  .izin {
    padding: 0.875rem var(--bosluk-4);
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-2);
  }

  .izin.istenmiyor {
    background: var(--zemin);
  }

  .ust {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--bosluk-3);
  }

  h3 {
    margin: 0;
    font-size: var(--yazi-govde);
  }

  .rozet {
    flex-shrink: 0;
    padding: 0.125rem 0.625rem;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    font-size: var(--yazi-kucuk);
    font-weight: 600;
    color: var(--yazi-soluk);
  }

  .rozet.gerekli {
    border-color: var(--renk-ana);
    color: var(--renk-ana);
  }

  .gerekce {
    margin: 0;
    font-size: var(--yazi-govde);
    color: var(--yazi-soluk);
  }

  .anahtar-deger dd {
    font-weight: 500;
  }
</style>
