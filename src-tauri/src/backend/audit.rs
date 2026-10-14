//! Etkinlik/denetim günlüğü (spatie/laravel-activitylog karşılığı): `audit_logs` tablosu.
use crate::backend::error::AppResult;
use crate::backend::util::{new_id, NOW_SQL};
use rusqlite::{params, Connection};
use serde_json::Value;

/// Bir değişikliği günlüğe yazar. `before`/`after` JSON olarak saklanır.
pub fn record(
    conn: &Connection,
    actor: Option<i64>,
    action: &str,
    entity: &str,
    entity_id: &str,
    reason: Option<&str>,
    before: Option<&Value>,
    after: Option<&Value>,
) -> AppResult<()> {
    conn.execute(
        &format!(
            "INSERT INTO audit_logs (id, at, actorId, action, entity, entityId, reason, before, after)
             VALUES (?1, {NOW_SQL}, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
        ),
        params![
            new_id(),
            actor.map(|a| a.to_string()),
            action,
            entity,
            entity_id,
            reason,
            before.map(|v| v.to_string()),
            after.map(|v| v.to_string()),
        ],
    )?;
    Ok(())
}

/// JSON değerinin kimlik metni (sayı ya da metin).
pub fn id_text(id: &Value) -> String {
    match id {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    }
}
