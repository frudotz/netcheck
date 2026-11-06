# Rust Komutları

Uygulama ekranlarının çağırdığı Tauri komutları. Ekranlar bu komutları yalnız [`src/lib/native.ts`](../src/lib/native.ts) üzerinden çağırır; bileşenlerde doğrudan Tauri çağrısı yoktur (Görev 15). Alanların tamamı: [`docs/veri-modeli.md`](veri-modeli.md). Geçici SQLite arka ucunun komutları ayrıdır: [`docs/backend.md`](backend.md).

| Komut | `native.ts` | Girdi | Başarıda | Hata |
|---|---|---|---|---|
| `get_network_snapshot` | `getNetworkSnapshot()` | — | `NetworkSnapshot` | `task_failed` |
| `run_diagnostic` | `runDiagnostic(kind)` | `kind`: `"gateway"`, `"cloudflare"`, `"google"`, `"dns"`, `"internet"` | `DiagnosticOutcome` | `unknown_diagnostic`, `task_failed` |
| `generate_report_id` | `generateReportId()` | — | `string`, `NCHK-YYYY-XXXXXXXX` | — |
| `get_platform_info` | `platform()` | — | `PlatformInfo` | — |
| `get_permission_inventory` | `permissionInventory()` | — | `PermissionEntry[]` | — |

- Kaynak: [`src-tauri/src/lib.rs`](../src-tauri/src/lib.rs). Ağ ve tanılama komutları engelleyici sistem çağrıları yaptığı için arka plan iş parçacığında çalışır.
- **Test hedefleri Rust'ta sabittir.** `run_diagnostic` yalnız türü alır; hedef adresi ön yüzden gelmez ve kabuğa hiçbir girdi aktarılmaz.
- `get_permission_inventory` statik bir sözleşme döner: bu derleme hedefinin bildirdiği ve bilinçli olarak istemediği izinler. İşletim sisteminden izin durumu okunmaz, hiçbir sistem diyaloğu açılmaz; çalışma zamanı izni isteyen komut yoktur ([`docs/izinler.md`](izinler.md)).
- Bir testin başarısız olması komut hatası değildir: `DiagnosticOutcome` içinde `status` (`failed`, `unavailable`) ve makine kodu `code` (`timeout`, `no_gateway` …) döner, mesaj ön yüzde seçili dilde üretilir.

## Hata türü: `CommandError`

Komut başarısız olursa düz metin değil, tipli bir hata döner ([`src-tauri/src/command_error.rs`](../src-tauri/src/command_error.rs) ↔ [`src/lib/types/command.ts`](../src/lib/types/command.ts)):

| `code` | Ek alan | Ne zaman |
|---|---|---|
| `unknown_diagnostic` | `value`: gelen değer | `run_diagnostic` bilinmeyen bir türle çağrıldı (boş, büyük harfli ya da başka bir metin). Panik olmaz, test çalışmaz |
| `task_failed` | — | Arka plandaki iş parçacığı tamamlanamadı |

JSON örneği: `{ "code": "unknown_diagnostic", "value": "foo" }`.

## Ön yüzde hata gösterimi

- `native.ts` tipli hatayı `CommandFailure` olarak fırlatır. Rust yoksa (tarayıcı önizlemesi) `NativeUnavailableError` fırlatır.
- Ekranlar ham hatayı göstermez; Görev 13'ün `HataDurumu` bileşeniyle seçili dilde bir mesaj ve "Tekrar dene" gösterir. Örnek: Tanılama ve Genel Bakış.
- Tek bir test komutu başarısız olursa test "Başarısız" görünür ve rapor yine oluşur.

## Testler

`cd src-tauri && cargo test`:

- `known_kinds_parse`: beş tür doğru ayrıştırılır (başarılı girdi).
- `unknown_kind_is_typed_error`: bilinmeyen, boş, büyük harfli ve komut benzeri girdiler `unknown_diagnostic` hatası olur (hatalı girdi).
- `errors_serialize_with_code`: hatanın JSON biçimi TypeScript tipiyle aynıdır.
- `cargo test permissions` (5 test): hiçbir izin kaydı çalışma zamanı diyaloğu bildirmez (yalnız doğrulanmamış kayıt açık bırakır); Android kaynak manifesti ve, `NETCHECK_MERGED_MANIFEST` verildiğinde, debug APK'nın birleşik manifesti tam olarak envanterin bildirdiği izinleri içerir; iOS `Info.plist`'te kullanım açıklaması anahtarı yoktur; capability dosyası yalnız `core:default` ve `opener:default` içerir.

Belirtimler: [`lat.md/tests.md`](../lat.md/tests.md).
