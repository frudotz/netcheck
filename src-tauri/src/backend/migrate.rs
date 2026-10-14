//! Laravel benzeri migration çalıştırıcı: `migrations` tablosu (id, migration, batch).
//! Her migration bir SQL dosyasıdır (`backend/migrations/*.sql`) ve kendi transaction'ında çalışır.
use crate::backend::error::AppResult;
use rusqlite::Connection;
use serde::Serialize;

pub struct Migration {
    pub name: &'static str,
    pub sql: &'static str,
}

#[derive(Debug, Serialize)]
pub struct MigrationStatus {
    pub migration: String,
    pub ran: bool,
    pub batch: Option<i64>,
}

fn ensure_table(conn: &Connection) -> AppResult<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            migration TEXT NOT NULL UNIQUE,
            batch INTEGER NOT NULL
        );",
    )?;
    Ok(())
}

/// Bekleyen migration'ları çalıştırır; çalışanların adlarını döndürür (`php artisan migrate`).
pub fn run(conn: &mut Connection, migrations: &[Migration]) -> AppResult<Vec<String>> {
    ensure_table(conn)?;
    let batch: i64 = conn.query_row("SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations", [], |r| r.get(0))?;
    let mut ran = Vec::new();
    for m in migrations {
        let done: bool = conn.query_row("SELECT EXISTS(SELECT 1 FROM migrations WHERE migration = ?1)", [m.name], |r| r.get(0))?;
        if done {
            continue;
        }
        let tx = conn.transaction()?;
        tx.execute_batch(m.sql)?;
        tx.execute("INSERT INTO migrations (migration, batch) VALUES (?1, ?2)", rusqlite::params![m.name, batch])?;
        tx.commit()?;
        ran.push(m.name.to_string());
    }
    Ok(ran)
}

/// `php artisan migrate:status`
pub fn status(conn: &Connection, migrations: &[Migration]) -> AppResult<Vec<MigrationStatus>> {
    ensure_table(conn)?;
    let mut out = Vec::new();
    for m in migrations {
        let batch: Option<i64> = conn
            .query_row("SELECT batch FROM migrations WHERE migration = ?1", [m.name], |r| r.get(0))
            .ok();
        out.push(MigrationStatus { migration: m.name.to_string(), ran: batch.is_some(), batch });
    }
    Ok(out)
}

/// `php artisan migrate:fresh`: yalnız geliştirmede. Bütün tabloları siler ve yeniden kurar.
pub fn fresh(conn: &mut Connection, migrations: &[Migration]) -> AppResult<Vec<String>> {
    conn.pragma_update(None, "foreign_keys", "OFF")?;
    let tables: Vec<String> = {
        let mut st = conn.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")?;
        let rows = st.query_map([], |r| r.get::<_, String>(0))?;
        rows.collect::<Result<Vec<_>, _>>()?
    };
    for t in tables {
        conn.execute_batch(&format!("DROP TABLE IF EXISTS \"{}\";", t.replace('"', "\"\"")))?;
    }
    conn.pragma_update(None, "foreign_keys", "ON")?;
    run(conn, migrations)
}
