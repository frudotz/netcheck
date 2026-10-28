//! Denetleyiciler (Laravel `app/Http/Controllers`). Hepsi düz Rust fonksiyonudur; `commands.rs`
//! bunları Tauri komutu olarak dışarı açar. Her fonksiyon önce `authorize` ile izni denetler.
//!
//! Kaynak (resource) denetleyicisi: `crud_*`  → `Eylem:Kaynak` izinleri (ViewAny, View, Create, Update, Delete, DeleteAny)
//! Kimlik doğrulama:           `auth_*`
//! Rol / izin yönetimi:        `role_*`, `permission_*`, `user_*`
use crate::backend::audit::{self, id_text};
use crate::backend::auth;
use crate::backend::crud::{self, ListQuery, Paged};
use crate::backend::domain::{self, WriteOp};
use crate::backend::error::{AppError, AppResult};
use crate::backend::migrate;
use crate::backend::migrations;
use crate::backend::policy::{ability, authorize};
use crate::backend::rbac::{self, ModelRef, SUPER_ADMIN_ROLE};
use crate::backend::schema;
use crate::backend::state::AppState;
use crate::backend::util::{new_id, NOW_SQL};
use rusqlite::params;
use serde_json::{json, Value};

fn mask_report_network(resource: &str, value: &mut Value) {
    if resource == "Report" {
        if let Some(network) = value.get("network").cloned() {
            value["network"] = crate::backend::domain::mask_network(&network);
        }
    }
}

/// Süper yönetici rolüne dokunan ya da bir süper yöneticiyi hedef alan işlemler yalnız süper yöneticiden gelir.
fn require_super_admin(c: &rusqlite::Connection, uid: i64) -> AppResult<()> {
    if rbac::has_role(c, ModelRef::user(uid), SUPER_ADMIN_ROLE)? {
        Ok(())
    } else {
        Err(AppError::Forbidden("Bu işlem yalnız süper yönetici tarafından yapılabilir.".into()))
    }
}

/// Bir kullanıcı kendi rollerini, izinlerini ya da durumunu değiştiremez; süper yönetici bunun dışındadır
/// (son yönetici koruması onu ayrıca sınırlar).
fn forbid_self_change(c: &rusqlite::Connection, uid: i64, target: i64) -> AppResult<()> {
    if uid == target && !rbac::has_role(c, ModelRef::user(uid), SUPER_ADMIN_ROLE)? {
        return Err(AppError::Forbidden("Kendi yetkini değiştiremezsin.".into()));
    }
    Ok(())
}

// ───────────────────────────── Auth ─────────────────────────────

pub fn auth_register(app: &AppState, name: &str, email: &str, password: &str) -> AppResult<Value> {
    app.db.transaction(|c| {
        if !auth::setup_required(c)? {
            return Err(AppError::Conflict("İlk yönetici hesabı daha önce oluşturulmuş.".into()));
        }
        let user = auth::register(c, name, email, password)?;
        app.set_user(Some(user.id));
        auth::user_with_access(c, user.id)
    })
}

pub fn auth_login(app: &AppState, email: &str, password: &str) -> AppResult<Value> {
    let user = app.db.with(|c| auth::attempt(c, email, password))?;
    app.set_user(Some(user.id));
    app.db.with(|c| auth::user_with_access(c, user.id))
}

pub fn auth_logout(app: &AppState) {
    app.set_user(None);
}

/// Oturum yoksa ya da oturum sahibi artık etkin değilse `null` (oturum düşürülür).
pub fn auth_me(app: &AppState) -> AppResult<Value> {
    match app.user() {
        Some(id) => match app.db.with(|c| auth::require_active(c, id)) {
            Ok(()) => app.db.with(|c| auth::user_with_access(c, id)),
            Err(AppError::Unauthenticated) => {
                app.set_user(None);
                Ok(Value::Null)
            }
            Err(e) => Err(e),
        },
        None => Ok(Value::Null),
    }
}

pub fn auth_setup_required(app: &AppState) -> AppResult<bool> {
    app.db.with(auth::setup_required)
}

pub fn contact_message_assignees(app: &AppState) -> AppResult<Vec<Value>> {
    app.db.with(|c| {
        authorize(c, app.user(), &ability("ViewAny", "ContactMessage"))?;
        auth::list_assignees(c)
    })
}

/// Mesaja yanıt ya da iç not ekler (`Update:ContactMessage`). Yazar kimliği oturumdan alınır; istemciden gelmez.
pub fn contact_message_reply(app: &AppState, message_id: &str, body: &str, internal: bool) -> AppResult<Value> {
    let body = body.trim();
    let len = body.chars().count();
    if !(1..=5000).contains(&len) {
        return Err(AppError::validation("body", "Yanıt 1–5000 karakter olmalı."));
    }
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), &ability("Update", "ContactMessage"))?;
        let before = crud::find(c, &schema::CONTACT_MESSAGE, &json!(message_id))?;
        let mut replies = before.get("replies").and_then(Value::as_array).cloned().unwrap_or_default();
        replies.push(json!({
            "id": new_id(), "authorId": uid.to_string(), "body": body,
            "at": crate::backend::util::now_iso(c)?, "internal": internal,
        }));
        let mut patch = json!({ "replies": replies });
        if !internal {
            patch["status"] = json!("answered");
        }
        let after = crud::update(c, &schema::CONTACT_MESSAGE, &json!(message_id), &patch)?;
        audit::record(
            c, Some(uid), if internal { "ContactMessage.note" } else { "ContactMessage.reply" }, "ContactMessage", message_id,
            None, Some(&json!({ "replies": before["replies"].as_array().map(Vec::len).unwrap_or(0), "status": before["status"] })),
            Some(&json!({ "replies": after["replies"].as_array().map(Vec::len).unwrap_or(0), "status": after["status"] })),
        )?;
        Ok(after)
    })
}

// ─────────────────────── Kaynak denetleyicisi (CRUD) ───────────────────────

pub fn crud_index(app: &AppState, resource: &str, query: ListQuery) -> AppResult<Paged> {
    let e = schema::entity(resource)?;
    app.db.with(|c| {
        authorize(c, app.user(), &ability("ViewAny", e.resource))?;
        let mut page = crud::list(c, e, &query)?;
        for item in &mut page.items {
            mask_report_network(e.resource, item);
        }
        Ok(page)
    })
}

pub fn crud_show(app: &AppState, resource: &str, id: &Value) -> AppResult<Value> {
    let e = schema::entity(resource)?;
    app.db.with(|c| {
        authorize(c, app.user(), &ability("View", e.resource))?;
        let mut item = crud::find(c, e, id)?;
        mask_report_network(e.resource, &mut item);
        Ok(item)
    })
}

pub fn crud_store(app: &AppState, resource: &str, data: &Value) -> AppResult<Value> {
    let e = schema::entity(resource)?;
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), &ability("Create", e.resource))?;
        domain::write_policy(e, WriteOp::Store, data, None)?;
        let mut created = crud::insert(c, e, data)?;
        mask_report_network(e.resource, &mut created);
        audit::record(c, Some(uid), &format!("{}.create", e.resource), e.resource, &id_text(&created[e.pk]), None, None, Some(&created))?;
        Ok(created)
    })
}

pub fn crud_update(app: &AppState, resource: &str, id: &Value, data: &Value) -> AppResult<Value> {
    let e = schema::entity(resource)?;
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), &ability("Update", e.resource))?;
        let mut before = crud::find(c, e, id)?;
        domain::write_policy(e, WriteOp::Update, data, Some(&before))?;
        let mut after = crud::update(c, e, id, data)?;
        mask_report_network(e.resource, &mut before);
        mask_report_network(e.resource, &mut after);
        audit::record(c, Some(uid), &format!("{}.update", e.resource), e.resource, &id_text(id), None, Some(&before), Some(&after))?;
        Ok(after)
    })
}

/// Silme: `reason` yıkıcı işlemlerde denetim kaydına yazılır.
pub fn crud_destroy(app: &AppState, resource: &str, id: &Value, reason: Option<&str>) -> AppResult<()> {
    let e = schema::entity(resource)?;
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), &ability("Delete", e.resource))?;
        let mut before = crud::find(c, e, id)?;
        mask_report_network(e.resource, &mut before);
        crud::delete(c, e, id)?;
        audit::record(c, Some(uid), &format!("{}.delete", e.resource), e.resource, &id_text(id), reason, Some(&before), None)?;
        Ok(())
    })
}

pub fn crud_destroy_many(app: &AppState, resource: &str, ids: &[Value], reason: Option<&str>) -> AppResult<usize> {
    let e = schema::entity(resource)?;
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), &ability("DeleteAny", e.resource))?;
        let n = crud::delete_many(c, e, ids)?;
        audit::record(c, Some(uid), &format!("{}.deleteAny", e.resource), e.resource, &format!("{n} kayıt"), reason, None, Some(&json!({ "ids": ids })))?;
        Ok(n)
    })
}

pub fn crud_aggregate(app: &AppState, resource: &str, group_by: &str, query: ListQuery) -> AppResult<Vec<Value>> {
    let e = schema::entity(resource)?;
    app.db.with(|c| {
        authorize(c, app.user(), &ability("ViewAny", e.resource))?;
        crud::aggregate(c, e, group_by, &query)
    })
}

/// Kaynak tanımlarının listesi (ön yüz menü ve form üretimi için): `[{ resource, table, readonly, columns:[{name,kind,required}] }]`
pub fn crud_resources(app: &AppState) -> AppResult<Vec<Value>> {
    app.db.with(|c| {
        authorize(c, app.user(), "ViewAny:Role")?;
        Ok(schema::all()
            .iter()
            .map(|e| {
                json!({
                    "resource": e.resource, "table": e.table, "pk": e.pk, "readonly": e.readonly,
                    "search": e.search, "filters": e.filters,
                    "columns": e.cols.iter().map(|k| json!({ "name": k.name, "kind": format!("{:?}", k.kind).to_lowercase(), "required": k.required })).collect::<Vec<_>>(),
                })
            })
            .collect())
    })
}

// ───────────────────────── Kullanıcılar ─────────────────────────

pub fn user_index(app: &AppState) -> AppResult<Vec<Value>> {
    app.db.with(|c| {
        authorize(c, app.user(), "ViewAny:User")?;
        auth::list_users(c)
    })
}

/// Yeni kullanıcı (`qtoefl:admin` karşılığı): oluşturur ve rolü atar. Var olan e-posta `conflict` döner.
/// `admin` rolü yalnız süper yönetici tarafından verilebilir.
pub fn user_store(app: &AppState, name: &str, email: &str, role: &str, password: Option<&str>) -> AppResult<Value> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Create:User")?;
        if role == SUPER_ADMIN_ROLE {
            require_super_admin(c, uid)?;
        }
        let u = auth::create_admin(c, email, role, name, password)?;
        audit::record(c, Some(uid), "User.create", "User", &u.id.to_string(), None, None, Some(&json!({ "email": u.email, "role": role })))?;
        auth::user_with_access(c, u.id)
    })
}

pub fn user_sync_roles(app: &AppState, user_id: i64, roles: &[String]) -> AppResult<Value> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Update:User")?;
        let names: Vec<&str> = roles.iter().map(String::as_str).collect();
        let m = ModelRef::user(user_id);
        let target = auth::user_by_id(c, user_id)?;
        forbid_self_change(c, uid, user_id)?;
        let before = rbac::role_names(c, m)?;
        let was_admin = before.iter().any(|r| r == SUPER_ADMIN_ROLE);
        let wants_admin = names.contains(&SUPER_ADMIN_ROLE);
        // `admin` rolünü vermek ya da almak yalnız süper yöneticinin işidir (yetki yükseltme kapısı).
        if was_admin || wants_admin {
            require_super_admin(c, uid)?;
        }
        // Son etkin süper yöneticiden `admin` rolü alınamaz (askıdaki yöneticiler sayılmaz).
        if was_admin && !wants_admin && target.status == "active" && auth::active_super_admin_count(c)? <= 1 {
            return Err(AppError::Conflict("Son etkin süper yöneticiden `admin` rolü alınamaz.".into()));
        }
        rbac::sync_roles(c, m, &names)?;
        audit::record(c, Some(uid), "User.syncRoles", "User", &user_id.to_string(), None, Some(&json!(before)), Some(&json!(roles)))?;
        auth::user_with_access(c, user_id)
    })
}

/// Kullanıcıya rol dışı, doğrudan izin verme (`syncPermissions`).
pub fn user_sync_permissions(app: &AppState, user_id: i64, perms: &[String]) -> AppResult<Value> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Update:User")?;
        auth::user_by_id(c, user_id)?;
        forbid_self_change(c, uid, user_id)?;
        if rbac::has_role(c, ModelRef::user(user_id), SUPER_ADMIN_ROLE)? {
            require_super_admin(c, uid)?;
        }
        let names: Vec<&str> = perms.iter().map(String::as_str).collect();
        let m = ModelRef::user(user_id);
        let before = rbac::direct_permissions(c, m)?;
        rbac::sync_permissions(c, m, &names)?;
        audit::record(c, Some(uid), "User.syncPermissions", "User", &user_id.to_string(), None, Some(&json!(before)), Some(&json!(perms)))?;
        auth::user_with_access(c, user_id)
    })
}

pub fn user_set_status(app: &AppState, user_id: i64, status: &str, reason: Option<&str>) -> AppResult<Value> {
    let u = app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Update:User")?;
        auth::user_by_id(c, user_id)?;
        forbid_self_change(c, uid, user_id)?;
        // Bir süper yöneticiyi yalnız süper yönetici askıya alabilir ya da yeniden etkinleştirebilir.
        if rbac::has_role(c, ModelRef::user(user_id), SUPER_ADMIN_ROLE)? {
            require_super_admin(c, uid)?;
        }
        let u = auth::set_status(c, user_id, status)?;
        audit::record(c, Some(uid), "User.setStatus", "User", &user_id.to_string(), reason, None, Some(&json!({ "status": status })))?;
        Ok(u)
    })?;
    // Hedef oturumdaki kullanıcıysa ve artık etkin değilse oturum hemen düşer.
    if status != "active" && app.user() == Some(user_id) {
        app.set_user(None);
    }
    Ok(json!(u))
}

/// Parola değişikliği (`Update:User`); süper yöneticinin parolasını yalnız süper yönetici değiştirir.
/// Denetim kaydına parola yazılmaz.
pub fn user_set_password(app: &AppState, user_id: i64, password: &str) -> AppResult<Value> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Update:User")?;
        auth::user_by_id(c, user_id)?;
        if rbac::has_role(c, ModelRef::user(user_id), SUPER_ADMIN_ROLE)? && uid != user_id {
            require_super_admin(c, uid)?;
        }
        let u = auth::set_password(c, user_id, password)?;
        audit::record(c, Some(uid), "User.setPassword", "User", &user_id.to_string(), None, None, None)?;
        Ok(json!(u))
    })
}

/// Ad soyad güncellemesi (`Update:User`); e-posta ve parola bu yoldan değişmez.
pub fn user_update(app: &AppState, user_id: i64, name: &str) -> AppResult<Value> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Update:User")?;
        let before = auth::user_by_id(c, user_id)?;
        if rbac::has_role(c, ModelRef::user(user_id), SUPER_ADMIN_ROLE)? && uid != user_id {
            require_super_admin(c, uid)?;
        }
        let u = auth::set_name(c, user_id, name)?;
        audit::record(c, Some(uid), "User.update", "User", &user_id.to_string(), None, Some(&json!({ "name": before.name })), Some(&json!({ "name": u.name })))?;
        Ok(json!(u))
    })
}

// ───────────────────────── Roller ve izinler ─────────────────────────

pub fn role_index(app: &AppState) -> AppResult<Vec<Value>> {
    app.db.with(|c| {
        authorize(c, app.user(), "ViewAny:Role")?;
        let mut out = Vec::new();
        for r in rbac::role_all(c)? {
            let perms = rbac::role_permissions(c, &r.name)?;
            out.push(json!({ "id": r.id, "name": r.name, "guardName": r.guard_name, "permissions": perms, "superAdmin": r.name == SUPER_ADMIN_ROLE }));
        }
        Ok(out)
    })
}

pub fn role_store(app: &AppState, name: &str, permissions: &[String]) -> AppResult<Value> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Create:Role")?;
        let name = name.trim();
        if name.is_empty() || name.chars().count() > 80 {
            return Err(AppError::validation("name", "Rol adı 1–80 karakter olmalı."));
        }
        if rbac::role_find_by_name(c, name)?.is_some() {
            return Err(AppError::Conflict(format!("`{name}` adında bir rol zaten var.")));
        }
        rbac::role_find_or_create(c, name)?;
        let perms: Vec<&str> = permissions.iter().map(String::as_str).collect();
        rbac::role_sync_permissions(c, name, &perms)?;
        audit::record(c, Some(uid), "Role.create", "Role", name, None, None, Some(&json!({ "permissions": permissions })))?;
        Ok(json!({ "name": name, "permissions": permissions }))
    })
}

pub fn role_update(app: &AppState, name: &str, new_name: &str) -> AppResult<()> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Update:Role")?;
        let new_name = new_name.trim();
        if new_name.is_empty() || new_name.chars().count() > 80 {
            return Err(AppError::validation("name", "Rol adı 1–80 karakter olmalı."));
        }
        rbac::role_rename(c, name, new_name)?;
        audit::record(c, Some(uid), "Role.update", "Role", name, None, Some(&json!({ "name": name })), Some(&json!({ "name": new_name })))?;
        Ok(())
    })
}

pub fn role_destroy(app: &AppState, name: &str, reason: Option<&str>) -> AppResult<()> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Delete:Role")?;
        rbac::role_delete(c, name)?;
        audit::record(c, Some(uid), "Role.delete", "Role", name, reason, None, None)?;
        Ok(())
    })
}

pub fn role_sync_permissions(app: &AppState, name: &str, permissions: &[String]) -> AppResult<Vec<String>> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Update:Role")?;
        if name == SUPER_ADMIN_ROLE {
            return Err(AppError::Conflict("Süper yönetici zaten her izne sahiptir; izinleri düzenlenemez.".into()));
        }
        let perms: Vec<&str> = permissions.iter().map(String::as_str).collect();
        let before = rbac::role_permissions(c, name)?;
        rbac::role_sync_permissions(c, name, &perms)?;
        audit::record(c, Some(uid), "Role.syncPermissions", "Role", name, None, Some(&json!(before)), Some(&json!(permissions)))?;
        rbac::role_permissions(c, name)
    })
}

pub fn permission_index(app: &AppState) -> AppResult<Vec<Value>> {
    app.db.with(|c| {
        authorize(c, app.user(), "ViewAny:Permission")?;
        Ok(rbac::permission_all(c)?.into_iter().map(|p| json!({ "id": p.id, "name": p.name, "guardName": p.guard_name })).collect())
    })
}

/// `shield:generate`: bütün kaynaklar (ve verilen ek kaynaklar) için izinleri oluşturur.
pub fn permission_generate(app: &AppState, extra_resources: &[String]) -> AppResult<usize> {
    app.db.transaction(|c| {
        let uid = authorize(c, app.user(), "Create:Permission")?;
        let mut resources: Vec<&str> = schema::all().iter().map(|e| e.resource).collect();
        resources.extend(["User", "Role", "Permission"]);
        resources.extend(extra_resources.iter().map(String::as_str));
        resources.sort();
        resources.dedup();
        let n = rbac::permissions_generate(c, &resources)?;
        audit::record(c, Some(uid), "Permission.generate", "Permission", &format!("{n} yeni"), None, None, None)?;
        Ok(n)
    })
}

// ───────────────────────── Altyapı ─────────────────────────

/// `php artisan migrate:status` (yalnız süper yönetici).
pub fn db_migrate_status(app: &AppState) -> AppResult<Vec<migrate::MigrationStatus>> {
    app.db.with(|c| {
        let uid = app.user().ok_or(AppError::Unauthenticated)?;
        auth::require_active(c, uid)?;
        if !rbac::has_role(c, ModelRef::user(uid), SUPER_ADMIN_ROLE)? {
            return Err(AppError::Forbidden("Yalnız süper yönetici.".into()));
        }
        migrate::status(c, migrations::ALL)
    })
}

// ───────────────────────── Herkese açık ─────────────────────────

/// İletişim formu (oturum gerekmez; bugün hiçbir ekran çağırmadığı için Tauri komutu olarak kayıtlı değil). `ContactMessage` kaydı oluşturur.
pub fn contact_submit(app: &AppState, name: &str, email: &str, subject: Option<&str>, message: &str, lang: Option<&str>) -> AppResult<Value> {
    let mut errors = Vec::new();
    let mut fe = |f: &str, m: &str| errors.push(crate::backend::error::FieldError { field: f.into(), message: m.into() });
    if !(2..=80).contains(&name.trim().chars().count()) {
        fe("name", "Ad 2–80 karakter olmalı.");
    }
    let em = email.trim();
    if !auth::valid_email(em) {
        fe("email", "Geçerli bir e-posta adresi gir.");
    }
    if let Some(s) = subject {
        let n = s.trim().chars().count();
        if n != 0 && !(2..=200).contains(&n) {
            fe("subject", "Konu 2–200 karakter olmalı.");
        }
    }
    if !(10..=5000).contains(&message.trim().chars().count()) {
        fe("message", "Mesaj 10–5000 karakter olmalı.");
    }
    let lang = lang.unwrap_or("tr");
    if !["tr", "en", "ar", "fa", "de"].contains(&lang) {
        fe("lang", "Dil geçerli değil.");
    }
    if !errors.is_empty() {
        return Err(AppError::Validation(errors));
    }
    app.db.transaction(|c| {
        let id = new_id();
        c.execute(
            &format!("INSERT INTO contact_messages (id, name, email, subject, message, lang, status, createdAt, replies) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'new', {NOW_SQL}, '[]')"),
            params![id, name.trim(), em.to_lowercase(), subject.map(str::trim).filter(|s| !s.is_empty()), message.trim(), lang],
        )?;
        crud::find(c, &schema::CONTACT_MESSAGE, &json!(id))
    })
}
