# İlerleme — Batch 02

> Görev listesi: [`docs/tasks/week-4/README.md`](tasks/week-4/README.md). Görev 16'nın (Batch 02 denetimi) görev dosyası depoda yok; istenen üç çıktı eğitmenin 21.10.2026 durum raporundan alındı (rapor depoya konmaz): `tauri.conf.json` içinde `minWidth`/`minHeight`, bu belge ve `v0.2.0-batch-02` etiketi. Son tarih: **27.10.2026 23:59**. Ayrıntılı gereksinim denetimi: [`docs/course-compliance.md`](course-compliance.md).

## Durum özeti

Batch 02'nin bütün PR'ları (#35–#43 ve düzeltme PR'ı #45) 28.10.2026'da sırayla, merge commit ile `master`'a birleşti (`72abf11`). Aynı gün #46 (kişisel veri), #47 (belge eşitleme), #48 (arka uç sertleştirme + panel bağlantısı) ve #49 (oturum süresi, giriş sınırı, ayrılmış rol adı, salt okunur hedefler) de birleşti; **`master` = `a5ef40b`**. Yayın kapısının teknik ölçütleri bu son commit üzerinde yeniden çalıştırıldı ve geçti. **Kapı yalnız K13'te bekliyor:** `v0.2.0-batch-02` etiketi depo sahibinin onayıyla atılır ([Yayın kapısı](#yayın-kapısı)). Öğrencinin kendisinin yapması gereken adımlar [en altta](#öğrencinin-yapacakları).

## Batch 02 kontrol matrisi

PR'lar zincirleme açıldı: her biri bir öncekinin dalı üstünde ve tabanı o dal. Böylece her PR'ın "Files changed" sekmesi yalnız kendi görevini gösterir. Zincir 22.10.2026'da `master` = `9970845` üzerinden açıldı; durum 28.10.2026, `master` = `a5ef40b`.

| Görev | Eğitmen tablosunda istenen | Durum | PR | Kanıt |
|---|---|---|---|---|
| 09.1 Master koruması | Kural seti; `docs/kurallar.md` "PR güvenliği"; `docs/kanit/master-korumasi.png` | Birleştirildi | #34 (`9970845`) | [`kurallar.md` § PR güvenliği](kurallar.md#pr-güvenliği). Doğrudan push denemesi yapılmadı (R09.1-d). |
| lat.md (Hafta 05 adım 1) | `lat.md/`, `lat check` temiz, PR ile birleştirme | Birleştirildi | #33 (`2e09390`) | `lat check` her dalda geçiyor |
| 10 Çalışma yöntemi | `docs/gorev-sartnamesi.md`; `docs/istemler/` ve görev başına günlük | Birleştirildi | #35 (`021a0d0`) | [`istemler/`](istemler/README.md); yeni sohbet kural testi öğrencide (R10-d) |
| 11 Veri sözleşmesi | `src/lib/types/` (≥3 tip, `index.ts`); `docs/veri-modeli.md`; `check` betiği | Birleştirildi | #36 (`86f64e7`) | [`veri-modeli.md`](veri-modeli.md); `bun run check` |
| Uygulama dili (12–14 hazırlığı, C-2) | Görev 12–14'ün dil değiştirme adımları için ön koşul | Birleştirildi | #37 (`0840e5a`) | [`istemler/uygulama-dili.md`](istemler/uygulama-dili.md) |
| 12 Kart bileşeni | `src/lib/components/ui/Kart.svelte` | Birleştirildi | #38 (`6cfbaa4`) | [`istemler/12-kart-bileseni.md`](istemler/12-kart-bileseni.md) |
| 13 Liste ve üç durum | `Yukleniyor`, `BosDurum`, `HataDurumu` ve dört hal | Birleştirildi | #39 (`e36c391`) | `docs/kanit/13-liste-ve-uc-durum-*.png`; öğrencinin kendi ekran görüntüleri (R13-e) |
| 14 Detay ekranı | Kimlikli detay, geri dönüş, "bulunamadı" | Birleştirildi | #40 (`d052768`) | [`istemler/14-detay-ekrani.md`](istemler/14-detay-ekrani.md) |
| 15 Rust komutu ve platform | `docs/platform-destegi.md` (ve tipli hata, `docs/komutlar.md`) | Birleştirildi | #41 (`2da32a1`) | [`platform-destegi.md`](platform-destegi.md); macOS/Linux/iOS çalıştırması ertelendi (R15-h) |
| Yönetim paneli (Hafta 05) | AI Studio panelini `admin/`'e taşı; sabit renk yok; metinler sözlükten | Birleştirildi | #42 (`1463b53`) | [`yonetim-paneli.md`](yonetim-paneli.md); kaynak deponun arşivi ayrı, açık adım (RA-e) |
| 16 Batch 02 denetimi | `minWidth`/`minHeight`; bu belge; `v0.2.0-batch-02` | Birleştirildi; etiket onay bekliyor | #43 (`6759088`) | Pencere en az 320 × 480 ([aşağıda](#pencere-boyutu)) |
| Yerel denetim düzeltmeleri (27.10) | Kod incelemesinde bulunan kusurlar (rapor kaybı, test listesi, komut hatası mesajı, bozuk depo, panel `t()`) | Birleştirildi | #45 (`72abf11`) | [`istemler/yerel-denetim-duzeltmeleri.md`](istemler/yerel-denetim-duzeltmeleri.md) |
| Kişisel veri (durum raporu kuralı, C-4) | Öğrenci numarası güncel dosyalardan kaldırıldı | Birleştirildi | #46 (`e4c9fea`) | [`istemler/kisisel-veri-kaldirma.md`](istemler/kisisel-veri-kaldirma.md) |
| Belge eşitleme (yayın kapısı) | Birleşme sonrası ilerleme/uyum/`lat.md` kayıtları | Birleştirildi | #47 (`93df501`) | [`istemler/batch-02-yayin-kapisi.md`](istemler/batch-02-yayin-kapisi.md) |
| Arka uç sertleştirme + panel bağlantısı (PR #32 denetimi) | C1–C3, H1–H4, M1 düzeltmeleri; `admin/` tek panel, SQLite'a IPC ile bağlı | Birleştirildi (eğitmenin C-3 kararı bekliyor) | #48 (`9c74c34`) | [`istemler/pr32-backend-hardening.md`](istemler/pr32-backend-hardening.md) |
| Güvenlik takibi (M2–M5, L5) | Oturum süresi, giriş sınırı, ayrılmış rol adı, salt okunur hedefler, kısmi sunucu sayfalama | Birleştirildi | #49 (`a5ef40b`) | [`istemler/backend-security-followups.md`](istemler/backend-security-followups.md) |

## Pencere boyutu

`src-tauri/tauri.conf.json`: varsayılan 420 × 820, en küçük **320 × 480** (mantıksal piksel). 320 px, düzenin doğrulandığı en dar genişliktir (Görev 12'de 320/420/1280 px; yönetim paneli de 320 px'te denendi). 480 px yükseklikte üst bar, içerik ve alt menü birlikte görünür. Değerler görev dosyasında verilmediği için seçildi; rubrik başka değer isterse değiştirilir. Mobilde etkisi yoktur.

Doğrulama (Windows, `bun run tauri dev`):

- Pencere, `WM_GETMINMAXINFO` sorgusuna en küçük izleme boyutunu 336 × 519 dış piksel olarak bildiriyor. 96 DPI'da bu, 320 × 480 istemci alanı demektir.
- Beş uygulama ekranı, bir bilgi sayfası ve yönetim paneli 320 × 480'de açıldı. Yatay taşma yok, alt menü görünür.

## Doğrulama

`master` = `a5ef40b` (PR #49 merge commit'i) üzerinde, 28.10.2026, Windows; ana çalışma kopyasına dokunmadan bu commit'e ayrılmış temiz bir worktree'de (`bun install --frozen-lockfile` sonrası). Önceki doğrulama `72abf11` içindi; aşağıdaki sonuçlar yenidir:

| Kontrol | Sonuç |
|---|---|
| `bun run build` | 32 sayfa, 0 hata, `Complete!` |
| `bun run check` | 85 dosya, 0 hata, 0 uyarı |
| `cargo test --locked` | 54/54 Windows'ta, 0 uyarı (toplam 55; macOS'a özgü test CI'da) |
| `lat check` | geçti |
| CI (5 zorunlu kontrol) | Her PR'ın birleştirilen son commit'inde 5/5 (28.10.2026; #46–#49 dahil); `master`'daki `a5ef40b` push çalıştırması 5/5 (run 40635427364) |
| `git diff --check`, belge bağlantıları | temiz; eğitmen görev dosyaları dışındaki göreli bağlantılar çözülüyor |

## Yayın kapısı

Depoda ayrı bir yayın kapısı betiği yok. Ölçütler eğitmen tablosundan, Hafta 04 kurallarından ve Batch 01 etiket adımından derlendi. Her ölçüt, birleştirmeden sonra `master` üzerinde yeniden kontrol edilir.

| # | Ölçüt | Sonuç | Neden |
|---|---|---|---|
| K1 | Eğitmen tablosundaki ❌ ve 🟡 maddelerin dosyaları `master`'da | PASS | #35–#43 ve #45, 28.10.2026'da depo sahibi tarafından sırayla merge commit ile birleştirildi (`72abf11`); ardından #46–#49; `master` = `a5ef40b` |
| K2 | Her görev ayrı dal, PR ve istem günlüğü | PASS | Kontrol matrisi; [`istemler/`](istemler/README.md) |
| K3 | `bun run build` 0 hata | PASS | 32 sayfa, `master` üzerinde |
| K4 | `bun run check` 0 hata, 0 uyarı | PASS | |
| K5 | Rust testleri geçiyor | PASS | 54/54 Windows (`a5ef40b`); CI'da üç masaüstü işletim sistemi |
| K6 | `lat check` temiz | PASS | |
| K7 | Beş zorunlu CI kontrolü her PR'ın son commit'inde | PASS (#35–#43, #45, #46–#49) | Her dal birleştirmeden önce `master` ile merge commit'le güncellendi ve 5/5 yeniden geçti. #36'da iki merge tabanı oluştuğu için GitHub birleştirmeyi hesaplayamadı ve iş akışı tetiklenmedi; taban dal (#35'in ucu) #36'ya merge edilince (`dc42a45`) çözüldü |
| K8 | Uyum matrisinde etiket dışında FAIL yok | PASS | [`course-compliance.md`](course-compliance.md) özeti; tek FAIL R16-c, yani K13 |
| K9 | `v0.1.0-batch-01` değişmedi | PASS | `aebd3fe` → `b9fc299` |
| K10 | Öğrencinin kendi kanıtları | UNVERIFIED | R10-d (yeni sohbette kural testi), R13-e ve görevlerin §3 ekran görüntüleri yalnız öğrenci tarafından yapılabilir |
| K11 | Görev 16 rubriği | UNVERIFIED | Derste duyurulacak; depoda yok |
| K12 | Kişisel veri depoda yok (durum raporunun kuralı) | PASS (güncel dosyalar) | Öğrenci numarası 28.10.2026'da PR #46 (`e4c9fea`) ile README, `docs/proje-fikri.md` ve dört dildeki Hakkında sayfasından kaldırıldı. Numara Git geçmişinde ve değişmez `v0.1.0-batch-01` etiketinde durur; geçmiş yeniden yazılmaz. Ad soyad ve GitHub hesabı kaldı; kuralın bunları da kapsayıp kapsamadığı eğitmene sorulacak (C-4) |
| K13 | `v0.2.0-batch-02` etiketi `master`'da | **BLOCKED** (onay bekliyor) | K1 geçti; etiket yalnız depo sahibinin onayıyla güncel `master` (`a5ef40b`) üzerine atılır. 28.10.2026 itibarıyla onay verilmedi, etiket yok |

**Sonuç: BLOCKED** (yalnız K13). Teknik ölçütlerin hepsi 28.10.2026'da `master` = `a5ef40b` üzerinde geçti. Kalan tek engel etiket onayı. K10 (öğrencinin kendi kanıtları) ve K11 (rubrik) hâlâ UNVERIFIED; bunlar etiketi engellemez ama yapılmış sayılmaz.

## Birleştirme ve etiket

`master` kuralı PR'ın `master`'ın son hâlini içermesini istiyor (strict). Bu yüzden PR'lar sırayla birleştirildi; 1–4. adımlar 28.10.2026'da tamamlandı, 5. adım onay bekliyor.

1. **Yapıldı — #35 "Create a merge commit" ile birleştirildi** (`021a0d0`). Squash kullanılmadı: üstteki dallar aynı commit'leri taşıdığı için squash çakışma çıkarırdı. GitHub dalı sildi ve #36'nın tabanını `master` yaptı.
2. **Yapıldı — sıradaki dal her seferinde `master` ile güncellendi** (merge commit, rebase yok; her güncelleme ağacı değiştirmedi):
   ```bash
   git fetch origin
   git checkout feature/11-veri-sozlesmesi
   git merge origin/master
   git push
   ```
   Not: #36'da dal ve tabanı `master`'ı ayrı ayrı almış, iki merge tabanı oluşmuştu. Yerel Git bunu çözerken GitHub birleştirmeyi hesaplayamadı, PR "CONFLICTING" göründü ve `pull_request` iş akışı hiç tetiklenmedi. Çözüm, taban dalın ucunu (#35) #36'ya normal merge ile almak oldu (`dc42a45`); sonra kontroller koştu.
3. **Yapıldı — beş kontrol yeşil olunca her PR merge commit ile birleştirildi:** #36 `86f64e7`, #37 `0840e5a`, #38 `6cfbaa4`, #39 `e36c391`, #40 `d052768`, #41 `2da32a1`, #42 `1463b53`, #43 `6759088`, #45 `72abf11`.
4. **Yapıldı — yayın kapısı `master` üzerinde yeniden çalıştırıldı** (`72abf11`, sonra #46–#49'dan sonra `a5ef40b`): dört kontrol de geçti ([Doğrulama](#doğrulama)). K1 geçti.
5. **Etiketi onayınızla atın** (henüz atılmadı):
   ```bash
   git checkout master
   git pull origin master
   git tag -a v0.2.0-batch-02 -m "Hafta 4: Batch 02 - veri sözleşmesi, ekran durumları, tipli komutlar ve yönetim paneli"
   git push origin v0.2.0-batch-02
   ```

## Öğrencinin yapacakları

- `v0.2.0-batch-02` etiketini onaylayıp atmak (PR'lar birleşti; komut yukarıda).
- Görev 10–15'in her birinde "§ 3 Kendiniz doğrulayın" adımları ve kontrol listesindeki "ekran görüntüleri günlükte" maddesi (RG-c); özellikle Görev 10'un yeni sohbet testi (R10-d) ve Görev 13'ün dört hal görüntüsü (R13-e). Görev 15 § 3.6: elinizdeki her cihazda uygulamayı açmak.
- Yönetim paneli PR'ı (#42) birleşti (`1463b53`); `frudotz/netcheck-gorev-aistudio` deposunu arşivlemek ayrı ve açık bir adım olarak sizde (RA-e).
- PR #32 (eğitmenin): durum raporu "uygunsa merge edin, değilse yorum yazın" diyor. Yorum 21.10.2026'da yazıldı; PR 28.10.2026'da birleştirilmeden kapatıldı, yerine sertleştirilmiş entegrasyon PR #48 ile birleşti. **Eğitmenin C-3 kapsam kararı hâlâ bekleniyor**; birleştirme onay yerine geçmez.
- Kullanılan yapay zeka aracı hakkında geri bildirimi Telegram'daki konuya yazmak (durum raporundaki istek).
- C-4: öğrenci numarası güncel dosyalardan kaldırıldı (PR #46). Kuralın ad soyadı da kapsayıp kapsamadığını eğitmene sormak.
