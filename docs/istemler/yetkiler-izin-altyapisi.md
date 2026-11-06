# Yetkiler / İzinler (izin şeffaflığı ekranı)

Numarasız iş; günlük dal adıyla tutulur ([`README.md`](README.md)). Dal: `feature/yetkiler-izin-altyapisi`, PR #52. Kaynak: öğretim görevlisinin haftalık konusu ("Uygulamanız yalnız gerçekten kullandığı izni istemeli. Açıklayamadığınız izin bir zafiyettir.") ve eğitmenin başlangıç (scaffold) olarak gönderdiği ilk commit (`a2fc4c9`).

## Araç ve model

Claude Code, Claude Fable 5.1 (`claude-fable-5-1`), 2026-11-04 (denetim) ve 2026-11-06 (yeniden düzenleme). Windows, PowerShell. Telefon bağlı değil; Android x86_64 debug APK yerelde derlendi.

## Şartname

- **Amaç:** Uygulamanın gerçekten ihtiyaç duyduğu izinleri açıklayan, gereksiz yetki istemeyen ve platform farklarını dürüstçe gösteren bir izin şeffaflığı ekranı (`/izinler`). Bildirim eklentisi, bildirim izni ve ilişkili yetkiler projeye girmez.
- **Kapsam dışı:** bildirim özelliği tasarlamak; çalışma zamanı izni isteyen komut; yeni Tauri capability; mevcut komutların güvenlik sınırlarını değiştirmek; SQLite arka ucu; etiket/sürüm işlemleri.
- **Kabul ölçütleri:** `tauri-plugin-notification` bağımlılık ağacında yok; `Cargo.lock` `master` ile aynı; capability yalnız `core:default` + `opener:default`; Android manifesti yalnız `INTERNET` + `ACCESS_NETWORK_STATE`; `/izinler` dört dilde üç durumla (yükleniyor / hata / dolu) çiziliyor; `bun run build`, `bun run check`, `cargo check --locked`, `cargo test --locked`, `git diff --check`, `lat check` temiz.
- **Dokunulacak dosyalar:** `src-tauri/Cargo.toml`, `Cargo.lock`, `capabilities/default.json`, `src-tauri/src/lib.rs`, `src-tauri/src/platform/{mod,permissions}.rs`, `src/lib/{native,sozluk}.ts`, `src/lib/types/{index,permission}.ts`, `src/components/{Permissions,Settings,AppNav}.svelte`, `src/pages/izinler.astro`, `docs/{izinler,komutlar,veri-modeli,platform-destegi,klasor-mimarisi,mimari-agac}.md`, `lat.md/{architecture,decisions,project,tests,frontend}.md`, `AGENTS.md`, bu günlük.

## İstem

İki istem verildi. 2026-11-04, denetim (ilgili kısmı):

```text
PR #52'yi bağımsız bir güvenlik, kod kalitesi, platform uyumluluğu ve kullanıcı deneyimi denetiminden geçir. [...] Yalnızca test butonunun bulunmasını gerçek uygulama özelliğinin varlığı olarak kabul etme. Gerçek kullanım henüz yoksa bunu açıkça belirt. [...] Bu ilk aşama yalnızca denetimdir. Değişiklik yapmadan raporu sun.
```

2026-11-06, yeniden düzenleme (ilgili kısmı):

```text
Alınan karar: A seçeneği — Kapsamı daralt. NetCheck mevcut haliyle ağ tanılama uygulamasıdır. Gerçek bir bildirim özelliği bulunmadığından bildirim eklentisi, bildirim izni ve bunlarla ilişkili gereksiz yetkiler projeye eklenmeyecektir. [...] /izinler rotasını koru. Bu ekran artık runtime izin isteme ekranı değil, uygulamanın izin envanterini ve gerekçelerini açıklayan bir güvenlik/şeffaflık ekranı olacaktır. [...] Uygulamanın yalnızca statik olarak açıklayabildiği bir izni gerçek zamanlı sistem izni gibi göstermesini engelle.
```

## Plan

Denetim raporunun önerisi (A seçeneği) kullanıcı tarafından seçildi; ikinci istem planın kendisidir.

1. PR dalını ayrı bir worktree'ye al (çalışma kopyası başka dalda); HEAD `a2fc4c9`, taban `master` `458f1ee`.
2. Bildirim altyapısını kaldır: eklenti, capability satırı, `permissions.rs`, üç komut, `Izinler.svelte`, `native.ts` ve tip eklemeleri. `Cargo.lock` eklenti kaldırılınca `cargo check` ile budanır; başka sürüm değişmez.
3. Envanteri Rust'ta tek kaynak olarak yaz (`platform/permissions.rs`, platforma göre seçilen sabit tablolar) ve tek komutla (`get_permission_inventory`) ön yüze ver. Komut durum okumaz, diyalog açmaz.
4. `/izinler` ekranını `Permissions.svelte` olarak yeniden yaz: `Yukleniyor` / `HataDurumu` / dolu; metinler dört dilde sözlükte; Ayarlar'dan bağlantı; alt menüde Ayarlar sekmesi etkin.
5. Manifest, `Info.plist` ve capability dosyasıyla tutarlılığı `cargo test` ile denetle.
6. Belgeleri ve `lat.md`'yi güncelle; günlüğü kurala uygun adla (`yetkiler-izin-altyapisi.md`) yeniden yaz.

## Düzeltmeler

Denetim raporundaki bulguların karşılığı:

| Bulgu (denetim) | Yapılan |
|---|---|
| P0 Bildirimi kullanan özellik yok | Eklenti, izin, komutlar ve test düğmesi kaldırıldı; gerekçe `docs/izinler.md` |
| P0 Eklentinin Android manifestine `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` ve önyükleme alıcıları eklemesi | Eklenti bağımlılık ağacında yok; x86_64 debug APK'nın birleşik manifesti aşağıda |
| P1 `notification:default` gereksiz ve geniş | Capability `master` ile aynı: `core:default`, `opener:default` |
| P1 `permission_request` senkron komut, mobilde UI sonucunu bekliyor | Komut kaldırıldı; çalışma zamanı izni isteyen hiçbir komut yok |
| P1 Masaüstünde sahte "granted" | Canlı durum hiç gösterilmez; ekran statik envanteri "bildirildi / gerekmez / istenmiyor / doğrulanmadı" olarak açıklar |
| P1 Doğrulanmamış "bildirim gönderildi" | Kaldırıldı |
| P2 Ön yüzden ham metin | Komut girdi almaz |
| P2 `unsupported` üretilmiyor, `_` kolu | Durum enum'u Rust ve TS'te kapalı küme; tüm kollar açık |
| P2 Üç durum kuralı, `HataDurumu`, tipli hata | `Yukleniyor` / `HataDurumu` / dolu; çağrı `native.ts` `call()` üzerinden, hata ham gösterilmez |
| P3 `can_request` snake_case, sabit Türkçe metin, `__TAURI_INTERNALS__` tekrarı | `rename_all = "camelCase"`; 52 sözlük anahtarı dört dilde; `hasNative()` ve `call()` kullanılır |
| P3 Belgeler ve günlük | Aşağıdaki belgeler güncellendi; günlük yeniden adlandırıldı |

Yapılmayanlar: denetimde "düzeltilmesi gerekenler" olarak sayılan ama bildirim özelliğine bağlı maddeler (reddedilen izin için ayarlara yönlendirme, `visibilitychange` ile yenileme) artık konu dışı; envanter statik olduğu için yenileme gerekmez.

## Doğrulama

Dal ucunda, Windows, worktree:

- `bun install --frozen-lockfile`: 317 paket, `bun.lock` değişmedi.
- `bun run build`: 33 sayfa, 0 hata.
- `bun run check`: astro check 0 hata, 0 uyarı (önceden var olan 1 ipucu `CanliRozet.tsx`); svelte-check 0 hata, 0 uyarı.
- `cargo check --locked`: başarılı. `Cargo.lock` `master` ile birebir aynı (`git diff origin/master -- src-tauri/Cargo.lock` boş).
- `cargo test --locked`: 58 geçti, 0 başarısız (54 + 4 yeni envanter testi; macOS'a özgü test CI'da).
- `cargo tree --locked -i tauri-plugin-notification`: "did not match any packages".
- `git diff --check`: temiz. `lat check`: geçti.
- Eski komutlara referans: `grep -rn "permissions_status\|permission_request\|bildirim_gonder\|izinDurumu\|izinIste\|bildirimGonder\|notification" src src-tauri/src` boş.
- **Android** (`bun run tauri android build --debug --target x86_64 --apk`, 2026-11-06): APK üretildi. Üretilen `tauri.settings.gradle` yalnız `tauri-android` ve `tauri-plugin-opener` projelerini içerir. Birleşik manifest (`build/intermediates/merged_manifest/universalDebug/.../AndroidManifest.xml`) `uses-permission` olarak yalnız `INTERNET`, `ACCESS_NETWORK_STATE` ve AndroidX'in kendi `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` tanımını içerir; `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` ve `app.tauri.notification` alıcıları yoktur. Tek alıcı AndroidX `ProfileInstallReceiver` (master ile aynı). APK cihaza yüklenmedi.
- **Tarayıcıda** (geliştirme sunucusu 127.0.0.1:1420, başsız Chromium, agent-browser, Rust yok): `/izinler` TR/EN/AR/FA'da `HataDurumu` içinde o dilin `izinlerYalnizUygulamada` metnini gösterir; `<html lang dir>` `tr ltr` / `en ltr` / `ar rtl` / `fa rtl`.
- **Çalışan Windows uygulamasında** (`bun run tauri dev`, WebView2 CDP 9222, agent-browser, 2026-11-06): Ayarlar → "İzinler ve gerekçeleri →" bağlantısı `/izinler`'e götürür; alt menüde Ayarlar sekmesi etkin kalır. Dört dilde de yükleniyor ve hata yok, 6 kart: "Bildirilen ve gerekli izinler" (İnternet erişimi · Gerekli · Bu platformda izin gerekmez; Bağlantıyı tarayıcıda açma · İsteğe bağlı · `opener:default` · Bildirildi) ve "İstenmeyen izinler" (Bildirimler, Konum, Kamera, Mikrofon · İstenmiyor). Her satırda "Çalışma zamanı diyaloğu: Sorulmaz"; platform satırı "Masaüstü uygulaması · Windows". Uygulama verisi (dil) denemeden sonra geri alındı.

## İkinci inceleme düzeltmeleri (06.11)

| Bulgu | Yapılan |
|---|---|
| iOS `local-network` kaydı `unverified` olduğu hâlde `runtime_prompt: false` ve ekranda kesin "Sorulmaz" | `runtime_prompt` üç durumlu (`Some(false)` / `Some(true)` / `None`), TS'te `boolean \| null`; yalnız doğrulanmamış kayıt `None`; ekranda "Doğrulanmadı" (dört dilde `izinCalismaZamaniDogrulanmadi`, ayrıca `izinCalismaZamaniVar`). Test: `None` yalnız `unverified` kayıtlarda olabilir. Diğer kayıtlar değişmedi |
| Manifest testi yalnız kaynak dosyayı okuyor; Gradle birleşmesinin eklediği izinleri yakalamıyor | Yeni test `merged_android_manifest_declares_exactly_the_inventory`: `NETCHECK_MERGED_MANIFEST` ile verilen birleşik manifestte `<uses-permission>` adları (AndroidX'in uygulama kimliğiyle tanımladığı `<permission>` hariç) tam olarak envanter; `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` ve `app.tauri.notification` alıcısı yok. CI Android işi `aarch64` debug APK üretip testi değişkenle çalıştırır; dosya yoksa ya da uyuşmazsa iş başarısız olur |

Doğrulama (06.11, worktree): `cargo test --locked` 59/59; `NETCHECK_MERGED_MANIFEST` ile yerel x86_64 debug APK'nın birleşik manifestine karşı yeni test geçti; `bun run check` 0 hata; `bun run build` 33 sayfa; `git diff --check` ve `lat check` temiz. CI'daki APK adımı ilk kez bu commit'le çalışacak; sonucu push sonrası görülecek.

## Bilinen sınırlamalar ve açık maddeler

- Envanter statiktir: işletim sistemi ayarlarından değiştirilebilen bir izin olmadığı için canlı durum gösterilmez; böyle bir izin eklenirse bu ekranın tasarımı yeniden ele alınmalıdır.
- iOS "yerel ağ" satırı `unverified` kalır; fiziksel iPhone kaydı (NC-04) beklenir.
- macOS 15 ve sonrasının yerel ağ gizlilik istemi bu projede hiç gözlenmedi; envantere varsayımla eklenmedi, cihaz kaydı gelince değerlendirilir.
- iOS ve macOS derlemesi yalnız CI `cargo check` düzeyindedir; ekran bu platformlarda çalıştırılmadı.
- Linux'ta ekran çalıştırılmadı (CI derleme ve testler).

## PR

https://github.com/frudotz/netcheck/pull/52
