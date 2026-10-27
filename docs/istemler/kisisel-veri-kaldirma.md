# Kişisel Verinin Depodan Kaldırılması

Numarasız iş; günlük dal adıyla tutulur. Dal: `fix/kisisel-veri-kaldirma`, tabanı `master`. Kaynak: eğitmenin 21.10.2026 durum raporundaki "kişisel veri (öğrenci numarası) herkese açık depoda olmamalı" kuralı; depoda yalnız özeti var ([`docs/course-compliance.md`](../course-compliance.md), çelişki C-4).

Bu dal `master` tabanlıdır ve Batch 02 PR zincirinden (#35–#45) bağımsızdır. `docs/istemler/` dizini ve günlük dizini (`README.md`) Görev 10 PR'ı (#35) ile gelir; bu günlük o dizin birleşince dizine eklenir.

## Araç ve model

Claude Code, Claude Fable 5.1 (`claude-fable-5-1`), 2026-10-28. Windows, PowerShell.

## Şartname

- **Amaç:** Öğrenci numarasını depodaki güncel dosyalardan kaldırmak; böylece Görev 03'ün README isteği ile durum raporunun kişisel veri kuralı arasındaki çelişki (C-4) güncel dosyalar için kapanır.
- **Kapsam dışı:** Git geçmişi ve `v0.1.0-batch-01` etiketi yeniden yazılmaz (yasak); numara geçmişte ve etikette kalır. Ad soyad ve GitHub hesabı kaldırılmaz: Görev 03 "Öğrenci satırına adınızı ve öğrenci numaranızı yazın" der, kural yalnız numarayı adlandırır; ad zaten commit yazarlığında herkese açık. "Şube 1" kişisel veri değildir, olduğu gibi kalır (doğrulanmamış, R03-f).
- **Kabul ölçütleri:** numara için `git grep` boş döner; `bun run build` 0 hata; `lat check` geçer; başka içerik değişmez.
- **Dokunulacak dosyalar:** `README.md` (iki yer), `docs/proje-fikri.md`, `src/pages/hakkinda.mdx` ve `en/`, `ar/`, `fa/` kopyaları (Hakkında sayfasındaki "Öğrenci No" satırı), bu günlük.

## İstem

Depo sahibinin 28.10.2026 istemi, ilgili kısmı olduğu gibi:

```text
README'deki öğrenci numarası gibi kişisel verileri, mevcut gizlilik talimatına göre kaldırmak için ayrı ve küçük bir görev dalı/PR hazırla. Geçmişi yeniden yazma.
```

## Plan

1. `master`'dan ayrı bir dal aç; zincirdeki dallara dokunma.
2. Numaranın geçtiği her izlenen dosyayı `git grep` ile bul; yalnız numarayı taşıyan satırı ya da parçayı sil.
3. Derleme ve `lat check` ile doğrula; PR'ı `master`'a aç. Birleştirme depo sahibinde.

Plan depo sahibinin istemiyle önceden onaylıydı (ayrı, küçük dal/PR; geçmiş yeniden yazılmaz).

## Düzeltmeler

- İstem README'yi sayıyordu; aynı numara `docs/proje-fikri.md` ve dört dildeki Hakkında sayfasında da vardı. Aynı kural aynı veriye uygulandı; hepsi bu PR'da kaldırıldı.
- Çelişki kayıtları (`docs/course-compliance.md` C-4 ve K12 satırı, `docs/ilerleme-batch-02.md`, `lat.md/tasks.md` NC-16) Batch 02 zincirindeki dallarda yaşar; çakışma çıkarmamak için burada değiştirilmedi. Zincir birleşince bu satırlar "güncel dosyalardan kaldırıldı; geçmişte ve etikette kalır" diye güncellenir.

## Doğrulama

- Numara için `git grep`: izlenen dosyalarda sonuç yok (numaranın kendisi bu günlüğe de yazılmaz).
- `bun run build`: 21 sayfa, 0 hata (Windows; `master` tabanı, yönetim paneli sayfaları zincirde).
- `lat check`: geçti. `git diff --check` temiz; Çince/Japonca taraması temiz.
- Tarayıcıda denenmedi: değişiklik yalnız metin satırı silmektir.

## Bilinen sınırlamalar ve açık maddeler

- Numara Git geçmişinde (`docs/student-info` dalı, PR #15) ve değişmez `v0.1.0-batch-01` etiketinde durur. Tamamen kaldırmak geçmişi yeniden yazmayı gerektirir; bu yasaktır ve yapılmadı.
- Eğitmenin kuralın adı da kapsayıp kapsamadığına dair açıklaması beklenir; kapsıyorsa ayrı bir PR gerekir.

## PR

[#46](https://github.com/frudotz/netcheck/pull/46) (taban: `master`).
