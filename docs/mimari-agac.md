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

| Platform Grubu | Hedef Sistemler | Paket Formatı | NetCheck notu |
|---|---|---|---|
| **Masaüstü** | Windows (10 / 11 x64) | `.msi`, `.exe` | Birincil geliştirme/demo platformu; ICMP `IcmpSendEcho` ile |
| **Masaüstü** | macOS (Apple Silicon / Intel) | `.dmg`, `.app` | Ping sistem `ping` ikilisiyle |
| **Masaüstü** | Linux (Ubuntu / Debian) | `.deb`, `.AppImage` | Ping sistem `ping` ikilisiyle |
| **Mobil** | iOS (iPhone & iPad) | `.ipa` (Xcode) | Ping kullanılamazsa test "Kullanılamıyor" |
| **Mobil** | Android (Telefon & Tablet) | `.apk`, `.aab` | Ping kullanılamazsa test "Kullanılamıyor" |

## 3. Ekran Boyutları (Responsive Breakpoints)

| Aralık | Düzen | Gezinme |
|---|---|---|
| **Telefon (< 768 px)** | Tek sütun, `padding: 16px` | Sabit alt menü (`alt-menu`) |
| **Tablet (768–1199 px)** | `.sayfa` ortalanır (`max-width: 1040px`); Genel Bakış 2 sütun | Alt menü, sekmeler en fazla 200 px |
| **Masaüstü (≥ 1200 px)** | Genel Bakış 3 sütun; arayüz listesi tam genişlik | Alt menü ortalanmış |

Varsayılan Tauri penceresi: 420 × 820 (telefon düzeni).
