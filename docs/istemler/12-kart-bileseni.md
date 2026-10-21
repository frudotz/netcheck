# Görev 12 — Kart Bileşeni

Görev dosyası: [`docs/tasks/week-4/12-kart-bileseni.task.md`](../tasks/week-4/12-kart-bileseni.task.md). Dal: `feature/12-kart-bileseni`, `feature/uygulama-dili` dalının üstünde (zincirleme).

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-21. Windows, PowerShell. Arayüz denemesi: `bun run tauri dev` ile çalışan Windows uygulaması, WebView2 uzaktan hata ayıklama portu (`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222`) üzerinden CDP. Agent Browser bu portta bağlanırken takıldığı için küçük bir CDP betiği kullanıldı (AGENTS.md § 5'teki yöntem).

## Şartname

- **Amaç:** Listelerde tek, veri tipini tanımayan bir kart bileşeni; ana ekranda kullanılması.
- **Kapsam dışı:** Geçmiş ve rapor ekranları (Görev 13 ve 14); Tanılama ekranı; Rust.
- **Kabul ölçütleri:**
  - `src/lib/components/ui/Kart.svelte`: başlık, alt metin, görsel (isteğe bağlı), etiket (isteğe bağlı), etiket türü (bilgi, başarı, uyarı, hata) ve tıklama davranışı.
  - Girdi tipi `src/lib/types/ui.ts` içinde; kart uygulamanın veri tiplerini içe aktarmıyor.
  - Renk, boşluk ve köşe değerleri yalnız `app.css` değişkenlerinden; sabit renk kodu yok.
  - Görselsiz, çok uzun başlıkla ve AR/FA düzeninde bozulmuyor.
  - Klavyeyle odaklanıyor, Enter ile açılıyor; görselin alternatif metni var.
  - Ana ekranda bu kartla en az 6 öğe; eski ekrana özel kart kodu silinmiş.
- **Dokunulacak dosyalar:** `src/lib/components/ui/Kart.svelte` (yeni), `src/lib/types/ui.ts` (yeni), `src/lib/types/index.ts`, `src/components/Overview.svelte`, `src/components/ScoreGauge.svelte`, `src/lib/score.ts`, `src/lib/sozluk.ts`, `src/styles/app.css`, `docs/branding.md`, `docs/klasor-mimarisi.md`, `docs/course-compliance.md`, `lat.md/`.
- **Doğrulama adımları:** `bun run check`; `bun run build`; çalışan uygulamada kart sayısı, Tab/Enter, Arapça RTL, uzun başlık ve 320 / 420 / 1280 px taşma denetimi.

## İstem

Ayrı bir istem verilmedi; Görev 11–16 için verilen genel istem geçerli. Tam metin: [`11-veri-sozlesmesi.md`](11-veri-sozlesmesi.md), "İstem" bölümü.

## Plan

Genel istem ayrı onay turu istemediği için plan onay beklemeden uygulandı.

1. `types/ui.ts`: `KartOzellikleri`, `EtiketTuru`, `KartGorseli` (görselin `alt` alanı zorunlu).
2. `Kart.svelte`: `href` verilirse `<a>`, `onclick` verilirse `<button>`, ikisi yoksa düz kart. Ortak içerik tek bir Svelte snippet'inde.
3. Bilgi etiketi için `--durum-bilgi` / `-zemin` değişkenleri yoktu: önce `docs/branding.md`'ye (kontrast oranıyla), sonra `app.css`'e eklendi.
4. Genel Bakış: "Ağ Bilgileri" satırları (7) ve "Ağ Arayüzleri" listesi karta çevrildi, eski `.arayuz` / `.rozet` / `dl` kodu silindi. Ekran yeniden kurulduğu için bütün metinleri sözlüğe (dört dil) taşındı.
5. Etkileşimli kart kullanımı olarak "Son rapor" bağlantısı karta çevrildi.

## Düzeltmeler ve kararlar

- **Kart sınıf adı:** etiket sınıfı önce `.etiket` idi; `app.css`'teki global `.etiket` kuralı karta da uygulanacağı için `.kart-etiket` yapıldı.
- **RTL hatası:** Arapça görünümde "2 ms" gecikmesi "ms 2" okunuyordu. Global `.mono` sınıfına `direction: ltr; unicode-bidi: isolate` eklendi; adres, kimlik ve gecikme her dilde soldan sağa okunur.
- **Ölçüm hatası:** RTL'de başlığın sağa yaslandığını ilk denemede öğe kutusuyla ölçtüm; başlık kutusu kartın tüm genişliğini kapladığı için ölçüm geçersizdi. Metnin kendisi (`Range.getClientRects`) ile yeniden ölçüldü.
- **Ortak metinler:** `ScoreGauge` seviye adları sözlüğe taşındı (`score.ts`'teki `scoreLevelLabel` silindi). `SCORE_NOTE`, `connectionTypeLabel` ve "Kullanılamıyor" gibi değerler Tanılama ve Rapor ekranları için geçici olarak `labels.ts` / `score.ts`'te de duruyor; Rapor ekranı Görev 14'te taşınacak.

## Doğrulama

- `bun run check`: 0 hata, 0 uyarı (önceden var olan 1 ipucu).
- `bun run build`: 21 sayfa, `Complete!`, 0 hata. `lat check`: geçti. Değişen belgelerde 49 bağlantı: kırık yok. `git diff --check`: temiz.
- `Kart.svelte` içinde hex/rgb değeri: 0. Veri tipi içe aktarımı: yok (yalnız `KartOzellikleri`).
- **Çalışan uygulamada** (Windows, `bun run tauri dev`, gerçek ağ):
  - Ana ekranda 13 kart: 7 ağ bilgisi, 5 arayüz, 1 son rapor. Varsayılan arayüzde "Varsayılan" etiketi var; eski kart sınıflarından öğe sayısı 0.
  - Tab ile 8. adımda "Son rapor" kartı odak aldı, `:focus-visible` halkası çizildi (`outline: solid`), Enter `/rapor?id=…` sayfasını açtı.
  - Arapça (`dir="rtl"`): başlık metni kartın sağına yaslı. Kart başlığı 8 satıra kırılan çok uzun bir metinle değiştirildi (ayrılmaz uzun kelime dahil).
  - 320, 420 ve 1280 px'te sayfa ve kart taşması 0; etiketler kart içinde.
  - "2 ms" düzeltmeden sonra `direction: ltr`, `unicode-bidi: isolate` ile doğru okunuyor.
- Ekran görüntüleri yalnız araç incelemesi için alındı ve silindi: gerçek genel ve yerel IP adreslerini gösteriyordu (AGENTS.md § 5).
- Görsel girdisi: tip `alt`'ı zorunlu kılıyor ve bileşen `alt`'ı bağlıyor; uygulamada görsel kullanan ekran olmadığı için çalışırken denenmedi.

## Bilinen sınırlamalar ve açık maddeler

- **Görev § 3'teki adımları öğrencinin kendisi yapmalı ve ekran görüntülerini günlüğe eklemeli.** Görüntüler gerçek ağ adreslerini gösterdiği için eklenmeden önce maskelenmeli.
- Görsel girdisi gerçek bir ekranda kullanılmıyor.
- Tanılama ekranı ve `labels.ts` metinleri henüz Türkçe.

## PR

[#38](https://github.com/frudotz/netcheck/pull/38) (taban: #37'nin dalı).
