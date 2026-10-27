# Yerel Denetim Düzeltmeleri (Batch 02)

Numarasız iş; günlük dal adıyla tutulur ([`README.md`](README.md)). Dal: `fix/yerel-denetim-duzeltmeleri`, Görev 16 dalının üstünde (zincirin sonu). Kaynak: 27.10.2026'da Windows'ta yapılan yerel denetim ve açık PR zincirinin (#35–#44) kod incelemesi.

## Araç ve model

Claude Code, Claude Fable 5.1 (`claude-fable-5-1`), 2026-10-27. Windows, PowerShell. Kod incelemesi `/code-review medium` ile `origin/master...docs/proje-duraklatma` aralığında (22 commit, 141 dosya). Telefon ya da başka cihaz bağlı değil.

## Şartname

- **Amaç:** Yerel denetimde ve kod incelemesinde bulunan, görev gereksinimleriyle açıkça çelişen küçük kusurları tek bir PR'da düzeltmek; görev PR'larına dokunmamak.
- **Kapsam dışı:** tasarım tartışması gerektiren bulgular (aşağıda "Düzeltilmeyenler"), PR birleştirme, etiket, macOS/Linux/mobil denemeleri.
- **Kabul ölçütleri:** her düzeltme tek bir bulguya karşılık gelir; `bun run check`, `bun run build`, `cargo test`, `lat check` temiz; tarayıcıda denenebilen düzeltmeler denendi.
- **Dokunulacak dosyalar:** `src/lib/reports.svelte.ts`, `src/lib/diagnostics.svelte.ts`, `src/lib/types/diagnostic.ts`, `src/lib/labels.ts`, `src/lib/sozluk.ts`, `src/components/History.svelte`, `admin/i18n/index.tsx`, `docs/veri-modeli.md`, `lat.md/architecture.md`, `lat.md/frontend.md`, bu günlük.

## İstem

"NetCheck Batch 02 — Windows Local Audit" istemi, ilgili kısmı olduğu gibi:

```text
5. Identify reproducible defects in the current local code. Fix only objective, well-scoped defects that are clearly within the task requirements. If a fix is warranted, use a dedicated task branch and preserve the existing branch/PR workflow. Do not mix unrelated changes.
```

## Plan

1. Zincirin tamamında (`docs/proje-duraklatma` ucu) belgelenen kontrolleri çalıştır.
2. Kod incelemesinin bulgularını tek tek kodda doğrula; yalnız doğrulanan ve görev kuralına aykırı olanları düzelt.
3. Görev PR'larını değiştirmek yerine zincirin sonunda ayrı bir düzeltme dalı aç; böylece her görev PR'ı kendi kapsamında kalır.

## Düzeltmeler

| Bulgu | Düzeltme |
|---|---|
| `reports.yukle()` listeyi depodan okunanla değiştiriyordu; `save()` başarısız olunca (depo dolu ya da kapalı) yeni rapor geçmişten ve detaydan kayboluyordu. Görev 13'te eklenen bir gerileme. | Depoya yazılamamış raporlar yeniden yüklemede korunur. |
| `diagnostics.start()` testleri "çalışıyor" yapmadan önce platform sorgusunu bekliyordu; o sırada önceki sonuçlar "Başarılı" görünüyordu (`master`'da eşzamanlıydı). | Liste beklemeden sıfırlanır. |
| Platform bilgisi alınamazsa (`get_platform_info` hatası) hiçbir test çalışmıyor, ekran hataya düşüyordu. | Ping desteği bilinmezse testlerin hepsi çalıştırılır. |
| Hata sonrası liste ping'siz derlemede de beş teste dönüyordu. | Son bilinen test kümesi kullanılır. İlk açılıştaki beş satır olduğu gibi kaldı: beş hedef platformun hepsinde ping yöntemi var, ping'siz derleme bugün yok. |
| Komut çağrısı başarısız olunca satıra kodsuz, Türkçe sabit mesaj yazılıyordu; İngilizce/Arapça/Farsça ekranda Türkçe satır kalıyordu (AGENTS.md §4 dil kuralı). | Yalnız ön yüzde yazılan `command_failed` kodu eklendi; mesaj sözlükteki `testTamamlanamadi`'den gelir. `docs/veri-modeli.md` ve `lat.md` güncellendi. |
| Depodaki JSON bozuksa Geçmiş sürekli hata halinde kalıyor, "Tekrar dene" hiç başaramıyor ve "Geçmişi temizle" yalnız dolu halde göründüğü için kullanıcı kurtulamıyordu. | Temizleme hata halinde de sunulur; temizleyince liste yeniden yüklenir ve boş hale geçer. |
| Panelin `t()` işlevi yer tutucuyu `RegExp` + dizge değiştirmeyle dolduruyordu; `$&` içeren değerler bozuluyordu. | Uygulamanın `bicim` işlevi kullanılır. |

**Düzeltilmeyenler** (karar ya da ayrı iş gerektiriyor):

- Genel Bakış'ın hızlı kontrolü ping desteğine bakmadan 1.1.1.1 gecikmesini gösteriyor. Bugün ping'siz derleme olmadığı için görünür etkisi yok; "kullanılamıyor göster" ile "hiç gösterme" kuralları arasındaki seçim Görev 15 kapsamında tartışılmalı.
- RTL yön kontrolü üç bileşende satır içi, Ayarlar'da `dirOf` ile; iki yerleşim betiği aynı mantığı tekrarlıyor. Tutarlılık işi, kusur değil.
- `History.svelte` içindeki `Hal` tipi bileşende tanımlı. Ekran durumu olduğu için veri sözleşmesi kuralının kapsamı tartışmalı; dokunulmadı.

## Doğrulama

Bu dalın ucunda, Windows:

- `bunx tsc -p admin/tsconfig.json`: 0 hata. `bun run check`: 0 hata, 0 uyarı. `bun run build`: 32 sayfa, 0 hata. `cargo test --locked`: 24/24 (toplam 25; macOS'a özgü test CI'da). `lat check`: geçti.
- **Tarayıcıda** (`bun run dev`, başsız Edge, Rust yok): sonuçlar PR açıklamasında.
- Mantık denemesi: `yukle` birleştirme kuralı dört durumla (yazılamamış rapor, temizleme sonrası, boşaltılmış depo, 50 sınırı) ayrı bir betikte denendi.
- Tauri'ye bağlı değişiklikler (platform sorgusu başarısızlığı, komut hatasında `command_failed`) çalışan uygulamada **denenmedi**; tip denetimi ve kod okumasıyla doğrulandı.

## Bilinen sınırlamalar ve açık maddeler

- macOS, Linux, Android ve iOS'ta denenmedi; cihaz bağlı değil.
- Bu dal zincirin sonunda olduğu için ancak #43'ten sonra birleşir.

## PR

[#45](https://github.com/frudotz/netcheck/pull/45) (taban: #43'ün dalı).
