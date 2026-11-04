# İstem günlüğü — Yetkiler / İzinler (Görev 31-36)

## İstem
qLar izin desenini örnek alarak izin altyapısı ekle: permissions_status (asla diyalog açmaz) ve
permission_request; gerçek izin bildirim ("Ağ bağlantısı durumu bildirimi"). /izinler ekranı; Rust yalnız native.ts üzerinden.

## Uygulandı
permissions.rs, lib.rs (tauri-plugin-notification + komut kaydı), Cargo.toml, capabilities/default.json
(notification:default), native.ts, types/izin.ts, /izinler sayfası + Izinler.svelte, docs/izinler.md.

## Doğrulama
bun run build ve cargo check sonucu PR'da belirtildi. Canlı bildirim masaüstü/cihaz derlemesinde görünür.

## Not
Öğretim görevlisi tarafından başlangıç (scaffold) olarak gönderildi; öğrenci inceleyip merge eder.
