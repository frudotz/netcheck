# Batch 02 Yayın Kapısı ve Belge Eşitleme

Numarasız iş; günlük dal adıyla tutulur. Dal: `docs/batch-02-yayin-kapisi`, tabanı `master` = `72abf11` (PR #45'in merge commit'i). Kaynak: Görev 16 çıktısı [`docs/ilerleme-batch-02.md`](../ilerleme-batch-02.md) ve [`docs/course-compliance.md`](../course-compliance.md), PR zinciri birleştikten sonra eski durumu anlatıyordu.

## Araç ve model

Claude Code, Claude Fable 5.1 (`claude-fable-5-1`), 2026-10-28. Windows, PowerShell. Ana çalışma kopyasına dokunulmadı; iş ayrı bir Git worktree'de yapıldı.

## Şartname

- **Amaç:** PR #35–#43 ve #45'in `master`'a birleştiğini, yayın kapısının `72abf11` üzerinde geçtiğini ve C-4 kararını (öğrenci numarasının güncel dosyalardan kaldırılması) ilerleme, uyum ve `lat.md` belgelerine doğru biçimde işlemek.
- **Kapsam dışı:** kod ve uygulama dosyaları; etiket, GitHub Release, PR birleştirme; öğrenciye ait doğrulamalar (K10, R10-d, R13-e, RG-c) ve Görev 16 rubriği (K11) yapılmış gösterilmez.
- **Kabul ölçütleri:** yalnız belge dosyaları değişir; `bun run build`, `bun run check`, `cargo test --locked`, `lat check` temiz; PR'ın beş CI kontrolü geçer; K13 / R16-c "onay bekliyor" kalır.
- **Dokunulacak dosyalar:** `docs/ilerleme-batch-02.md`, `docs/course-compliance.md`, `docs/istemler/README.md` (dizin), `lat.md/tasks.md`, `lat.md/workflows.md`, `lat.md/platforms.md`, bu günlük.

## İstem

Depo sahibinin 28.10.2026 istemi, ilgili kısmı olduğu gibi:

```text
Yalnızca dokümantasyon düzeltmesi için yeni bir dal ve PR hazırla.
1. PR #35–#43 ve #45'in artık birleşmiş olduğunu doğru şekilde yansıt.
2. K1 durumunu, yayın kapısı sonuçlarını ve master'da üretilen 32 sayfayı güncelle.
3. K7 ve ilgili CI kayıtlarını güncel zincir sonucuna göre düzelt.
4. K12 / C-4 ifadesini hassas biçimde güncelle: öğrenci numarası güncel dosyalardan kaldırıldı; eski Git geçmişinde ve v0.1.0-batch-01 etiketinde kalıyor. Geçmişi yeniden yazma.
5. K13 / R16-c'yi onay bekliyor olarak bırak. K10, K11 ve öğrenciye ait doğrulamalar yapılmadıysa bunları PASS yapma; eksik kanıtları uydurma.
6. Yalnızca doğrulanmış sonuçları ve durumları kaydet; ilgisiz kod veya uygulama dosyalarını değiştirme.
```

## Plan

1. `origin/master`'ı doğrula; `master`'dan `docs/` dalı aç (ayrı worktree).
2. Eski durum anlatan satırları bul (`PR açık`, `BLOCKED`, `PASS (Task N branch)`, "21 pages", "in review", C-4 "Undecided") ve 28.10 kayıtlarıyla değiştir; birleştirme SHA'larını yaz.
3. Dört kontrolü worktree'de çalıştır, PR aç, CI'ı doğrula. Birleştirme ve etiket depo sahibinde.

Plan istemle önceden belirlenmişti; ayrı onay turu yapılmadı.

## Düzeltmeler

- İstem üç dosya sayıyordu; aynı eski durum `lat.md/platforms.md` (NC-07 satırı) ve `docs/istemler/README.md` dizininde de vardı (PR #46'nın günlüğü dizinde yoktu). Bunlar da kapsama alındı.
- `docs/course-compliance.md` R03-e satırı PASS'tan PARTIAL'a çekildi: Görev 03 numarayı istiyor, numara C-4 kararıyla bilerek kaldırıldı. Özet toplamları buna göre 86 PASS / 12 PARTIAL / 1 FAIL / 6 UNVERIFIED oldu; `lat.md/workflows.md` aynı sayıları taşır.
- K12 "PASS (güncel dosyalar)" yazıldı; ad soyadın kuralın kapsamında olup olmadığı eğitmene bırakıldı.
- `lat.md/tasks.md`'de NC-17 ve NC-07 `done` oldu (PR #33 ve #40 birleşmişti); NC-14, NC-16, NC-19 metinleri birleşme sonrası duruma çekildi, durumları `in progress`/`blocked` kaldı (öğrenci kanıtı, etiket, arşiv, eğitmen onayları açık).

## Doğrulama

Worktree, `72abf11` + bu değişiklikler, Windows:

- `bun run build`: 32 sayfa, 0 hata.
- `bun run check`: 0 hata, 0 uyarı.
- `cargo test --locked`: 24/24 (toplam 25; macOS'a özgü test CI'da).
- `lat check`: geçti (NC-14 giriş paragrafı 250 karakter sınırı için kısaltıldı).
- `git diff --check` temiz; diff'te Çince/Japonca karakter ve öğrenci numarası yok; yalnız belge dosyaları değişti.

## Bilinen sınırlamalar ve açık maddeler

- K10 (öğrencinin kendi kanıtları: R10-d yeni sohbet testi, R13-e, RG-c §3 adımları) ve K11 (rubrik) UNVERIFIED kaldı; bu PR onları değiştirmez.
- K13 / R16-c: etiket atılmadı, depo sahibinin onayı bekleniyor.
- RA-e (AI Studio deposunun arşivi) ve PR #32 kararı açık.

## PR

[#47](https://github.com/frudotz/netcheck/pull/47) (taban: `master`).
