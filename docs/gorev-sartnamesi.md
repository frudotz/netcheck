# Görev Şartnamesi

Her görevden önce doldurulan kısa şablon. Doldurulan şartname, görevin istem günlüğüne ([`docs/istemler/`](istemler/README.md)) "Şartname" başlığıyla konur; yapay zeka aracı planını bu şartnameye göre sunar. Çalışma sırası: [`AGENTS.md` § Çalışma döngüsü](../AGENTS.md#çalışma-döngüsü).

Kaynak her zaman görev dosyasıdır (`docs/tasks/`); şartname onu kısaltır, yerine geçmez. Görev dosyası bir proje kuralıyla çelişiyorsa şartnamede yazılır ve karar verilmeden uygulanmaz.

Alıntı satırları (`>`) NetCheck'ten örnektir; kendi görevinizde silip yerine yazın.

## Amaç

Bir iki cümle: ne değişecek ve kullanıcı ya da proje ne kazanacak.

> Tarayıcıda (`bun run dev`) açılan Tanılama ekranı Rust olmadan da çökmez; "yalnızca masaüstü uygulamasında" açıklaması görünür.

## Kapsam dışı

Bu görevde bilerek yapılmayacak işler. Yapay zeka aracının "bu arada şunu da düzelteyim" demesini önler.

> - Tanılama hedefleri değişmez; Rust'ta sabittir ([`AGENTS.md` § 6](../AGENTS.md#6-güvenlik-ve-kapsam-sınırları)).
> - Uygulama ekranlarının metinleri başka dile çevrilmez; yeni bağımlılık eklenmez.
> - SQLite arka ucuna (`src-tauri/src/backend/`) bağlanılmaz.

## Kabul ölçütleri

İşaretlenebilir maddeler. Her madde bir komut, bir ekran ya da bir dosyayla kanıtlanabilmeli.

> - [ ] Ekran tarayıcıda açıldığında hata yerine açıklama gösteriyor.
> - [ ] Tauri çağrıları yalnız [`src/lib/native.ts`](../src/lib/native.ts) üzerinden yapılıyor.
> - [ ] `bun run build` 0 hata; `bunx svelte-check --tsconfig ./tsconfig.json` 0 hata, 0 uyarı.

## Dokunulacak dosyalar

Değişmesi beklenen dosyalar ve nedeni. Listede olmayan bir dosyaya dokunmak gerekirse önce plan güncellenir.

> - `src/components/Diagnostics.svelte`: tarayıcı durumunu gösterir.
> - `src/lib/native.ts`: IPC'nin tek giriş noktası.
> - `docs/mimari-agac.md`: yalnız rota ya da sayfa değişirse.

## Doğrulama adımları

Sırayla çalıştırılacak komutlar ve elle denenecek adımlar. Sonuçlar istem günlüğüne olduğu gibi yazılır; çalıştırılmayan adım "geçti" sayılmaz.

> 1. `bun run build` → 0 hata ve sayfa sayısı.
> 2. `bun run dev` → Tanılama ekranı tarayıcıda açılır, açıklama görünür.
> 3. `bun run tauri dev` → aynı ekranda testler gerçek sonuç verir.
> 4. Rust değiştiyse `cd src-tauri && cargo test`; `lat.md/` değiştiyse `lat check`.
