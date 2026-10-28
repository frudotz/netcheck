# Veri Modeli

NetCheck'in veri sözleşmesi. Tipler [`src/lib/types/`](../src/lib/types/index.ts) altında, her ana tip ayrı dosyadadır ve hepsi `$lib/types` üzerinden içe aktarılır. Rust'tan gelen tipler serde yapılarıyla (`camelCase`) birebir aynıdır; bir alan değişirse iki taraf birlikte değişir.

**Kural:** yeni bir veri alanı önce `src/lib/types/` içinde tanımlanır, sonra bu tabloya eklenir ([`AGENTS.md` § 4](../AGENTS.md#4-kod-yazım-kuralları)).

İşaretler: **Z** zorunlu, **İ** isteğe bağlı. İsteğe bağlı bir değer alınamazsa alan hiç gelmez ve ekranda "Bulunamadı" ya da "Kullanılamıyor" görünür; uydurma değer gösterilmez.

## İlişkiler

```
DiagnosticReport ──┬── network: NetworkSnapshot ── interfaces: NetworkInterface[]
                   └── tests: DiagnosticTest[5]   ◄── DiagnosticOutcome (Rust) + Türkçe mesaj
PlatformInfo (Rust)    raporla ilişkisi yok; Ayarlar ekranında gösterilir
```

- Bir rapor, tanılama anındaki **tek** ağ durumunu ve **beş** testi taşır. Rapor kimliği Rust'ta üretilir.
- `DiagnosticTest`, Rust'un `DiagnosticOutcome` yanıtından ön yüzde kurulur: `code` Türkçe `message` olur ([`src/lib/labels.ts`](../src/lib/labels.ts)).
- Raporlar cihazda `localStorage` içinde `netcheck.reports` anahtarıyla saklanır (en yeni başta, en çok 50). Sunucu ya da eşitleme yoktur.

## Bağlantı: `NetworkSnapshot`

[`network.ts`](../src/lib/types/network.ts) · Rust `get_network_snapshot`

| Alan | Tip | | Açıklama |
|---|---|---|---|
| `dnsServers` | `string[]` | Z | Sistemin DNS sunucuları; okunamazsa boş liste |
| `connectionType` | `ConnectionType` | Z | Varsayılan arayüzün bağlantı türü |
| `interfaces` | `NetworkInterface[]` | Z | Bütün arayüzler |
| `hostname` | `string` | İ | Cihaz adı |
| `localIPv4` | `string` | İ | Varsayılan arayüzün IPv4 adresi |
| `localIPv6` | `string` | İ | Varsayılan arayüzün IPv6 adresi |
| `gateway` | `string` | İ | Varsayılan ağ geçidi; mobil veride çoğunlukla yok |
| `interfaceName` | `string` | İ | Varsayılan arayüzün görünen adı |

`NetworkInterface`:

| Alan | Tip | | Açıklama |
|---|---|---|---|
| `name` | `string` | Z | İşletim sisteminin verdiği ad; iki arayüz aynı adı taşıyabilir |
| `type` | `ConnectionType` | Z | Arayüzün bağlantı türü |
| `isUp` | `boolean` | Z | Arayüz açık mı |
| `isDefault` | `boolean` | Z | Varsayılan yol bu arayüzden mi geçiyor |
| `ipv4`, `ipv6`, `mac` | `string` | İ | Adresler |

## Test sonucu: `DiagnosticTest` ve `DiagnosticOutcome`

[`diagnostic.ts`](../src/lib/types/diagnostic.ts) · Rust `run_diagnostic`

`DiagnosticTest` (ekranda ve raporda):

| Alan | Tip | | Açıklama |
|---|---|---|---|
| `id` | `DiagnosticKind` | Z | Testin türü |
| `name` | `string` | Z | Görünen ad (ör. "Google DNS") |
| `status` | `DiagnosticStatus` | Z | Testin durumu |
| `target` | `string` | İ | Hedef; bitmeden açıklama, bitince Rust'un denediği hedef |
| `latencyMs` | `number` | İ | Gecikme (ms) |
| `code` | `DiagnosticCode` | İ | Rust'un sonuç kodu; rapor ekranı mesajı seçili dilde bundan üretir. Görev 14'ten önceki raporlarda yoktur |
| `detail` | `string` | İ | Rust'un ek bilgisi (DNS'te çözülen adres, HTTPS'te genel IP) |
| `message` | `string` | İ | Rapor anındaki Türkçe sonuç mesajı; `code` olmayan eski raporlarda gösterilir |

`DiagnosticOutcome` (Rust yanıtı):

| Alan | Tip | | Açıklama |
|---|---|---|---|
| `status` | `OutcomeStatus` | Z | Sonuç |
| `code` | `DiagnosticCode` | Z | Makine kodu; başarıda `ok` |
| `target` | `string` | İ | Gerçekte denenen hedef |
| `latencyMs` | `number` | İ | Gecikme (ms); yalnız başarıda |
| `detail` | `string` | İ | DNS'te çözülen adres, HTTPS'te genel IP |

## Rapor: `DiagnosticReport`

[`report.ts`](../src/lib/types/report.ts) · ön yüz birleştirir, `id` Rust'tan

| Alan | Tip | | Açıklama |
|---|---|---|---|
| `id` | `string` | Z | `NCHK-YYYY-XXXXXXXX` (Rust `generate_report_id`) |
| `createdAt` | `string` | Z | ISO 8601 (UTC) |
| `score` | `number` | Z | 0–100 Bağlantı Skoru ([`src/lib/score.ts`](../src/lib/score.ts)) |
| `passed` | `number` | Z | Başarılı test sayısı |
| `failed` | `number` | Z | Başarısız ya da kullanılamayan test sayısı |
| `network` | `NetworkSnapshot` | Z | Rapor anındaki ağ durumu |
| `tests` | `DiagnosticTest[]` | Z | Beş test |

## Çalışma ortamı: `PlatformInfo`

[`platform.ts`](../src/lib/types/platform.ts) · Rust `get_platform_info`

| Alan | Tip | | Açıklama |
|---|---|---|---|
| `os` | `OsName` | Z | İşletim sistemi |
| `family` | `PlatformFamily` | Z | Masaüstü ya da mobil |
| `icmp` | `IcmpBackend` | Z | Ping yöntemi |

## Sabit seçenek listeleri

| Tip | Değerler |
|---|---|
| `ConnectionType` | `ethernet`, `wifi`, `cellular`, `unknown` |
| `DiagnosticKind` | `gateway`, `cloudflare`, `google`, `dns`, `internet` |
| `OutcomeStatus` | `success`, `failed`, `unavailable` |
| `DiagnosticStatus` | `pending`, `running` ve `OutcomeStatus` değerleri |
| `DiagnosticCode` | `ok`, `no_gateway`, `timeout`, `unreachable`, `ping_unsupported`, `resolve_failed`, `http_error`, `connection_failed`; yalnız ön yüzde yazılan `command_failed` (komut çağrısının kendisi başarısız olunca) |
| `ScoreLevel` | `iyi` (≥ 80), `orta` (≥ 50), `zayif` |
| `OsName` | `windows`, `macos`, `linux`, `android`, `ios` |
| `PlatformFamily` | `desktop`, `mobile` |
| `IcmpBackend` | `icmp-api`, `system-ping`, `icmp-socket`, `unavailable` |
| `LinkState` | `checking`, `online`, `no-internet`, `offline`, `unknown` (Genel Bakış; HTTPS testinden türetilir) |
| `Tema` / `TemaTercihi` | `gunduz`, `gece` / ayrıca `sistem` |
| `Locale` / `InfoSlug` | `tr`, `en`, `ar`, `fa` / `hakkinda`, `iletisim`, `kosullar`, `gizlilik` |

## Örnek veri

[`src/lib/veri/ornek.ts`](../src/lib/veri/ornek.ts): `NetworkSnapshot`, `DiagnosticTest` ve `DiagnosticReport` tiplerinin her birinden 6 kayıt (Görev 11).

- Yalnız tiplerin nasıl doldurulduğunu gösterir; `bun run check` onu tiplere göre denetler.
- **Hiçbir ekran, store ya da Rust komutu içe aktarmaz.** Uygulama gerçek olmayan ağ verisi göstermez.
- Adresler belgeleme aralıklarındandır: IPv4 RFC 5737, IPv6 RFC 3849, MAC RFC 7042. 1.1.1.1, 8.8.8.8 ve cloudflare.com uygulamanın sabit test hedefleridir.
- Skorlar ve mesajlar uygulamanın kendi kurallarıyla üretilen değerlerle aynıdır.
