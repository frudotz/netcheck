# İzinler (Yetkiler)

NetCheck yalnız gerçekten kullandığı izni ister. İlke: **açıklayamadığımız izni istemeyiz; açıklayamadığımız izin bir zafiyettir.** Bu belge uygulamanın her hedef platformda bildirdiği, gerektirmediği ve bilinçli olarak istemediği izinlerin tek gerekçe kaynağıdır. Kurallar [`AGENTS.md` § 6](../AGENTS.md#6-güvenlik-ve-kapsam-sınırları)'da, karar [`lat.md/decisions.md`](../lat.md/decisions.md) "Least-privilege mobile permissions" bölümündedir.

## Nasıl çalışır

- **Tek kaynak:** envanter [`src-tauri/src/platform/permissions.rs`](../src-tauri/src/platform/permissions.rs) içindeki sabit tablolardır; derleme hedefine göre biri seçilir. Ön yüz tipi [`src/lib/types/permission.ts`](../src/lib/types/permission.ts), komut `get_permission_inventory` ([`docs/komutlar.md`](komutlar.md)).
- **Statiktir:** liste işletim sisteminden okunmaz, hiçbir sistem izin diyaloğu açılmaz ve çalışma zamanı izni istenmez. Uygulamanın bugün çalışma zamanında istediği izin yoktur; bu yüzden "izin iste" komutu da yoktur.
- **Ekran:** `/izinler` ([`src/components/Permissions.svelte`](../src/components/Permissions.svelte)), Ayarlar → "İzinler ve gerekçeleri". Her kayıt için ad, tür, platform, teknik kimlik, gerekli / isteğe bağlı, durum, çalışma zamanı diyaloğu ("sorulmaz"; cihazda doğrulanmamış iOS yerel ağ kaydında "doğrulanmadı"), gerekçe ve etkilenen özellikler gösterilir. Metinler dört dilde [`src/lib/sozluk.ts`](../src/lib/sozluk.ts) sözlüğünden gelir. Tarayıcı önizlemesinde Rust olmadığı için "yalnızca uygulamada" mesajı görünür; durum uydurulmaz.
- **Tutarlılık testleri** (`cd src-tauri && cargo test permissions`): Android manifesti tam olarak envanterin bildirdiği izinleri içerir; iOS `Info.plist` hiçbir `UsageDescription` anahtarı taşımaz; [`capabilities/default.json`](../src-tauri/capabilities/default.json) yalnız `core:default` ve `opener:default` içerir; hiçbir kayıt çalışma zamanı diyaloğu bildirmez ve yalnız `unverified` kayıt bunu açık bırakır. Debug APK üretildikten sonra birleşik manifest de aynı envanterle karşılaştırılır (aşağıda). Yeni bir izin bu üç dosyadan birine eklenirse testler, envanter ve bu belge güncellenmeden kırılır.

## Durum değerleri

| Durum | Anlamı |
|---|---|
| `declared` | Manifest, `Info.plist` ya da capability dosyasında bildirildi; kurulum anında verilir, kullanıcıya sorulmaz |
| `not-needed` | Bu platform bu yetenek için izin kavramı tanımlamaz (masaüstü ve iOS'ta ağ erişimi) |
| `not-requested` | Uygulama bilinçli olarak istemez; yapılandırmada yoktur |
| `unverified` | Gerekip gerekmediği ve sistem diyaloğu açıp açmayacağı cihazda henüz doğrulanmadı; eklenmedi (`runtimePrompt: null`) |

## Envanter

Android ([`gen/android/app/src/main/AndroidManifest.xml`](../src-tauri/gen/android/app/src/main/AndroidManifest.xml)):

| İzin | Teknik kimlik | Gereklilik | Durum | Gerekçe | Etkilenen özellikler |
|---|---|---|---|---|---|
| İnternet erişimi | `android.permission.INTERNET` | Gerekli | Bildirildi (normal izin) | Ping, DNS ve HTTPS testleri ile genel IP sorgusu | Ağ bilgisi, ping, DNS, HTTPS |
| Ağ durumu | `android.permission.ACCESS_NETWORK_STATE` | Gerekli | Bildirildi (normal izin) | Bağlantı türü, ağ geçidi ve DNS sunucuları `ConnectivityManager`'dan okunur | Ağ bilgisi |
| Bağlantıyı tarayıcıda açma | `opener:default` (Tauri) | İsteğe bağlı | Bildirildi | Kaynak kod ve bilgi sayfası bağlantıları | Dış bağlantı |
| Wi-Fi durumu | `android.permission.ACCESS_WIFI_STATE` | — | İstenmiyor | Bağlantı hızı gösterilmez (D-48) | — |
| Bildirimler | `android.permission.POST_NOTIFICATIONS` | — | İstenmiyor | Bildirim üreten özellik yok | — |
| Konum / Kamera / Mikrofon | `ACCESS_FINE_LOCATION` / `CAMERA` / `RECORD_AUDIO` | — | İstenmiyor | Kullanılmaz | — |

`INTERNET` ve `ACCESS_NETWORK_STATE` Android'de **normal** (kurulum anı) izinlerdir: yükleme sırasında verilir, çalışma zamanı diyaloğu açılmaz ve kullanıcı ayarlardan geri alamaz. Uygulamanın Android'de çalışma zamanı izni yoktur.

iOS ([`gen/apple/netcheck_iOS/Info.plist`](../src-tauri/gen/apple/netcheck_iOS/Info.plist), boş entitlements):

| İzin | Teknik kimlik | Gereklilik | Durum | Gerekçe |
|---|---|---|---|---|
| İnternet erişimi | — | Gerekli | İzin gerekmez | iOS ağ erişimi için izin tanımlamaz |
| Yerel ağ | `NSLocalNetworkUsageDescription` | İsteğe bağlı | Cihazda doğrulanmadı | Ağ geçidi ping testi için gerekip gerekmediği fiziksel iPhone'da kararlaştırılacak (D-54, NC-04); anahtar eklenmedi |
| Bağlantıyı tarayıcıda açma | `opener:default` | İsteğe bağlı | Bildirildi | Dış bağlantılar |
| Bildirimler / Konum / Kamera / Mikrofon | `UNUserNotificationCenter` / `NSLocationWhenInUseUsageDescription` / `NSCameraUsageDescription` / `NSMicrophoneUsageDescription` | — | İstenmiyor | Kullanılmaz; anahtarlar `Info.plist`'te yoktur |

macOS: ağ erişimi izin gerektirmez; `opener:default` bildirilir; bildirim, konum, kamera ve mikrofon kullanım açıklaması anahtarları yoktur ve istenmez.

Windows ve Linux: masaüstü uygulaması için ağ izni kavramı yoktur; `opener:default` bildirilir; bildirim, konum, kamera ve mikrofon kullanılmaz (bu iki platformda teknik kimlik gösterilmez).

## Tauri yetkileri

[`capabilities/default.json`](../src-tauri/capabilities/default.json) yalnız `core:default` ve `opener:default` içerir. Uygulama komutları (`get_network_snapshot`, `run_diagnostic`, `generate_report_id`, `get_platform_info`, `get_permission_inventory`) capability gerektirmez; ön yüz onları yalnız [`src/lib/native.ts`](../src/lib/native.ts) üzerinden çağırır. Yeni bir eklenti yetkisi ancak onu kullanan bir özellik ve bu belgede bir gerekçe varsa eklenir.

## Birleşik Android manifesti

Kaynak manifest tek başına yeterli kanıt değildir: Gradle, bağımlılıkların (Tauri Android kitaplığı, eklentiler, AndroidX) manifestlerini birleştirir ve bir eklenti kendi izinlerini bu yolla ekleyebilir. Bu yüzden debug APK üretildikten sonra birleşik manifest de envanterle karşılaştırılır:

```bash
bun run tauri android build --debug --target x86_64 --apk
cd src-tauri && NETCHECK_MERGED_MANIFEST=gen/android/app/build/intermediates/merged_manifest/universalDebug/processUniversalDebugMainManifest/AndroidManifest.xml cargo test --locked merged_android_manifest
```

Test `merged_android_manifest_declares_exactly_the_inventory` yalnız `<uses-permission>` kayıtlarına bakar; AndroidX'in uygulama kimliğiyle tanımladığı `<permission>` (ör. `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`) uygulamanın talep ettiği bir izin değildir ve sayılmaz. Kalan `uses-permission` adları tam olarak `INTERNET` ve `ACCESS_NETWORK_STATE` olmalı, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` gibi istenmeyen izinler ve `app.tauri.notification` alıcıları bulunmamalıdır. Ortam değişkeni verilmezse test atlanır; CI'daki Android işi APK'yı üretip bu testi değişkenle çalıştırır, uyuşmazlıkta iş başarısız olur ([`.github/workflows/cross-platform.yml`](../.github/workflows/cross-platform.yml)).

## Bildirim eklentisi neden eklenmedi

PR #52'nin ilk sürümü `tauri-plugin-notification` eklentisini, `notification:default` yetkisini ve bir "test bildirimi" düğmesini ekliyordu. Bağımsız denetimde şunlar görüldü: bildirimi kullanan gerçek bir özellik yok; eklentinin Android kitaplığı manifest birleşmesiyle uygulamaya `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED` ve `WAKE_LOCK` izinlerini ve önyükleme alıcılarını ekliyor; `notification:default` yetkisi ön yüze 17 eklenti komutunu açıyor; masaüstünde eklenti izin durumunu okumadan her zaman "verildi" döner. Hepsi bu belgenin ilkesiyle çelişir. Karar: bildirim özelliği tasarlanıp kapsam kararı verilene kadar eklenti, izin ve yetki eklenmez. Eklenti bağımlılık ağacında değildir (`cargo tree -i tauri-plugin-notification` boş döner), dolayısıyla Gradle'ın ürettiği `tauri.settings.gradle` yalnız `tauri-android` ve `tauri-plugin-opener` projelerini içerir ve manifest birleşmesine başka izin girmez.
