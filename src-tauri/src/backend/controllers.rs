//! Denetleyiciler (Laravel `app/Http/Controllers`). Hepsi düz Rust fonksiyonudur; `commands.rs`
//! bunları Tauri komutu olarak dışarı açar. Her fonksiyon önce `authorize` ile izni denetler.
//!
//! Kaynak (resource) denetleyicisi: `crud_*`  → `Eylem:Kaynak` izinleri (ViewAny, View, Create, Update, Delete, DeleteAny)
//! Kimlik doğrulama:           `auth_*`
//! Rol / izin yönetimi:        `role_*`, `permission_*`, `user_*`
use crate::backend::audit::{self, id_text};
use crate::backend::auth;
use crate::backend::crud::{self, ListQuery, Paged};
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

// ───────────────────────────── Auth ─────────────────────────────

pub fn auth_register(app: &AppState, name: &str, email: &str, password: &str) -> AppResult<Value> {
    let user = app.db.with(|c| auth::register(c, name, email, password))?;
    app.set_user(Some(user.id));
    app.db.with(|c| auth::user_with_access(c, user.id))
}

pub fn auth_login(app: &AppState, email: &str, password: &str) -> AppResult<Value> {
    let user = app.db.with(|c| auth::attempt(c, email, password))?;
    app.set_user(Some(user.id));
    app.db.with(|c| auth::user_with_access(c, user.id))
}

pub fn auth_logout(app: &AppState) {
    app.set_user(None);
}

/// Oturum yoksa `null`.
pub fn auth_me(app: &AppState) -> AppResult<Value> {
    match app.user() {
        Some(id) => app.db.with(|c| auth::user_with_access(c, id)),
        None => Ok(Value::Null),
    }
}

// ─────────────────────── Kaynak denetleyicisi (CRUD) ───────────────────────

pub fn crud_index(app: &AppState, resource: &str, query: ListQuery) -> AppResult<Paged> {
    let e = schema::entity(resource)?;
    app.db.with(|c| {
        authorize(c, app.user(), &ability("ViewAny", e.resource))?;
        crud::list(c, e, &query)
    })
}

pub fn crud_show(app: &AppState, resource: &str, id: &Value) -> AppResult<Value> {
    let e = schema::entity(resource)?;
    app.db.with(|c| {
        authorize(c, app.user(), &ability("View", e.resource))?;
        crud::find(c, e, id)
    })
}

pub fn crud_store(app: &AppState, resource: &str, data: &Value) -> AppResult<Value> {
    let e = schema::entity(resource)?;
    app.db.with(|c| {
        let uid = authorize(c, app.user(), &ability("Create", e.resource))?;
        let created = crud::insert(c, e, data)?;
        audit::record(c, Some(uid), &format!("{}.create", e.resource), e.resource, &id_text(&created[e.pk]), None, None, Some(&created))?;
        Ok(created)
    })
}

pub fn crud_update(app: &AppState, resource: &str, id: &Value, data: &Value) -> AppResult<Value> {
    let e = schema::entity(resource)?;
    app.db.with(|c| {
        let uid = authorize(c, app.user(), &ability("Update", e.resource))?;
        let before = crud::find(c, e, id)?;
        let after = crud::update(c, e, id, data)?;
        audit::record(c, Some(uid), &format!("{}.update", e.resource), e.resource, &id_text(id), None, Some(&before), Some(&after))?;
        Ok(after)
    })
}

/// Silme: `reason` yıkıcı işlemlerde denetim kaydına yazılır.
pub fn crud_destroy(app: &AppState, resource: &str, id: &Value, reason: Option<&str>) -> AppResult<()> {
    let e = schema::entity(resource)?;
    app.db.with(|c| {
        let uid = authorize(c, app.user(), &ability("Delete", e.resource))?;
        let before = crud::find(c, e, id)?;
        crud::delete(c, e, id)?;
        audit::record(c, Some(uid), &format!("{}.delete", e.resource), e.resource, &id_text(id), reason, Some(&before), None)?;
        Ok(())
    })
}

pub fn crud_destroy_many(app: &AppState, resource: &str, ids: &[Value], reason: Option<&str>) -> AppResult<usize> {
    let e = schema::entity(resource)?;
    app.db.with(|c| {
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

/// Yeni kullanıcı (`qtoefl:admin` karşılığı): oluşturur ya da günceller ve rolü atar.
pub fn user_store(app: &AppState, name: &str, email: &str, role: &str, password: Option<&str>) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "Create:User")?;
        let u = auth::create_admin(c, email, role, name, password)?;
        audit::record(c, Some(uid), "User.create", "User", &u.id.to_string(), None, None, Some(&json!({ "email": u.email, "role": role })))?;
        auth::user_with_access(c, u.id)
    })
}

pub fn user_sync_roles(app: &AppState, user_id: i64, roles: &[String]) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "Update:User")?;
        let names: Vec<&str> = roles.iter().map(String::as_str).collect();
        let m = ModelRef::user(user_id);
        auth::user_by_id(c, user_id)?;
        let before = rbac::role_names(c, m)?;
        // Son süper yöneticiden `admin` rolü alınamaz.
        if before.iter().any(|r| r == SUPER_ADMIN_ROLE) && !names.contains(&SUPER_ADMIN_ROLE) {
            let admins: i64 = c.query_row(
                "SELECT COUNT(*) FROM model_has_roles mr JOIN roles r ON r.id = mr.role_id WHERE r.name = ?1 AND mr.model_type = 'User'",
                [SUPER_ADMIN_ROLE],
                |r| r.get(0),
            )?;
            if admins <= 1 {
                return Err(AppError::Conflict("Son süper yöneticiden `admin` rolü alınamaz.".into()));
            }
        }
        rbac::sync_roles(c, m, &names)?;
        audit::record(c, Some(uid), "User.syncRoles", "User", &user_id.to_string(), None, Some(&json!(before)), Some(&json!(roles)))?;
        auth::user_with_access(c, user_id)
    })
}

/// Kullanıcıya rol dışı, doğrudan izin verme (`syncPermissions`).
pub fn user_sync_permissions(app: &AppState, user_id: i64, perms: &[String]) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "Update:User")?;
        auth::user_by_id(c, user_id)?;
        let names: Vec<&str> = perms.iter().map(String::as_str).collect();
        let m = ModelRef::user(user_id);
        let before = rbac::direct_permissions(c, m)?;
        rbac::sync_permissions(c, m, &names)?;
        audit::record(c, Some(uid), "User.syncPermissions", "User", &user_id.to_string(), None, Some(&json!(before)), Some(&json!(perms)))?;
        auth::user_with_access(c, user_id)
    })
}

pub fn user_set_status(app: &AppState, user_id: i64, status: &str, reason: Option<&str>) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "Update:User")?;
        let u = auth::set_status(c, user_id, status)?;
        audit::record(c, Some(uid), "User.setStatus", "User", &user_id.to_string(), reason, None, Some(&json!({ "status": status })))?;
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
    app.db.with(|c| {
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
    app.db.with(|c| {
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
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "Delete:Role")?;
        rbac::role_delete(c, name)?;
        audit::record(c, Some(uid), "Role.delete", "Role", name, reason, None, None)?;
        Ok(())
    })
}

pub fn role_sync_permissions(app: &AppState, name: &str, permissions: &[String]) -> AppResult<Vec<String>> {
    app.db.with(|c| {
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
    app.db.with(|c| {
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
        if !rbac::has_role(c, ModelRef::user(uid), SUPER_ADMIN_ROLE)? {
            return Err(AppError::Forbidden("Yalnız süper yönetici.".into()));
        }
        migrate::status(c, migrations::ALL)
    })
}

// ───────────────────────── Herkese açık ─────────────────────────

/// İletişim formu (oturum gerekmez). `ContactMessage` kaydı oluşturur.
pub fn contact_submit(app: &AppState, name: &str, email: &str, subject: Option<&str>, message: &str, lang: Option<&str>) -> AppResult<Value> {
    let mut errors = Vec::new();
    let mut fe = |f: &str, m: &str| errors.push(crate::backend::error::FieldError { field: f.into(), message: m.into() });
    if name.trim().chars().count() < 2 {
        fe("name", "Ad en az 2 karakter olmalı.");
    }
    let em = email.trim();
    if !(em.contains('@') && em.contains('.') && !em.contains(char::is_whitespace) && em.chars().count() <= 254) {
        fe("email", "Geçerli bir e-posta adresi gir.");
    }
    if let Some(s) = subject {
        if !s.trim().is_empty() && s.trim().chars().count() < 2 {
            fe("subject", "Konu en az 2 karakter olmalı.");
        }
    }
    if message.trim().chars().count() < 10 {
        fe("message", "Mesaj en az 10 karakter olmalı.");
    }
    let lang = lang.unwrap_or("tr");
    if !["tr", "en", "ar", "fa", "de"].contains(&lang) {
        fe("lang", "Dil geçerli değil.");
    }
    if !errors.is_empty() {
        return Err(AppError::Validation(errors));
    }
    app.db.with(|c| {
        let id = new_id();
        c.execute(
            &format!("INSERT INTO contact_messages (id, name, email, subject, message, lang, status, createdAt, replies) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'new', {NOW_SQL}, '[]')"),
            params![id, name.trim(), em.to_lowercase(), subject.map(str::trim).filter(|s| !s.is_empty()), message.trim(), lang],
        )?;
        crud::find(c, &schema::CONTACT_MESSAGE, &json!(id))
    })
}
