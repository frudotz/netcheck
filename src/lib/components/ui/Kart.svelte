<script lang="ts">
  // Genel kart (Görev 12): başlık, alt metin, isteğe bağlı görsel ve etiket.
  // Uygulamanın veri tiplerini tanımaz; dönüşümü kartı kullanan ekran yapar.
  // `href` verilirse <a>, `onclick` verilirse <button> olur: ikisi de klavyeyle odaklanır ve Enter ile açılır.
  import type { KartOzellikleri } from "$lib/types";

  let {
    baslik,
    altMetin,
    altMetinEsAralikli = false,
    gorsel,
    etiket,
    etiketTuru = "bilgi",
    href,
    onclick,
  }: KartOzellikleri = $props();
</script>

{#snippet icerik()}
  {#if gorsel}
    <img class="gorsel" src={gorsel.src} alt={gorsel.alt} loading="lazy" />
  {/if}
  <span class="metin">
    <span class="baslik">{baslik}</span>
    {#if altMetin}
      <span class="alt-metin" class:mono={altMetinEsAralikli}>{altMetin}</span>
    {/if}
  </span>
  {#if etiket}
    <span class="kart-etiket {etiketTuru}">{etiket}</span>
  {/if}
{/snippet}

{#if href}
  <a class="kart-bilesen etkilesimli" {href}>{@render icerik()}</a>
{:else if onclick}
  <button type="button" class="kart-bilesen etkilesimli" {onclick}>{@render icerik()}</button>
{:else}
  <div class="kart-bilesen">{@render icerik()}</div>
{/if}

<style>
  /* Bütün renk, boşluk ve köşe değerleri src/styles/app.css değişkenlerinden gelir.
     Yöne bağlı değer yoktur: sıra ve hizalama yazı yönünü izler (RTL'de görsel sağa geçer). */
  .kart-bilesen {
    display: flex;
    align-items: center;
    gap: var(--bosluk-3);
    width: 100%;
    min-width: 0;
    min-height: var(--dokunma);
    padding: var(--bosluk-3) var(--bosluk-4);
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
    color: var(--yazi);
    font: inherit;
    text-align: start;
    text-decoration: none;
  }

  .etkilesimli {
    cursor: pointer;
  }

  .etkilesimli:hover {
    border-color: var(--renk-ana);
  }

  .gorsel {
    width: var(--dokunma);
    height: var(--dokunma);
    flex-shrink: 0;
    border-radius: calc(var(--radius) / 2);
    object-fit: cover;
  }

  .metin {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    flex: 1;
    min-width: 0;
  }

  .baslik {
    font-size: var(--yazi-govde);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .alt-metin {
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  .kart-etiket {
    flex-shrink: 0;
    align-self: start;
    max-width: 50%;
    padding: 0.125rem var(--bosluk-2);
    border-radius: 999px;
    font-size: var(--yazi-mini);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .kart-etiket.bilgi {
    color: var(--durum-bilgi);
    background: var(--durum-bilgi-zemin);
  }

  .kart-etiket.basari {
    color: var(--durum-basarili);
    background: var(--durum-basarili-zemin);
  }

  .kart-etiket.uyari {
    color: var(--durum-uyari);
    background: var(--durum-uyari-zemin);
  }

  .kart-etiket.hata {
    color: var(--durum-hata);
    background: var(--durum-hata-zemin);
  }
</style>
