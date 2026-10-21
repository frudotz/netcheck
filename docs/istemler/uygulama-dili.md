# Uygulama Dili (Görev 12–14 hazırlığı)

Numarasız iş: Görev 12, 13 ve 14'ün doğrulama adımları uygulamada dil değiştirmeyi istiyor ("Dili Arapça ya da Farsça yapın", "Dili değiştirin: üç durumun metinleri de çevriliyor mu?", "Detay ekranı dört dilde derlenir"). Uygulama ekranları yalnız Türkçeydi (çelişki C-2). Dal: `feature/uygulama-dili`, Görev 11 dalının üstünde (zincirleme).

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-21. Windows, PowerShell. Arayüz denemesi: Agent Browser 0.36.0, `bun run dev` (tarayıcı önizlemesi).

## Şartname

- **Amaç:** Kullanıcı uygulama dilini Ayarlar'dan TR / EN / AR / FA olarak seçebilsin; AR ve FA'da ekran sağdan sola dönsün; metinler sözlükten gelsin.
- **Kapsam dışı:** bütün eski metinlerin çevrilmesi (yalnız kabuk ve Ayarlar; Görev 12–14 kendi metinlerini ekleyecek); bilgi sayfalarının dil rotaları; Rust.
- **Kabul ölçütleri:**
  - Dil seçimi kalıcı (sayfa yenilenince ve ekranlar arası gezinmede korunuyor).
  - `<html lang dir>` uygulama ekranlarında değişiyor, bilgi sayfalarında rotanın dili korunuyor.
  - Başlık, menü ve Ayarlar dört dilde; 320 px'te yatay taşma yok.
  - `bun run check` ve `bun run build` 0 hata.
- **Dokunulacak dosyalar:** `src/lib/sozluk.ts` (yeni), `src/lib/dil.svelte.ts` (yeni), `src/layouts/Layout.astro`, `src/components/AppHeader.svelte`, `src/components/AppNav.svelte`, `src/components/Settings.svelte`, `src/lib/labels.ts`, `src/lib/i18n.ts`, `AGENTS.md`, `docs/mimari-agac.md`, `docs/klasor-mimarisi.md`, `docs/course-compliance.md`, `lat.md/`.
- **Doğrulama adımları:** `bun run check`; `bun run build`; tarayıcıda dil değiştirme, yenileme, gezinme, bilgi sayfası ve 320 px denemesi.

## İstem

Ayrı bir istem verilmedi; iş, Görev 11–16 için verilen genel istemin ("küçük ve geri alınabilir kararları kendin al") kapsamında yapıldı. Tam metin: [`11-veri-sozlesmesi.md`](11-veri-sozlesmesi.md), "İstem" bölümü.

## Plan

Genel istem ayrı onay turu istemediği için plan onay beklemeden uygulandı.

1. `src/lib/sozluk.ts`: Türkçe kaynak sözlük, diğer üç dil aynı anahtarlarla (tip denetimiyle zorunlu).
2. `src/lib/dil.svelte.ts`: seçili dil (`localStorage` anahtarı `dil`, varsayılan Türkçe).
3. `Layout.astro`: açılış betiği dili ilk çizimden önce ve her istemci gezinmesinden sonra uygular. Dili rotadan gelen sayfa `data-sabit-dil` taşır ve etkilenmez.
4. Başlık, menü ve Ayarlar sözlükten; Ayarlar'a dil seçimi; bilgi sayfası bağlantıları seçili dile gider.
5. AGENTS.md § 4 "Dil" kuralı, `lat.md` kararı ve uyum matrisi (C-2).

## Düzeltmeler ve kararlar

- **C-2:** genel yetkiyle karar verildi. AGENTS.md görev dosyalarını bağlayıcı sayıyor ve Görev 12–14 dil değiştirmeyi şart koşuyor. Eğitmen onayı bekleniyor.
- **Kısmi çeviri bilerek seçildi.** Yalnız sözlüğe taşınan metinler çevriliyor; kalan eski metinler Türkçe ve Ayarlar'daki dil notu bunu kullanıcıya söylüyor. Bütün uygulamayı tek PR'da çevirmek görevlerin istediğinden büyük ve riskliydi.
- `platformLabel` ve `icmpBackendLabel` yalnız Ayarlar'da kullanılıyordu; iki kopya kalmasın diye `labels.ts`'ten sözlüğe taşındı.
- Araç kaynaklı hata: Arapça ders adında Latin harfleriyle karışık bir yazım ("إستينye") vardı, düzeltildi.

## Doğrulama

- `bun run check`: `astro check` 31 dosya, 0 hata, 0 uyarı, 1 ipucu (önceden vardı, NC-18). `svelte-check` 757 dosya, 0 hata, 0 uyarı.
- **Tarayıcı denemesi** (Agent Browser, `bun run dev`, 420 × 900):
  - Dil yokken: `lang="tr"`, `dir="ltr"`, menü Türkçe, "Türkçe" seçili.
  - "العربية" tıklanınca: `lang="ar"`, `dir="rtl"`, başlık "الإعدادات", menü Arapça, `localStorage.dil = "ar"`, bilgi sayfası bağlantıları `/ar/...`.
  - Sayfa yenilenince dil ve yön korundu.
  - Menüden Geçmiş'e istemci gezinmesinde `lang="ar"`, `dir="rtl"` korundu ve aktif menü doğru.
  - Uygulama dili Arapçayken `/hakkinda` `lang="tr"` / `ltr`, `/en/gizlilik` `lang="en"` / `ltr` kaldı (`data-sabit-dil`).
  - "Türkçe" seçilince `lang="tr"`, `dir="ltr"`, kayıt silindi.
  - 320 × 700, Farsça: yatay taşma yok (`scrollWidth` 320 = `clientWidth`); dil düğmeleri iki satıra iniyor.
- Arapça Ayarlar ekranının görüntüsü araç tarafından alındı ve elle incelendi; depoya eklenmedi (görev dosyası istemiyor).
- Tauri uygulamasında (`bun run tauri dev`) denenmedi.

## Bilinen sınırlamalar ve açık maddeler

- Genel Bakış, Tanılama, İletişim formu ve `labels.ts` metinleri henüz Türkçe; Görev 12–14 kendi dokunduğu metinleri sözlüğe taşıyacak.
- Bilgi sayfalarındaki başlık ve menü, sayfanın değil uygulamanın dilini gösterir (önceden hep Türkçeydi).
- C-2 kararı eğitmen onayı bekliyor.

## PR

Bu günlüğü içeren PR'ın bağlantısı PR açıldıktan sonra eklenir.
