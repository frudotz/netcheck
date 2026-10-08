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

## 2. Hedef Platform Matrisi

Tauri v2 ile tek kod tabanından aşağıdaki platformlar **hedeflenir**. Hedef platform, doğrulanmış platform anlamına gelmez; güncel durum ayrı sütunda verilir (güncelleme: 2026-10-08). "CI" = [`cross-platform.yml`](../.github/workflows/cross-platform.yml) derleme/test kontrolü; uygulama çalıştırma veya paketleme değildir.

| Platform Grubu | Hedef Sistemler | Paket Formatı | Güncel Durum |
|---|---|---|---|
| **Masaüstü** | Windows (10 / 11 x64) | `.msi`, `.exe` | **Doğrulandı** — geliştirme ve sürüm derlemesi (`bun run tauri build`) çalıştırıldı; ICMP `IcmpSendEcho` |
| **Masaüstü** | macOS (Apple Silicon / Intel) | `.dmg`, `.app` | Rust kodu CI'da **derleniyor ve testleri geçiyor** (sistem `ping` yolu dahil); uygulama paketi ve çalıştırma **doğrulanmadı** |
| **Masaüstü** | Linux (Ubuntu / Debian) | `.deb`, `.AppImage` | Rust kodu CI'da **derleniyor ve testleri geçiyor** (sistem `ping` yolu dahil); uygulama paketi ve çalıştırma **doğrulanmadı** |
| **Mobil** | iOS / iPadOS | `.ipa` (Xcode) | **Planlanan hedef** — Rust kütüphanesi CI'da `aarch64-apple-ios` için derleniyor; mobil proje (`gen/apple`) yok, ping "kullanılamıyor" |
| **Mobil** | Android (Telefon & Tablet) | `.apk`, `.aab` | **Planlanan hedef** — Rust kütüphanesi CI'da `aarch64-linux-android` için derleniyor; mobil proje (`gen/android`) yok, ping "kullanılamıyor" |

Tarayıcı (`bun run dev`) yalnızca arayüz önizlemesidir; ağ tanılama Tauri uygulaması gerektirir.

### Mobil yol haritası (planlanan)
Temel aşama (`feature/mobile-foundation`) tamamlandı: platform sınırı `src-tauri/src/platform/`, `get_platform_info`, hücresel bağlantı türü, `TAURI_DEV_HOST`, 44 px dokunma hedefleri, CI derleme kontrolü. Sonraki aşamalar kendi dallarında (ör. `feature/android`, `feature/ios`):
1. Tauri Android/iOS projelerinin üretilmesi ve yapılandırılması.
2. Platform izinleri ve capability'ler (Android'de ağ izinleri doğrulanarak eklenecek).
3. Android ağ bilgisi (IP, IPv6, gateway, DNS, hostname, arayüzler) — kullanılabilir API'ler doğrulanarak.
4. iOS ağ bilgisi — Apple kısıtları ve API'leri doğrulanarak.
5. Mobil tanılama — süreç tabanlı ping mobilde uygun değilse platforma özgü alternatif.
6. Android APK/AAB derleme doğrulaması.
7. iOS derleme/arşiv doğrulaması (macOS ortamında).
8. Gerçek cihaz testleri.

## 3. Ekran Boyutları (Responsive Breakpoints)

| Aralık | Düzen | Gezinme |
|---|---|---|
| **Telefon (< 768 px)** | Tek sütun, `padding: 16px` | Sabit alt menü (`alt-menu`) |
| **Tablet (768–1199 px)** | `.sayfa` ortalanır (`max-width: 1040px`); Genel Bakış 2 sütun | Alt menü, sekmeler en fazla 200 px |
| **Masaüstü (1200–1599 px)** | Genel Bakış 3 sütun; arayüz listesi tam genişlik | Alt menü ortalanmış |
| **Büyük ekran (≥ 1600 px)** | Düzen masaüstüyle aynı; içerik `max-width: 1040px` ile ortalanır, kenar boşlukları genişler (satır uzunluğu sınırlı kalır) | Alt menü ortalanmış, sekmeler en fazla 200 px |

Varsayılan Tauri penceresi: 420 × 820 (telefon düzeni).
