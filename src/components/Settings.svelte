<script lang="ts">
  // Ayarlar — tema seçimi, uygulama bilgisi ve yerel veri
  import { onMount } from "svelte";
  import { tema, type TemaTercihi } from "$lib/tema.svelte";
  import { reports } from "$lib/reports.svelte";
  import { getPlatformInfo, hasNative } from "$lib/native";
  import { icmpBackendLabel, platformLabel } from "$lib/labels";
  import pkg from "../../package.json";
  import ExternalLink from "./ExternalLink.svelte";

  const secenekler: { deger: TemaTercihi; ad: string }[] = [
    { deger: "sistem", ad: "Sistem" },
    { deger: "gunduz", ad: "Gündüz" },
    { deger: "gece", ad: "Gece" },
  ];

  // localStorage ve Tauri tespiti yalnızca istemcide anlamlıdır.
  let mounted = $state(false);
  let ortam = $state("—");
  let ping = $state("—");

  onMount(() => {
    mounted = true;
    if (!hasNative()) {
      ortam = "Tarayıcı önizlemesi";
      return;
    }
    // Çalışma ortamı Rust'tan okunur (masaüstü/mobil, işletim sistemi, ping yöntemi).
    getPlatformInfo()
      .then((info) => {
        ortam = platformLabel(info);
        ping = icmpBackendLabel[info.icmp];
      })
      .catch(() => {
        ortam = "Bilinmiyor";
      });
  });
</script>

<div class="sayfa">
  <h1>Ayarlar</h1>

  <section class="kart bolum">
    <h2 id="tema-baslik">Tema</h2>
    <div class="secim" role="radiogroup" aria-labelledby="tema-baslik">
      {#each secenekler as s (s.deger)}
        <button
          role="radio"
          aria-checked={mounted && tema.tercih === s.deger}
          class:secili={mounted && tema.tercih === s.deger}
          onclick={() => tema.sec(s.deger)}
        >
          {s.ad}
        </button>
      {/each}
    </div>
    <p class="not">"Sistem" seçildiğinde işletim sisteminin açık/koyu teması izlenir.</p>
  </section>

  <section class="kart bolum">
    <h2>Yerel Veri</h2>
    <dl>
      <div><dt>Kayıtlı rapor</dt><dd>{mounted ? reports.list.length : "—"}</dd></div>
      <div><dt>Depolama</dt><dd>Bu cihaz (localStorage)</dd></div>
    </dl>
    <a class="satir-link" href="/gecmis">Geçmişi görüntüle / temizle →</a>
  </section>

  <section class="kart bolum">
    <h2>Bilgi Sayfaları</h2>
    <ul class="bilgi-listesi">
      <li><a class="satir-link" href="/hakkinda">Hakkında →</a></li>
      <li><a class="satir-link" href="/iletisim">İletişim →</a></li>
      <li><a class="satir-link" href="/kosullar">Kullanım Koşulları →</a></li>
      <li><a class="satir-link" href="/gizlilik">Gizlilik Politikası →</a></li>
    </ul>
    <p class="not">Bilgi sayfaları Türkçe, English, العربية ve فارسی dillerinde sunulur.</p>
  </section>

  <section class="kart bolum">
    <h2>Uygulama Bilgisi</h2>
    <dl>
      <div><dt>Uygulama</dt><dd>NetCheck</dd></div>
      <div><dt>Açıklama</dt><dd>Yerel Ağ Tanılama ve Bağlantı Analiz Uygulaması</dd></div>
      <div><dt>Sürüm</dt><dd class="mono">{pkg.version}</dd></div>
      <div><dt>Çalışma ortamı</dt><dd>{ortam}</dd></div>
      <div><dt>Ping yöntemi</dt><dd>{ping}</dd></div>
      <div><dt>Ders</dt><dd>İstinye Üniversitesi · MYO063 Mobil Programlama</dd></div>
    </dl>
    <div class="baglantilar">
      <ExternalLink href="https://github.com/frudotz/netcheck">Kaynak kod (GitHub) ↗</ExternalLink>
    </div>
  </section>
</div>

<style>
  h1 {
    margin: 0;
    font-size: 22px;
  }

  .bolum {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  h2 {
    margin: 0;
    font-size: 15px;
  }

  .secim {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    background: var(--zemin);
    border: 1px solid var(--kenar);
  }

  .secim button {
    padding: 10px 0;
    border: 0;
    border-radius: 9px;
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    color: var(--yazi-soluk);
  }

  .secim button.secili {
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
  }

  .not {
    margin: 0;
    font-size: 12px;
    color: var(--yazi-soluk);
  }

  dl {
    margin: 0;
  }

  dl div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 0;
    border-top: 1px solid var(--kenar);
  }

  dl div:first-child {
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
  }

  .bilgi-listesi {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 16px;
  }

  .baglantilar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    font-size: 14px;
  }

  .satir-link {
    font-size: 14px;
    font-weight: 600;
    color: var(--renk-ana);
  }
</style>
