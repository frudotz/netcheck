# Görev 11 — Veri Sözleşmesi: Tipler ve Örnek Veri

Görev dosyası: [`docs/tasks/week-4/11-veri-sozlesmesi.task.md`](../tasks/week-4/11-veri-sozlesmesi.task.md). Dal: `feature/11-veri-sozlesmesi`, Görev 10 dalının (`feature/10-calisma-yontemi`) üstünde; PR #35 henüz birleşmediği için zincirleme.

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-21. Windows, PowerShell.

## Şartname

- **Amaç:** Uygulamanın veri tipleri tek yerde, alan açıklamalarıyla; derleme sırasında tip hataları yakalanır.
- **Kapsam dışı:** ekranların görünümü ve davranışı (görev "görünümü değiştirmez" diyor); Rust kodu; SQLite arka ucunun tipleri (`src-tauri/src/backend/`); bileşenlerin kendi `Props` tanımları.
- **Kabul ölçütleri:**
  - `src/lib/types/` altında en az üç ana tip, her biri ayrı dosyada, `index.ts` hepsini dışa aktarıyor.
  - Her alanın yanında tek satır açıklama; zorunlu ve isteğe bağlı alanlar ayrı; durum alanları sabit seçenek listesi.
  - Örnek veri tek dosyada, her ana tipten en az 6 kayıt, tiplere uygun.
  - Dağınık tipler taşınmış; `any` yok.
  - `package.json` içinde `check` betiği (`astro check`); `bun run check` 0 hata.
  - `docs/veri-modeli.md` ve AGENTS.md indeksi; AGENTS.md kuralı "yeni veri alanı önce `src/lib/types/` içinde tanımlanır".
- **Dokunulacak dosyalar:** `src/lib/types/*` (yeni), `src/lib/veri/ornek.ts` (yeni), `src/types/netcheck.ts` (silinir), tipleri içe aktaran `src/lib/*.ts` ve `src/components/*.svelte` dosyaları, `src/layouts/InfoLayout.astro`, `package.json`, `bun.lock`, `docs/veri-modeli.md` (yeni), `docs/proje-fikri.md`, `docs/klasor-mimarisi.md`, `AGENTS.md`, `docs/course-compliance.md`, `lat.md/`.
- **Doğrulama adımları:** `bun run check`; `bun run build`; derleme çıktısının görev öncesiyle karşılaştırılması; örnek verinin uygulamanın kendi skor kuralıyla yeniden hesaplanması; hiçbir ekranın örnek veriyi içe aktarmadığının kontrolü; `lat check`; bağlantı kontrolü; `git diff --check`.

## İstem

Görev 11–16 ve yönetim paneli için verilen genel istem (tam metin). Sonraki görevlerin günlükleri buraya bağlantı verir.

```text
# NetCheck Batch 02 — Tamamlama ve Teslimat Görevi

Repo: `frudotz/netcheck`

Amacın, NetCheck'in kalan görevlerini ve Batch 02 teslimatını uçtan uca tamamlamak. Her küçük karar için kullanıcıyı tekrar tekrar bekletme. Önceden belirlenmiş proje kurallarına uy, güvenli ve geri alınabilir kararlar ver, gerçek bir kapsam çatışması veya kullanıcı müdahalesi gerektiren durum ortaya çıkarsa yalnızca o noktada dur.

## 1. Başlangıç denetimi

Önce `AGENTS.md`, `docs/tasks/`, `docs/course-compliance.md`, `lat.md/`, `docs/istemler/` ve ilgili mimari belgelerini oku.

GitHub'ın güncel durumundan şunları doğrula:
- `master` HEAD ve çalışma ağacının durumu.
- Açık PR'lar, son commit'leri, CI kontrolleri ve merge edilebilirlikleri.
- `Protectmaster` kurallarının durumu.
- `v0.1.0-batch-01` etiketinin değişmez hedefi.
- Release gate'in güncel sonucu.
- Görev 09.1, 10 ve 11–16'nın gerçek kabul kriterleri.

Önceki konuşmalardaki SHA ve CI bilgilerini güncelmiş gibi kabul etme. Hiçbir şeyi değiştirmeden önce mevcut durumu raporla.

## 2. Çalışma kuralları

- `master` üzerine doğrudan commit atma.
- Her görev için ayrı, güncel `master` tabanlı branch ve PR kullan.
- Force push, `reset --hard`, geçmişi yeniden yazma veya ilgisiz değişiklikleri silme.
- Her görevde önce kısa bir kapsam/plan ve kabul kriterleri hazırla; ardından uygula.
- Bir görevin değişikliklerini başka bir görevin PR'ına karıştırma.
- Gerekli testleri çalıştır; çalıştırılmayan testleri başarılı olarak raporlama.
- PR'ın son commit'inin tüm zorunlu CI kontrollerini doğrula.
- Merge öncesi tam diff'i, güvenlik etkilerini, kapsamı ve kabul kriterlerini incele.
- PR #32'yi mevcut haliyle otomatik birleştirme.
- Gerçek kullanıcı/öğrenci testlerini, ekran görüntülerini, cihaz testlerini veya öğretmen onaylarını uydurma.
- macOS/iOS çalışmalarını şimdilik ertele; mevcut durumu doğru belgelemeye devam et.
- `v0.1.0-batch-01` etiketini ve hedef commit'ini değiştirme.

Kullanıcının tüm kalan işleri bitirme isteği, görevlerin yürütülmesi için genel yetkilendirmedir. Bu, gerçek güvenlik sorunlarını görmezden gelme veya kanıt gereksinimlerini atlama yetkisi değildir.

## 3. Açık PR'lar ve Görev 10

### PR #35 — Çalışma yöntemi

`https://github.com/frudotz/netcheck/pull/35`

- Güncel diff ve CI'yi incele.
- Yeni sohbet kural testi ve gerekli kanıtlar eksikse bunları açıkça ayır.
- Gerçekten yeni sohbet açılması gerekiyorsa bunu mevcut sohbet testiyle değiştirme. Kullanıcının gerçekleştirmesi gereken tek adım varsa net biçimde bildir; kalan tüm işleri sen tamamla.
- Doğrulanabilir dokümantasyon, bağlantılar, günlükler ve uyum matrisi hatalarını düzelt.
- Kabul kriterleri karşılanmadan görevi tamamlandı işaretleme.

### PR #32 — AI Studio paneli

`https://github.com/frudotz/netcheck/pull/32`

- PR'ı güncel `master` ile karşılaştır; tüm diff'i ve gerçek görev kapsamını incele.
- Mevcut kapsam, kimlik doğrulama, rol yetkileri, kişisel veri maskeleme, veri bütünlüğü, mobil platformlar ve Tauri IPC sorunlarını değerlendir.
- Güvenli biçimde taşınabilecek UI bileşenlerini belirle.
- Görev kuralları izin vermiyorsa giriş/üyelik, veritabanı veya sunucu tarafı özellikleri sessizce ekleme.
- Gerçek uygulamada çalışmayan kontrol ve ekranları çalışıyormuş gibi sunma.
- Gerekiyorsa panel entegrasyonunu ayrı bir UI odaklı PR'a taşı. Kaynak panel deposunu, entegrasyon ve doğrulama tamamlanmadan arşivleme veya silme.
- Belirsiz gereksinimleri `docs/course-compliance.md` içinde açıkça kaydet.

## 4. Görev 11–16

Her görevin gerçek şartnamesini aç ve görev numarasına göre değil, bağımlılıklarına göre güvenli bir sıra oluştur. Her görev için:
1. Şartname, kapsam ve kabul kriterleri.
2. Ayrı branch.
3. En küçük doğru uygulama.
4. İlgili otomatik testler ve build.
5. Diff, güvenlik ve regresyon incelemesi.
6. İstem günlüğü ve gerekli dokümantasyon.
7. PR ve son commit CI doğrulaması.
8. Birleştirme ve son durum doğrulaması.

Görev başlıklarını veya kabul kriterlerini tahmin etme; doğrudan depo içindeki görev dosyalarından al.

## 5. Doğrulama ve teslimat

- `lat check`, `bun run build`, ilgili TypeScript/Svelte kontrolleri ve Rust testlerini gerektiği yerde çalıştır.
- Android/iOS/macOS doğrulamasını gerçek çalıştırma kanıtı olmadan iddia etme.
- Bağlantı ve başlık çapalarını kontrol et.
- `docs/course-compliance.md`, `lat.md/tasks.md` ve ilgili çalışma günlüklerini gerçek sonuçlarla eşleştir.
- Release gate'i tekrar çalıştır. BLOCKED ise hangi ölçütlerin neden engel olduğunu göster ve bunları mümkün olduğu ölçüde gider.
- Batch 02'nin gerekli görevleri, testleri, belgeleri ve release kriterleri tamamlanmadan `v0.2.0-batch-02` oluşturma.
- Son raporda tamamlanan işler, birleştirilen PR'lar, commit SHA'ları, test sonuçları, kalan doğrulanmamış kriterler ve kullanıcının yapması gereken varsa yalnızca zorunlu manuel adımlar yer alsın.

## 6. Çalışma biçimi

Küçük ve geri alınabilir kararları kendin al. Gerçek kapsam çelişkisi, güvenlik riski veya yalnızca kullanıcının sağlayabileceği kanıt dışında gereksiz onay turları oluşturma.

Her görevi izole şekilde bitir, sonuçları doğrula ve sıradaki bağımlı göreve geç. Herhangi bir engel ortaya çıktığında işi genel olarak bırakma; engellenen maddeyi kaydet ve bağımsız olarak tamamlanabilecek diğer görevlerde ilerle.

Nihai hedef: NetCheck'i dürüstçe doğrulanmış, belgelenmiş, release gate'i geçmiş ve Batch 02 teslimatına hazır hâle getirmek.
```

## Plan

İstem, her görevde önce kısa bir plan hazırlanmasını ve ayrı onay turu beklenmeden uygulanmasını istiyor. Plan bu yüzden onay beklemeden uygulandı; burada ve PR'da kayıtlı.

1. Görevin denetim istemini çalıştır: mevcut durum, `docs/course-compliance.md` satırları R11-a…f ile karşılaştırıldı. Tipler tek dosyadaydı (`src/types/netcheck.ts`); `LinkState`, `ScoreLevel`, `Tema`/`TemaTercihi` ve `Locale`/`InfoSlug` başka dosyalara dağılmıştı; `any` yoktu; `check` betiği ve `docs/veri-modeli.md` yoktu.
2. Tipleri beş dosyaya böl: bağlantı (`network.ts`), test sonucu (`diagnostic.ts`), rapor (`report.ts`), çalışma ortamı (`platform.ts`), tercihler (`preferences.ts`); `index.ts` hepsini dışa aktarsın.
3. İçe aktarmaları `$lib/types`'a taşı, eski dosyayı sil.
4. Örnek veriyi tek dosyaya yaz; hiçbir ekran içe aktarmasın (karar C-1).
5. `@astrojs/check` ekle, `check` betiğini yaz.
6. `docs/veri-modeli.md` yaz; AGENTS.md, `docs/proje-fikri.md`, `docs/klasor-mimarisi.md`, uyum matrisi ve `lat.md`'yi güncelle.

## Düzeltmeler ve kararlar

- **C-1 (örnek veri ve sahte veri yasağı):** genel yetkiyle karar verildi. Kayıtlar belgeleme adres aralıklarını (RFC 5737, 3849, 7042) kullanıyor, yalnız tip örneği; hiçbir ekran, store ya da komut içe aktarmıyor. Sınır AGENTS.md § 4'e yazıldı. Eğitmen onayı bekleniyor.
- **Sabit seçenekler:** Rust'un sonuç kodları (`DiagnosticCode`) ve işletim sistemi adları (`OsName`) serbest `string` iken birleşim tipi yapıldı. `labels.ts` bu tipleri kullanıyor; tip dışı bir kod gelirse yine "Test tamamlanamadı." gösterilir.
- **`check` betiği** `astro check` ile birlikte `svelte-check`'i de çalıştırıyor, çünkü `astro check` `.svelte` dosyalarını denetlemiyor.
- **Tek kaynak:** `docs/proje-fikri.md` § 4'teki alan tablosu kaldırıldı, yerine `docs/veri-modeli.md` bağlantısı kondu.
- Bileşenlerin kendi `Props` arayüzleri bileşende kaldı; AGENTS.md kuralı bunu açıkça istisna tutuyor.
- Dosya adları İngilizce (`network.ts` …); AGENTS.md § 4 "yeni kod tanımlayıcıları İngilizcedir" diyor.

## Doğrulama

- `bun run check`: `astro check` 29 dosya, 0 hata, 0 uyarı, 1 ipucu (`CanliRozet.tsx` içinde kullanılmayan `React`; önceden vardı, NC-18). `svelte-check` 755 dosya, 0 hata, 0 uyarı.
- `bun run build`: 21 sayfa, `Complete!`, 0 hata.
- **Görünüm değişmedi:** 21 HTML sayfasının 17'si önceki dalın derlemesiyle bayt bayt aynı. Kalan 4'ünde (`/`, `/ayarlar`, `/rapor`, `/tanilama`) tek fark, `labels.ts` değiştiği için JS paket adlarının karması; CSS dosyaları aynı.
- **Örnek veri:** altı raporun skoru `src/lib/score.ts` `computeScore` ile yeniden hesaplandı, hepsi beyan edilen değere eşit. Geçen ve kalan test sayıları tutarlı, kimlikler `NCHK-YYYY-XXXXXXXX` biçiminde ve benzersiz. Belgeleme aralığı dışındaki tek adresler uygulamanın sabit hedefleri 1.1.1.1 ve 8.8.8.8.
- `git grep "veri/ornek" -- src`: sonuç yok, yani hiçbir dosya örnek veriyi içe aktarmıyor.
- `any` araması (`: any`, `as any`, `<any>`, `any[]`): sonuç yok.
- Rust değişmedi; `cargo test` bu görevde çalıştırılmadı.
- `lat check`: geçti. Değişen yedi Markdown dosyasında 84 bağlantı ve başlık çapası: kırık yok. `git diff --check`: temiz.
- CI sonucu PR'da.

## Bilinen sınırlamalar ve açık maddeler

- **Öğrencinin kendi doğrulaması ve ekran görüntüleri yok** (görev § 3 ve kontrol listesi): `bun run check` ve `bun run build` çıktısının öğrencinin makinesinde alınması, uygulamanın açılıp ekranların aynı göründüğünün elle denenmesi.
- C-1 kararı eğitmen tarafından onaylanmadı.
- CI `bun run check` yerine yalnız `svelte-check` çalıştırıyor; iş akışını değiştirmek bu görevin kapsamında değil.

## PR

[#36](https://github.com/frudotz/netcheck/pull/36) (taban: #35'in dalı).
