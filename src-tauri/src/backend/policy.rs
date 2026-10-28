//! Policy katmanı: `authorize(ability)` Laravel'deki `$this->authorize()` karşılığıdır.
//! Oturum yoksa ya da oturum sahibi artık `active` değilse `Unauthenticated`, izin yoksa `Forbidden` döner.
use crate::backend::auth;
use crate::backend::error::{AppError, AppResult};
use crate::backend::rbac::{self, ModelRef};
use rusqlite::Connection;

pub fn authorize(conn: &Connection, user: Option<i64>, ability: &str) -> AppResult<i64> {
    let uid = user.ok_or(AppError::Unauthenticated)?;
    auth::require_active(conn, uid)?;
    if rbac::can(conn, ModelRef::user(uid), ability)? {
        Ok(uid)
    } else {
        Err(AppError::Forbidden(format!("Bu işlem için `{ability}` izni gerekli.")))
    }
}

/// `Eylem:Kaynak` izin adı (Shield biçimi).
pub fn ability(action: &str, resource: &str) -> String {
    rbac::permission_name(action, resource)
}
