//! Küçük yardımcılar: zaman damgası ve rastgele kimlik.
use crate::backend::error::AppResult;
use argon2::password_hash::rand_core::{OsRng, RngCore};
use rusqlite::Connection;

/// SQLite'ta ISO-8601 UTC zaman damgası üreten ifade (SQL içinde kullanılır).
pub const NOW_SQL: &str = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

pub fn now_iso(conn: &Connection) -> AppResult<String> {
    Ok(conn.query_row(&format!("SELECT {NOW_SQL}"), [], |r| r.get::<_, String>(0))?)
}

/// 16 bayt rastgele, 32 haneli küçük harf onaltılık kimlik (metin birincil anahtarlar için).
pub fn new_id() -> String {
    let mut buf = [0u8; 16];
    OsRng.fill_bytes(&mut buf);
    buf.iter().map(|b| format!("{b:02x}")).collect()
}

/// `n` bayt rastgele, büyük harf onaltılık dize (sipariş/bilet kodu gibi kısa kodlar için).
pub fn random_hex_upper(n: usize) -> String {
    let mut buf = vec![0u8; n];
    OsRng.fill_bytes(&mut buf);
    buf.iter().map(|b| format!("{b:02X}")).collect()
}

/// `alphabet` karakterlerinden `n` rastgele karakterlik dize (iş emri kodundaki rastgele ek gibi).
pub fn random_from(alphabet: &[u8], n: usize) -> String {
    let mut buf = vec![0u8; n];
    OsRng.fill_bytes(&mut buf);
    buf.iter().map(|b| alphabet[(*b as usize) % alphabet.len()] as char).collect()
}
