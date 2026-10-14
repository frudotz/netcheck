# Mimari Ağaç Yapısı ve Kapsam

> Görev tanımı: [`docs/tasks/week-3/07-hedefler-agac-yapisi.task.md`](tasks/week-3/07-hedefler-agac-yapisi.task.md). Klasör yapısı için bkz. [`docs/klasor-mimarisi.md`](klasor-mimarisi.md).

---

## 1. Sayfa ve Özellik Ağacı

```
NetCheck
├── / (Genel Bakış)
│   ├── Bağlantı durumu (HTTPS hızlı kontrol) ve 1.1.1.1 gecikmesi
│   ├── Son Bağlantı Skoru → son rapora bağlantı
│   ├── Ağ bilgileri: genel IP, IPv4, IPv6, gateway, DNS, hostname, bağlantı türü
│   └── Etkin ağ arayüzleri
│
├── /tanilama (Tanılama)
│   ├── 5 sabit test: Gateway · 1.1.1.1 · 8.8.8.8 · DNS · HTTPS
│   └── "Tanılamayı Başlat" → [Rust: run_diagnostic ×5, get_network_snapshot, generate_report_id]
│
├── /rapor?id=NCHK-… (Tanılama Raporu)
│   └── Rust tarafından üretilen kimlik, skor, test sonuçları, ağ anlık görüntüsü
│
├── /gecmis (Geçmiş)
│   └── localStorage raporları, rapora git, geçmişi temizle
│
├── /ayarlar (Ayarlar)
│   └── Tema (Sistem / Gündüz / Gece), yerel veri, bilgi sayfası bağlantıları, uygulama bilgisi
│
└── Bilgi Sayfaları (TR kökte; EN/AR/FA dil önekiyle — AR/FA `dir="rtl"`)
    ├── /hakkinda  · /en/hakkinda  · /ar/hakkinda  · /fa/hakkinda   (MDX + React bileşeni)
    ├── /iletisim  · /en/iletisim  · /ar/iletisim  · /fa/iletisim   (Astro + Svelte form)
    ├── /kosullar  · /en/kosullar  · /ar/kosullar  · /fa/kosullar   (MDX)
    └── /gizlilik  · /en/gizlilik  · /ar/gizlilik  · /fa/gizlilik   (MDX)
```

Toplam 21 rota: 5 uygulama ekranı + 16 bilgi sayfası (4 sayfa × 4 dil).

Alt menü: Genel Bakış · Tanılama · Geçmiş · Ayarlar (`/rapor` → Geçmiş; tüm bilgi sayfaları → Ayarlar sekmesi etkin).

## 2. Yönetim Arayüzü

`/admin/` ve alt rotalar Astro tarafından sunulur; arayüz mevcut React kodunu kullanır. Bu ayrı yönetim alanı örnek veriyle çalışır, gerçek cihaz/sunucu verisine bağlı değildir.

```
Yönetim arayüzü (/admin/)
├── /admin/ (Panel Özeti)
├── /admin/raporlar · /admin/raporlar/:id
├── /admin/cihazlar
├── /admin/mesajlar
├── /admin/skor-kurallari
├── /admin/hedefler
├── /admin/icerik
├── /admin/yoneticiler
├── /admin/denetim
└── /admin/ayarlar
```

## 3. Hedef Platform Matrisi

Tauri v2 ile tek kod tabanından aşağıdaki platformlar **hedeflenir**. Hedef platform, doğrulanmış platform anlamına gelmez; güncel durum ayrı sütunda verilir (güncelleme: 2026-10-08). "CI" = [`cross-platform.yml`](../.github/workflows/cross-platform.yml) derleme/test kontrolü; uygulama çalıştırma veya paketleme değildir.

| Platform Grubu | Hedef Sistemler | Paket Formatı | Güncel Durum |
|---|---|---|---|
| **Masaüstü** | Windows (10 / 11 x64) | `.msi`, `.exe` | **Doğrulandı** — geliştirme ve sürüm derlemesi (`bun run tauri build`) çalıştırıldı; ICMP `IcmpSendEcho` |
| **Masaüstü** | macOS (Apple Silicon / Intel) | `.dmg`, `.app` | Rust kodu CI'da **derleniyor ve testleri geçiyor** (sistem `ping` yolu dahil); uygulama paketi ve çalıştırma **doğrulanmadı** |
| **Masaüstü** | Linux (Ubuntu / Debian) | `.deb`, `.AppImage` | Rust kodu CI'da **derleniyor ve testleri geçiyor** (sistem `ping` yolu dahil); uygulama paketi ve çalıştırma **doğrulanmadı** |
| **Mobil** | iOS / iPadOS | `.ipa` (Xcode) | **Simülatörde derlendi ve açıldı; kısmen doğrulandı.** iOS projesi `src-tauri/gen/apple`. Simülatör (iPhone 17, iOS 26.5, `aarch64-sim` debug): uygulama açılıyor, Genel Bakış'ta gerçek yerel IP, gateway, DNS, genel IP ve Darwin ICMP soketiyle 1.1.1.1 gecikmesi görüldü. Ağ bilgisi yalnız iOS'ta desteklenen API'lerle okunur (Network.framework, BSD); SystemConfiguration iOS derlemesine bağlanmaz. Simülatör ağı ana Mac'inkidir; DNS sonucu cihaz kanıtı değildir. Tanılama/rapor/geçmiş/ayarlar ekranları, 4 dil + RTL ve **fiziksel iPhone doğrulanmadı**; imzalama ve `.ipa` **uygulanmadı**. |
| **Mobil** | Android (Telefon & Tablet) | `.apk`, `.aab` | **Uygulandı; emülatörde ve fiziksel cihazda doğrulandı.** Emülatör (Android 16 / API 36, x86_64 debug APK): ağ bilgisi, ICMP soketi ile ping, DNS, HTTPS, rapor, geçmiş, 4 dil + RTL. Fiziksel cihaz (Redmi Note 13 Pro, Android 16 / HyperOS 3.0, arm64): Wi-Fi ve mobil veri (Turkcell) üzerinde ağ bilgisi, ICMP soketi ile ping, DNS, HTTPS, genel IP, 5 tanılama, 4 dil + RTL, dar ekran (392 / 320 px) yerleşimi. Sürüm `aarch64` APK derlendi (imzasız; yalnız yerel test için debug anahtarıyla imzalanıp kuruldu). Mağaza / Play Store imzalaması ve AAB yayını **uygulanmadı**. Fiziksel test tek cihaz ve tek operatörle sınırlı. |

Tarayıcı (`bun run dev`) yalnızca arayüz önizlemesidir; ağ tanılama Tauri uygulaması gerektirir.

### Mobil yol haritası
1. ✅ Mobil temel (`feature/mobile-foundation`): platform sınırı `src-tauri/src/platform/`, `get_platform_info`, CI.
2. ✅ Android (`feature/android`): Tauri Android projesi (`src-tauri/gen/android`), ICMP datagram soketi, JNI ile cihaz adı, `ACCESS_NETWORK_STATE`; emülatörde doğrulandı.
3. ✅ Android fiziksel cihaz testi (Redmi Note 13 Pro; Wi-Fi + Turkcell mobil veri).
4. ⏳ Android imzalı sürüm (keystore, AAB/APK).
5. ◐ iOS (`feature/ios`, `feature/ios-validation`): Darwin ICMP soketi; `src-tauri/gen/apple`; simülatörde derleme ve açılış ✔. Kalan: simülatörde tüm ekranlar + 4 dil/RTL, fiziksel iPhone (Wi-Fi + hücresel, DNS), imzalama.

## 4. Ekran Boyutları (Responsive Breakpoints)

Tek kod tabanı, tek sayfa kümesi: telefon, tablet, masaüstü ve büyük ekran (TV / tarayıcı) için ayrı uygulama yoktur. Düzen **kullanılabilir genişlik ve yükseklikten** seçilir; en-boy oranı tespiti yapılmaz. En-boy oranları (9:16, 9:20, 3:4, 4:3, 16:9, 16:10, 21:9, 4K) yalnızca doğrulama hedefidir.

| Kesme noktası | Koşul | Düzen | Gezinme |
|---|---|---|---|
| **Telefon** | `< 48em` (768 px) | Tek sütun; sayfa boşluğu `1rem` | Sabit alt menü (`.alt-menu`) |
| **Tablet** | `≥ 48em` | Genel Bakış 2 sütun (durum + skor │ ağ bilgileri); Rapor ve Ayarlar kart ızgarası 2 sütun; sayfa boşluğu `1.5rem` | Alt menü |
| **Masaüstü** | `≥ 64em` (1024 px) | Tanılama 2 sütun (denetimler │ test listesi); içerik en fazla `--icerik-genislik` (75rem) | Dikey ray (satır başı tarafında; RTL'de sağda) |
| **Kısa yatay ekran** | `landscape`, genişlik `≥ 33em`, yükseklik `≤ 31.25em` (500 px) | Telefon yatay: dikey alan içeriğe kalır | Dikey ray (sıkı öğeler) |
| **Büyük ekran / TV** | `≥ 100em × 50em` · `≥ 160em × 87.5em` · `≥ 200em × 112.5em` (genişlik × yükseklik; her kademenin portre eşi de geçerli) | Kök yazı boyutu `112.5%` · `150%` · `200%`; tüm `rem` ölçüleri (yazı, boşluk, dokunma hedefi, içerik genişliği) orantılı büyür. 1920×1080 ≈ 18 px, 3840×2160 ≈ 32 px kök | Dikey ray |

- **Token'lar** (`src/styles/app.css`): `--yazi-*`, `--bosluk-*`, `--dokunma` (44 px), `--sayfa-bosluk`, `--icerik-genislik`, `--okuma-genislik` (bilgi sayfaları, 48rem), `--kart-min`, `--ust-yukseklik`, `--alt-menu-yukseklik`, `--ray-genislik`, `--odak`.
- **Paylaşılan sınıflar:** `.sayfa` (ortalanmış kapsayıcı, yatay güvenli alan), `.sayfa.okuma`, `.izgara` (`auto-fit` kart ızgarası; sütun sayısı genişlikten gelir) ve `.izgara.iki` (en fazla iki sütun), `.anahtar-deger` (etiket–değer listesi), `.btn` / `.btn.ikincil`, `.satir-link`, `.etiket`, `:focus-visible` odak halkası.
- **Kabuk:** `Layout.astro` gövde ızgarası (başlık / menü / içerik); `AppNav` aynı işaretlemeyle alt menü ya da ray olur. Kesme noktası `Layout.astro` ve `AppNav.svelte` içinde aynıdır.
- **RTL:** yöne bağlı kenarlar mantıksal özelliklerle yazılır (`border-inline-start`, `text-align: end`, `inset-inline`); `direction` bileşen bazında zorlanmaz.
- **Kapsayıcı sorgusu (`@container`) kullanılmaz:** iOS dağıtım hedefi 15.0; WKWebView iOS 16 öncesinde desteklemez.
- **Dil:** uygulama ekranları Türkçedir; bilgi sayfaları TR / EN / AR / FA (AR ve FA sağdan sola).
- **Odak / TV:** üzerine gelmeye (hover) bağlı etkileşim yoktur; klavye ve uzaktan kumanda için `:focus-visible` halkası vardır.

Varsayılan Tauri penceresi: 420 × 820 (telefon düzeni). Pencere genişletildiğinde masaüstü düzenine geçilir.
