# Arka Uç Oturum Süresi, Giriş Sınırı ve Kalan Bulgular

Numarasız iş; günlük dal adıyla tutulur ([`README.md`](README.md)). Dal: `fix/backend-security-followups`, tabanı `master` = `9c74c34` (PR #48 merge commit'i). Kaynak: PR #32 denetiminin PR #48'den sonra açık kalan bulguları M2, M3, M4, M5 ve L5 ([`pr32-backend-hardening.md`](pr32-backend-hardening.md)).

**Durum ayrımı (bağlayıcı):** PR #48 kodu birleşti (`9c74c341ea3d4477548cb5975abe9ce489e90b8b`, CI 5/5) — bu depo sahibinin uygulama kararıdır. Eğitmenin C-3 kapsam kararı (giriş/veritabanı/uzaktan yönetim, [`docs/course-compliance.md`](../course-compliance.md)) **hâlâ beklemektedir**; birleştirme onay yerine geçmez. C-3'e bağlı başka kararlar yanıt belgelenene kadar bloke kalır.

## Araç ve model

Claude Code, Claude Fable 5.1 (`claude-fable-5-1`), 2026-10-28. Windows, PowerShell. İş ayrı bir worktree'de yapıldı; gerçek uygulama veritabanına (`%APPDATA%\edu.istinye.netcheck\app.sqlite`) dokunulmadı.

## Şartname

- **Amaç:** M2 giriş denemesi sınırı, M4 oturum süresi, M3 ayrılmış rol adı değişkenleri, M5 `diagnostic_targets` yazılabilirliği, L5 istemci tarafı sayfalama için en küçük güvenli düzeltmeler; her biri önce kırmızı sonra yeşil testle.
- **Kapsam dışı:** `report_submit`/`contact_submit`'i yeniden açmak; C-3 kararını vermek; birleştirme, etiket, Release; macOS/Linux/mobil çalıştırma iddiası.
- **Kabul ölçütleri:** `cargo test --locked`, `bun run check`, `bun run build`, `lat check`, `git diff --check` temiz; PR #48 ile gelen 46 test değişmeden geçer; paketlenmiş uygulamada gerçek IPC ile doğrulama; taslak PR'ın CI'ı kaydedilir.
- **Dokunulan dosyalar:** `src-tauri/src/backend/{state,error,controllers,rbac,schema,tests}.rs`, `admin/api/index.ts`, `admin/context/AdminAuthContext.tsx`, `admin/features/DiagnosticTargetsView.tsx`, `admin/i18n/{tr,en,ar,fa}.ts`, `docs/backend.md`, `docs/yonetim-paneli.md`, `docs/course-compliance.md`, `lat.md/{architecture,tests,tasks,decisions,project}.md`, bu günlük.

## İstem

Depo sahibinin 28.10.2026 istemi, ilgili kısmı olduğu gibi:

```text
Continue from the merged PR #48 and bring the project to a consistent, fully documented state.
Complete the remaining security work where safe, verify the results, update repository lat.md/
documentation and the existing NetCheck Obsidian notes, then stop and wait for the owner's next
instruction. [...] M2 — Login/registration abuse controls; M4 — Session timeout; M3 — Reserved
role-name normalization; M5 — diagnostic_targets; L5 — Client-side paging. [...] C-3 is still an
unresolved governance decision. [...] Do not merge the new PR.
```

## Plan

1. Durumu doğrula (master `9c74c34`, PR #48 CI 5/5, açık PR'lar, etiketler); `master`'dan odaklı dal.
2. M3 ve M5 için mevcut API ile kırmızı testler; M2/M4 için saat enjekte edilebilir `AppState` ve sınır/süre testleri; düzeltmeler; L5 için sunucu tarafı sayfalama yalnız arka ucun süzebildiği sorgularda.
3. Paketlenmiş uygulamada gerçek IPC doğrulaması; `devCsp` için `tauri dev`; belgeler; Obsidian; taslak PR ve CI.

## Düzeltmeler

| Bulgu | Tasarım ve uygulama |
|---|---|
| M2 Giriş sınırı | Anahtar: küçük harfli e-posta (sunucu tarafı süreç belleği; parola ya da deneme içeriği saklanmaz). 15 dakikalık pencerede 5 başarısız deneme → o anahtar 15 dakika kilitli; kilitliyken doğru parola da `too_many_attempts` (+`retryAfterSecs`); başarılı giriş sayacı siler; en çok 256 anahtar, dolunca süresi dolanlar sonra en eskisi atılır. Askıya alınmış hesapla deneme de başarısız sayılır (parola doğruluğu sızmaz). İlk kurulum (`auth_register`) sınırdan bağımsızdır; yalnız veritabanı boşken mümkündür. **Sınır:** süreç içi; uygulama yeniden başlayınca sıfırlanır (yerel masaüstü uygulaması için kabul edildi, `docs/backend.md` §9). |
| M4 Oturum süresi | `AppState` oturumu `started_at`/`last_seen` ile tutar; `user()` her yetki denetiminde 30 dk boşta kalma ve 12 saat mutlak ömrü uygular, süresi dolanı düşürür, aktifse `last_seen`'i yeniler. `auth_me` null döner; panel giriş ekranına döner. Askıya alma/engelleme davranışı (PR #48) korunur. Testler `set_now` ile deterministik; uyku yok. |
| M3 Ayrılmış rol adı | `rbac::is_reserved_role_name` (boşluk kırpılmış, ASCII büyük/küçük harf duyarsız `admin`). `role_store`, `role_update`/`role_rename`, `role_find_or_create` değişkenleri `validation` ile reddeder; `user_sync_roles` ve `user_store` değişkenleri süper yönetici rolü gibi denetler (`forbidden`). |
| M5 `diagnostic_targets` | Tabloyu yalnız genel CRUD açığa çıkarıyordu (Create/Update/Delete/DeleteAny); uygulama tabloyu hiç okumaz. `DIAGNOSTIC_TARGET.readonly = true` → yazma `forbidden`; satırlar silinmedi, migration yok. Panelin Hedefler ekranı salt okunur (düzenleme ve sıfırlama kaldırıldı, açıklama notu); `updateTarget`/`resetTargetsToDefault` API'den çıkarıldı. |
| L5 Sayfalama | Listeler maskeli geldiği için gizlilik değil performans konusu. Mesajlar, denetim günlüğü ve cihazlar artık yalnız arka ucun süzebildiği süzgeçlerle (`schema` `filters` listesi) `crud_index` sayfa/arama/sıralama ile tek sayfa ister; JSON alanı süzgeçleri (cihaz `os`, cihaz araması) ve rapor listesi (skor seviyesi, bağlantı türü, test durumu, tarih aralığı, platform) eski yolda kalır. Kalan iş NC-21 olarak kaydedildi (kabul ölçütüyle). |

Hata kodu `too_many_attempts` panelde `authErrTooMany` sözlük anahtarıyla gösterilir (dört dil); ham mesaj ekrana çıkmaz.

## Doğrulama

Worktree `p4wt`, Windows, 28.10.2026:

| Kontrol | Sonuç |
|---|---|
| Kırmızı aşama | M3 ve M5 testleri düzeltme öncesi başarısız (2 FAIL / 21 geçti). M2: sınırlayıcı geçici olarak kaldırılınca `login_is_locked_after_repeated_failures` FAIL; `first_admin_bootstrap_is_not_rate_limited` sınır olmadan `TooManyAttempts` beklediği için geçemez. M4 testleri yeni saat kancasını gerektirdiği için eski kodla derlenemez; davranış `set_now` ile sınandı. |
| `cd src-tauri && cargo test --locked` | 54 geçti, 0 başarısız, 0 uyarı (46 mevcut + 8 yeni) |
| `bun install --frozen-lockfile` | geçti |
| `bun run check` | 0 hata, 0 uyarı (tek ipucu `CanliRozet.tsx`, önceden vardı) |
| `bun run build` | 32 sayfa, 0 hata |
| `lat check` | geçti |
| `git diff --check` | temiz |
| Gerçek IPC (paketlenmiş uygulama) | aşağıda |
| `devCsp` (`tauri dev`) | aşağıda |
| CI (PR #49) | `477f3c9` üzerinde 5/5 (run 40633881674); birleşme sonrası `master` `a5ef40b` için 5/5 (run 40635427364) |

**Uçtan uca (gerçek Tauri IPC).** `bunx tauri build --debug --no-bundle --config` ile kimliği `edu.istinye.netcheck.hardening` olan ayrı uygulama; kendi veri klasörü ve sıfırdan oluşan atılabilir `app.sqlite`; bitince klasör silindi; gerçek veritabanının değişiklik zamanı değişmedi. Üretim CSP'si altında WebView2 CDP ile sürüldü.

| Adım | Sonuç |
|---|---|
| İlk kurulum (arayüz) | Kurulum formu → süper yönetici oturumu (`auth_me` süper yönetici) |
| M3 (IPC) | `role_store("Admin")` → `validation`; `role_update(support → " ADMIN ")` → `validation`; rol listesi değişmedi (`admin, content, support, viewer`) |
| M5 (IPC + arayüz) | `crud_update DiagnosticTarget cloudflare` → `forbidden`; liste 5 satır (`cloudflare=1.1.1.1` …) okunur; Hedefler ekranında 0 giriş alanı, 0 kaydet/sıfırla düğmesi, salt okunur notu var |
| M2 (IPC + arayüz) | İkinci hesap `destek@…` oluşturuldu; çıkış sonrası 5 yanlış parola: 4× `validation`, 5. deneme `too_many_attempts`; ardından **doğru parola** → `too_many_attempts`, `retryAfterSecs: 900`, oturum açılmadı; giriş formu sözlük metnini gösterdi ("Çok fazla başarısız giriş denemesi. Bir süre sonra yeniden dene."), oturum kapalı kaldı; başka hesap (`nobody@…`) etkilenmedi (`validation`) |
| Oturumsuz sayfalama | `crud_index AuditLog` oturum yokken `unauthenticated` (sunucu tarafı sayfalama yetki denetiminden geçer) |
| CSP | 0 ihlal; konsol hatası yok |

Oturum süresi (M4) gerçek uygulamada beklenerek doğrulanmadı (30 dk / 12 sa); `set_now` ile birim testlerde sınandı. İlk çalıştırmada betik uygulama açılışını beklemeden gezinmişti; gezinme bekleyişi düzeltilip yeniden koşuldu (ilk koşunun kilitleme sonuçları aynıydı).

**`devCsp` (Vite geliştirme sunucusu).** `bunx tauri dev --config` (aynı ayrı kimlik, port 1420, CDP 9230) çalıştırıldı: Genel Bakış, Tanılama ve `/admin` (kurulum formu) yüklendi, `auth_setup_required` IPC'si çalıştı, HMR soketi hatasız, konsolda 0 CSP ihlali. **Gözlem:** geliştirme modunda Vite sunucusunun yanıtında CSP başlığı yok ve sayfaya CSP `<meta>` enjekte edilmemiş; yani `devCsp` bu kurulumda uygulanmış görünmüyor (harici `devUrl` ile Tauri başlık ekleyemiyor). Üretim CSP'si paketlenmiş uygulamada doğrulandı; geliştirme derlemesi dağıtılmaz. `devCsp` zararsız olduğu için yapılandırmada bırakıldı; `docs/backend.md` §9 buna göre düzeltildi.

## Bilinen sınırlamalar ve açık maddeler

- **C-3 eğitmen kararı bekliyor** (NC-16 bloke); PR #48 birleşmesi onay değildir.
- Giriş sınırı süreç içidir (yeniden başlatma sıfırlar); oturum süresi dolunca panel açık sayfa kalır, ilk işlemde giriş ekranına döner.
- Rapor ve cihaz listelerinde JSON alanı süzgeçleri istemci tarafında (NC-21).
- `report_submit` ve `contact_submit` kayıtlı değil; yeniden açılması incelenmiş gereksinim ister.
- macOS, Linux, Android ve iOS'ta çalıştırılmadı; CI yalnız derleme ve testleri kanıtlar.
- Öğrenciye ait kanıtlar (R10-d, R13-e, RG-c, K10) ve `v0.2.0-batch-02` etiketi değişmedi.

## PR

[#49](https://github.com/frudotz/netcheck/pull/49) — depo sahibi 28.10.2026'da `master`'a birleştirdi (merge commit `a5ef40b5853a60d1e64610cb6be810b2ea911758`); PR'ın son commit'i `477f3c9` için CI 5/5, `master` push çalıştırması 5/5 (run 40635427364). Eğitmenin C-3 kararı hâlâ bekliyor; birleştirme onay yerine geçmez.
