//! Tauri uygulama durumu: veritabanı + oturumdaki kullanıcı.
use crate::backend::db::Db;
use std::sync::Mutex;

pub struct AppState {
    pub db: Db,
    pub current_user: Mutex<Option<i64>>,
}

impl AppState {
    pub fn new(db: Db) -> Self {
        AppState { db, current_user: Mutex::new(None) }
    }
    pub fn user(&self) -> Option<i64> {
        self.current_user.lock().ok().and_then(|g| *g)
    }
    pub fn set_user(&self, id: Option<i64>) {
        if let Ok(mut g) = self.current_user.lock() {
            *g = id;
        }
    }
}
