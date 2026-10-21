# Görev 15 — Rust Komutu: Tipli Sonuç ve Hata

Görev dosyası: [`docs/tasks/week-4/15-rust-komutu.task.md`](../tasks/week-4/15-rust-komutu.task.md). Dal: `feature/15-rust-komutu`, Görev 14 dalının üstünde (zincirleme).

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-21. Windows, PowerShell. Deneme ortamları:

- **Çalışan Windows uygulaması:** `bun run tauri dev`, WebView2 CDP portu 9224. Önceki pencere başka bir süreç tarafından kullanıldığı için farklı port seçildi.
- **Rust'sız tarayıcı:** başsız Edge.

## Şartname

- **Amaç:** Arayüzün Rust'a yaptırdığı işlerin yanıtı ve hatası baştan belli olsun; platform farkları tek yerden sorulsun.
- **Kapsam dışı:** yeni bir ağ özelliği; macOS/iOS'ta ek doğrulama (eğitmenin 21.10 yönlendirmesiyle ertelendi); SQLite arka ucunun komutları.
- **Kabul ölçütleri:**
  - Uygulamaya özgü komut; şablon komutu yok.
  - Başarıda yapı, başarısızlıkta türü belli hata; geçersiz girdide panik yok.
  - Bütün Tauri çağrıları `src/lib/native.ts` üzerinden.
  - Tarayıcıda çökme yok; sonuç ve hata tipleri `src/lib/types/` içinde.
  - Hata `HataDurumu` ile gösteriliyor; en az 2 Rust testi.
  - `docs/platform-destegi.md` ve AGENTS.md kuralı; `native.ts` içinde `platform()` ve `destekleniyorMu()`; `docs/komutlar.md`.
- **Dokunulacak dosyalar:**
  - Rust: `src-tauri/src/command_error.rs` (yeni), `src-tauri/src/diagnostics.rs`, `src-tauri/src/lib.rs`.
  - Ön yüz: `src/lib/types/command.ts` (yeni), `src/lib/types/ui.ts`, `src/lib/native.ts`, `src/lib/diagnostics.svelte.ts`, `src/lib/labels.ts`, `src/lib/score.ts`, `src/lib/sozluk.ts`, `src/components/ExternalLink.svelte`, `src/components/Diagnostics.svelte`, `src/components/Settings.svelte`, `src/components/Overview.svelte`.
  - Belgeler: `docs/komutlar.md` (yeni), `docs/platform-destegi.md` (yeni), `AGENTS.md`, `docs/course-compliance.md`, `lat.md/`.
- **Doğrulama adımları:** `cargo check --locked`, `cargo test --locked`; `bun run check`; `bun run build`; çalışan uygulamada geçersiz türle IPC çağrısı, gerçek tanılama ve dil değişimi; tarayıcıda hata hali; `native.ts` dışında Tauri çağrısı araması.

## İstem

Ayrı bir istem verilmedi; Görev 11–16 için verilen genel istem geçerli. Tam metin: [`11-veri-sozlesmesi.md`](11-veri-sozlesmesi.md), "İstem" bölümü.

## Plan

Genel istem ayrı onay turu istemediği için plan onay beklemeden uygulandı.

1. **Tipli hata:** platformdan bağımsız `CommandError` (`unknown_diagnostic { value }`, `task_failed`), JSON'da `{ "code": … }`. Komutlar `Result<_, String>` yerine bunu döndürür.
2. **`run_diagnostic` girdisi:** tür artık metin olarak gelir ve `FromStr` ile ayrıştırılır. Bilinmeyen değer, Tauri'nin ham serde hatası yerine tipli hata olur. Test hedefleri Rust'ta sabit kalır.
3. **Testler:** başarılı girdi, hatalı girdi (boş, büyük harfli, komut benzeri), JSON biçimi.
4. **`native.ts`:** tipli hatayı `CommandFailure` olarak fırlatır; `platform()`, `destekleniyorMu()`, `openExternal()`. `ExternalLink` doğrudan Tauri içe aktarmaz.
5. **Tanılama ekranı:** hata `HataDurumu` ile; ekran metinleri sözlüğe.
6. **Belgeler:** `docs/komutlar.md` ve `docs/platform-destegi.md` (yalnız doğrulanmış iddialar).

## Düzeltmeler ve kararlar

- **"Desteklenmeyen özellik görünmez" kuralı:** beş hedef platformda her özelliğin bir yolu var (ping her platformda farklı yöntemle). Bu yüzden pratikte hiçbir şey gizlenmiyor. Ping yöntemi olmayan bir derlemede `destekleniyorMu("ping")` false döner; ping testleri o zaman hiç çalıştırılmaz ve listede görünmez. Rust yine `ping_unsupported` döndürür (AGENTS.md "kullanılamıyor" kuralı).
- **Platform doğrulaması:** tablo, uygulama yolunu ve doğrulama düzeyini ayrı gösteriyor. macOS için PR #28'deki debug `.app` çalıştırması yazıldı. README ve Hakkında sayfalarındaki "macOS uygulama olarak çalıştırılmadı" cümlesi bu görevin kapsamında olmadığı için değiştirilmedi.
- **Kullanılmayan kopyalar:** `labels.ts`'te `errorMessage`, `DESKTOP_ONLY` ve `score.ts`'te `SCORE_NOTE` artık kullanılmıyordu, silindi. `labels.ts` yalnız rapora yazılan Türkçe değerleri tutuyor.
- **Araç kaynaklı hata:** `lat.md/architecture.md`'ye İngilizce metin içinde "Bileşenler" sözcüğü kaçmıştı, düzeltildi.

## Doğrulama

- `cargo check --locked`: uyarısız. `cargo test --locked`: 24/24 Windows'ta (toplam 25; macOS'a özgü test CI'da çalışır). Üç yeni test: `known_kinds_parse`, `unknown_kind_is_typed_error`, `errors_serialize_with_code`.
- `bun run check`: 0 hata, 0 uyarı (önceden var olan 1 ipucu). `bun run build`: 21 sayfa, 0 hata. `lat check`: geçti. Değişen belgelerde 94 bağlantı: kırık yok. Değişen dosyalarda Çince/Japonca karakter: 0. `git diff --check`: temiz.
- `native.ts` dışında `@tauri-apps/*` içe aktaran dosya: yok.
- **Çalışan uygulamada** (Windows, `bun run tauri dev`):
  - `invoke('run_diagnostic', { kind: 'foo' })` → `{"code":"unknown_diagnostic","value":"foo"}` döndü, uygulama çökmedi.
  - `native.ts` `runDiagnostic('foo')` → `CommandFailure`, `error.code === "unknown_diagnostic"`.
  - `runDiagnostic('dns')` → `status: success`, `code: ok`.
  - `platform()` → `{ os: "windows", family: "desktop", icmp: "icmp-api" }`; `destekleniyorMu("ping")` ve `("external-link")` → true.
  - Tanılama gerçek ağla Türkçe ve Arapça çalıştırıldı: hata yok, beş test başarılı, rapor oluştu. Arapçada test adları, durumlar ve Rust kodundan üretilen mesajlar çevrildi.
  - Bu denemede uygulamaya iki gerçek rapor eklendi (olağan kullanım).
  - Yeni raporun detay ekranı Arapça açıldı, mesajlar koddan çevrildi. Görev 14'ün Tauri'de denenemeyen kısmı böylece doğrulandı.
- **Rust'sız tarayıcıda** Tanılama "Tanılamayı Başlat": `HataDurumu` ("Ağ bilgileri yalnızca NetCheck uygulamasında alınabilir…", `role="alert"`, "Tekrar dene"), ekran çökmedi.

## Bilinen sınırlamalar ve açık maddeler

- **Görev § 3 adımlarını öğrenci kendisi yapmalı** (ekran görüntüleri dahil). Görev § 3.6 "elinizdeki her cihazda uygulamayı açın" öğrenciye ait.
- macOS, Linux ve iOS'ta bu görev çalıştırılmadı (eğitmenin yönlendirmesiyle ertelendi; tabloda düzeyler yazılı).
- README ve Hakkında sayfalarındaki macOS cümlesi hâlâ eski (NC-10).

## PR

Bu günlüğü içeren PR'ın bağlantısı PR açıldıktan sonra eklenir.
