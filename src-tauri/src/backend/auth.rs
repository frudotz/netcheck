//! Kullanıcı kaydı ve girişi (Laravel Auth karşılığı). Parolalar Argon2id ile özetlenir.
//! İlk kayıt olan kullanıcı `admin` rolünü alır (yerel kurulum açılışı); sonrakiler rolsüz kalır
//! ve bir yönetici tarafından rol alır (`sync_roles`).
use crate::backend::error::{AppError, AppResult, FieldError};
use crate::backend::rbac::{self, ModelRef, SUPER_ADMIN_ROLE};
use crate::backend::util::NOW_SQL;
use argon2::password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use serde_json::{json, Value};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub status: String,
    pub last_login_at: Option<String>,
    pub created_at: String,
}

fn hash_password(password: &str) -> AppResult<String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| AppError::Internal(format!("parola özetlenemedi: {e}")))
}

fn verify_password(password: &str, hash: &str) -> bool {
    match PasswordHash::new(hash) {
        Ok(parsed) => Argon2::default().verify_password(password.as_bytes(), &parsed).is_ok(),
        Err(_) => false,
    }
}

fn valid_email(e: &str) -> bool {
    let len = e.chars().count();
    (5..=254).contains(&len) && !e.contains(char::is_whitespace) && e.matches('@').count() == 1 && {
        let (local, domain) = e.split_once('@').unwrap_or(("", ""));
        !local.is_empty() && domain.contains('.') && !domain.starts_with('.') && !domain.ends_with('.')
    }
}

fn field(field: &str, message: &str) -> FieldError {
    FieldError { field: field.into(), message: message.into() }
}

fn validate(name: Option<&str>, email: &str, password: Option<&str>) -> AppResult<()> {
    let mut errors = Vec::new();
    if let Some(n) = name {
        let len = n.trim().chars().count();
        if !(2..=80).contains(&len) {
            errors.push(field("name", "Ad soyad 2–80 karakter olmalı."));
        }
    }
    if !valid_email(email) {
        errors.push(field("email", "Geçerli bir e-posta adresi gir."));
    }
    if let Some(p) = password {
        let len = p.chars().count();
        if !(8..=128).contains(&len) {
            errors.push(field("password", "Parola 8–128 karakter olmalı."));
        }
    }
    if errors.is_empty() { Ok(()) } else { Err(AppError::Validation(errors)) }
}

fn row_to_user(r: &rusqlite::Row<'_>) -> rusqlite::Result<User> {
    Ok(User { id: r.get(0)?, name: r.get(1)?, email: r.get(2)?, status: r.get(3)?, last_login_at: r.get(4)?, created_at: r.get(5)? })
}

const USER_COLS: &str = "id, name, email, status, last_login_at, created_at";

pub fn user_by_id(conn: &Connection, id: i64) -> AppResult<User> {
    conn.query_row(&format!("SELECT {USER_COLS} FROM users WHERE id = ?1"), [id], row_to_user)
        .optional()?
        .ok_or_else(|| AppError::NotFound("Kullanıcı bulunamadı.".into()))
}

/// `POST /register`. İlk kullanıcı `admin` olur.
pub fn register(conn: &Connection, name: &str, email: &str, password: &str) -> AppResult<User> {
    let email = email.trim().to_lowercase();
    validate(Some(name), &email, Some(password))?;
    let first: bool = conn.query_row("SELECT NOT EXISTS(SELECT 1 FROM users)", [], |r| r.get(0))?;
    let hash = hash_password(password)?;
    let res = conn.execute(
        &format!("INSERT INTO users (name, email, password, status, created_at, updated_at) VALUES (?1, ?2, ?3, 'active', {NOW_SQL}, {NOW_SQL})"),
        params![name.trim(), email, hash],
    );
    if let Err(rusqlite::Error::SqliteFailure(f, _)) = &res {
        if f.code == rusqlite::ErrorCode::ConstraintViolation {
            return Err(AppError::Conflict("Bu e-posta ile bir hesap mevcut.".into()));
        }
    }
    res?;
    let id = conn.last_insert_rowid();
    if first {
        rbac::role_find_or_create(conn, SUPER_ADMIN_ROLE)?;
        rbac::assign_role(conn, ModelRef::user(id), &[SUPER_ADMIN_ROLE])?;
    } else if let Some(default_role) = crate::backend::schema::DEFAULT_ROLE {
        // Uygulamanın son kullanıcı rolü (örn. `customer`); rol yoksa rolsüz kalır.
        if rbac::role_find_by_name(conn, default_role)?.is_some() {
            rbac::assign_role(conn, ModelRef::user(id), &[default_role])?;
        }
    }
    user_by_id(conn, id)
}

/// `POST /login`. Hata mesajı kullanıcı yokluğunu belli etmez.
pub fn attempt(conn: &Connection, email: &str, password: &str) -> AppResult<User> {
    let email = email.trim().to_lowercase();
    let row: Option<(i64, String, String)> = conn
        .query_row("SELECT id, password, status FROM users WHERE email = ?1", [&email], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
        .optional()?;
    let bad = || AppError::validation("email", "E-posta veya parola hatalı.");
    let Some((id, hash, status)) = row else {
        // Zamanlama farkını azaltmak için var olmayan kullanıcıda da bir özetleme yapılır.
        let _ = hash_password(password);
        return Err(bad());
    };
    if !verify_password(password, &hash) {
        return Err(bad());
    }
    if status != "active" {
        return Err(AppError::Forbidden("Hesabın askıya alınmış ya da engellenmiş.".into()));
    }
    conn.execute(&format!("UPDATE users SET last_login_at = {NOW_SQL} WHERE id = ?1"), [id])?;
    user_by_id(conn, id)
}

/// Komut satırı yönetici aracının karşılığı (`qtoefl:admin`): kullanıcıyı oluşturur ya da günceller, rol atar.
/// Rol önceden var olmalıdır (yoksa `NotFound`).
pub fn create_admin(conn: &Connection, email: &str, role: &str, name: &str, password: Option<&str>) -> AppResult<User> {
    let email = email.trim().to_lowercase();
    validate(Some(name), &email, password)?;
    rbac::role_find_by_name(conn, role)?.ok_or_else(|| AppError::NotFound(format!("`{role}` adında bir rol yok.")))?;
    let existing: Option<i64> = conn.query_row("SELECT id FROM users WHERE email = ?1", [&email], |r| r.get(0)).optional()?;
    let id = match existing {
        Some(id) => {
            if let Some(p) = password {
                conn.execute(
                    &format!("UPDATE users SET name = ?1, password = ?2, updated_at = {NOW_SQL} WHERE id = ?3"),
                    params![name.trim(), hash_password(p)?, id],
                )?;
            } else {
                conn.execute(&format!("UPDATE users SET name = ?1, updated_at = {NOW_SQL} WHERE id = ?2"), params![name.trim(), id])?;
            }
            id
        }
        None => {
            let p = password.ok_or_else(|| AppError::validation("password", "Yeni kullanıcı için parola gerekli."))?;
            conn.execute(
                &format!("INSERT INTO users (name, email, password, status, created_at, updated_at) VALUES (?1, ?2, ?3, 'active', {NOW_SQL}, {NOW_SQL})"),
                params![name.trim(), email, hash_password(p)?],
            )?;
            conn.last_insert_rowid()
        }
    };
    rbac::assign_role(conn, ModelRef::user(id), &[role])?;
    user_by_id(conn, id)
}

/// Oturumdaki kullanıcı + rolleri + tüm izinleri (ön yüz menü/buton görünürlüğü için).
pub fn user_with_access(conn: &Connection, id: i64) -> AppResult<Value> {
    let user = user_by_id(conn, id)?;
    let m = ModelRef::user(id);
    let roles = rbac::role_names(conn, m)?;
    let super_admin = roles.iter().any(|r| r == SUPER_ADMIN_ROLE);
    Ok(json!({
        "user": user,
        "roles": roles,
        "superAdmin": super_admin,
        "permissions": rbac::all_permissions(conn, m)?,
    }))
}

/// Yönetici listesi (`AdminUser` biçimi: `role` = ilk rol, `roles` = tümü).
pub fn list_users(conn: &Connection) -> AppResult<Vec<Value>> {
    let mut st = conn.prepare(&format!("SELECT {USER_COLS} FROM users ORDER BY id"))?;
    let users: Vec<User> = st.query_map([], row_to_user)?.collect::<Result<Vec<_>, _>>()?;
    let mut out = Vec::new();
    for u in users {
        let roles = rbac::role_names(conn, ModelRef::user(u.id))?;
        out.push(json!({
            "id": u.id, "name": u.name, "email": u.email,
            "role": roles.first().cloned(), "roles": roles,
            "active": u.status == "active", "status": u.status,
            "lastLoginAt": u.last_login_at, "createdAt": u.created_at,
        }));
    }
    Ok(out)
}

pub fn set_status(conn: &Connection, id: i64, status: &str) -> AppResult<User> {
    if !["active", "suspended", "banned"].contains(&status) {
        return Err(AppError::validation("status", "Durum active, suspended veya banned olmalı."));
    }
    user_by_id(conn, id)?;
    if status != "active" && rbac::has_role(conn, ModelRef::user(id), SUPER_ADMIN_ROLE)? {
        let admins: i64 = conn.query_row(
            "SELECT COUNT(*) FROM model_has_roles mr JOIN roles r ON r.id = mr.role_id JOIN users u ON u.id = mr.model_id
             WHERE r.name = ?1 AND mr.model_type = 'User' AND u.status = 'active'",
            [SUPER_ADMIN_ROLE],
            |r| r.get(0),
        )?;
        if admins <= 1 {
            return Err(AppError::Conflict("Son etkin süper yönetici askıya alınamaz.".into()));
        }
    }
    conn.execute(&format!("UPDATE users SET status = ?1, updated_at = {NOW_SQL} WHERE id = ?2"), params![status, id])?;
    user_by_id(conn, id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn email_checks() {
        assert!(valid_email("ad@ornek.com"));
        assert!(!valid_email("ad@ornek"));
        assert!(!valid_email("ad ornek@x.com"));
        assert!(!valid_email("@x.com"));
    }

    #[test]
    fn hash_roundtrip() {
        let h = hash_password("gizli-parola").unwrap();
        assert!(verify_password("gizli-parola", &h));
        assert!(!verify_password("yanlis", &h));
    }
}
