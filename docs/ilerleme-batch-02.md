# İlerleme — Batch 02

> Görev listesi: [`docs/tasks/week-4/README.md`](tasks/week-4/README.md). Görev 16'nın (Batch 02 denetimi) görev dosyası depoda yok; istenen üç çıktı eğitmenin 21.10.2026 durum raporundan alındı (rapor depoya konmaz): `tauri.conf.json` içinde `minWidth`/`minHeight`, bu belge ve `v0.2.0-batch-02` etiketi. Son tarih: **27.10.2026 23:59**. Ayrıntılı gereksinim denetimi: [`docs/course-compliance.md`](course-compliance.md).

## Durum özeti

Batch 02'nin bütün görevleri birer dalda ve PR'da hazır; otomatik kontroller geçiyor. **Yayın kapısı şu an BLOCKED:** PR'lar henüz `master`'a birleştirilmedi ve etiket ancak birleştirmeden sonra atılabilir ([Yayın kapısı](#yayın-kapısı)). Öğrencinin kendisinin yapması gereken adımlar [en altta](#öğrencinin-yapacakları).

## Batch 02 kontrol matrisi

PR'lar zincirleme açıldı: her biri bir öncekinin dalı üstünde ve tabanı o dal. Böylece her PR'ın "Files changed" sekmesi yalnız kendi görevini gösterir. Durum 22.10.2026, `master` = `9970845`.

| Görev | Eğitmen tablosunda istenen | Durum | PR | Kanıt |
|---|---|---|---|---|
| 09.1 Master koruması | Kural seti; `docs/kurallar.md` "PR güvenliği"; `docs/kanit/master-korumasi.png` | Birleştirildi | #34 (`9970845`) | [`kurallar.md` § PR güvenliği](kurallar.md#pr-güvenliği). Doğrudan push denemesi yapılmadı (R09.1-d). |
| lat.md (Hafta 05 adım 1) | `lat.md/`, `lat check` temiz, PR ile birleştirme | Birleştirildi | #33 (`2e09390`) | `lat check` her dalda geçiyor |
| 10 Çalışma yöntemi | `docs/gorev-sartnamesi.md`; `docs/istemler/` ve görev başına günlük | PR açık | #35 | [`istemler/`](istemler/README.md); yeni sohbet kural testi öğrencide (R10-d) |
| 11 Veri sözleşmesi | `src/lib/types/` (≥3 tip, `index.ts`); `docs/veri-modeli.md`; `check` betiği | PR açık | #36 | [`veri-modeli.md`](veri-modeli.md); `bun run check` |
| Uygulama dili (12–14 hazırlığı, C-2) | Görev 12–14'ün dil değiştirme adımları için ön koşul | PR açık | #37 | [`istemler/uygulama-dili.md`](istemler/uygulama-dili.md) |
| 12 Kart bileşeni | `src/lib/components/ui/Kart.svelte` | PR açık | #38 | [`istemler/12-kart-bileseni.md`](istemler/12-kart-bileseni.md) |
| 13 Liste ve üç durum | `Yukleniyor`, `BosDurum`, `HataDurumu` ve dört hal | PR açık | #39 | `docs/kanit/13-liste-ve-uc-durum-*.png`; öğrencinin kendi ekran görüntüleri (R13-e) |
| 14 Detay ekranı | Kimlikli detay, geri dönüş, "bulunamadı" | PR açık | #40 | [`istemler/14-detay-ekrani.md`](istemler/14-detay-ekrani.md) |
| 15 Rust komutu ve platform | `docs/platform-destegi.md` (ve tipli hata, `docs/komutlar.md`) | PR açık | #41 | [`platform-destegi.md`](platform-destegi.md); macOS/Linux/iOS çalıştırması ertelendi (R15-h) |
| Yönetim paneli (Hafta 05) | AI Studio panelini `admin/`'e taşı; sabit renk yok; metinler sözlükten | PR açık | #42 | [`yonetim-paneli.md`](yonetim-paneli.md); kaynak deponun arşivi birleştirmeden sonra |
| 16 Batch 02 denetimi | `minWidth`/`minHeight`; bu belge; `v0.2.0-batch-02` | PR açık; etiket yok | #43 | Pencere en az 320 × 480 ([aşağıda](#pencere-boyutu)) |
| Yerel denetim düzeltmeleri (27.10) | Kod incelemesinde bulunan kusurlar (rapor kaybı, test listesi, komut hatası mesajı, bozuk depo, panel `t()`) | PR açık | #45 | [`istemler/yerel-denetim-duzeltmeleri.md`](istemler/yerel-denetim-duzeltmeleri.md) |

## Pencere boyutu

`src-tauri/tauri.conf.json`: varsayılan 420 × 820, en küçük **320 × 480** (mantıksal piksel). 320 px, düzenin doğrulandığı en dar genişliktir (Görev 12'de 320/420/1280 px; yönetim paneli de 320 px'te denendi). 480 px yükseklikte üst bar, içerik ve alt menü birlikte görünür. Değerler görev dosyasında verilmediği için seçildi; rubrik başka değer isterse değiştirilir. Mobilde etkisi yoktur.

Doğrulama (Windows, `bun run tauri dev`):

- Pencere, `WM_GETMINMAXINFO` sorgusuna en küçük izleme boyutunu 336 × 519 dış piksel olarak bildiriyor. 96 DPI'da bu, 320 × 480 istemci alanı demektir.
- Beş uygulama ekranı, bir bilgi sayfası ve yönetim paneli 320 × 480'de açıldı. Yatay taşma yok, alt menü görünür.

## Doğrulama

Görev 16 dalının son hâlinde (`feature/16-batch-02-denetimi`, Windows):

| Kontrol | Sonuç |
|---|---|
| `bun run build` | 32 sayfa, 0 hata, `Complete!` |
| `bun run check` | 0 hata, 0 uyarı |
| `cargo test --locked` | 24/24 Windows'ta (toplam 25; macOS'a özgü test CI'da) |
| `lat check` | geçti |
| CI (5 zorunlu kontrol) | #35–#43 son commit'lerinde 5/5 (22.10.2026; 27.10'da yeniden okundu, değişmedi) |

## Yayın kapısı

Depoda ayrı bir yayın kapısı betiği yok. Ölçütler eğitmen tablosundan, Hafta 04 kurallarından ve Batch 01 etiket adımından derlendi. Her ölçüt, birleştirmeden sonra `master` üzerinde yeniden kontrol edilir.

| # | Ölçüt | Sonuç | Neden |
|---|---|---|---|
| K1 | Eğitmen tablosundaki ❌ ve 🟡 maddelerin dosyaları `master`'da | **BLOCKED** | Hepsi açık PR'larda (#35–#43, düzeltmeler #45). PR'ları depo sahibi birleştirir ([`AGENTS.md`](../AGENTS.md) § Çalışma döngüsü madde 7). |
| K2 | Her görev ayrı dal, PR ve istem günlüğü | PASS | Kontrol matrisi; [`istemler/`](istemler/README.md) |
| K3 | `bun run build` 0 hata | PASS | 32 sayfa |
| K4 | `bun run check` 0 hata, 0 uyarı | PASS | |
| K5 | Rust testleri geçiyor | PASS | 24/24 Windows; CI'da üç masaüstü işletim sistemi |
| K6 | `lat check` temiz | PASS | |
| K7 | Beş zorunlu CI kontrolü her PR'ın son commit'inde | PASS (#35–#43) | Birleştirme sırasında her dal güncellenince yeniden çalışır |
| K8 | Uyum matrisinde etiket dışında FAIL yok | PASS | [`course-compliance.md`](course-compliance.md) özeti; tek FAIL R16-c, yani K13 |
| K9 | `v0.1.0-batch-01` değişmedi | PASS | `aebd3fe` → `b9fc299` |
| K10 | Öğrencinin kendi kanıtları | UNVERIFIED | R10-d (yeni sohbette kural testi), R13-e ve görevlerin §3 ekran görüntüleri yalnız öğrenci tarafından yapılabilir |
| K11 | Görev 16 rubriği | UNVERIFIED | Derste duyurulacak; depoda yok |
| K12 | Kişisel veri depoda yok (durum raporunun kuralı) | UNVERIFIED | Batch 01 README'sinin istediği öğrenci bilgisi depoda; karar bekliyor (C-4) |
| K13 | `v0.2.0-batch-02` etiketi `master`'da | **BLOCKED** | K1'e ve depo sahibinin onayına bağlı |

**Sonuç: BLOCKED** (K1, K13). Teknik ölçütlerin hepsi geçiyor. Engeller birleştirme ve onay; K10–K12 öğrenci ya da eğitmen kararı bekliyor.

## Birleştirme ve etiket

`master` kuralı PR'ın `master`'ın son hâlini içermesini istiyor (strict). Bu yüzden PR'lar sırayla birleştirilir:

1. **#35'i "Create a merge commit" ile birleştirin.** Squash kullanmayın: üstteki dallar aynı commit'leri taşıdığı için squash çakışma çıkarır. GitHub dalı siler ve #36'nın tabanını `master` yapar.
2. **Sıradaki dalı `master` ile güncelleyin** (merge, rebase yok):
   ```bash
   git fetch origin
   git checkout feature/11-veri-sozlesmesi
   git merge origin/master
   git push
   ```
3. **Beş kontrol yeşil olunca o PR'ı da merge commit ile birleştirin.** 2–3. adımları sırayla #37, #38, #39, #40, #41, #42, #43 ve #45 (27.10 yerel denetim düzeltmeleri) için tekrarlayın.
4. **Yayın kapısını `master` üzerinde yeniden çalıştırın:** `bun run build`, `bun run check`, `cargo test`, `lat check`. K1 artık geçmeli.
5. **Etiketi onayınızla atın:**
   ```bash
   git checkout master
   git pull origin master
   git tag -a v0.2.0-batch-02 -m "Hafta 4: Batch 02 - veri sözleşmesi, ekran durumları, tipli komutlar ve yönetim paneli"
   git push origin v0.2.0-batch-02
   ```

## Öğrencinin yapacakları

- PR'ları yukarıdaki sırayla birleştirmek ve etiketi atmak.
- Görev 10–15'in her birinde "§ 3 Kendiniz doğrulayın" adımları ve kontrol listesindeki "ekran görüntüleri günlükte" maddesi (RG-c); özellikle Görev 10'un yeni sohbet testi (R10-d) ve Görev 13'ün dört hal görüntüsü (R13-e). Görev 15 § 3.6: elinizdeki her cihazda uygulamayı açmak.
- Yönetim paneli PR'ı (#42) birleşip doğrulandıktan sonra `frudotz/netcheck-gorev-aistudio` deposunu arşivlemek.
- PR #32 (eğitmenin): durum raporu "uygunsa merge edin, değilse yorum yazın" diyor. Yorum 21.10.2026'da yazıldı (birleştirilmesi önerilmiyor; C-3 ve güvenlik bulguları). Kalan adım: eğitmenin yanıtını beklemek.
- Kullanılan yapay zeka aracı hakkında geri bildirimi Telegram'daki konuya yazmak (durum raporundaki istek).
- C-4 (depodaki öğrenci bilgisi) için karar.
