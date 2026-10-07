# Proje Fikri: NetCheck

> Görev tanımı: [`docs/tasks/week-3/02-proje-fikriniz.task.md`](tasks/week-3/02-proje-fikriniz.task.md)

- **Proje Adı:** NetCheck — Yerel Ağ Tanılama ve Bağlantı Analiz Uygulaması
- **Slogan:** Ağınızda ne olduğunu saniyeler içinde görün.
- **Öğrenci Adı Soyadı:** Hamza Arda Karabacak
- **Öğrenci Numarası:** 2520191010
- **İlham Alınan Konsept:** Özgün fikir — işletim sistemlerinin "ağ sorun gidericisi" araçlarının sade, raporlanabilir bir sürümü. Bilişim Güvenliği Teknolojisi programının ağ temelleriyle doğrudan ilişkili olduğu için seçildi.

---

## 1. Proje Özeti

NetCheck, bağlı olunan yerel ağın temel bilgilerini (IP adresleri, gateway, DNS, bağlantı türü) gösteren ve birkaç basit bağlantı testi çalıştıran **yerel öncelikli (local-first)** bir masaüstü uygulamasıdır (Android ve iOS planlanan hedef platformlardır). Test sonuçları, Rust tarafında üretilen benzersiz bir kimlikle **tanılama raporuna** dönüştürülür ve yalnızca cihazda saklanır. Sunucu, hesap, veritabanı veya bulut eşitlemesi yoktur.

## 2. Temel 3 Ekran ve İşlev

1. **Ana Liste Ekranı — Genel Bakış (`/`):** Bağlantı durumu (Bağlı / İnternet Yok / Bağlantı Yok), yerel IPv4/IPv6, genel IP, gateway, DNS sunucuları, hostname, bağlantı türü, 1.1.1.1 gecikmesi, son Bağlantı Skoru ve tüm etkin ağ arayüzlerinin listesi. Değer alınamazsa "Kullanılamıyor" / "Bulunamadı" gösterilir; sahte veri yoktur.
2. **Detay ve Seçim Ekranı — Tanılama (`/tanilama`):** Beş sabit test listelenir ve **Tanılamayı Başlat** ile çalıştırılır: Gateway, Cloudflare (`1.1.1.1`), Google DNS (`8.8.8.8`), DNS çözümleme (`cloudflare.com`) ve HTTPS internet testi. Her test için durum (Bekliyor / Çalışıyor / Başarılı / Başarısız / Kullanılamıyor), hedef, gecikme ve açıklama gösterilir.
3. **Kayıt / Kod Üretme Ekranı — Tanılama Raporu (`/rapor?id=…`):** Tanılama bittiğinde Rust komutu `generate_report_id` rapor kimliğini üretir. Rapor; kimlik, tarih, Bağlantı Skoru (0–100), başarılı/başarısız sayıları, test sonuçları ve ağ anlık görüntüsünü içerir. Raporlar **Geçmiş** (`/gecmis`) ekranında listelenir ve tekrar açılabilir.

Ek: **Ayarlar** (`/ayarlar`) — tema (Sistem / Gündüz / Gece), uygulama bilgisi, yerel veri özeti.

Akış: Genel Bakış → Tanılama → Tanılama Raporu → Geçmiş.

## 3. Hedef Kitle

- **Öğrenciler:** IP, gateway, DNS ve gecikme kavramlarını kendi ağlarında somut olarak görmek isteyenler.
- **Ev kullanıcıları:** "İnternet yok" sorununun modemde mi, DNS'te mi yoksa dış bağlantıda mı olduğunu hızlıca ayırt etmek isteyenler.
- **Teknik destekle görüşecek kullanıcılar:** Destek ekibine paylaşılabilir, kimlik numaralı bir tanılama raporu hazırlamak isteyenler.

## 4. Veri Modeli

Tanımlar: [`src/types/netcheck.ts`](../src/types/netcheck.ts) (TypeScript) ↔ `src-tauri/src/*.rs` (Rust, serde `camelCase`).

| Model | Alanlar | Kaynak |
|---|---|---|
| `NetworkSnapshot` | `hostname?`, `localIPv4?`, `localIPv6?`, `gateway?`, `dnsServers[]`, `connectionType` (`ethernet`/`wifi`/`unknown`), `interfaceName?`, `interfaces[]` | Rust `get_network_snapshot` |
| `NetworkInterface` | `name`, `ipv4?`, `ipv6?`, `mac?`, `type`, `isUp`, `isDefault` | Rust |
| `DiagnosticTest` | `id`, `name`, `target?`, `status`, `latencyMs?`, `message?` | Rust `run_diagnostic` sonucu + Türkçe mesaj |
| `DiagnosticReport` | `id`, `createdAt`, `score`, `passed`, `failed`, `network`, `tests[]` | Ön yüz birleştirir; `id` Rust'tan |

Raporlar `localStorage` içinde `netcheck.reports` anahtarıyla saklanır (en fazla 50).

**Bağlantı Skoru** ([`src/lib/score.ts`](../src/lib/score.ts)): İnternet 35 + DNS 20 + Gateway 15 + 1.1.1.1 10 + 8.8.8.8 10 + gecikme bonusu en fazla 10 (<50 ms: 10, <100 ms: 7, <200 ms: 4, diğer: 1). Temel tanılama sonuçlarına göre hesaplanan basit bir değerlendirmedir; profesyonel bir ağ kalitesi ölçümü değildir.

## 5. Rust Tarafında Üretilen Kod

```
NCHK-YYYY-XXXXXXXX
│    │    └─ 8 haneli büyük harf onaltılık sonek (ör. 16F25A10)
│    └────── raporun oluşturulduğu UTC yıl
└─────────── NetCheck öneki
```

Örnek: `NCHK-2026-16F25A10`. Üreten komut: `generate_report_id` ([`src-tauri/src/report_id.rs`](../src-tauri/src/report_id.rs)). Sonek; işlem başına rastgele anahtarlanan bir özet fonksiyonuyla (zaman damgası + sayaç + işlem kimliği) üretilir. Kimlik yalnızca Rust'ta üretilir; tarayıcı önizlemesinde (Tauri dışı) rapor oluşturulmaz.
