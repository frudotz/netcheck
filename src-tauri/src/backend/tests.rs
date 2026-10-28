//! Yetki ve oturum kurallarının bellek içi veritabanıyla sınanması (migration'lar çalışmış).
//! Her test `boot_memory()` ile boş bir veritabanı açar; gerçek dosya kullanılmaz.
use crate::backend::auth;
use crate::backend::controllers as c;
use crate::backend::crud::ListQuery;
use crate::backend::error::AppError;
use crate::backend::rbac::{self, ModelRef, SUPER_ADMIN_ROLE};
use crate::backend::state::AppState;

const PW: &str = "gizli-parola-1";

/// İlk yönetici kaydı; oturum yöneticide kalır.
fn boot_with_admin() -> (AppState, i64) {
    let app = crate::backend::boot_memory().expect("bellek içi veritabanı");
    let v = c::auth_register(&app, "Yönetici", "admin@ornek.com", PW).expect("ilk kayıt");
    let id = v["user"]["id"].as_i64().unwrap();
    (app, id)
}

/// Yönetici oturumuyla yeni kullanıcı; dönen kimlik. Oturum çağrıdan sonra yöneticide kalır.
fn add_user(app: &AppState, admin: i64, email: &str, role: &str) -> i64 {
    app.set_user(Some(admin));
    let v = c::user_store(app, "Kullanıcı", email, role, Some(PW)).expect("kullanıcı oluştur");
    v["user"]["id"].as_i64().unwrap()
}

fn give_role_permissions(app: &AppState, role: &str, perms: &[&str]) {
    app.db.with(|conn| rbac::role_give_permission_to(conn, role, perms)).expect("izin ver");
}

fn roles_of(app: &AppState, id: i64) -> Vec<String> {
    app.db.with(|conn| rbac::role_names(conn, ModelRef::user(id))).unwrap()
}

fn password_hash_of(app: &AppState, id: i64) -> String {
    app.db.with(|conn| Ok(conn.query_row("SELECT password FROM users WHERE id = ?1", [id], |r| r.get::<_, String>(0))?)).unwrap()
}

fn status_of(app: &AppState, id: i64) -> String {
    app.db.with(|conn| Ok(conn.query_row("SELECT status FROM users WHERE id = ?1", [id], |r| r.get::<_, String>(0))?)).unwrap()
}

// ───────────────────────── C1: askıya alınan kullanıcı ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Suspended session is rejected]]
fn suspended_user_loses_authorization_immediately() {
    let (app, admin) = boot_with_admin();
    let b = add_user(&app, admin, "destek@ornek.com", "support");

    app.set_user(Some(b));
    assert!(c::crud_index(&app, "ContactMessage", ListQuery::default()).is_ok(), "destek rolü mesajları listeler");

    app.set_user(Some(admin));
    c::user_set_status(&app, b, "suspended", Some("test")).expect("askıya al");

    app.set_user(Some(b));
    let listed = c::crud_index(&app, "ContactMessage", ListQuery::default());
    assert!(matches!(listed, Err(AppError::Unauthenticated)), "askıdaki oturum yetkisiz olmalı: {listed:?}");
    let me = c::auth_me(&app).expect("auth_me hata vermez");
    assert!(me.is_null(), "askıdaki kullanıcı için oturum görünmemeli: {me}");
}

#[test]
// @lat: [[tests#Local backend#Suspending the session user ends the session]]
fn suspending_the_session_user_ends_the_session() {
    let (app, admin) = boot_with_admin();
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    give_role_permissions(&app, "support", &["Update:User"]);
    // Yönetici kendini değil, ikinci bir yönetici askıya alıyor: oturumdaki kullanıcı hedefse oturum kapanır.
    let d = add_user(&app, admin, "ikinci@ornek.com", SUPER_ADMIN_ROLE);
    app.set_user(Some(d));
    c::user_set_status(&app, b, "banned", None).expect("yönetici engeller");
    app.set_user(Some(admin));
    c::user_set_status(&app, d, "suspended", None).expect("iki etkin yönetici varken biri askıya alınabilir");
    app.set_user(Some(d));
    assert!(c::auth_me(&app).unwrap().is_null(), "askıya alınan yöneticinin oturumu düşer");
}

// ───────────────────────── C2: süper yönetici rolü yalnız süper yöneticiden ─────────────────────────

#[test]
// @lat: [[tests#Local backend#No self-promotion to super admin]]
fn delegated_user_cannot_promote_self_to_super_admin() {
    let (app, admin) = boot_with_admin();
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    give_role_permissions(&app, "support", &["Update:User", "ViewAny:User"]);

    app.set_user(Some(b));
    let r = c::user_sync_roles(&app, b, &["admin".into()]);
    assert!(matches!(r, Err(AppError::Forbidden(_))), "kendine admin rolü verememeli: {r:?}");
    assert_eq!(roles_of(&app, b), vec!["support".to_string()]);
}

#[test]
// @lat: [[tests#Local backend#Only a super admin grants the admin role]]
fn delegated_user_cannot_grant_super_admin_to_others() {
    let (app, admin) = boot_with_admin();
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    let cc = add_user(&app, admin, "icerik@ornek.com", "content");
    give_role_permissions(&app, "support", &["Update:User", "Create:User", "ViewAny:User"]);

    app.set_user(Some(b));
    let r = c::user_sync_roles(&app, cc, &["admin".into()]);
    assert!(matches!(r, Err(AppError::Forbidden(_))), "başkasına admin rolü verememeli: {r:?}");
    assert_eq!(roles_of(&app, cc), vec!["content".to_string()]);

    let r = c::user_store(&app, "Yeni", "yeni@ornek.com", SUPER_ADMIN_ROLE, Some(PW));
    assert!(matches!(r, Err(AppError::Forbidden(_))), "admin rolüyle kullanıcı oluşturamamalı: {r:?}");
    let exists: bool = app
        .db
        .with(|conn| Ok(conn.query_row("SELECT EXISTS(SELECT 1 FROM users WHERE email = 'yeni@ornek.com')", [], |r| r.get(0))?))
        .unwrap();
    assert!(!exists, "reddedilen istek kullanıcı oluşturmamalı");

    // Süper yönetici dışı rol vermek serbest kalır.
    let r = c::user_sync_roles(&app, cc, &["viewer".into()]);
    assert!(r.is_ok(), "delegasyon diğer roller için çalışır: {r:?}");
}

#[test]
// @lat: [[tests#Local backend#Only a super admin demotes or suspends an admin]]
fn delegated_user_cannot_strip_super_admin_role() {
    let (app, admin) = boot_with_admin();
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    let d = add_user(&app, admin, "ikinci@ornek.com", SUPER_ADMIN_ROLE);
    give_role_permissions(&app, "support", &["Update:User"]);

    app.set_user(Some(b));
    let r = c::user_sync_roles(&app, d, &["viewer".into()]);
    assert!(matches!(r, Err(AppError::Forbidden(_))), "admin rolünü alamamalı: {r:?}");
    assert_eq!(roles_of(&app, d), vec![SUPER_ADMIN_ROLE.to_string()]);
    let r = c::user_set_status(&app, d, "suspended", None);
    assert!(matches!(r, Err(AppError::Forbidden(_))), "süper yöneticiyi askıya alamamalı: {r:?}");
    assert_eq!(status_of(&app, d), "active");
}

// ───────────────────────── C3: var olan e-posta ile kullanıcı oluşturma ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Duplicate e-mail is a conflict]]
fn duplicate_email_is_a_conflict_and_changes_nothing() {
    let (app, admin) = boot_with_admin();
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    let hash_before = password_hash_of(&app, b);

    app.set_user(Some(admin));
    let r = c::user_store(&app, "Sahte", "Destek@Ornek.com", SUPER_ADMIN_ROLE, Some("yeni-parola-99"));
    assert!(matches!(r, Err(AppError::Conflict(_))), "aynı e-posta çakışma vermeli: {r:?}");
    assert_eq!(password_hash_of(&app, b), hash_before, "parola değişmemeli");
    assert_eq!(roles_of(&app, b), vec!["support".to_string()], "roller değişmemeli");
    app.db.with(|conn| auth::attempt(conn, "destek@ornek.com", PW)).expect("eski parola hâlâ geçerli");
    let old_login = app.db.with(|conn| auth::attempt(conn, "destek@ornek.com", "yeni-parola-99"));
    assert!(old_login.is_err(), "yeni parola geçerli olmamalı");
}

// ───────────────────────── H1: son etkin süper yönetici ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Last active super admin is protected]]
fn last_active_super_admin_cannot_be_demoted_or_suspended() {
    let (app, admin) = boot_with_admin();
    let r = c::user_set_status(&app, admin, "suspended", None);
    assert!(matches!(r, Err(AppError::Conflict(_))), "tek yönetici askıya alınamaz: {r:?}");
    let r = c::user_sync_roles(&app, admin, &["support".into()]);
    assert!(matches!(r, Err(AppError::Conflict(_))), "tek yöneticiden admin alınamaz: {r:?}");
    assert_eq!(roles_of(&app, admin), vec![SUPER_ADMIN_ROLE.to_string()]);
    assert_eq!(status_of(&app, admin), "active");
}

#[test]
// @lat: [[tests#Local backend#Suspended admins do not count as active]]
fn suspended_super_admins_do_not_count_as_active() {
    let (app, admin) = boot_with_admin();
    let d = add_user(&app, admin, "ikinci@ornek.com", SUPER_ADMIN_ROLE);
    app.set_user(Some(admin));
    c::user_set_status(&app, d, "suspended", None).expect("iki etkin yönetici varken askıya alma serbest");
    let r = c::user_sync_roles(&app, admin, &["support".into()]);
    assert!(matches!(r, Err(AppError::Conflict(_))), "kalan tek etkin yöneticiden admin alınamaz: {r:?}");
    assert_eq!(roles_of(&app, admin), vec![SUPER_ADMIN_ROLE.to_string()]);
}

#[test]
// @lat: [[tests#Local backend#Several active super admins can be managed]]
fn multiple_active_super_admins_can_be_managed() {
    let (app, admin) = boot_with_admin();
    let d = add_user(&app, admin, "ikinci@ornek.com", SUPER_ADMIN_ROLE);
    app.set_user(Some(admin));
    c::user_sync_roles(&app, d, &["support".into()]).expect("ikinci yönetici indirilebilir");
    assert_eq!(roles_of(&app, d), vec!["support".to_string()]);
    c::user_sync_roles(&app, d, &[SUPER_ADMIN_ROLE.into()]).expect("süper yönetici yeniden admin yapabilir");
    c::user_set_status(&app, d, "suspended", None).expect("ikinci yönetici askıya alınabilir");
    c::user_set_status(&app, d, "active", None).expect("yeniden etkinleştirilebilir");
    // Artık iki etkin yönetici var; ilk yönetici kendini indirebilir.
    c::user_sync_roles(&app, admin, &["viewer".into()]).expect("başka etkin yönetici varken indirme serbest");
    assert_eq!(roles_of(&app, admin), vec!["viewer".to_string()]);
}

// ───────────────────────── C3 devamı: parola ve ad ayrı, yetkili akışlardan ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Password change is an explicit flow]]
fn password_change_goes_through_the_explicit_flow() {
    let (app, admin) = boot_with_admin();
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    give_role_permissions(&app, "support", &["Update:User"]);

    // Süper yönetici B'nin parolasını değiştirir: eski parola düşer, yeni parola geçer, denetim kaydı parola içermez.
    app.set_user(Some(admin));
    c::user_set_password(&app, b, "yeni-parola-99").expect("yönetici parola değiştirir");
    assert!(app.db.with(|conn| auth::attempt(conn, "destek@ornek.com", PW)).is_err(), "eski parola geçersiz");
    app.db.with(|conn| auth::attempt(conn, "destek@ornek.com", "yeni-parola-99")).expect("yeni parola geçerli");
    let logged: (i64, Option<String>) = app
        .db
        .with(|conn| Ok(conn.query_row("SELECT COUNT(*), MAX(after) FROM audit_logs WHERE action = 'User.setPassword'", [], |r| Ok((r.get(0)?, r.get(1)?)))?))
        .unwrap();
    assert_eq!(logged.0, 1);
    assert!(logged.1.is_none(), "denetim kaydında parola olmamalı");

    // Delegasyonlu kullanıcı süper yöneticinin parolasını değiştiremez; kendi parolasını değiştirebilir.
    let hash_before = password_hash_of(&app, admin);
    app.set_user(Some(b));
    let r = c::user_set_password(&app, admin, "ele-gecirilen-parola");
    assert!(matches!(r, Err(AppError::Forbidden(_))), "yöneticinin parolası korunur: {r:?}");
    assert_eq!(password_hash_of(&app, admin), hash_before);
    c::user_set_password(&app, b, "kendi-parolam-123").expect("kendi parolasını değiştirir");

    // Kısa parola reddedilir.
    let r = c::user_set_password(&app, b, "kisa");
    assert!(matches!(r, Err(AppError::Validation(_))), "kısa parola doğrulamadan geçmez: {r:?}");
}

#[test]
// @lat: [[tests#Local backend#User update changes only the name]]
fn user_update_changes_only_the_name() {
    let (app, admin) = boot_with_admin();
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    let hash_before = password_hash_of(&app, b);
    app.set_user(Some(admin));
    let v = c::user_update(&app, b, "Yeni Ad").expect("ad güncellenir");
    assert_eq!(v["name"], "Yeni Ad");
    assert_eq!(v["email"], "destek@ornek.com");
    assert_eq!(password_hash_of(&app, b), hash_before);
    assert_eq!(roles_of(&app, b), vec!["support".to_string()]);
}

// ═════════════════════════ Aşama 2: iş kuralları, bütünlük, açık uçlar, dışa aktarma ═════════════════════════
use crate::backend::domain;
use crate::backend::schema;
use serde_json::{json, Value};

fn report_payload(device_id: Option<&str>) -> Value {
    let mut v = json!({
        "network": { "hostname": "cihaz-1", "localIPv4": "192.0.2.10", "gateway": "192.0.2.1", "dnsServers": ["192.0.2.53"], "connectionType": "wifi",
                     "interfaces": [{ "name": "Wi-Fi", "ipv4": "192.0.2.10", "mac": "00-00-5E-00-53-01", "type": "wifi", "isUp": true, "isDefault": true }] },
        "tests": [
            { "id": "gateway", "status": "success", "latencyMs": 2.0 }, { "id": "cloudflare", "status": "success", "latencyMs": 20.0 },
            { "id": "google", "status": "success", "latencyMs": 22.0 }, { "id": "dns", "status": "success", "latencyMs": 15.0 },
            { "id": "internet", "status": "success", "latencyMs": 90.0 }
        ]
    });
    if let Some(d) = device_id {
        v["device"] = json!({ "id": d, "platform": { "os": "windows", "family": "desktop" }, "appVersion": "0.1.0", "locale": "tr" });
    }
    v
}

fn submit_report(app: &AppState, device_id: Option<&str>) -> String {
    domain::do_report_submit(app, &report_payload(device_id)).expect("rapor kaydı")["id"].as_str().unwrap().to_string()
}

fn audit_count(app: &AppState, action: &str) -> i64 {
    app.db.with(|conn| Ok(conn.query_row("SELECT COUNT(*) FROM audit_logs WHERE action = ?1", [action], |r| r.get(0))?)).unwrap()
}

fn find_report(app: &AppState, id: &str) -> Value {
    app.db.with(|conn| crate::backend::crud::find(conn, &schema::REPORT, &json!(id))).unwrap()
}

// ───────────────────────── H2: genel CRUD iş kurallarını atlayamaz ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Published score rule is immutable]]
fn published_score_rule_cannot_be_edited_through_generic_crud() {
    let (app, _admin) = boot_with_admin();
    let ok_weights = json!({ "internet": 35, "dns": 20, "gateway": 15, "cloudflare": 10, "google": 10 });
    let r = c::crud_update(&app, "ScoreRule", &json!(1), &json!({ "weights": ok_weights, "note": "x" }));
    assert!(matches!(r, Err(AppError::Conflict(_))), "yayınlanmış kural değişmemeli: {r:?}");
    let r = c::crud_store(&app, "ScoreRule", &json!({ "status": "published", "weights": ok_weights, "latencyBands": [{ "maxMs": null, "bonus": 1 }], "levels": { "iyi": 80, "orta": 50 } }));
    assert!(matches!(r, Err(AppError::Validation(_))), "genel CRUD yayın yapamamalı: {r:?}");
    let r = c::crud_store(&app, "ScoreRule", &json!({ "status": "draft", "weights": { "internet": 50, "dns": 20, "gateway": 15, "cloudflare": 10, "google": 10 }, "latencyBands": [{ "maxMs": null, "bonus": 1 }], "levels": { "iyi": 80, "orta": 50 } }));
    assert!(matches!(r, Err(AppError::Validation(_))), "geçersiz ağırlık reddedilmeli: {r:?}");
    let draft = c::crud_store(&app, "ScoreRule", &json!({ "status": "draft", "weights": ok_weights, "latencyBands": [{ "maxMs": null, "bonus": 1 }], "levels": { "iyi": 80, "orta": 50 } })).expect("geçerli taslak");
    c::crud_update(&app, "ScoreRule", &draft["version"], &json!({ "note": "taslak notu" })).expect("taslak düzenlenebilir");
}

#[test]
// @lat: [[tests#Local backend#Report fields are protected]]
fn report_protected_fields_are_rejected() {
    let (app, _admin) = boot_with_admin();
    let id = submit_report(&app, None);
    for (k, v) in [("score", json!(1)), ("tests", json!([])), ("network", json!({})), ("createdAt", json!("2020-01-01T00:00:00Z")), ("passed", json!(0)), ("ruleVersion", json!(9))] {
        let r = c::crud_update(&app, "Report", &json!(id), &json!({ k: v }));
        assert!(matches!(r, Err(AppError::Validation(_))), "{k} değişmemeli: {r:?}");
    }
    assert_eq!(find_report(&app, &id)["score"], 100);
    c::crud_update(&app, "Report", &json!(id), &json!({ "shared": false })).expect("paylaşım bayrağı değişebilir");
    let r = c::crud_store(&app, "Report", &json!({ "createdAt": "2026-01-01T00:00:00Z", "score": 50, "passed": 1, "failed": 4, "network": {}, "tests": [] }));
    assert!(matches!(r, Err(AppError::Forbidden(_))), "panelden rapor oluşturulamamalı: {r:?}");
}

#[test]
// @lat: [[tests#Local backend#Reply list is not writable through CRUD]]
fn reply_author_cannot_be_forged_through_generic_crud() {
    let (app, _admin) = boot_with_admin();
    let msg = c::contact_submit(&app, "Ali Veli", "ali@ornek.com", None, "Uygulama açılmıyor, yardım eder misiniz?", Some("tr")).expect("iletişim formu");
    let r = c::crud_update(&app, "ContactMessage", &msg["id"], &json!({ "replies": [{ "id": "x", "authorId": "999", "body": "sahte", "at": "2026-01-01T00:00:00Z", "internal": false }] }));
    assert!(matches!(r, Err(AppError::Validation(_))), "istemci yanıt listesini yazamamalı: {r:?}");
    let r = c::crud_update(&app, "ContactMessage", &msg["id"], &json!({ "message": "değiştirildi" }));
    assert!(matches!(r, Err(AppError::Validation(_))), "özgün ileti değişmemeli: {r:?}");
    c::crud_update(&app, "ContactMessage", &msg["id"], &json!({ "status": "in-progress" })).expect("durum değişebilir");
}

// ───────────────────────── H3: denetim kaydı ile birlikte geri alma ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Mutation and audit roll back together]]
fn mutation_and_audit_roll_back_together() {
    let (app, _admin) = boot_with_admin();
    let page = c::crud_store(&app, "ContentPage", &json!({ "slug": "hakkinda", "lang": "tr", "title": "Eski", "body": "", "status": "draft" })).expect("sayfa");
    // Denetim tablosunu geçici olarak devre dışı bırak: audit::record başarısız olur.
    app.db.with(|conn| { conn.execute_batch("ALTER TABLE audit_logs RENAME TO audit_logs_kapali;")?; Ok(()) }).unwrap();
    let r = c::crud_update(&app, "ContentPage", &page["id"], &json!({ "title": "Yeni" }));
    assert!(r.is_err(), "denetim yazılamayınca işlem başarısız olmalı");
    app.db.with(|conn| { conn.execute_batch("ALTER TABLE audit_logs_kapali RENAME TO audit_logs;")?; Ok(()) }).unwrap();
    let title: String = app.db.with(|conn| Ok(conn.query_row("SELECT title FROM content_pages WHERE id = ?1", [page["id"].as_str().unwrap()], |r| r.get(0))?)).unwrap();
    assert_eq!(title, "Eski", "denetimsiz değişiklik kalıcı olmamalı");
}

// ───────────────────────── H4: oturumsuz yazma uçları sınır ve biçim denetler ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Report submission is bounded]]
fn report_submit_rejects_invalid_or_oversized_payloads() {
    let (app, _admin) = boot_with_admin();
    let mut big = report_payload(None);
    big["network"]["blob"] = json!("x".repeat(20_000));
    assert!(matches!(domain::do_report_submit(&app, &big), Err(AppError::Validation(_))), "16 KiB üstü ağ bilgisi reddedilmeli");
    let mut bad_date = report_payload(None);
    bad_date["createdAt"] = json!("yarın");
    assert!(matches!(domain::do_report_submit(&app, &bad_date), Err(AppError::Validation(_))), "biçimsiz zaman damgası reddedilmeli");
    let mut bad_device = report_payload(Some("x"));
    bad_device["device"]["id"] = json!("a".repeat(65));
    assert!(matches!(domain::do_report_submit(&app, &bad_device), Err(AppError::Validation(_))), "uzun cihaz kimliği reddedilmeli");
    let mut four = report_payload(None);
    four["tests"].as_array_mut().unwrap().pop();
    assert!(matches!(domain::do_report_submit(&app, &four), Err(AppError::Validation(_))), "eksik test reddedilmeli");
    // Geçerli kayıt: testler yalnız bilinen alanlarıyla saklanır.
    let mut extra = report_payload(None);
    extra["tests"][0]["message"] = json!("<script>alert(1)</script>");
    let rec = domain::do_report_submit(&app, &extra).expect("geçerli rapor");
    assert!(rec["tests"][0].get("message").is_none(), "fazladan alanlar atılmalı: {}", rec["tests"][0]);
    assert_eq!(rec["tests"][0]["id"], "gateway");
}

#[test]
// @lat: [[tests#Local backend#Contact submission is bounded]]
fn contact_submit_rejects_oversized_message() {
    let (app, _admin) = boot_with_admin();
    let r = c::contact_submit(&app, "Ali", "ali@ornek.com", None, &"a".repeat(5001), None);
    assert!(matches!(r, Err(AppError::Validation(_))), "5000 karakter üstü ileti reddedilmeli: {r:?}");
    let r = c::contact_submit(&app, "Ali", "ali@ornek", None, "Yeterince uzun bir ileti.", None);
    assert!(matches!(r, Err(AppError::Validation(_))), "geçersiz e-posta reddedilmeli: {r:?}");
}

// ───────────────────────── H2/H3 devamı: arka uca ait yanıt ve cihaz silme ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Reply author is the session user]]
fn reply_author_is_the_authenticated_user() {
    let (app, admin) = boot_with_admin();
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    let msg = c::contact_submit(&app, "Ali Veli", "ali@ornek.com", None, "Uygulama açılmıyor, yardım eder misiniz?", Some("tr")).expect("iletişim formu");
    let id = msg["id"].as_str().unwrap();

    app.set_user(Some(b));
    let after = c::contact_message_reply(&app, id, "Merhaba, inceliyoruz.", false).expect("destek yanıtlar");
    let reply = &after["replies"][0];
    assert_eq!(reply["authorId"], b.to_string(), "yazar oturumdan gelir");
    assert_eq!(reply["body"], "Merhaba, inceliyoruz.");
    assert_eq!(reply["internal"], false);
    assert_eq!(after["status"], "answered");
    assert_eq!(audit_count(&app, "ContactMessage.reply"), 1);

    let r = c::contact_message_reply(&app, id, "   ", true);
    assert!(matches!(r, Err(AppError::Validation(_))), "boş yanıt reddedilir: {r:?}");

    // İzinsiz kullanıcı yanıt yazamaz.
    let v = add_user(&app, admin, "izleyici@ornek.com", "viewer");
    app.set_user(Some(v));
    let r = c::contact_message_reply(&app, id, "yetkisiz", false);
    assert!(matches!(r, Err(AppError::Forbidden(_))), "viewer yanıt yazamaz: {r:?}");
}

#[test]
// @lat: [[tests#Local backend#Device purge is atomic]]
fn device_purge_is_atomic_and_authorized() {
    let (app, admin) = boot_with_admin();
    submit_report(&app, Some("cihaz-A"));
    submit_report(&app, Some("cihaz-A"));
    submit_report(&app, Some("cihaz-B"));

    let v = add_user(&app, admin, "izleyici@ornek.com", "viewer");
    app.set_user(Some(v));
    let r = domain::do_device_purge(&app, "cihaz-A", None);
    assert!(matches!(r, Err(AppError::Forbidden(_))), "viewer cihaz silemez: {r:?}");

    // Denetim yazılamazsa raporlar ve cihaz yerinde kalır.
    app.set_user(Some(admin));
    app.db.with(|conn| { conn.execute_batch("ALTER TABLE audit_logs RENAME TO audit_logs_kapali;")?; Ok(()) }).unwrap();
    assert!(domain::do_device_purge(&app, "cihaz-A", Some("test")).is_err());
    app.db.with(|conn| { conn.execute_batch("ALTER TABLE audit_logs_kapali RENAME TO audit_logs;")?; Ok(()) }).unwrap();
    let count = |sql: &str| -> i64 { app.db.with(|conn| Ok(conn.query_row(sql, [], |r| r.get(0))?)).unwrap() };
    assert_eq!(count("SELECT COUNT(*) FROM reports WHERE \"deviceId\" = 'cihaz-A'"), 2, "geri alma: raporlar durur");
    assert_eq!(count("SELECT COUNT(*) FROM devices WHERE id = 'cihaz-A'"), 1, "geri alma: cihaz durur");

    let out = domain::do_device_purge(&app, "cihaz-A", Some("kullanıcı isteği")).expect("yönetici siler");
    assert_eq!(out["deletedReports"], 2);
    assert_eq!(count("SELECT COUNT(*) FROM reports WHERE \"deviceId\" = 'cihaz-A'"), 0);
    assert_eq!(count("SELECT COUNT(*) FROM devices WHERE id = 'cihaz-A'"), 0);
    assert_eq!(count("SELECT COUNT(*) FROM reports"), 1, "diğer cihazın raporu kalır");
    assert_eq!(audit_count(&app, "Device.purge"), 1);
}

// ───────────────────────── M1: dışa aktarma ve alan bazlı hassas veri açma ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Export is authorized and audited]]
fn export_requires_permission_and_is_audited() {
    let (app, admin) = boot_with_admin();
    let v = add_user(&app, admin, "izleyici@ornek.com", "viewer");
    let s = add_user(&app, admin, "destek@ornek.com", "support");
    app.set_user(Some(v));
    let r = domain::do_export_authorize(&app, "csv");
    assert!(matches!(r, Err(AppError::Forbidden(_))), "viewer dışa aktaramaz: {r:?}");
    assert_eq!(audit_count(&app, "report.export"), 0);
    app.set_user(Some(s));
    assert!(domain::do_export_authorize(&app, "csv").expect("support dışa aktarır"));
    assert!(domain::do_export_authorize(&app, "pdf").expect("pdf de"));
    assert_eq!(audit_count(&app, "report.export"), 2);
    let r = domain::do_export_authorize(&app, "xlsx");
    assert!(matches!(r, Err(AppError::Validation(_))), "bilinmeyen tür: {r:?}");
    app.set_user(None);
    assert!(matches!(domain::do_export_authorize(&app, "csv"), Err(AppError::Unauthenticated)));
}

#[test]
// @lat: [[tests#Local backend#PII reveal is per field and audited]]
fn pii_reveal_is_per_field_audited_and_default_stays_masked() {
    let (app, admin) = boot_with_admin();
    let id = submit_report(&app, None);
    let v = add_user(&app, admin, "izleyici@ornek.com", "viewer");

    // Varsayılan görünüm maskeli (liste, tekil, rapor komutu).
    app.set_user(Some(v));
    let shown = domain::do_report_show(&app, &id).expect("viewer raporu görür");
    assert_eq!(shown["network"]["hostname"], "••••");
    assert_eq!(shown["network"]["interfaces"][0]["mac"], "••••");
    let listed = c::crud_index(&app, "Report", ListQuery::default()).unwrap();
    assert_eq!(listed.items[0]["network"]["localIPv4"], "••••");
    // Reveal:PII olmadan alan açılamaz ve denetim kaydı oluşmaz.
    let r = domain::do_report_reveal_field(&app, &id, "hostname");
    assert!(matches!(r, Err(AppError::Forbidden(_))), "viewer hassas alan açamaz: {r:?}");
    assert_eq!(audit_count(&app, "pii.reveal"), 0);

    // Süper yönetici tek tek açar; her açma alan adıyla kayda geçer; saklanan veri maskeli kalır.
    app.set_user(Some(admin));
    let h = domain::do_report_reveal_field(&app, &id, "hostname").unwrap();
    assert_eq!(h["value"], "cihaz-1");
    let d = domain::do_report_reveal_field(&app, &id, "dnsServer[0]").unwrap();
    assert_eq!(d["value"], "192.0.2.53");
    let m = domain::do_report_reveal_field(&app, &id, "Wi-Fi.mac").unwrap();
    assert_eq!(m["value"], "00-00-5E-00-53-01");
    let r = domain::do_report_reveal_field(&app, &id, "network");
    assert!(matches!(r, Err(AppError::Validation(_))), "toplu açma yok: {r:?}");
    assert_eq!(audit_count(&app, "pii.reveal"), 3);
    let fields: Vec<String> = app
        .db
        .with(|conn| {
            let mut st = conn.prepare("SELECT after FROM audit_logs WHERE action = 'pii.reveal' ORDER BY rowid")?;
            let rows = st.query_map([], |r| r.get::<_, String>(0))?;
            Ok(rows.collect::<Result<Vec<_>, _>>()?)
        })
        .unwrap();
    assert!(fields[0].contains("hostname") && fields[2].contains("Wi-Fi.mac"), "denetim kaydı alan adını taşır: {fields:?}");
    assert_eq!(domain::do_report_show(&app, &id).unwrap()["network"]["hostname"], "••••", "açma sonrası da varsayılan maskeli");
    assert_eq!(find_report(&app, &id)["network"]["hostname"], "cihaz-1", "saklanan veri bozulmaz");
}

// ═════════════════════════ Takip: giriş sınırı, oturum süresi, ayrılmış rol adı, hedef tablosu ═════════════════════════
use crate::backend::state::{LOGIN_LOCK_SECS, LOGIN_MAX_FAILURES, SESSION_ABSOLUTE_SECS, SESSION_IDLE_SECS};

const T0: u64 = 1_800_000_000;

fn boot_with_admin_at(now: u64) -> (AppState, i64) {
    let app = crate::backend::boot_memory().expect("bellek içi veritabanı");
    app.set_now(now);
    let v = c::auth_register(&app, "Yönetici", "admin@ornek.com", PW).expect("ilk kayıt");
    (app, v["user"]["id"].as_i64().unwrap())
}

// ───────────────────────── M3: ayrılmış rol adı ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Reserved role name variants are rejected]]
fn reserved_role_name_variants_are_rejected() {
    let (app, admin) = boot_with_admin_at(T0);
    for name in ["Admin", "ADMIN", " admin ", "aDmIn"] {
        let r = c::role_store(&app, name, &[]);
        assert!(matches!(r, Err(AppError::Validation(_))), "{name:?} ayrılmış ad olarak reddedilmeli: {r:?}");
    }
    let r = c::role_update(&app, "support", "Admin");
    assert!(matches!(r, Err(AppError::Validation(_))), "yeniden adlandırma ile de alınamaz: {r:?}");
    let roles: Vec<String> = app.db.with(|conn| Ok(rbac::role_all(conn)?.into_iter().map(|r| r.name).collect())).unwrap();
    assert_eq!(roles, vec!["admin", "content", "support", "viewer"], "rol listesi değişmemeli: {roles:?}");

    // Delegasyonlu kullanıcı için büyük/küçük harf değişkeni de süper yönetici rolü sayılır.
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    let cc = add_user(&app, admin, "icerik@ornek.com", "content");
    give_role_permissions(&app, "support", &["Update:User", "Create:User"]);
    app.set_user(Some(b));
    let r = c::user_sync_roles(&app, cc, &["Admin".into()]);
    assert!(matches!(r, Err(AppError::Forbidden(_))), "başkasına 'Admin' verememeli: {r:?}");
    let r = c::user_sync_roles(&app, b, &["ADMIN".into()]);
    assert!(matches!(r, Err(AppError::Forbidden(_))), "kendine 'ADMIN' verememeli: {r:?}");
    let r = c::user_store(&app, "Yeni", "yeni@ornek.com", "Admin", Some(PW));
    assert!(matches!(r, Err(AppError::Forbidden(_))), "'Admin' rolüyle kullanıcı oluşturamamalı: {r:?}");
    assert_eq!(roles_of(&app, cc), vec!["content".to_string()]);
    assert_eq!(roles_of(&app, b), vec!["support".to_string()]);
}

// ───────────────────────── M5: tanılama hedefleri tablosu salt okunur ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Diagnostic targets are read only]]
fn diagnostic_targets_are_read_only() {
    let (app, _admin) = boot_with_admin_at(T0);
    let listed = c::crud_index(&app, "DiagnosticTarget", ListQuery::default()).expect("liste okunur");
    assert_eq!(listed.total, 5);
    let r = c::crud_update(&app, "DiagnosticTarget", &json!("cloudflare"), &json!({ "target": "198.51.100.1" }));
    assert!(matches!(r, Err(AppError::Forbidden(_))), "hedef adresi değiştirilemez: {r:?}");
    let r = c::crud_store(&app, "DiagnosticTarget", &json!({ "kind": "gateway", "target": "x" }));
    assert!(matches!(r, Err(AppError::Forbidden(_))), "hedef eklenemez: {r:?}");
    let r = c::crud_destroy(&app, "DiagnosticTarget", &json!("dns"), None);
    assert!(matches!(r, Err(AppError::Forbidden(_))), "hedef silinemez: {r:?}");
    let target: String = app.db.with(|conn| Ok(conn.query_row("SELECT target FROM diagnostic_targets WHERE kind = 'cloudflare'", [], |r| r.get(0))?)).unwrap();
    assert_eq!(target, "1.1.1.1", "saklanan satır değişmedi");
}
// ───────────────────────── M2: giriş denemesi sınırı ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Login is locked after repeated failures]]
fn login_is_locked_after_repeated_failures() {
    let (app, _admin) = boot_with_admin_at(T0);
    app.set_user(None);
    for _ in 0..LOGIN_MAX_FAILURES {
        let r = c::auth_login(&app, "admin@ornek.com", "yanlis-parola");
        assert!(r.is_err(), "yanlış parola reddedilir");
    }
    // Doğru parola bile kilit süresince kabul edilmez; hata kodu ayrı ve kalan süre bildirilir.
    let r = c::auth_login(&app, "Admin@Ornek.com", PW);
    assert!(matches!(r, Err(AppError::TooManyAttempts(secs)) if secs > 0 && secs <= LOGIN_LOCK_SECS), "kilit: {r:?}");
    assert!(c::auth_me(&app).unwrap().is_null(), "kilitli denemeler oturum açmaz");
    // Kilit süresi dolunca doğru parola yeniden çalışır ve sayaç temizlenir.
    app.set_now(T0 + LOGIN_LOCK_SECS + 1);
    c::auth_login(&app, "admin@ornek.com", PW).expect("kilit dolunca giriş");
    assert!(app.login_locked_for("admin@ornek.com").is_none());
}

#[test]
// @lat: [[tests#Local backend#Login lock is per account and success resets]]
fn login_lock_is_per_account_and_success_resets() {
    let (app, admin) = boot_with_admin_at(T0);
    let _b = add_user(&app, admin, "destek@ornek.com", "support");
    app.set_user(None);
    for _ in 0..(LOGIN_MAX_FAILURES - 1) {
        assert!(c::auth_login(&app, "destek@ornek.com", "yanlis-parola").is_err());
    }
    // Dört başarısızlıktan sonra doğru parola kabul edilir ve sayacı sıfırlar.
    c::auth_login(&app, "destek@ornek.com", PW).expect("sınır altında giriş");
    app.set_user(None);
    for _ in 0..(LOGIN_MAX_FAILURES - 1) {
        assert!(matches!(c::auth_login(&app, "destek@ornek.com", "yanlis-parola"), Err(AppError::Validation(_))), "sayaç sıfırlanmış olmalı");
    }
    // Destek hesabının denemeleri yöneticiyi kilitlemez.
    c::auth_login(&app, "admin@ornek.com", PW).expect("başka hesap etkilenmez");
}

#[test]
// @lat: [[tests#Local backend#First-admin bootstrap is not rate limited]]
fn first_admin_bootstrap_is_not_rate_limited() {
    let app = crate::backend::boot_memory().unwrap();
    app.set_now(T0);
    // Kullanıcı yokken yapılan giriş denemeleri (başarısız) ilk kurulumu engellemez.
    for _ in 0..(LOGIN_MAX_FAILURES * 2) {
        let _ = c::auth_login(&app, "admin@ornek.com", "tahmin");
    }
    assert!(matches!(c::auth_login(&app, "admin@ornek.com", PW), Err(AppError::TooManyAttempts(_))), "giriş kilitli");
    let v = c::auth_register(&app, "Yönetici", "admin@ornek.com", PW).expect("ilk kayıt kilitten etkilenmez");
    assert_eq!(v["superAdmin"], true);
}

// ───────────────────────── M4: oturum süresi ─────────────────────────

#[test]
// @lat: [[tests#Local backend#Idle session expires]]
fn idle_session_expires_and_activity_extends_it() {
    let (app, _admin) = boot_with_admin_at(T0);
    // Etkinlik boşta kalma süresini yeniler.
    app.set_now(T0 + SESSION_IDLE_SECS - 60);
    assert!(c::user_index(&app).is_ok());
    app.set_now(T0 + 2 * SESSION_IDLE_SECS - 120);
    assert!(c::user_index(&app).is_ok(), "son etkinlikten sonra süre yeniden başlar");
    // Boşta kalma süresi aşılınca korunan komut ve auth_me oturumu düşürür.
    app.set_now(T0 + 2 * SESSION_IDLE_SECS - 120 + SESSION_IDLE_SECS + 1);
    assert!(matches!(c::user_index(&app), Err(AppError::Unauthenticated)), "süresi dolan oturum yetkisiz");
    assert!(c::auth_me(&app).unwrap().is_null());
    assert!(app.session().is_none(), "oturum kaydı silinir");
    // Yeniden giriş yeni bir oturum başlatır.
    c::auth_login(&app, "admin@ornek.com", PW).expect("yeniden giriş");
    assert!(c::user_index(&app).is_ok());
}

#[test]
// @lat: [[tests#Local backend#Absolute session lifetime expires]]
fn absolute_session_lifetime_expires_despite_activity() {
    let (app, _admin) = boot_with_admin_at(T0);
    let step = SESSION_IDLE_SECS / 2;
    let mut t = T0;
    while t + step < T0 + SESSION_ABSOLUTE_SECS {
        t += step;
        app.set_now(t);
        assert!(c::auth_me(&app).unwrap().is_object(), "mutlak ömür içinde etkin oturum sürer (t+{})", t - T0);
    }
    app.set_now(T0 + SESSION_ABSOLUTE_SECS + 1);
    assert!(c::auth_me(&app).unwrap().is_null(), "mutlak ömür dolunca oturum düşer");
    assert!(matches!(c::user_index(&app), Err(AppError::Unauthenticated)));
}

#[test]
// @lat: [[tests#Local backend#Suspension still ends the session with expiry in place]]
fn suspension_still_ends_the_session_with_expiry_in_place() {
    let (app, admin) = boot_with_admin_at(T0);
    let b = add_user(&app, admin, "destek@ornek.com", "support");
    app.set_user(Some(b));
    assert!(c::crud_index(&app, "ContactMessage", ListQuery::default()).is_ok());
    app.set_user(Some(admin));
    c::user_set_status(&app, b, "banned", None).expect("engelle");
    app.set_user(Some(b));
    assert!(matches!(c::crud_index(&app, "ContactMessage", ListQuery::default()), Err(AppError::Unauthenticated)));
    assert!(c::auth_me(&app).unwrap().is_null());
}
