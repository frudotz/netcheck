# Yönetim Panelini Projeye Taşıma

Kaynak gereksinim: eğitmenin 21.10.2026 tarihli durum raporu (depoya konmaz). Rapor, AI Studio ile ayrı depoda üretilen yönetim panelinin ana projeye (örneğin `admin/` klasörüne) taşınmasını ister. Taşınan panel proje kurallarına uymalıdır: dal ve PR, sabit renk kodu yok, metinler sözlükten. Ayrı depo bundan sonra arşivlenebilir. Görev dosyası yoktur; numarasız iş olduğu için günlük dal adıyla tutulur ([`README.md`](README.md)). Dal: `feature/admin-panel-tasima`, Görev 15 dalının üstünde (zincirleme).

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-21/22. Windows, PowerShell. Ekranların metin ve renk temizliği üç alt ajana bölündü; her biri ayrı dosya grubunda ve sözlüklerin ayrı bölümünde çalıştı, sonuçları ana oturum birleştirip doğruladı.

## Şartname

- **Amaç:** Yönetim paneli ayrı depoda kalmasın; ana projede, proje kurallarına uyan bir arayüz olarak dursun.
- **Kapsam dışı:** veri kaynağı, giriş, SQLite bağlantısı (karar C-3); PR #32'nin değiştirilmesi ya da birleştirilmesi; kaynak deponun arşivlenmesi (birleştirme ve doğrulamadan sonra, depo sahibi yapar); uygulama menüsüne panel bağlantısı.
- **Kabul ölçütleri:**
  - Panel kaynağı `admin/` altında; ekranlar mevcut Astro uygulamasının sayfaları; tek Bun projesi.
  - `admin/` içinde hex, rgb/rgba, hsl, Tailwind palet sınıfı ve `dark:` yok; renkler `app.css` token'larından.
  - Görünen her metin sözlükten; dört dil aynı anahtarlarla; Türkçe varsayılan.
  - Sahte kayıt, kişi, e-posta ya da IP yok. Veri ekranları "bağlı değil" durumunu gösterir; çalışamayacak denetim gösterilmez.
  - Uygulama sayfalarının CSS'i değişmez (yeni token dışında).
  - Her bağımlılığın gerekçesi yazılı (AGENTS.md §3.6).
  - `bun run check`, `bun run build`, `lat check` temiz; panel çalışan uygulamada ve tarayıcıda 420/1280 px, TR ve AR/RTL denenmiş.
- **Dokunulacak dosyalar:** `admin/` (yeni), `src/pages/admin/`, `src/layouts/AdminLayout.astro`, `astro.config.mjs`, `package.json`, `bun.lock`, `src/styles/app.css` (bir token), `docs/branding.md`, `docs/yonetim-paneli.md` (yeni), `docs/klasor-mimarisi.md`, `docs/mimari-agac.md`, `docs/kurulum.md`, `docs/course-compliance.md`, `AGENTS.md`, `lat.md/`.
- **Doğrulama adımları:** tip denetimi; renk ve metin taraması; ana uygulama CSS'inin önceki dalın derlemesiyle karşılaştırılması; çalışan uygulamada 11 ekranın gezilmesi; üretim derlemesinin tarayıcıda denenmesi; tema ve dilin uygulamayla paylaşıldığının denenmesi.

## İstem

Bu iş iki istemden gelir.

1. Görev 11–16 için verilen genel istem: [`11-veri-sozlesmesi.md`](11-veri-sozlesmesi.md), "İstem" bölümü. Panelle ilgili kısmı: "Gerekiyorsa panel entegrasyonunu ayrı bir UI odaklı PR'a taşı. Kaynak panel deposunu, entegrasyon ve doğrulama tamamlanmadan arşivleme veya silme."
2. Ondan önceki "Batch 02 Execution and AI Studio Admin Migration" isteminin panel bölümü, olduğu gibi:

```text
## Phase 4 — AI Studio admin panel migration plan

The instructor requires the AI Studio admin panel to be moved from its separate repository into the main NetCheck repository. The separate repository should only be archived after the migrated panel is merged and verified.

The initial migration must be UI-only:
- Proposed source directory: `admin/`.
- Integrate through the existing Astro application and routes.
- Keep one Bun project; do not add a second package manager/project root without justification.
- Do not connect SQLite, add login, or submit reports/messages to a backend in the initial migration.
- Do not add fake production data. Show honest empty or "not connected" states.
- Reuse the existing localization and text direction infrastructure.
- Keep all user-facing text in dictionaries. Turkish remains the default unless I explicitly decide otherwise.
- Remove hard-coded hex/rgba colors and Tailwind palette classes; use existing app design tokens and the `data-tema="gece"` theme.
- Justify each retained dependency as required by `AGENTS.md` §3.6.
- Update architecture and knowledge graph documentation only when supported by the merged implementation.

Compare the AI Studio repository and PR #32 before moving code. Reuse appropriate UI components, but do not blindly copy the SQLite wiring or merge PR #32.

PR #32 remains open and must not be merged by this task.
```

## Plan

Genel istem ayrı onay turu istemediği için plan onay beklemeden uygulandı. Taşıma planı daha önce kullanıcıya sunulmuştu (aşama 1: "yalnız arayüz, kurallara uygun, veri ve giriş yok").

1. Kaynağı (`b5ba95d`) ayrı bir commit'te olduğu gibi kopyala; örnek veri, ikinci token dosyası ve AI Studio/Vite dosyalarını alma.
2. Veri arayüzünü "bağlı değil" uygulamasıyla değiştir; veri ekranlarının yerine durum açıklaması göster.
3. Yönlendiriciyi Astro sayfalarıyla değiştir (`/admin/<ekran>`, rapor `?id=`).
4. Tailwind paletini kapat, renkleri token'lara eşle; sabit renkleri, palet sınıflarını ve `dark:` öneklerini kaldır.
5. Bütün metinleri sözlüğe taşı; tema ve dili uygulamanın anahtarlarıyla paylaş; çekirdek tipleri `src/lib/types/`'tan al.
6. Doğrula, belgele, PR aç.

## Düzeltmeler ve kararlar

Genel yetkiyle verilen küçük ve geri alınabilir kararlar ([`docs/course-compliance.md`](../course-compliance.md) RA-f ve açık sorular bölümünde de yazılı):

- **Bağımlılıklar:** Tailwind (geliştirme bağımlılığı) ve `lucide-react` tutuldu, `react-router-dom` alınmadı; gerekçeler [`docs/yonetim-paneli.md`](../yonetim-paneli.md) § Bağımlılıklar.
- **Veri ekranları:** Hedefler ve İçerik ekranları dahil bütün veri ekranlarının kodu depoda, ama bağlı değilken çizilmiyor. Hedef ve içerik düzenleyicilerinin kalıp kalmayacağı ayrı bir karar; bu PR onu çözmüyor.
- **Erişim:** panel `/admin` adresinde; uygulama menüsünden bağlantı yok (PR #32 da öyleydi). Statik derlemenin parçası olduğu için mobil paketlere de girer; panelin mobilde bulunup bulunmayacağı açık karar.
- **Dil:** panel dört dilli kaldı (kaynak panel de öyleydi), Türkçe varsayılan; C-2 kararıyla uyumlu.
- **Yeni token:** üst bar metni için `--renk-koyu-yazi` (`#ffffff`, iki temada aynı). Uygulama üst barı aynı beyazı bileşen içinde sabit yazıyor; o dosya NC-18 kapsamında, burada değişmedi.
- **Gölgeler:** Tailwind'in varsayılan siyah gölgeleri `--renk-koyu` tonlarıyla değiştirildi; derlenmiş panel CSS'inde `app.css` dışından gelen tek renk değeri Tailwind'in `#0000` (saydam) varsayılanı.
- **Alt ajan çıktılarının düzeltilmesi:**
  - Test adları ve bağlantı türleri için iki ayrı anahtar kümesi açılmıştı. İkisi de silindi; uygulamanın sözlüğündeki `testAdi` ve `baglantiTuruEtiketi` kullanılıyor.
  - Kullanılmayan 28 eski anahtar silindi. Her dilde 410 anahtar kaldı.
  - Üç ekran (Skor kuralları, Hedefler, İçerik) yükleniyor ve hata durumunu tutuyor ama hiç göstermiyordu, üstelik ham hata metnini saklıyordu. İki durum da artık gösteriliyor ve sözlük metni kullanılıyor.
- **Arayüz düzeltmeleri (denemede bulundu):**
  - 420 px'te "Yönetim" rozeti tema düğmesinin altında kalıyordu; rozet dar ekranda gizlendi.
  - 320 px'te logo yazısı sığmıyordu; dar ekranda tema seçimi yalnız Ayarlar'da.
  - Telefon menüsü Esc ile kapanmıyordu (dinleyici odak almayan katmandaydı); pencereye taşındı.
  - Uzun sayfada kenar menüsünün alt kısmı ekran dışında kalıyordu; menü yapışkan yapıldı.
- **Araç kaynaklı hata:** Tailwind eklentisi eklendikten sonra çalışan geliştirme sunucusu bağımlılıkları yeniden derlerken ilk yüklemede `_jsxDEV is not a function` görüldü. Sayfa yenilenince düzeldi; kod hatası değildi.

## Doğrulama

- **Tip denetimi:** `bunx tsc -p admin/tsconfig.json`: 0 hata. `bun run check`: 0 hata, 0 uyarı (85 dosya; panel dosyaları da denetleniyor).
- **Derleme:** `bun run build`: 32 sayfa, 0 hata (21 uygulama ve bilgi sayfası + 11 panel sayfası).
- **Renk taraması:** `admin/` içinde hex/rgb/hsl, palet sınıfı, `dark:` ve `outline-none` sayısı 0. Bulunan iki eşleşme açıklama satırları.
- **Metin taraması:** sözlük dışındaki Türkçe karakterler yalnız açıklama satırlarında. Dört sözlükte 410 anahtar, aynı küme, yer tutucular eşleşiyor. Çince/Japonca karakter 0.
- **Uygulama CSS'i:** önceki dal (`feature/15-rust-komutu`) ayrı çalışma ağacında derlendi. 21 uygulama sayfasının yüklediği CSS, yeni token dışında birebir aynı. Tailwind çıktısı yalnız panelin CSS dosyasında.
- **Çalışan Windows uygulaması** (`bun run tauri dev`, CDP 9224):
  - 11 panel ekranı TR gündüz 420 ve 1280 px, AR gece 1280 px, FA gece 420 px'te gezildi. Her ekranda başlık doğru, yatay taşma yok, veri ekranlarında hiç düğme, form ya da tablo yok.
  - RTL'de kenar menüsü sağda. Konsol hatası yok.
  - 320 px'te üst bar sığıyor (TR ve FA).
  - Telefon menüsü açılıyor (10 bağlantı) ve Esc ile kapanıyor.
  - Klavyeyle ilk odak "İçeriğe atla"; odak halkası görünüyor (3 px).
  - Panel Ayarlar'ında Gece ve English seçildi: uygulamanın `/` sayfası gece temasında ve İngilizce ("Overview") açıldı. Deneme sonunda tema, dil ve yoğunluk varsayılana döndürüldü.
- **Üretim derlemesi** (`bun run preview`, başsız Edge): aynı 44 ekran/boyut/dil kombinasyonu; başlıklar doğru, taşma yok, hata yok. Kenar menüsü uzun sayfada yapışkan kalıyor; RTL'de daraltma oku doğru yönde.
- `lat check`: geçti.

## Bilinen sınırlamalar ve açık maddeler

- **Panel bir veri kaynağına bağlı değil.** Ekranların kod yolları (tablolar, düzenleyiciler, onay pencereleri) tip denetiminden geçiyor ama çizilmedikleri için çalışırken denenmedi; bağlantı aşamasında (NC-11) denenmeli.
- **Kaynak depo** (`frudotz/netcheck-gorev-aistudio`) değiştirilmedi ve arşivlenmedi; birleştirme ve doğrulamadan sonra depo sahibi arşivler.
- **PR #32** değiştirilmedi. SQLite bağlantısı ve güvenlik bulguları NC-11'de bekliyor.
- macOS, Linux, Android ve iOS'ta panel açılmadı (macOS/iOS eğitmen yönlendirmesiyle ertelendi).
- Panelin uygulama içinden açılması ve mobil paketlerde bulunması açık karar (RA-f).

## PR

[#42](https://github.com/frudotz/netcheck/pull/42) (taban: #41'in dalı).
