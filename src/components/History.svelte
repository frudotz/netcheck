<script lang="ts">
  // Geçmiş — bu cihazda (localStorage) saklanan tanılama raporları.
  // Görev 13: veri tek yükleme işlevinden (reports.yukle) gelir ve ekran dört halden yalnız birini gösterir:
  // yükleniyor, hata, boş, dolu. Arama ve skor süzgeci adreste tutulur (?ara=&seviye=), böylece
  // rapordan geri dönünce korunur (Görev 14). Geliştirmede ?durum=… ile hal zorlanabilir:
  // docs/gelistirme-notlari.md.
  import { onMount } from "svelte";
  import type { ScoreLevel } from "$lib/types";
  import { GECMIS_ADRESI, reports, reportHref } from "$lib/reports.svelte";
  import { scoreLevel } from "$lib/score";
  import { dil } from "$lib/dil.svelte";
  import { bicim, skorSeviyesiEtiketi, tarihSaat } from "$lib/sozluk";
  import Kart from "$lib/components/ui/Kart.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";

  type Hal = "yukleniyor" | "hata" | "bos" | "dolu";
  const SEVIYELER: ScoreLevel[] = ["iyi", "orta", "zayif"];
  const ETIKET_TURU = { iyi: "basari", orta: "uyari", zayif: "hata" } as const;

  const m = $derived(dil.metin);

  let hal = $state<Hal>("yukleniyor");
  let ara = $state("");
  let seviye = $state<ScoreLevel | "">("");
  let confirming = $state(false);

  /** Yalnız geliştirme sunucusunda (`bun run dev`, `bun run tauri dev`) geçerli; derlemede yok sayılır. */
  function zorlananHal(): string | null {
    return import.meta.env.DEV ? new URLSearchParams(location.search).get("durum") : null;
  }

  async function yukle() {
    hal = "yukleniyor";
    const zorla = zorlananHal();
    if (zorla === "yukleniyor") return;
    try {
      if (zorla === "hata") throw new Error("geliştirme: zorlanan hata");
      const liste = await reports.yukle();
      hal = zorla === "bos" || liste.length === 0 ? "bos" : "dolu";
    } catch {
      hal = "hata";
    }
  }

  // Adresteki süzgeç okunmadan adres yazılmasın (ilk çizimde boş değerler adresi silmesin).
  let adresOkundu = false;

  onMount(() => {
    const q = new URLSearchParams(location.search);
    ara = q.get("ara") ?? "";
    const s = q.get("seviye");
    seviye = SEVIYELER.find((l) => l === s) ?? "";
    adresOkundu = true;
    yukle();
  });

  /** Arama ve süzgeç adrese yazılır (geçmiş kaydı eklenmez). */
  $effect(() => {
    const a = ara;
    const s = seviye;
    if (!adresOkundu) return;
    const url = new URL(location.href);
    if (a) url.searchParams.set("ara", a);
    else url.searchParams.delete("ara");
    if (s) url.searchParams.set("seviye", s);
    else url.searchParams.delete("seviye");
    if (url.href !== location.href) history.replaceState(history.state, "", url);
    // Rapor ekranının "Geçmiş" bağlantısı bu adrese döner; arama ve süzgeç korunur (Görev 14).
    try {
      sessionStorage.setItem(GECMIS_ADRESI, url.pathname + url.search);
    } catch {
      // Depolama kapalıysa geri bağlantı süzgeçsiz /gecmis'e gider.
    }
  });

  /** "Tekrar dene": geliştirmede zorlanan hal adresten kaldırılır, sonra gerçekten yeniden yüklenir. */
  function tekrarDene() {
    if (zorlananHal() !== null) {
      const url = new URL(location.href);
      url.searchParams.delete("durum");
      history.replaceState(history.state, "", url);
    }
    yukle();
  }

  function suzgeciTemizle() {
    ara = "";
    seviye = "";
  }

  const suzulmus = $derived.by(() => {
    const aranan = ara.trim().toLocaleLowerCase(dil.kod);
    return reports.list.filter(
      (r) =>
        (!seviye || scoreLevel(r.score) === seviye) &&
        (!aranan ||
          r.id.toLocaleLowerCase(dil.kod).includes(aranan) ||
          tarihSaat(r.createdAt, dil.kod).toLocaleLowerCase(dil.kod).includes(aranan)),
    );
  });

  // Geçmiş temizlenince dolu liste boş hale geçer.
  const gorunen = $derived<Hal>(hal === "dolu" && reports.list.length === 0 ? "bos" : hal);

  function clearHistory() {
    reports.clear();
    confirming = false;
    // Temizleme depoyu yeniden yazar; hata halinden de boş hale geçilsin diye yeniden yüklenir.
    void yukle();
  }
</script>

<div class="sayfa">
  <div>
    <h1>{m.menuGecmis}</h1>
    <p class="aciklama">{m.gecmisAciklama}</p>
  </div>

  {#if gorunen === "yukleniyor"}
    <Yukleniyor satir={4} />
  {:else if gorunen === "hata"}
    <HataDurumu mesaj={m.gecmisHata} {tekrarDene} />
    <!-- Depo bozuksa "Tekrar dene" hiç başaramaz; temizleme burada da sunulur ki kullanıcı kurtulabilsin. -->
    {#if confirming}
      <div class="kart onay" role="alertdialog" aria-label={m.temizlemeOnayiEtiketi}>
        <p>{bicim(m.temizlemeOnayi, { n: reports.list.length })}</p>
        <div class="dugmeler">
          <button class="btn tehlike" onclick={clearHistory}>{m.evetTemizle}</button>
          <button class="btn ikincil" onclick={() => (confirming = false)}>{m.vazgec}</button>
        </div>
      </div>
    {:else}
      <button class="btn ikincil temizle" onclick={() => (confirming = true)}>{m.gecmisiTemizle}</button>
    {/if}
  {:else if gorunen === "bos"}
    <BosDurum baslik={m.gecmisBos} aciklama={m.gecmisBosAciklama} dugmeMetni={m.tanilamayiBaslat} dugmeHref="/tanilama" />
  {:else}
    <div class="suzgec">
      <label class="alan">
        <span>{m.ara}</span>
        <input type="search" bind:value={ara} placeholder={m.araIpucu} />
      </label>
      <label class="alan">
        <span>{m.seviyeSuzgeci}</span>
        <select bind:value={seviye}>
          <option value="">{m.tumu}</option>
          {#each SEVIYELER as s (s)}
            <option value={s}>{skorSeviyesiEtiketi(m, s)}</option>
          {/each}
        </select>
      </label>
    </div>

    {#if suzulmus.length === 0}
      <BosDurum baslik={m.sonucYok} aciklama={m.sonucYokAciklama} dugmeMetni={m.suzgeciTemizle} onclick={suzgeciTemizle} />
    {:else}
      <ul class="liste">
        {#each suzulmus as r (r.id)}
          <li>
            <Kart
              href={reportHref(r.id)}
              baslik={r.id}
              altMetin={`${tarihSaat(r.createdAt, dil.kod)} · ${r.passed} ${m.basarili} · ${r.failed} ${m.basarisiz}`}
              etiket={`${r.score} · ${skorSeviyesiEtiketi(m, scoreLevel(r.score))}`}
              etiketTuru={ETIKET_TURU[scoreLevel(r.score)]}
            />
          </li>
        {/each}
      </ul>
    {/if}

    {#if confirming}
      <div class="kart onay" role="alertdialog" aria-label={m.temizlemeOnayiEtiketi}>
        <p>{bicim(m.temizlemeOnayi, { n: reports.list.length })}</p>
        <div class="dugmeler">
          <button class="btn tehlike" onclick={clearHistory}>{m.evetTemizle}</button>
          <button class="btn ikincil" onclick={() => (confirming = false)}>{m.vazgec}</button>
        </div>
      </div>
    {:else}
      <button class="btn ikincil temizle" onclick={() => (confirming = true)}>{m.gecmisiTemizle}</button>
    {/if}
  {/if}
</div>

<style>
  .suzgec {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: var(--bosluk-3);
  }

  .alan {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-1);
    font-size: var(--yazi-kucuk);
    font-weight: 600;
    color: var(--yazi-soluk);
  }

  .alan input,
  .alan select {
    min-height: var(--dokunma);
    padding: var(--bosluk-2) var(--bosluk-3);
    border: 1px solid var(--kenar);
    border-radius: calc(var(--radius) / 2);
    background: var(--kart);
    color: var(--yazi);
    font: inherit;
    font-size: var(--yazi-govde);
    font-weight: 400;
  }

  .liste {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-2);
  }

  .liste li {
    display: flex;
    min-width: 0;
  }

  .onay {
    padding: var(--bosluk-4);
  }

  .onay p {
    margin: 0 0 var(--bosluk-3);
    font-weight: 600;
  }

  .dugmeler {
    display: flex;
    gap: var(--bosluk-2);
  }

  .tehlike {
    background: var(--durum-hata);
    color: var(--durum-hata-zemin);
  }

  /* Tablet ve üzeri: eylem düğmeleri tam genişlik yerine içerik kadar. */
  @media (min-width: 48em) {
    .temizle,
    .dugmeler .btn {
      width: auto;
      min-width: 12rem;
    }

    .temizle {
      align-self: flex-start;
    }
  }
</style>
