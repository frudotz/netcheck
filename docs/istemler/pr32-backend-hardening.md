# PR #32 Arka Uç Sertleştirme ve Panel Bağlantısı

Numarasız iş; günlük dal adıyla tutulur ([`README.md`](README.md)). Dal: `fix/pr32-backend-hardening`, eğitmenin PR #32 dalı `feature/src-admin-prototype` (`c0c1a04`) üzerinden açıldı; PR'ın geçmişi korunur, yeniden yazılmaz. PR #32 birleştirilmedi, tabanı değiştirilmedi; etiket yok.

**Kapsam kararı:** panelin veri bağlantısı (giriş, veritabanı, uzaktan yönetim) [`docs/course-compliance.md`](../course-compliance.md) C-3 çelişkisine bağlıdır. Eğitmenin kararı **beklemektedir**; bu dal bir birleştirme kapısıdır, onay değildir.

## Araç ve model

Claude Code, Claude Fable 5.1 (`claude-fable-5-1`), 2026-10-28. Windows, PowerShell. Bütün iş ana çalışma kopyasından ayrı worktree'lerde yapıldı; gerçek uygulama veritabanına (`%APPDATA%\edu.istinye.netcheck\app.sqlite`) dokunulmadı.

## Şartname

- **Amaç:** PR #32'nin gerçek SQLite + Tauri IPC entegrasyonunu korumak; salt okunur denetimde bulunan güvenlik kusurlarını testleriyle gidermek; `master` ile birleştirmek; tek bir panel (`admin/`) bırakmak ve gerçek uygulamada uçtan uca doğrulamak.
- **Kapsam dışı:** PR birleştirme, etiket/Release; geçmiş yeniden yazma; sahte/örnek veri; `report_submit` ve `contact_submit` gibi oturumsuz yazma uçlarını yeniden açmak; C-3 kararını vermek.
- **Kabul ölçütleri:** her bulgu için önce kırmızı sonra yeşil regresyon testi; `cargo test --locked`, `bun run check`, `bun run build`, `lat check`, `git diff --check` temiz; on uçtan uca senaryo paketlenmiş uygulamada, atılabilir veritabanıyla geçer.
- **Dokunulan dosyalar:** `src-tauri/src/backend/{policy,auth,controllers,domain,db,commands,tests}.rs`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src/lib/native.ts`, `admin/` (api, context, App, AppShell, yol, DataTable, MaskedValue, NetworkSnapshotView, ReportsList/ReportDetail/AdminUsers/Messages/Settings, i18n ×4), `docs/backend.md`, `docs/yonetim-paneli.md`, `docs/klasor-mimarisi.md`, `lat.md/{architecture,tests,tasks,decisions,project}.md`, bu günlük. `src-admin/` silindi.

## İstem

Depo sahibinin 28.10.2026 istemleri, dört aşama; her birinin ilgili kısmı olduğu gibi:

```text
Phase 1 — Read-only security and integration audit. Every finding must cite exact file paths and
line numbers. Do not modify files.

Phase 1 scope — only C1, C2, C3, H1. Tests must fail against the vulnerable behavior before the fix
and pass after it. Do not weaken existing authorization checks or tests.

Phase 2 only: H2, H3, H4, and M1. Add failing-then-passing regression tests. Set a restrictive
compatible Content Security Policy. Reveal sensitive fields individually, authorize and audit each
reveal. Gate CSV/PDF/print exports using the backend authorization model.

Phase 3: merge origin/master normally; keep admin/ as the sole canonical admin panel; verify the
actual Tauri application and IPC path for ten scenarios with a throwaway database; never touch the
real app.sqlite. If the instructor's C-3 scope decision is still pending, record it as a merge gate.
```

## Plan

1. Salt okunur denetim: dört Critical/High bulgu (C1–C3, H1), dört High/Medium (H2–H4, M1), beş Medium/Low; raporlandı, onay alındı.
2. Aşama 1 ve 2: her bulgu için bellek içi SQLite (`boot_memory`) üzerinde önce kırmızı test, sonra düzeltme; mevcut testler değişmedi.
3. Aşama 3: `origin/master` normal merge commit ile alındı; beş çakışma `master` lehine çözüldü; `admin/` panel `admin/api/index.ts` ile gerçek komutlara bağlandı; `src-admin/` kaldırıldı; paketlenmiş uygulamada on senaryo koşuldu; belgeler güncellendi.

Her aşama kullanıcı onayıyla başladı; plan aşama istemlerinde verilmişti.

## Düzeltmeler

Arka uç (hepsi testli; [`lat.md/tests.md`](../../lat.md/tests.md) "Local backend"):

| Bulgu | Düzeltme |
|---|---|
| C1 Askıya alınan kullanıcının oturumu sürüyordu | `authorize` ve `auth_me` kullanıcının `active` olmasını ister; oturumdaki kullanıcı askıya alınınca oturum düşer |
| C2 `Update:User`/`Create:User` ile `admin` rolü verilebiliyordu | `admin` rolünü vermek/almak, süper yöneticinin durum/izin/parolasını değiştirmek ve kendi yetkisini değiştirmek yalnız süper yöneticide |
| C3 Var olan e-postayla `user_store` parolayı sessizce sıfırlıyordu | `conflict`; parola `user_set_password`, ad `user_update` ile ayrı yetkili akışlarda |
| H1 Son yönetici sayımı askıdakileri sayıyordu | `active_super_admin_count` tek kaynak; son etkin süper yönetici indirilemez, askıya alınamaz |
| H2 Genel CRUD iş kurallarını atlıyordu | `domain::write_policy`: `Report` yalnız `shared`; yayınlanmış `ScoreRule` değişmez, kural JSON'u her yazımda doğrulanır; `ContactMessage.replies` yalnız `contact_message_reply`; `Device` sayaçları arka uca ait |
| H3 Çok adımlı yazmalar transaction'sızdı | `Db::transaction`: denetim kaydı yazılamazsa değişiklik geri alınır; `device_purge` tek işlem |
| H4 Oturumsuz yazma uçları sınırsızdı, CSP yoktu | `report_submit` ve `contact_submit` komut listesinden çıkarıldı (kod ve sınırları durur); `tauri.conf.json` `csp` + `devCsp` |
| M1 Dışa aktarma yetkisizdi, açma raporu bütünüyle açıyordu | `export_authorize` (`Export:Report`, denetimli); `report_show` her zaman maskeli; `report_reveal_field` alan başına, denetimli |

Birleştirme (Aşama 3A, merge commit `3420b10`): `astro.config.mjs`, `package.json`, `bun.lock` → `master` sürümü (Tailwind eklentisi ve `check` betiği zaten orada; `react-router-dom` ve `admin:check` yalnız `src-admin/` içindi); `src/layouts/AdminLayout.astro`, `src/pages/admin/index.astro` → `master` (kanonik panel); PR'ın `src/pages/admin/[...slug].astro` yolu silindi (`[gorunum].astro` aynı sayfaları üretir). `master` işlevi silinmedi.

Panel (Aşama 3B, `c9c5d84`): `admin/api/index.ts` `AdminApi` + `AuthApi`'yi yalnız `invokeAdmin` üzerinden uygular; `bagli = hasNative()`; `AdminAuthContext` kurulum/giriş/çıkış/rol yok/hata durumları ve `can()`; menü ve ekranlar `EKRAN_IZNI` ile süzülür (yalnız görünürlük; denetim Rust'ta); `MaskedValue` yalnız arka ucun döndürdüğü değeri gösterir; CSV ve yazdırma `Export:Report` ile; davette geçici parola; mesaj atanabilecekler `contact_message_assignees`'tan; hata kodları dört sözlükte metne çevrilir. `src-admin/` kaldırıldı.

## Doğrulama

Worktree `p3wt`, Windows, 28.10.2026:

| Kontrol | Sonuç |
|---|---|
| `cd src-tauri && cargo test --locked` | 46 geçti, 0 başarısız, 0 uyarı (25 mevcut + 21 yeni; 21 yenisinin 13'ü düzeltmeden önce kırmızıydı, 8'i yeni komutlar için) |
| `bun install --frozen-lockfile` | geçti (`master` kilit dosyası) |
| `bun run check` | 0 hata, 0 uyarı (tek ipucu `CanliRozet.tsx`, önceden vardı) |
| `bun run build` | 32 sayfa, 0 hata |
| `lat check` | geçti |
| `git diff --check` | temiz |

**Uçtan uca (gerçek Tauri IPC, Aşama 3C).** `bunx tauri build --debug --no-bundle --config` ile kimliği `edu.istinye.netcheck.hardening` olan ayrı bir uygulama derlendi; kendi veri klasörü ve atılabilir `app.sqlite` kullandı, bitince klasör silindi; gerçek veritabanının değişiklik zamanı değişmedi (21.10.2026 23:12). Uygulama `http://tauri.localhost` üzerinde üretim CSP'siyle çalıştı; WebView2 CDP (port 9227) ile sürüldü. **Fikstür:** `report_submit` kayıtlı olmadığı için raporlar yalnız bu atılabilir veritabanına, uygulama kapalıyken `bun:sqlite` ile eklendi: iki cihaz (`fixture-device-A/B`), üç rapor (`NCHK-2026-F1A2B3C4/C5/C6`, belgeleme adresleri `192.0.2.x`, `00-00-5E-00-53-xx`), bir iletişim iletisi; parola `test-parola-123`. Senaryo 2b ve 9'da ikinci bir yöneticinin yapacağı iş (askıya alma; denetim tablosunu geçici kapatma) aynı atılabilir veritabanında doğrudan SQL ile yapıldı.

| # | Senaryo | Sonuç |
|---|---|---|
| 0 | CSP | Yanıtta CSP başlığı var (Tauri satır içi betik karmalarını ekledi); `/`, `/tanilama`, `/admin*` sayfalarında 0 ihlal; dış betik engellendi |
| 1 | İlk yönetici + ikinci kullanıcı | Kurulum formu ekranda; kayıt sonrası menü 10 ekran, `auth_me` süper yönetici; Yöneticiler ekranı davet formuyla `destek@…` (`support`) oluştu |
| 2 | Giriş/çıkış, askıya alma | Çıkış → giriş ekranı; support girişinde menü 5 ekran. Support oturumu açıkken hesap askıya alınınca ilk IPC `unauthenticated`, `auth_me` null, arayüz giriş ekranına düştü; askıdaki hesapla giriş `forbidden` |
| 3 | Delegasyon | `Update:User`+`Create:User` verilmiş support: kendine `admin` → `forbidden` ("kendi yetkini değiştiremezsin"); `admin` rollü kullanıcı oluşturma → `forbidden` |
| 4 | CRUD yetkisi, yayınlanmış kural | support `crud_index ScoreRule` → `forbidden`; süper yönetici yayınlanmış kural güncellemesi → `conflict` |
| 5 | Liste/detay maskeli | Liste 3 satır, IPC'de `hostname`/`localIPv4` `••••`; detayda 6 maskeli alan; `report_show` maskeli |
| 6 | Alan bazlı açma | "Göster" tıklanınca yalnız o alan (`fixture-host-1`) göründü; `pii.reveal` denetim kaydı 0 → 1, `after` `{field: hostname}`; `report_show` hâlâ maskeli; sayfa yenilenince yine maskeli |
| 7 | Dışa aktarma | Süper yönetici: IPC `true`, CSV düğmesi var. Viewer: düğme yok, `export_authorize` `forbidden`, `report_reveal_field` `forbidden`, `device_purge` `forbidden` |
| 8 | Yanıt yazarı | support `contact_message_reply` → `authorId` = support'un kimliği, durum `answered`; mesaj ekranında yanıt görünür; `crud_update` ile `replies` → `validation` |
| 9 | Geri alma | Denetim tablosu kapalıyken `crud_update ContentPage` → `db` hatası; başlık "Eski" kaldı |
| 10 | Cihaz silme | `device_purge`: 2 rapor + cihaz tek işlemde silindi, diğer cihaz durdu |
| — | Kayıtlı olmayan uçlar | `report_submit` ve `contact_submit` → "Command not found" |

Yapılmadı: `devCsp` (Vite geliştirme sunucusu) çalıştırılmadı; macOS/Linux/mobilde denenmedi; CI bu dal için PR açılmadığından çalışmadı.

## Bilinen sınırlamalar ve açık maddeler

- **C-3 kararı bekliyor;** dal birleştirilmez.
- Giriş denemesi sınırı ve oturum zaman aşımı yok (M2, M4); rol adı büyük/küçük harf ayrımı (M3); `diagnostic_targets` düzenlenebilir ama uygulama okumaz (M5, AGENTS.md §6 ile çelişir); panel listeleri istemci tarafında sayfalar (L5).
- Panelden e-posta ve parola değiştirilemez (`user_set_password` arka uçta var, ekranı yok).
- Fikstür betiği depoda değil (AGENTS.md §5: geçici otomasyon dosyaları commit edilmez); içeriği yukarıda tanımlıdır.

## PR

[#48](https://github.com/frudotz/netcheck/pull/48) — depo sahibi 28.10.2026'da `master`'a birleştirdi (merge commit `9c74c341ea3d4477548cb5975abe9ce489e90b8b`, CI 5/5). Bu birleştirme depo sahibinin uygulama kararıdır; **eğitmenin C-3 kapsam kararı hâlâ beklemektedir** ve birleştirme onay yerine geçmez. PR #32 depo sahibi tarafından 28.10.2026'da birleştirilmeden kapatıldı; yerine PR #48 geçti. Kalan bulgular (M2–M5, L5) `fix/backend-security-followups` dalında ele alındı ([`backend-security-followups.md`](backend-security-followups.md)).
