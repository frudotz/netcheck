# Klasör Mimarisi ve Dizin Rehberi

Bu belge, projenin temel dizin yapısını, önemli klasörlerin sorumluluklarını ve bunların ne zaman / nasıl kullanılacağını açıklar.

> 📌 **Dokümantasyon Kuralı:**
> Dizin yapısı yalnızca bu belgede tutulur; `README.md` veya `AGENTS.md` içine kopyalanmaz, buraya link verilir.
> Proje geliştikçe her münferit dosyayı buraya eklemeyin; ana klasörleri ve sorumluluk sınırlarını koruyun.

---

## 📂 Temel Dizin Mimarisi

```
netcheck/
├── package.json             # Bağımlılıklar, scriptler ve motor tanımları
├── astro.config.mjs         # Astro entegrasyonları (Svelte, React, MDX) ve Vite port ayarları
├── tsconfig.json            # TypeScript yapılandırması ve $lib alias'ı
├── .gitignore               # Versiyon kontrol dışı bırakılan dosyalar
├── .github/workflows/       # CI: Linux/macOS/Windows + Android/iOS Rust derleme kontrolü
│
├── public/                  # Statik varlıklar (Derlenmeyen logolar, favicon, görseller)
├── src-tauri/               # Rust Tauri çekirdeği (Pencere, yetkiler, native komutlar)
│   ├── tauri.conf.json      # Masaüstü/mobil pencere ayarları ve frontendDist hedefi
│   ├── gen/android/         # Tauri Android projesi (Gradle, AndroidManifest, MainActivity)
│   ├── gen/apple/           # Tauri iOS projesi (Xcode projesi, Info.plist; imzalama ayarları depoya girmez)
│   ├── Cargo.toml           # Rust kütüphaneleri ve bağımlılıkları
│   └── src/                 # lib.rs (komut kaydı), platformdan bağımsız modüller + platform/ (OS'e özgü kod)
│
├── admin/                   # Yönetim paneli (React; yalnız arayüz, veri kaynağı yok) — docs/yonetim-paneli.md
│   ├── features/ components/ # Ekranlar ve panel bileşenleri
│   ├── i18n/                # Panel sözlükleri (tr kaynak; en, ar, fa)
│   ├── api/                 # Veri arayüzü; şimdilik "bağlı değil" uygulaması
│   └── styles/admin.css     # Tailwind, renkler yalnız app.css token'larından
│
├── src/                     # Ön yüz kaynak kodları (Frontend)
│   ├── layouts/             # Sayfa iskeletleri (Layout.astro, ortak header/nav, ClientRouter; AdminLayout.astro)
│   ├── pages/               # Dosya tabanlı rota sistemi (URL rotaları: .astro, .mdx)
│   ├── components/          # Ekran bileşenleri (.svelte, .tsx)
│   ├── lib/                 # İş mantığı, Rust IPC sarmalayıcıları, Svelte 5 store'ları ($state)
│   │   ├── components/ui/   # Veri tipi tanımayan genel bileşenler (Kart, Yukleniyor, BosDurum, HataDurumu)
│   │   ├── types/           # Veri sözleşmesi: TypeScript tipleri (.ts)
│   │   └── veri/            # Görev 11 örnek verisi (ekranlar kullanmaz)
│   └── styles/              # Global tema değişkenleri ve CSS stilleri (app.css)
│
└── docs/                    # Proje dokümantasyonu, görevler ve mimari rehberler
```

---

## 🛠️ Klasörlerin Kullanımı ve Sorumlulukları

### 1. `package.json` & `astro.config.mjs` (Kök Konfigürasyon)
- **`package.json`:** Projenin bağımlılıklarını (`dependencies`) ve `bun run dev`, `bun run build` gibi komutlarını barındırır.
- **`astro.config.mjs`:** Svelte, React, MDX gibi entegrasyonların ve Vite ayarlarının (Tauri portu `1420`, `$lib` aliası) yapıldığı merkezdir.

### 2. `public/` (Statik Varlıklar)
- **Ne konur?** Doğrudan derleme sürecine girmeden tarayıcıya sunulacak dosyalar (logolar, `favicon.png`, `robots.txt`, resimler).
- **Nasıl kullanılır?** Kod içinde `/logo.svg` veya `/favicon.png` şeklinde kök dizinden çağrılır.

### 3. `src-tauri/` (Native Çekirdek)
- **Ne konur?** Rust backend kodları (`src/lib.rs` komut kaydı; platformdan bağımsız `network.rs`, `diagnostics.rs`, `report_id.rs`; işletim sistemine göre değişen her şey `src/platform/` altında — ör. `platform/icmp.rs`: Windows `IcmpSendEcho`, macOS/Linux sistem `ping`, Android ayrıcalıksız ICMP soketi, iOS Darwin ICMP datagram soketi), Cargo paketleri (`Cargo.toml`), izinler (`capabilities/`) ve pencere ayarları (`tauri.conf.json`).
- **Ne zaman kullanılır?** İşletim sistemiyle konuşan native kodlar (ağ arayüzleri, ping, DNS, HTTPS testi, rapor kimliği) yazılırken. Test hedefleri burada sabittir; ön yüzden komuta serbest girdi aktarılmaz.

### 4. `src/layouts/` (Sayfa İskeletleri)
- **Ne konur?** Sayfaların ortak şablonları (`Layout.astro`).
- **Ne zaman kullanılır?** Üst bar, alt gezinme menüsü, tema kontrolü (`document.documentElement.dataset.tema`) ve yumuşak sayfa geçişleri (`<ClientRouter />`) burada tanımlanır. Sayfalar bu layout'u sarmalar.

### 5. `src/pages/` (Dosya Tabanlı Rotalar)
- **Ne konur?** Kullanıcının gezeceği sayfalar: uygulama ekranları (`index.astro`, `tanilama.astro`, `rapor.astro`, `gecmis.astro`, `ayarlar.astro`) ve bilgi sayfaları (`hakkinda.mdx`, `iletisim.astro`, `kosullar.mdx`, `gizlilik.mdx`; diğer diller `en/`, `ar/`, `fa/` alt klasörlerinde). Sayfa listesi: [`docs/mimari-agac.md`](mimari-agac.md).
- **Kural:** Dosya adı doğrudan URL yolu olur. İçerik ağırlıklı sayfalar için `.mdx`, dinamik veya bileşen içeren sayfalar için `.astro` kullanılır.

### 6. `src/components/` ve `src/lib/components/ui/` (UI Bileşenleri)
- **`src/components/`:** Ekranlar ve ekrana bağlı parçalar: Genel Bakış, Tanılama, Geçmiş, üst/alt bar, formlar (`.svelte` veya `.tsx`).
- **`src/lib/components/ui/`:** Hiçbir veri tipini tanımayan genel bileşenler: Görev 12 `Kart.svelte`; Görev 13 `Yukleniyor.svelte`, `BosDurum.svelte`, `HataDurumu.svelte`. Girdi tipleri `src/lib/types/ui.ts` içindedir; renk, boşluk ve köşe değerleri yalnız `src/styles/app.css` değişkenlerinden gelir.
- **Kural:** Birden fazla sayfada tekrar eden veya bağımsız bir işlevi olan görsel parçalar burada toplanır. Svelte veya React ile yazılabilir.

### 7. `src/lib/` (Durum ve İş Mantığı)
- **Ne konur?** Svelte 5 `$state` store'ları (`diagnostics`, `reports`, `tema`, `dil`), Rust `invoke` sarmalayıcıları (`native.ts`), skor hesabı (`score.ts`), dört dilli metin sözlüğü (`sozluk.ts`) ve henüz sözlüğe taşınmamış Türkçe metinler (`labels.ts`).
- **Nasıl import edilir?** `$lib/native` veya `$lib/reports.svelte` şeklinde alias ile çağrılır.

### 8. `src/lib/types/` ve `src/lib/veri/` (Veri Sözleşmesi)
- **`src/lib/types/`:** TypeScript veri tipleri, her ana tip ayrı dosyada (`network.ts`, `diagnostic.ts`, `report.ts`, `platform.ts`, `preferences.ts`); `index.ts` hepsini dışa aktarır ve `$lib/types` ile içe aktarılır. Rust serde yapılarıyla birebir eşleşir. Alan tabloları: [`docs/veri-modeli.md`](veri-modeli.md).
- **`src/lib/veri/`:** Görev 11 örnek verisi (`ornek.ts`). Yalnız tip örneğidir; hiçbir ekran içe aktarmaz.

### 9. `src/styles/` (Tasarım ve Stiller)
- **Ne konur?** `app.css` ve tema tanımları.
- **Kural:** Renkler CSS değişkeni (`--renk-ana`, `--zemin`, `--kart`, `--durum-*`) olarak burada tanımlanır; değerlerin tek kaynağı [`docs/branding.md`](branding.md). Ad-hoc renk yazılmaz.

### 10. `docs/` (Dokümantasyon)
- **Ne konur?** Mimari kararlar, marka renkleri, görev kılavuzları ve proje planları. Görev dosyalarının istediği kanıt görselleri `docs/kanit/` alt klasöründe durur.

### 11. `admin/` (Yönetim Paneli)
- **Ne konur?** AI Studio ile ayrı depoda üretilip ana projeye taşınan React yönetim paneli: ekranlar (`features/`), panel bileşenleri (`components/`), sözlükler (`i18n/`), veri arayüzü (`api/`), panele özgü tipler (`domain/`) ve stil (`styles/admin.css`). Sayfaları `src/pages/admin/` altındadır, kabuğu `src/layouts/AdminLayout.astro`.
- **Kural:** Renkler yalnız `src/styles/app.css` token'larından, metinler yalnız `admin/i18n/` sözlüklerinden gelir; çekirdek tipler `src/lib/types/`'tan alınır. Panel verisini yalnız Tauri IPC (`src/lib/native.ts`) üzerinden bu cihazdaki SQLite arka ucundan okur; tarayıcı önizlemesinde bağlı değildir. Ayrıntı: [`docs/yonetim-paneli.md`](yonetim-paneli.md).

---

## 🗄️ Geçici Yerel Arka Uç (`src-tauri/src/backend/`)

SQLite tabanlı geçici arka uç (migration, rol/izin, kaynak denetleyicileri, iş işlevleri) `src-tauri/src/backend/` altındadır; ayrıntı, tablolar ve komut listesi tek kaynakta: [`docs/backend.md`](backend.md).
