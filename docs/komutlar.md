# Rust Komutları

Uygulama ekranlarının çağırdığı Tauri komutları. Ekranlar bu komutları yalnız [`src/lib/native.ts`](../src/lib/native.ts) üzerinden çağırır; bileşenlerde doğrudan Tauri çağrısı yoktur (Görev 15). Alanların tamamı: [`docs/veri-modeli.md`](veri-modeli.md). Geçici SQLite arka ucunun komutları ayrıdır: [`docs/backend.md`](backend.md).

| Komut | `native.ts` | Girdi | Başarıda | Hata |
|---|---|---|---|---|
| `get_network_snapshot` | `getNetworkSnapshot()` | — | `NetworkSnapshot` | `task_failed` |
| `run_diagnostic` | `runDiagnostic(kind)` | `kind`: `"gateway"`, `"cloudflare"`, `"google"`, `"dns"`, `"internet"` | `DiagnosticOutcome` | `unknown_diagnostic`, `task_failed` |
| `generate_report_id` | `generateReportId()` | — | `string`, `NCHK-YYYY-XXXXXXXX` | — |
| `get_platform_info` | `platform()` | — | `PlatformInfo` | — |

- Kaynak: [`src-tauri/src/lib.rs`](../src-tauri/src/lib.rs). Ağ ve tanılama komutları engelleyici sistem çağrıları yaptığı için arka plan iş parçacığında çalışır.
- **Test hedefleri Rust'ta sabittir.** `run_diagnostic` yalnız türü alır; hedef adresi ön yüzden gelmez ve kabuğa hiçbir girdi aktarılmaz.
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

Belirtimler: [`lat.md/tests.md`](../lat.md/tests.md).
