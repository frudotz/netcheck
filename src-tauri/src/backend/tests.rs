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
