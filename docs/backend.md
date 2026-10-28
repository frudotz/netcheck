# NetCheck — Geçici Yerel Arka Uç (SQLite)

> **Durum:** Sunucu yok. Veri, uygulamanın kendi veri klasöründeki bir **SQLite** dosyasında (`app.sqlite`) tutulur; kod `src-tauri/src/backend/` altındadır ve Tauri komutları olarak dışarı açılır. Sunucuya geçilince yalnız bu klasörün içi değişir; ekranların kullandığı komut adları ve veri biçimi aynı kalacak şekilde tasarlandı.

Rol ve izin düzeni, eğitmenin Laravel projelerindeki `spatie/laravel-permission` (+ Filament Shield) mantığındadır.

## 1. Laravel karşılıkları

| Laravel | Bu depoda |
|---|---|
| `database/migrations` | `src-tauri/src/backend/migrations/*.sql` + `migrations.rs`; uygulama açılışında bekleyenler çalışır (`migrations` tablosu: id, migration, batch) |
| `spatie/laravel-permission` | `rbac.rs`: roller, izinler, `assign_role`, `sync_roles`, `give_permission_to`, `can` … (tablolar Spatie ile aynı) |
| Filament Shield izin adları | `Eylem:Kaynak` (örn. `ViewAny:Order`), eylemler: ViewAny, View, Create, Update, Delete, DeleteAny |
| Süper yönetici (`Gate::before`) | `admin` rolü her izin denetimini geçer |
| Policy / `authorize()` | `policy.rs`; her denetleyici işlevi önce izni denetler |
| Resource controller | `controllers.rs` → `crud_index/show/store/update/destroy` (her kaynak için) |
| `spatie/laravel-activitylog` | `audit.rs` → `audit_logs` tablosu (kim, ne, önce/sonra, neden) |
| `artisan qtoefl:admin` | `user_store` (kullanıcıyı oluşturur/günceller ve rol atar) |
| Eloquent modeli | `schema.rs` içindeki `Entity` tanımı (sütun adları ön yüz tipleriyle aynı) |
| Form request doğrulaması | `crud.rs` tür/zorunluluk denetimi + `domain.rs` iş kuralı doğrulamaları → `{ code: "validation", errors: [{ field, message }] }` |

## 2. Veritabanı dosyası ve ilk açılış

- Dosya: uygulama veri klasörü / `app.sqlite` (Tauri `app_data_dir`). Depoya girmez.
- Açılışta migration'lar sırayla çalışır; roller, izinler ve başlangıç verisi **veri migration'larıyla** gelir (seeder gerekmez).
- Veritabanında kullanıcı yokken admin paneli ilk yönetici hesabını oluşturur; bu ilk kullanıcı `admin` olur. Sonraki genel kayıtlar kapalıdır. Yeni yöneticiler, yetkili panelinden rol ve parola atanarak eklenir.
- Admin paneli `/admin/` rotasında Tauri uygulaması içinden açılır ve aynı yerel `app.sqlite` veritabanına bağlanır. Tarayıcı önizlemesinde SQLite erişimi veya sahte veri yedeği yoktur.
- Rapor, cihaz ve mesaj örnekleri veritabanına otomatik eklenmez; listeler gerçek kayıt yoksa boş görünür. Skor kuralları ve tanılama hedefleri başlangıç migration'ından gelir.

## 3. Tablolar

Ortak tablolar: `users`, `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`, `contact_messages`, `content_pages`, `audit_logs`.

| Kaynak (izin adı) | Tablo | Birincil anahtar | Sütunlar |
|---|---|---|---|
| `Device` | `devices` | `id` (metin) | platform*, appVersion*, locale, lastSeenAt, reportCount |
| `Report` | `reports` | `id` (metin) | createdAt*, score*, passed*, failed*, network*, tests*, deviceId, shared, receivedAt, ruleVersion |
| `ScoreRule` | `score_rules` | `version` (otomatik artan) | status, weights*, latencyBands*, levels*, publishedAt, note |
| `DiagnosticTarget` | `diagnostic_targets` | `kind` (metin) | target*, enabled, timeoutMs |

`*` zorunlu alan. JSON türündeki sütunlar (liste/nesne) metin olarak saklanır, okunurken nesneye çevrilir. Sütun adları, ön yüz tipleriyle birebir eşleşir.

## 4. Roller ve izinler

`admin` süper yöneticidir (atama gerekmez). Diğer roller aşağıdaki izinleri alır; `User`, `Role`, `Permission` kaynakları yalnız `admin`dedir.

| Rol | İzinler |
|---|---|
| `admin` | tümü (süper yönetici) |
| `support` | `ContactMessage` (tümü); `Report` (okuma); `Device` (okuma); `Export:Report` |
| `content` | `ContentPage` (tümü) |
| `viewer` | `Report` (okuma); `Device` (okuma); `ScoreRule` (okuma); `DiagnosticTarget` (okuma); `ContactMessage` (okuma); `ContentPage` (okuma) |

Özel yetenekler: `Publish:ScoreRule`, `Export:Report`, `Reveal:PII`.

Yeni izin/rol eklemek için yeni bir veri migration'ı yazılır (`INSERT OR IGNORE`); mevcut migration değiştirilmez.

## 5. Komutlar

Rust'taki `snake_case` parametreler JS tarafında `camelCase` yazılır. Aşağıdaki parametre adları JS adlarıdır.

### Ortak

| Komut | Parametreler | Ne yapar |
|---|---|---|
| `auth_setup_required` | — | Veritabanında henüz kullanıcı yoksa `true` döner |
| `auth_register` | name, email, password | Yalnız ilk yönetici hesabını oluşturur; sonraki kayıtları reddeder |
| `contact_message_assignees` | — | İleti yetkisi olan kullanıcılar için etkin yönetici adları ve kimlikleri |
| `auth_login` | email, password | Giriş |
| `auth_logout` | — | Çıkış |
| `auth_me` | — | Oturumdaki kullanıcı + roller + izinler (yoksa null) |
| `user_index` | — | Kullanıcı listesi (`ViewAny:User`) |
| `user_store` | name, email, role, password | Yeni kullanıcı oluştur + rol ata (`Create:User`); e-posta kayıtlıysa `conflict`; `admin` rolünü yalnız süper yönetici verir |
| `user_sync_roles` | userId, roles[] | Rolleri eşitle (`Update:User`); `admin` rolünü vermek/almak ve kendi rollerini değiştirmek yalnız süper yöneticide; son etkin süper yöneticiden `admin` alınamaz |
| `user_sync_permissions` | userId, permissions[] | Doğrudan izinleri eşitle (`Update:User`); kendi izinleri ve süper yöneticilerin izinleri yalnız süper yöneticide |
| `user_set_status` | userId, status, reason? | active / suspended / banned (`Update:User`); süper yöneticiyi yalnız süper yönetici; son etkin süper yönetici askıya alınamaz; oturumdaki kullanıcı hedefse oturum düşer |
| `user_set_password` | userId, password | Parola değiştir (`Update:User`); süper yöneticinin parolasını yalnız kendisi ya da süper yönetici; parola denetim kaydına yazılmaz |
| `user_update` | userId, name | Ad soyad güncelle (`Update:User`); e-posta ve parola değişmez |
| `role_index` | — | Roller + izinleri (`ViewAny:Role`) |
| `role_store` | name, permissions?[] | Rol oluştur (`Create:Role`) |
| `role_update` | name, newName | Rol adını değiştir (`Update:Role`) |
| `role_destroy` | name, reason? | Rol sil (`Delete:Role`) |
| `role_sync_permissions` | name, permissions[] | Rolün izinlerini eşitle (`Update:Role`) |
| `permission_index` | — | İzin listesi (`ViewAny:Permission`) |
| `permission_generate` | extraResources?[] | Kaynaklar için izinleri üret — `shield:generate` (`Create:Permission`) |
| `crud_resources` | — | Kaynak tanımları (tablo, sütun, süzgeç) |
| `crud_index` | resource, query? | Liste: arama + süzgeç + sıralama + sayfalama (`ViewAny:<Kaynak>`) |
| `crud_show` | resource, id | Tek kayıt (`View`) |
| `crud_store` | resource, data | Oluştur (`Create`) |
| `crud_update` | resource, id, data | Kısmi güncelle (`Update`) |
| `crud_destroy` | resource, id, reason? | Sil (`Delete`) |
| `crud_destroy_many` | resource, ids[], reason? | Toplu sil (`DeleteAny`) |
| `crud_aggregate` | resource, groupBy, query? | Gruplu sayım (panel grafikleri) |
| `db_migrate_status` | — | Migration durumu (yalnız admin) |
| `contact_submit` | name, email, subject?, message, lang? | İletişim formu (oturum gerekmez) |

### Bu uygulamaya özel

| Komut | Parametreler | Ne yapar |
|---|---|---|
| `report_submit` | input | Cihazdan gelen rapor (oturum gerekmez). `input`: `{ network, tests, createdAt?, shared?, device?: { id, platform, appVersion, locale } }` Kimliği Rust üretir (`report_id::generate`), skoru geçerli kuraldan hesaplar. |
| `report_show` | id, reveal | Bir raporu gösterir; hassas alanlar varsayılan maskelidir. `reveal` için `Reveal:PII` gerekir ve denetim kaydına yazılır. |
| `report_set_sharing` | id, shared, reason? | Rapor paylaşımını günceller ve gerekçeyi denetim kaydına yazar. |
| `score_rule_publish` | version, note | Taslak kuralı yayınlar (`Publish:ScoreRule`). Eski raporlar kendi `ruleVersion` değerini korur. |
| `score_rule_preview` | version, reportIds | Kuralı seçili raporlarda dener: `[{ id, oldScore, newScore, oldLevel, newLevel }]` |
| `report_dashboard` | from, to | Panel özeti ve o anki yayınlanmış skor kuralının seviyelendirme eşikleri. |

## 6. Ön yüzden çağırma

Admin paneli çağrıları `src-admin/src/api/nativeAdapter.ts` üzerinden `src/lib/native.ts` sınırına gider. Yeni bir panel API işlemi eklerken IPC çağrısını doğrudan bileşene koyma; Tauri dışındaki ortamda bu çağrılar veri üretmeden açık hata verir.

Hatalar `{ code, message, errors? }` olarak döner. `code`: `unauthenticated` (oturum yok), `forbidden` (izin yok), `not_found`, `validation` (`errors[]` alan bazlı), `conflict`, `db`, `internal`.

Süzgeç anahtarı bir sütun adıysa tam eşleşme, dizi ise `IN`; `<sütun>Min` / `<sütun>Max` aralık verir (yalnız `filters` listesindeki sütunlar).

## 7. Yeni tablo / kaynak ekleme

1. `migrations/` altına yeni SQL dosyası (`2026_MM_GG_NNNNNN_ad.sql`); `migrations.rs` listesinin **sonuna** ekle.
2. `schema.rs` içine `Entity` tanımı ekle ve `PROJECT` listesine koy (sütun adları TypeScript tipiyle aynı).
3. İzinler için yeni bir veri migration'ı: `INSERT OR IGNORE INTO permissions …` ve rol atamaları.
4. İş kuralı gerekiyorsa `domain.rs` içine işlev + `#[tauri::command]` sarmalayıcı yaz, `lib.rs` `generate_handler!` listesine ekle.
5. `cargo test` (`src-tauri/` içinde).

## 8. Testler

`cd src-tauri && cargo test` — bellek içi SQLite ile migration'ları, rol/izin mantığını, kaynak denetleyicisini, parola özetini ve bu uygulamanın iş kurallarını sınar.

## 9. Sınırlar (geçici çözüm)

- Tek kullanıcılı yerel oturum: giriş yapan kullanıcı uygulama belleğinde tutulur; uygulama kapanınca oturum biter. Her yetki denetimi kullanıcının `active` olduğunu da doğrular: askıya alınan ya da engellenen kullanıcının açık oturumu hemen geçersiz olur (`unauthenticated`).
- Veri cihazdadır; cihazlar arası eşitleme ve sunucu yoktur. Silinen uygulama verisiyle birlikte veritabanı da gider.
- Parolalar Argon2id ile özetlenir; yine de bu bir **eğitim ve geliştirme altyapısıdır**, gerçek kullanıcı verisi için denetlenmiş bir sunucu gerekir.
- İzin önbelleği yoktur; her denetim veritabanından okunur.
- Arama SQLite `LIKE` ile yapılır (Türkçe büyük/küçük harf duyarlılığı sınırlıdır).
