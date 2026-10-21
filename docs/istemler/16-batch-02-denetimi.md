# Görev 16 — Batch 02 Denetimi

Görev dosyası depoda yok ([`docs/tasks/week-4/README.md`](../tasks/week-4/README.md): "Batch 02 denetimi (Görev 16) derste duyurulacak"). İstenen üç çıktı eğitmenin 21.10.2026 durum raporundaki tablodan alındı (rapor depoya konmaz): `tauri.conf.json` içinde `minWidth` / `minHeight`, `docs/ilerleme-batch-02.md`, `v0.2.0-batch-02` etiketi. Dal: `feature/16-batch-02-denetimi`, yönetim paneli dalının üstünde (zincirleme).

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-22. Windows, PowerShell; çalışan uygulama `bun run tauri dev` (WebView2 CDP 9224).

## Şartname

- **Amaç:** Batch 02 teslimatının durumunu tek yerde göstermek. Pencereye en küçük boyut vermek. Etiketin hangi koşulda atılacağını yazmak.
- **Kapsam dışı:** etiketin kendisi (PR'lar birleşmeden ve depo sahibi onaylamadan atılmaz); PR birleştirme (depo sahibi yapar); rubrikte olabilecek ama bilinmeyen maddeler.
- **Kabul ölçütleri:**
  - `tauri.conf.json` penceresinde `minWidth` ve `minHeight` var ve çalışan uygulamada uygulanıyor.
  - En küçük boyutta ekranlar kullanılabilir: yatay taşma yok, gezinme görünür.
  - `docs/ilerleme-batch-02.md` kontrol matrisini, doğrulama sonuçlarını, yayın kapısını ve birleştirme/etiket adımlarını içeriyor.
  - Uyum matrisi ve `lat.md` gerçek durumla eşleşiyor; belirsiz noktalar kayıtlı.
- **Dokunulacak dosyalar:** `src-tauri/tauri.conf.json`, `docs/ilerleme-batch-02.md` (yeni), `docs/course-compliance.md`, `docs/mimari-agac.md`, `docs/teslim.md`, `AGENTS.md`, `lat.md/` (frontend, workflows, tasks), bu günlük.
- **Doğrulama adımları:** pencere sınırının çalışan uygulamada okunması; ekranların en küçük boyutta denenmesi; `bun run build`, `bun run check`, `cargo test --locked`, `lat check`, bağlantı denetimi.

## İstem

Ayrı bir istem verilmedi; Görev 11–16 için verilen genel istem geçerli. Tam metin: [`11-veri-sozlesmesi.md`](11-veri-sozlesmesi.md), "İstem" bölümü. Etiketle ilgili kısmı: "Batch 02'nin gerekli görevleri, testleri, belgeleri ve release kriterleri tamamlanmadan `v0.2.0-batch-02` oluşturma." Önceki bir istem de etiketi "full rubric verification and my explicit approval" koşuluna bağlamıştı.

## Plan

Genel istem ayrı onay turu istemediği için plan onay beklemeden uygulandı.

1. **Pencere sınırı:** 320 × 480. Düzen en dar 320 px'te doğrulandı; 480 px yükseklikte üst bar, içerik ve alt menü birlikte sığar. Çalışan uygulamada denenecek.
2. **İlerleme belgesi:** Batch 01'deki [`teslim.md`](../teslim.md) biçiminde kontrol matrisi, doğrulama tablosu, yayın kapısı ve adımlar.
3. **Yayın kapısı:** depoda tanımlı bir kapı yok. Ölçütler eğitmen tablosundan, Hafta 04 kurallarından ve Batch 01 etiket adımından derlenecek; sonuç gerekçesiyle yazılacak.
4. **Uyum matrisi:** R16-a/b/c satırları ve C-4.

## Düzeltmeler ve kararlar

- **Değerler:** 320 × 480, görev dosyası olmadığı için seçildi; rubrik başka değer isterse tek satırla değişir. Uyum matrisinde (R16-a) ve [`ilerleme-batch-02.md`](../ilerleme-batch-02.md) içinde yazılı.
- **C-4 kaydedildi:** Görev 03 README'ye öğrenci numarasını yazdırıyor. Durum raporu ise kişisel verinin herkese açık depoya konmamasını istiyor. Bu PR çelişkiyi yalnız kaydediyor: numara silinmedi, geçmiş yeniden yazılmadı.
- **Etiket atılmadı:** R16-c FAIL olarak kayıtlı. Kapı BLOCKED; nedenleri PR'ların birleşmemiş olması ve onayın gerekmesi.
- **Yanlış deneme (aracın hatası):** pencere sınırını kullanıcı gibi denemek için ekranın köşesinden sentetik bir fare sürüklemesi gönderildi. Windows odak değişimini engellediği için tıklama, o an önde olan Chrome penceresine (bir YouTube sekmesi) gitti. Uygulama penceresi boyut değiştirmedi. Masaüstüne bir şey bırakılmadığı kontrol edildi; videonun oynatma durumu değişmiş olabilir. Fare otomasyonu bırakıldı. Sınır, girdi göndermeyen bir sorguyla doğrulandı (aşağıda).
- `SetWindowPos` ile programdan küçültme sınırı aşabiliyor (Windows en küçük boyutu yalnız kullanıcı yeniden boyutlandırırken uygular). Bu yüzden kanıt olarak kullanılmadı.

## Doğrulama

- **Pencere sınırı** (Windows, `bun run tauri dev`, `tauri.conf.json` değişince uygulama yeniden derlendi): pencere `WM_GETMINMAXINFO` sorgusuna en küçük izleme boyutunu 336 × 519 dış piksel olarak bildirdi. Pencere çerçevesi 16 × 39 ve DPI 96 olduğundan bu, **320 × 480 istemci alanı** demektir.
- **En küçük boyutta ekranlar** (CDP, 320 × 480): Genel Bakış, Tanılama, Geçmiş, Ayarlar, Hakkında, yönetim paneli Özet ve Ayarlar ekranlarında başlık doğru, yatay taşma yok, alt menü görünür. Telefon yatayı için ayrıca 480 × 320'de de aynı sonuç.
- `bun run build`: 32 sayfa, 0 hata. `bun run check`: 0 hata, 0 uyarı. `cargo test --locked`: 24/24 Windows'ta (toplam 25). `lat check`: geçti. Değişen belgelerde bağlantı denetimi: kırık yok.
- CI: #35–#42 son commit'lerinde 5/5 başarılı (#41 `392c5fd`, #42 `a42ac5b`).

## Bilinen sınırlamalar ve açık maddeler

- `v0.2.0-batch-02` etiketi yok (R16-c). PR'lar sırayla birleşince ve depo sahibi onaylayınca atılır; adımlar [`ilerleme-batch-02.md`](../ilerleme-batch-02.md) içinde.
- Görev 16 rubriği bilinmiyor. Pencere değerleri ve belge biçimi rubrikle karşılaştırılmadı.
- Pencere sınırı yalnız Windows'ta denendi; macOS ve Linux'ta denenmedi, mobilde etkisi yok.
- Öğrenci adımları açık: R10-d, R13-e ve görevlerin § 3 ekran görüntüleri.

## PR

[#43](https://github.com/frudotz/netcheck/pull/43) (taban: #42'nin dalı).
