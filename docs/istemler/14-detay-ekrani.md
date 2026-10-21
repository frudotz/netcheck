# Görev 14 — Detay Ekranı ve Gezinme

Görev dosyası: [`docs/tasks/week-4/14-detay-ekrani.task.md`](../tasks/week-4/14-detay-ekrani.task.md). Dal: `feature/14-detay-ekrani`, Görev 13 dalının üstünde (zincirleme).

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-21. Windows, PowerShell. Deneme: geliştirme sunucusu ve başsız Microsoft Edge (CDP).

## Şartname

- **Amaç:** Karta tıklayan kullanıcı raporun ayrıntısını görsün; detay ekranının kendi adresi olsun, geri dönüş listenin durumunu korusun.
- **Kapsam dışı:** Tanılama ekranı; rapor kimliğinin biçimi; Rust.
- **Kabul ölçütleri:**
  - Karta tıklayınca detay açılıyor ve adres kimliği içeriyor.
  - Geri dönüşte listedeki arama ve süzgeç korunuyor.
  - Olmayan kimlikte `HataDurumu` ya da "bulunamadı" ekranı görünüyor, boş sayfa değil.
  - Detay ekranı dört dilde; AR ve FA'da sağdan sola.
  - `docs/mimari-agac.md` sayfa ağacı güncel.
- **Dokunulacak dosyalar:** `src/components/ReportView.svelte`, `src/components/StatusBadge.svelte`, `src/components/History.svelte`, `src/lib/reports.svelte.ts`, `src/lib/diagnostics.svelte.ts`, `src/lib/types/diagnostic.ts`, `src/lib/sozluk.ts`, `src/lib/labels.ts`, `docs/mimari-agac.md`, `docs/veri-modeli.md`, `docs/course-compliance.md`, `lat.md/`.
- **Doğrulama adımları:** `bun run check`; `bun run build`; görev § 3'teki dört adım (üç karta tıklama, olmayan kimlik, süzgeçle gidip dönme, adresi doğrudan açma) ve dil değişimi.

## İstem

Ayrı bir istem verilmedi; Görev 11–16 için verilen genel istem geçerli. Tam metin: [`11-veri-sozlesmesi.md`](11-veri-sozlesmesi.md), "İstem" bölümü.

## Plan

Genel istem ayrı onay turu istemediği için plan onay beklemeden uygulandı.

1. Kimlik sorgu dizesinde kalır (`/rapor?id=`). Görev örnek olarak `/usta/3` veriyor, ama uygulama statik derleniyor ve raporlar yalnız cihazda var; kimlikli yollar önceden üretilemez ve Tauri paketinde 404 verir. Gerekçe `docs/mimari-agac.md`'ye yazıldı.
2. Geri dönüş: Geçmiş, arama ve süzgeçli adresini oturum belleğine yazar; rapordaki "← Geçmiş" bağlantısı oraya döner. Tarayıcının geri tuşu zaten adresteki süzgeçle döner (Görev 13).
3. Olmayan ya da eksik kimlik: `HataDurumu`, "Geçmişe dön" düğmesiyle.
4. Dört dil: rapor ekranındaki bütün metinler sözlüğe. Raporlarda test mesajı Türkçe metin olarak saklanıyordu. `DiagnosticTest`'e önce tiplerde (Görev 11 kuralı) isteğe bağlı `code` ve `detail` eklendi; mesaj seçili dilde bunlardan üretiliyor.
5. Ekrana `h1` eklendi; ertelenmiş NC-07'yi kapatıyor.

## Düzeltmeler ve kararlar

- **Eski raporlar:** `code` alanı olmayan raporlarda rapor anında saklanan Türkçe mesaj gösterilir. RTL'de bu metin noktayı başa alıyordu; mesaja `dir="auto"` eklendi.
- **Kullanılmayan kopyalar:** `labels.ts`'teki `connectionTypeLabel`, `UNAVAILABLE`, `NOT_FOUND`, `statusLabel` ve `reports.svelte.ts`'teki `formatDateTime` artık kullanılmıyordu; silindi, `lat.md` bağlantıları sözlüğe yönlendirildi.
- **Deneme ortamı:** önceki görevlerde kullanılan Tauri penceresine bu sırada başka bir süreç tarafından `127.0.0.1:8000` adresi açılmıştı (büyük olasılıkla benim önceki Agent Browser bağlantı denememin bağladığı varsayılan oturum üzerinden). O pencereye dokunulmadı. Görev 14 başsız Edge'de denendi. Rapor içeriği için `src/lib/veri/ornek.ts`'teki belgeleme adresli kayıtlar **yalnız bu tarayıcının deneme profiline** yüklendi; uygulamaya ya da depoya veri eklenmedi.

## Doğrulama

- `bun run check`: 0 hata, 0 uyarı. `bun run build`: 21 sayfa, 0 hata. `lat check`: geçti. Değişen belgelerde 56 bağlantı: kırık yok. `git diff --check`: temiz.
- **Görev § 3, başsız Edge, geliştirme sunucusu:**
  1. `/gecmis?seviye=zayif&ara=2026` ile açılan listede iki kart (skor 45 ve 15). İkisine tıklandı; `/rapor?id=NCHK-2026-0000000E` ve `…0F` doğru raporları açtı.
  2. `/rapor?id=NCHK-2026-99999999`: `HataDurumu` (`role="alert"`), "Rapor bulunamadı: NCHK-2026-99999999 kimlikli rapor bu cihazda kayıtlı değil." ve "Geçmişe dön"; sayfa boş değil. Kimliksiz `/rapor`: "Rapor bulunamadı: görüntülenecek bir rapor seçilmedi."
  3. "← Geçmiş" bağlantısı, `history.back()` ve "Geçmişe dön": üçü de `/gecmis?seviye=zayif&ara=2026`'ya döndü; arama kutusunda "2026", süzgeçte "zayıf", 2 kart.
  4. `/rapor?id=NCHK-2026-0000000C` doğrudan açıldı: aynı rapor (skor 82).
- **Diller:** İngilizce, Arapça ve Farsça'da başlık, geri bağlantısı, test adları, durum rozetleri, mesajlar ve ağ etiketleri çevrildi; AR ve FA `dir="rtl"`. Kodu olmayan eski raporda Türkçe mesaj `ltr` yönünde.
- Arapça detay ekranının görüntüsü incelendi ve silindi; görev bu ekran için görüntü istemiyor.

## Bilinen sınırlamalar ve açık maddeler

- **Görev § 3 adımlarını öğrenci kendisi yapmalı** (kontrol listesi); burada araç başsız tarayıcıda yaptı.
- Bu görev çalışan Tauri uygulamasında denenmedi; deneme penceresi o sırada başka bir süreç tarafından kullanılıyordu.
- Mevcut raporlarda (`code` alanı olmadan kaydedilmiş) test mesajları Türkçe kalır; yeni raporlar dört dilde gösterilir.
- Sayfa başlığı (`<title>`) Türkçe kalıyor.
- Dört dil kararı (C-2) eğitmen onayı bekliyor.

## PR

[#40](https://github.com/frudotz/netcheck/pull/40) (taban: #39'un dalı).
