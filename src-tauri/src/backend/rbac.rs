//! spatie/laravel-permission mantığının SQLite karşılığı.
//!
//! Tablolar Spatie ile aynıdır: `roles`, `permissions`, `model_has_roles`,
//! `model_has_permissions`, `role_has_permissions` (guard: `web`).
//! Davranış (HasRoles / HasPermissions):
//!   * rol atama, çıkarma, eşitleme (`assign_role`, `remove_role`, `sync_roles`),
//!   * doğrudan izin (`give_permission_to` …) ve rol üzerinden izin,
//!   * `can()` = süper yönetici **ya da** doğrudan izin **ya da** rol izni
//!     (Shield'in `Gate::before` süper-admin kuralı; süper yönetici rolü: `admin`),
//!   * izin adları Filament Shield biçimindedir: `Eylem:Kaynak` (örn. `ViewAny:Order`).
//! Spatie'nin izin önbelleği yoktur; her denetim veritabanından okunur (tek kullanıcılı yerel uygulama).
use crate::backend::error::{AppError, AppResult};
use crate::backend::util::NOW_SQL;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;

pub const GUARD: &str = "web";
pub const SUPER_ADMIN_ROLE: &str = "admin";
pub const MODEL_USER: &str = "User";

/// Shield'in varsayılan eylem kümesinin kullanılan bölümü.
pub const ACTIONS: [&str; 6] = ["ViewAny", "View", "Create", "Update", "Delete", "DeleteAny"];

pub fn permission_name(action: &str, resource: &str) -> String {
    format!("{action}:{resource}")
}

#[derive(Debug, Clone, Serialize)]
pub struct Role {
    pub id: i64,
    pub name: String,
    pub guard_name: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Permission {
    pub id: i64,
    pub name: String,
    pub guard_name: String,
}

/// İzin/rol taşıyan model (Spatie'de morph: `model_type` + `model_id`).
#[derive(Debug, Clone, Copy)]
pub struct ModelRef {
    pub model_type: &'static str,
    pub model_id: i64,
}
impl ModelRef {
    pub fn user(id: i64) -> Self {
        ModelRef { model_type: MODEL_USER, model_id: id }
    }
}

fn strings(conn: &Connection, sql: &str, p: &[&dyn rusqlite::ToSql]) -> AppResult<Vec<String>> {
    let mut st = conn.prepare(sql)?;
    let rows = st.query_map(p, |r| r.get::<_, String>(0))?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

// ───────────────────────────── Permission ─────────────────────────────

pub fn permission_find_by_name(conn: &Connection, name: &str) -> AppResult<Option<Permission>> {
    Ok(conn
        .query_row(
            "SELECT id, name, guard_name FROM permissions WHERE name = ?1 AND guard_name = ?2",
            params![name, GUARD],
            |r| Ok(Permission { id: r.get(0)?, name: r.get(1)?, guard_name: r.get(2)? }),
        )
        .optional()?)
}

/// `Permission::findOrCreate`
pub fn permission_find_or_create(conn: &Connection, name: &str) -> AppResult<Permission> {
    conn.execute(
        &format!("INSERT OR IGNORE INTO permissions (name, guard_name, created_at, updated_at) VALUES (?1, ?2, {NOW_SQL}, {NOW_SQL})"),
        params![name, GUARD],
    )?;
    permission_find_by_name(conn, name)?.ok_or_else(|| AppError::Internal("izin oluşturulamadı".into()))
}

/// Spatie `PermissionDoesNotExist`
fn permission_or_fail(conn: &Connection, name: &str) -> AppResult<Permission> {
    permission_find_by_name(conn, name)?.ok_or_else(|| AppError::NotFound(format!("`{name}` adında bir izin yok (guard: {GUARD}).")))
}

pub fn permission_all(conn: &Connection) -> AppResult<Vec<Permission>> {
    let mut st = conn.prepare("SELECT id, name, guard_name FROM permissions WHERE guard_name = ?1 ORDER BY name")?;
    let rows = st.query_map([GUARD], |r| Ok(Permission { id: r.get(0)?, name: r.get(1)?, guard_name: r.get(2)? }))?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

pub fn permission_delete(conn: &Connection, name: &str) -> AppResult<()> {
    let n = conn.execute("DELETE FROM permissions WHERE name = ?1 AND guard_name = ?2", params![name, GUARD])?;
    if n == 0 {
        return Err(AppError::NotFound(format!("`{name}` adında bir izin yok.")));
    }
    Ok(())
}

/// `shield:generate` karşılığı: her kaynak için `ACTIONS` izinlerini oluşturur; yeni oluşturulan sayısını döndürür.
pub fn permissions_generate(conn: &Connection, resources: &[&str]) -> AppResult<usize> {
    let mut created = 0;
    for r in resources {
        for a in ACTIONS {
            let name = permission_name(a, r);
            if permission_find_by_name(conn, &name)?.is_none() {
                permission_find_or_create(conn, &name)?;
                created += 1;
            }
        }
    }
    Ok(created)
}

// ─────────────────────────────── Role ───────────────────────────────

pub fn role_find_by_name(conn: &Connection, name: &str) -> AppResult<Option<Role>> {
    Ok(conn
        .query_row(
            "SELECT id, name, guard_name FROM roles WHERE name = ?1 AND guard_name = ?2",
            params![name, GUARD],
            |r| Ok(Role { id: r.get(0)?, name: r.get(1)?, guard_name: r.get(2)? }),
        )
        .optional()?)
}

/// Spatie `RoleDoesNotExist`
fn role_or_fail(conn: &Connection, name: &str) -> AppResult<Role> {
    role_find_by_name(conn, name)?.ok_or_else(|| AppError::NotFound(format!("`{name}` adında bir rol yok (guard: {GUARD}).")))
}

/// `Role::findOrCreate`
pub fn role_find_or_create(conn: &Connection, name: &str) -> AppResult<Role> {
    conn.execute(
        &format!("INSERT OR IGNORE INTO roles (name, guard_name, created_at, updated_at) VALUES (?1, ?2, {NOW_SQL}, {NOW_SQL})"),
        params![name, GUARD],
    )?;
    role_or_fail(conn, name)
}

pub fn role_all(conn: &Connection) -> AppResult<Vec<Role>> {
    let mut st = conn.prepare("SELECT id, name, guard_name FROM roles WHERE guard_name = ?1 ORDER BY name")?;
    let rows = st.query_map([GUARD], |r| Ok(Role { id: r.get(0)?, name: r.get(1)?, guard_name: r.get(2)? }))?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

pub fn role_rename(conn: &Connection, name: &str, new_name: &str) -> AppResult<()> {
    if name == SUPER_ADMIN_ROLE {
        return Err(AppError::Conflict("Süper yönetici rolü yeniden adlandırılamaz.".into()));
    }
    role_or_fail(conn, name)?;
    conn.execute(
        &format!("UPDATE roles SET name = ?1, updated_at = {NOW_SQL} WHERE name = ?2 AND guard_name = ?3"),
        params![new_name, name, GUARD],
    )?;
    Ok(())
}

pub fn role_delete(conn: &Connection, name: &str) -> AppResult<()> {
    if name == SUPER_ADMIN_ROLE {
        return Err(AppError::Conflict("Süper yönetici rolü silinemez.".into()));
    }
    role_or_fail(conn, name)?;
    conn.execute("DELETE FROM roles WHERE name = ?1 AND guard_name = ?2", params![name, GUARD])?;
    Ok(())
}

pub fn role_permissions(conn: &Connection, role: &str) -> AppResult<Vec<String>> {
    strings(
        conn,
        "SELECT p.name FROM permissions p JOIN role_has_permissions rp ON rp.permission_id = p.id
         JOIN roles r ON r.id = rp.role_id WHERE r.name = ?1 AND r.guard_name = ?2 AND p.guard_name = ?2 ORDER BY p.name",
        &[&role, &GUARD],
    )
}

/// `$role->givePermissionTo(...)` (izin yoksa hata)
pub fn role_give_permission_to(conn: &Connection, role: &str, perms: &[&str]) -> AppResult<()> {
    let r = role_or_fail(conn, role)?;
    for name in perms {
        let p = permission_or_fail(conn, name)?;
        conn.execute("INSERT OR IGNORE INTO role_has_permissions (permission_id, role_id) VALUES (?1, ?2)", params![p.id, r.id])?;
    }
    Ok(())
}

pub fn role_revoke_permission_to(conn: &Connection, role: &str, perms: &[&str]) -> AppResult<()> {
    let r = role_or_fail(conn, role)?;
    for name in perms {
        let p = permission_or_fail(conn, name)?;
        conn.execute("DELETE FROM role_has_permissions WHERE permission_id = ?1 AND role_id = ?2", params![p.id, r.id])?;
    }
    Ok(())
}

/// `$role->syncPermissions(...)`: listede olmayanları çıkarır.
pub fn role_sync_permissions(conn: &Connection, role: &str, perms: &[&str]) -> AppResult<()> {
    let r = role_or_fail(conn, role)?;
    let mut ids = Vec::new();
    for name in perms {
        ids.push(permission_or_fail(conn, name)?.id);
    }
    conn.execute("DELETE FROM role_has_permissions WHERE role_id = ?1", [r.id])?;
    for id in ids {
        conn.execute("INSERT OR IGNORE INTO role_has_permissions (permission_id, role_id) VALUES (?1, ?2)", params![id, r.id])?;
    }
    Ok(())
}

pub fn role_has_permission_to(conn: &Connection, role: &str, perm: &str) -> AppResult<bool> {
    Ok(conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM role_has_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id
         WHERE r.name = ?1 AND p.name = ?2 AND r.guard_name = ?3 AND p.guard_name = ?3)",
        params![role, perm, GUARD],
        |r| r.get(0),
    )?)
}

// ───────────────────── HasRoles / HasPermissions (model) ─────────────────────

/// `$user->assignRole(...)`
pub fn assign_role(conn: &Connection, m: ModelRef, roles: &[&str]) -> AppResult<()> {
    let mut ids = Vec::new();
    for name in roles {
        ids.push(role_or_fail(conn, name)?.id);
    }
    for id in ids {
        conn.execute(
            "INSERT OR IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?1, ?2, ?3)",
            params![id, m.model_type, m.model_id],
        )?;
    }
    Ok(())
}

/// `$user->removeRole(...)`
pub fn remove_role(conn: &Connection, m: ModelRef, role: &str) -> AppResult<()> {
    let r = role_or_fail(conn, role)?;
    conn.execute(
        "DELETE FROM model_has_roles WHERE role_id = ?1 AND model_type = ?2 AND model_id = ?3",
        params![r.id, m.model_type, m.model_id],
    )?;
    Ok(())
}

/// `$user->syncRoles(...)`
pub fn sync_roles(conn: &Connection, m: ModelRef, roles: &[&str]) -> AppResult<()> {
    let mut ids = Vec::new();
    for name in roles {
        ids.push(role_or_fail(conn, name)?.id);
    }
    conn.execute("DELETE FROM model_has_roles WHERE model_type = ?1 AND model_id = ?2", params![m.model_type, m.model_id])?;
    for id in ids {
        conn.execute(
            "INSERT OR IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?1, ?2, ?3)",
            params![id, m.model_type, m.model_id],
        )?;
    }
    Ok(())
}

pub fn role_names(conn: &Connection, m: ModelRef) -> AppResult<Vec<String>> {
    strings(
        conn,
        "SELECT r.name FROM roles r JOIN model_has_roles mr ON mr.role_id = r.id
         WHERE mr.model_type = ?1 AND mr.model_id = ?2 AND r.guard_name = ?3 ORDER BY r.name",
        &[&m.model_type, &m.model_id, &GUARD],
    )
}

pub fn has_role(conn: &Connection, m: ModelRef, role: &str) -> AppResult<bool> {
    Ok(conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM model_has_roles mr JOIN roles r ON r.id = mr.role_id
         WHERE mr.model_type = ?1 AND mr.model_id = ?2 AND r.name = ?3 AND r.guard_name = ?4)",
        params![m.model_type, m.model_id, role, GUARD],
        |r| r.get(0),
    )?)
}

pub fn has_any_role(conn: &Connection, m: ModelRef, roles: &[&str]) -> AppResult<bool> {
    for r in roles {
        if has_role(conn, m, r)? {
            return Ok(true);
        }
    }
    Ok(false)
}

pub fn has_all_roles(conn: &Connection, m: ModelRef, roles: &[&str]) -> AppResult<bool> {
    for r in roles {
        if !has_role(conn, m, r)? {
            return Ok(false);
        }
    }
    Ok(true)
}

/// `$user->givePermissionTo(...)` (doğrudan izin; izin yoksa hata)
pub fn give_permission_to(conn: &Connection, m: ModelRef, perms: &[&str]) -> AppResult<()> {
    let mut ids = Vec::new();
    for name in perms {
        ids.push(permission_or_fail(conn, name)?.id);
    }
    for id in ids {
        conn.execute(
            "INSERT OR IGNORE INTO model_has_permissions (permission_id, model_type, model_id) VALUES (?1, ?2, ?3)",
            params![id, m.model_type, m.model_id],
        )?;
    }
    Ok(())
}

pub fn revoke_permission_to(conn: &Connection, m: ModelRef, perm: &str) -> AppResult<()> {
    let p = permission_or_fail(conn, perm)?;
    conn.execute(
        "DELETE FROM model_has_permissions WHERE permission_id = ?1 AND model_type = ?2 AND model_id = ?3",
        params![p.id, m.model_type, m.model_id],
    )?;
    Ok(())
}

pub fn sync_permissions(conn: &Connection, m: ModelRef, perms: &[&str]) -> AppResult<()> {
    let mut ids = Vec::new();
    for name in perms {
        ids.push(permission_or_fail(conn, name)?.id);
    }
    conn.execute("DELETE FROM model_has_permissions WHERE model_type = ?1 AND model_id = ?2", params![m.model_type, m.model_id])?;
    for id in ids {
        conn.execute(
            "INSERT OR IGNORE INTO model_has_permissions (permission_id, model_type, model_id) VALUES (?1, ?2, ?3)",
            params![id, m.model_type, m.model_id],
        )?;
    }
    Ok(())
}

pub fn direct_permissions(conn: &Connection, m: ModelRef) -> AppResult<Vec<String>> {
    strings(
        conn,
        "SELECT p.name FROM permissions p JOIN model_has_permissions mp ON mp.permission_id = p.id
         WHERE mp.model_type = ?1 AND mp.model_id = ?2 AND p.guard_name = ?3 ORDER BY p.name",
        &[&m.model_type, &m.model_id, &GUARD],
    )
}

pub fn permissions_via_roles(conn: &Connection, m: ModelRef) -> AppResult<Vec<String>> {
    strings(
        conn,
        "SELECT DISTINCT p.name FROM permissions p
         JOIN role_has_permissions rp ON rp.permission_id = p.id
         JOIN model_has_roles mr ON mr.role_id = rp.role_id
         WHERE mr.model_type = ?1 AND mr.model_id = ?2 AND p.guard_name = ?3 ORDER BY p.name",
        &[&m.model_type, &m.model_id, &GUARD],
    )
}

/// `$user->getAllPermissions()`: doğrudan + rol izinleri, tekrarsız.
pub fn all_permissions(conn: &Connection, m: ModelRef) -> AppResult<Vec<String>> {
    let mut all = direct_permissions(conn, m)?;
    all.extend(permissions_via_roles(conn, m)?);
    all.sort();
    all.dedup();
    Ok(all)
}

/// `$user->checkPermissionTo(...)`: doğrudan ya da rol üzerinden.
pub fn check_permission_to(conn: &Connection, m: ModelRef, perm: &str) -> AppResult<bool> {
    Ok(conn.query_row(
        "SELECT EXISTS(
            SELECT 1 FROM model_has_permissions mp JOIN permissions p ON p.id = mp.permission_id
              WHERE mp.model_type = ?1 AND mp.model_id = ?2 AND p.name = ?3 AND p.guard_name = ?4
            UNION ALL
            SELECT 1 FROM model_has_roles mr JOIN role_has_permissions rp ON rp.role_id = mr.role_id
              JOIN permissions p ON p.id = rp.permission_id
              WHERE mr.model_type = ?1 AND mr.model_id = ?2 AND p.name = ?3 AND p.guard_name = ?4
        )",
        params![m.model_type, m.model_id, perm, GUARD],
        |r| r.get(0),
    )?)
}

/// `$user->can(...)` + Shield süper-admin kuralı (`Gate::before`): `admin` rolü her kapıyı geçer.
pub fn can(conn: &Connection, m: ModelRef, ability: &str) -> AppResult<bool> {
    if has_role(conn, m, SUPER_ADMIN_ROLE)? {
        return Ok(true);
    }
    check_permission_to(conn, m, ability)
}
