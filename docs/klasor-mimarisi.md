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
│   ├── Cargo.toml           # Rust kütüphaneleri ve bağımlılıkları
│   └── src/                 # lib.rs (komut kaydı), platformdan bağımsız modüller + platform/ (OS'e özgü kod)
│
├── src/                     # Ön yüz kaynak kodları (Frontend)
│   ├── layouts/             # Sayfa iskeletleri (Layout.astro, ortak header/nav, ClientRouter)
│   ├── pages/               # Dosya tabanlı rota sistemi (URL rotaları: .astro, .mdx)
│   ├── components/          # Yeniden kullanılabilir UI bileşenleri (.svelte, .tsx)
│   ├── lib/                 # İş mantığı, Rust IPC sarmalayıcıları, Svelte 5 store'ları ($state)
│   ├── types/               # TypeScript tip tanımları ve arayüzler (.ts)
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
- **Ne konur?** Rust backend kodları (`src/lib.rs` komut kaydı; platformdan bağımsız `network.rs`, `diagnostics.rs`, `report_id.rs`; işletim sistemine göre değişen her şey `src/platform/` altında — ör. `platform/icmp.rs`: Windows `IcmpSendEcho`, macOS/Linux sistem `ping`, Android/iOS henüz yok), Cargo paketleri (`Cargo.toml`), izinler (`capabilities/`) ve pencere ayarları (`tauri.conf.json`).
- **Ne zaman kullanılır?** İşletim sistemiyle konuşan native kodlar (ağ arayüzleri, ping, DNS, HTTPS testi, rapor kimliği) yazılırken. Test hedefleri burada sabittir; ön yüzden komuta serbest girdi aktarılmaz.

### 4. `src/layouts/` (Sayfa İskeletleri)
- **Ne konur?** Sayfaların ortak şablonları (`Layout.astro`).
- **Ne zaman kullanılır?** Üst bar, alt gezinme menüsü, tema kontrolü (`document.documentElement.dataset.tema`) ve yumuşak sayfa geçişleri (`<ClientRouter />`) burada tanımlanır. Sayfalar bu layout'u sarmalar.

### 5. `src/pages/` (Dosya Tabanlı Rotalar)
- **Ne konur?** Kullanıcının gezeceği sayfalar: uygulama ekranları (`index.astro`, `tanilama.astro`, `rapor.astro`, `gecmis.astro`, `ayarlar.astro`) ve bilgi sayfaları (`hakkinda.mdx`, `iletisim.astro`, `kosullar.mdx`, `gizlilik.mdx`; diğer diller `en/`, `ar/`, `fa/` alt klasörlerinde). Sayfa listesi: [`docs/mimari-agac.md`](mimari-agac.md).
- **Kural:** Dosya adı doğrudan URL yolu olur. İçerik ağırlıklı sayfalar için `.mdx`, dinamik veya bileşen içeren sayfalar için `.astro` kullanılır.

### 6. `src/components/` (Yeniden Kullanılabilir UI Bileşenleri)
- **Ne konur?** Butonlar, kartlar, formlar, üst/alt barlar (`.svelte` veya `.tsx`).
- **Kural:** Birden fazla sayfada tekrar eden veya bağımsız bir işlevi olan görsel parçalar burada toplanır. Svelte veya React ile yazılabilir.

### 7. `src/lib/` (Durum ve İş Mantığı)
- **Ne konur?** Svelte 5 `$state` store'ları (`diagnostics`, `reports`, `tema`), Rust `invoke` sarmalayıcıları (`native.ts`), skor hesabı (`score.ts`) ve Türkçe metinler (`labels.ts`).
- **Nasıl import edilir?** `$lib/native` veya `$lib/reports.svelte` şeklinde alias ile çağrılır.

### 8. `src/types/` (Tip Tanımları)
- **Ne konur?** TypeScript veri modelleri (`netcheck.ts`: `NetworkSnapshot`, `DiagnosticTest`, `DiagnosticReport`). Rust serde yapılarıyla birebir eşleşir.

### 9. `src/styles/` (Tasarım ve Stiller)
- **Ne konur?** `app.css` ve tema tanımları.
- **Kural:** Renkler CSS değişkeni (`--renk-ana`, `--zemin`, `--kart`, `--durum-*`) olarak burada tanımlanır; değerlerin tek kaynağı [`docs/branding.md`](branding.md). Ad-hoc renk yazılmaz.

### 10. `docs/` (Dokümantasyon)
- **Ne konur?** Mimari kararlar, marka renkleri, görev kılavuzları ve proje planları.
