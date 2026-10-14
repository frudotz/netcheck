//! SQLite bağlantısı (rusqlite, SQLite kendi içinde derlenir: `bundled`).
//! Tek bağlantı bir `Mutex` arkasındadır; masaüstü/mobil tek kullanıcılı uygulama için yeterlidir.
use crate::backend::error::{AppError, AppResult};
use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

pub struct Db {
    conn: Mutex<Connection>,
}

impl Db {
    pub fn open(path: &Path) -> AppResult<Self> {
        let conn = Connection::open(path)?;
        Self::prepare(conn, true)
    }

    pub fn open_in_memory() -> AppResult<Self> {
        Self::prepare(Connection::open_in_memory()?, false)
    }

    fn prepare(conn: Connection, wal: bool) -> AppResult<Self> {
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.busy_timeout(std::time::Duration::from_secs(5))?;
        if wal {
            // journal_mode bir değer döndürür; query_row ile okunur.
            let _: String = conn.query_row("PRAGMA journal_mode = WAL", [], |r| r.get(0))?;
        }
        Ok(Db { conn: Mutex::new(conn) })
    }

    /// Bağlantıyı ödünç al (salt okuma ya da yazma).
    pub fn with<R>(&self, f: impl FnOnce(&Connection) -> AppResult<R>) -> AppResult<R> {
        let guard = self.conn.lock().map_err(|_| AppError::Internal("veritabanı kilidi bozuldu".into()))?;
        f(&guard)
    }

    /// Değiştirilebilir bağlantı (transaction açmak için).
    pub fn with_mut<R>(&self, f: impl FnOnce(&mut Connection) -> AppResult<R>) -> AppResult<R> {
        let mut guard = self.conn.lock().map_err(|_| AppError::Internal("veritabanı kilidi bozuldu".into()))?;
        f(&mut guard)
    }
}
