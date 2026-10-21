<script lang="ts">
  // Tanılama Raporu — Rust tarafından üretilen NCHK kimliği, skor, test sonuçları ve ağ bilgisi.
  // Görev 14: kimlik adreste (`/rapor?id=`), geri bağlantı Geçmiş'in arama ve süzgecini korur,
  // bilinmeyen kimlikte HataDurumu gösterilir; metinler dört dilde sözlükten gelir.
  import { onMount } from "svelte";
  import { gecmisAdresi, reports } from "$lib/reports.svelte";
  import { formatLatency } from "$lib/labels";
  import { dil } from "$lib/dil.svelte";
  import { baglantiTuruEtiketi, bicim, tarihSaat, testAdi, testMesaji } from "$lib/sozluk";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import ScoreGauge from "./ScoreGauge.svelte";
  import StatusBadge from "./StatusBadge.svelte";

  const m = $derived(dil.metin);
  const geriOk = $derived(dil.kod === "ar" || dil.kod === "fa" ? "→" : "←");

  let id = $state("");
  let ready = $state(false);
  let geri = $state("/gecmis");

  // URL parametresi ve dönülecek liste adresi yalnızca istemcide okunur (SSR güvenliği).
  onMount(() => {
    id = new URLSearchParams(window.location.search).get("id") ?? "";
    geri = gecmisAdresi();
    ready = true;
  });

  const report = $derived(id ? reports.find(id) : undefined);

  function listeyeDon() {
    location.href = geri;
  }
</script>

<div class="sayfa">
  <a class="satir-link geri" href={geri}>{geriOk} {m.menuGecmis}</a>
  <h1>{m.raporBaslik}</h1>

  {#if !ready}
    <Yukleniyor satir={3} />
  {:else if !report}
    <HataDurumu
      mesaj={id ? bicim(m.raporBulunamadi, { id }) : m.raporSecilmedi}
      tekrarDene={listeyeDon}
      dugmeMetni={m.gecmiseDon}
    />
  {:else}
    <div class="izgara iki rapor">
    <section class="kart kimlik">
      <code class="kod mono">{report.id}</code>
      <span class="tarih">{tarihSaat(report.createdAt, dil.kod)}</span>
    </section>

    <section class="kart skor">
      <ScoreGauge score={report.score} />
      <div>
        <h2>{m.baglantiSkoru}</h2>
        <p class="not">{m.skorNotu}</p>
        <p class="sayac">
          <span class="ok">{report.passed} {m.basarili}</span> · <span class="hayir">{report.failed} {m.basarisiz}</span>
        </p>
      </div>
    </section>

    <section class="kart">
      <h2 class="bolum">{m.testSonuclari}</h2>
      <ul class="liste">
        {#each report.tests as t (t.id)}
          <li>
            <div class="satir">
              <strong>{testAdi(m, t.id)}</strong>
              <StatusBadge status={t.status} />
            </div>
            <div class="satir alt">
              <!-- Eski raporların Türkçe mesajı RTL düzende de doğru yönde okunsun. -->
              <span dir="auto">{testMesaji(m, t)}</span>
              <span class="mono">{formatLatency(t.latencyMs)}</span>
            </div>
          </li>
        {/each}
      </ul>
    </section>

    <section class="kart">
      <h2 class="bolum">{m.agBilgileri}</h2>
      <dl class="anahtar-deger ag">
        <div><dt>{m.cihazAdi}</dt><dd>{report.network.hostname ?? m.kullanilamiyor}</dd></div>
        <div><dt>{m.baglantiTuru}</dt><dd>{baglantiTuruEtiketi(m, report.network.connectionType)}</dd></div>
        <div><dt>{m.yerelIpv4}</dt><dd class="mono">{report.network.localIPv4 ?? m.kullanilamiyor}</dd></div>
        <div><dt>IPv6</dt><dd class="mono">{report.network.localIPv6 ?? m.kullanilamiyor}</dd></div>
        <div><dt>{m.gateway}</dt><dd class="mono">{report.network.gateway ?? m.bulunamadi}</dd></div>
        <div>
          <dt>DNS</dt>
          <dd class="mono">{report.network.dnsServers.length ? report.network.dnsServers.join(", ") : m.bulunamadi}</dd>
        </div>
      </dl>
    </section>
    </div>
  {/if}
</div>

<style>
  /* Bölümler .izgara içinde: dar ekranda tek sütun, ≥ ~45rem içerik genişliğinde iki sütun. */
  .rapor {
    --kart-min: 22rem;
  }

  .geri {
    align-self: flex-start;
    margin-bottom: -0.375rem;
  }

  .kimlik {
    align-self: stretch;
    padding: 1.125rem var(--bosluk-4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    text-align: center;
    border-top: 4px solid var(--renk-ana);
  }

  .kod {
    font-size: 1.375rem;
    font-weight: 800;
    letter-spacing: 1px;
    overflow-wrap: anywhere;
  }

  .tarih {
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
  }

  .skor {
    align-self: stretch;
    padding: var(--bosluk-4);
    display: flex;
    align-items: center;
    gap: var(--bosluk-4);
  }

  .skor h2 {
    margin: 0;
    font-size: 1rem;
  }

  .not {
    margin: var(--bosluk-1) 0 var(--bosluk-2);
    font-size: var(--yazi-kucuk);
    color: var(--yazi-soluk);
  }

  .sayac {
    margin: 0;
    font-size: var(--yazi-govde);
    font-weight: 600;
  }

  .ok {
    color: var(--durum-basarili);
  }

  .hayir {
    color: var(--durum-hata);
  }

  .bolum {
    margin: 0;
    padding: 0.875rem var(--bosluk-4) 0.375rem;
    font-size: var(--yazi-orta);
  }

  .liste {
    list-style: none;
    margin: 0;
    padding: 0 var(--bosluk-4) var(--bosluk-2);
  }

  .liste li {
    padding: 0.625rem 0;
    border-top: 1px solid var(--kenar);
  }

  .liste li:first-child {
    border-top: 0;
  }

  .ag {
    padding: 0 var(--bosluk-4) var(--bosluk-2);
  }

  .satir {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--bosluk-3);
  }

  .alt {
    margin-top: var(--bosluk-1);
    font-size: var(--yazi-ince);
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }
</style>
