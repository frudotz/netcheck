//! SQLite tabanlı geçici yerel arka uç.
//!
//! * `db`, `migrate`, `migrations/*.sql` — bağlantı ve Laravel benzeri migration düzeni
//! * `rbac`, `policy`, `auth` — spatie/laravel-permission mantığında roller ve izinler
//! * `crud`, `controllers`, `commands` — kaynak denetleyicileri ve Tauri komutları
//! * `schema`, `domain` — bu uygulamanın tabloları ve iş işlevleri
//!
//! Ayrıntı ve komut listesi: `docs/backend.md`.
#![allow(dead_code)] // yardımcı işlevlerin bir kısmı henüz ekranlardan çağrılmıyor
pub mod audit;
pub mod auth;
pub mod commands;
pub mod controllers;
pub mod crud;
pub mod db;
pub mod domain;
pub mod error;
pub mod migrate;
pub mod migrations;
pub mod policy;
pub mod rbac;
pub mod schema;
pub mod schema_common;
pub mod state;
pub mod util;

use std::path::Path;

/// Veritabanını açar, bekleyen migration'ları çalıştırır ve uygulama durumunu döndürür.
pub fn boot(path: &Path) -> error::AppResult<state::AppState> {
    let db = db::Db::open(path)?;
    db.with_mut(|c| migrate::run(c, migrations::ALL).map(|_| ()))?;
    Ok(state::AppState::new(db))
}

/// Testler için bellek içi veritabanı (migration'lar çalışmış).
#[cfg(test)]
pub fn boot_memory() -> error::AppResult<state::AppState> {
    let db = db::Db::open_in_memory()?;
    db.with_mut(|c| migrate::run(c, migrations::ALL).map(|_| ()))?;
    Ok(state::AppState::new(db))
}
