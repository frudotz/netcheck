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
│   └── Tema (Sistem / Gündüz / Gece), yerel veri, uygulama bilgisi
│
└── Bilgi Sayfası
    └── /hakkinda (MDX + React bileşeni)
```

Alt menü: Genel Bakış · Tanılama · Geçmiş · Ayarlar (`/rapor` → Geçmiş, `/hakkinda` → Ayarlar sekmesi etkin).

## 2. Hedef Platform Matrisi

Tauri v2 ile tek kod tabanından aşağıdaki platformlar **hedeflenir**. Hedef platform, doğrulanmış platform anlamına gelmez; güncel durum ayrı sütunda verilir (denetim: 2026-10-07).

| Platform Grubu | Hedef Sistemler | Paket Formatı | Güncel Durum |
|---|---|---|---|
| **Masaüstü** | Windows (10 / 11 x64) | `.msi`, `.exe` | **Doğrulandı** — geliştirme ve sürüm derlemesi (`bun run tauri build`) çalıştırıldı; ICMP `IcmpSendEcho` |
| **Masaüstü** | macOS (Apple Silicon / Intel) | `.dmg`, `.app` | Kod ve paket yapılandırması mevcut; **derleme ve çalışma doğrulanmadı** |
| **Masaüstü** | Linux (Ubuntu / Debian) | `.deb`, `.AppImage` | Kod ve paket yapılandırması mevcut; **derleme ve çalışma doğrulanmadı** |
| **Mobil** | iOS / iPadOS | `.ipa` (Xcode) | **Planlanan hedef** — mobil proje henüz yapılandırılmadı |
| **Mobil** | Android (Telefon & Tablet) | `.apk`, `.aab` | **Planlanan hedef** — mobil proje henüz yapılandırılmadı |

Tarayıcı (`bun run dev`) yalnızca arayüz önizlemesidir; ağ tanılama Tauri uygulaması gerektirir.

### Mobil yol haritası (planlanan)
Her aşama kendi dalında yapılır (ör. `feature/android-foundation`, `feature/ios-foundation`):
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
