//! Tauri uygulama durumu: veritabanı, oturum ve giriş denemesi sınırı.
//!
//! * Oturum süreçte tutulur (tek yerel kullanıcı). Boşta kalma süresi [`SESSION_IDLE_SECS`] ve
//!   mutlak ömür [`SESSION_ABSOLUTE_SECS`] arka uçta uygulanır: süresi dolan oturum ilk denetimde düşer,
//!   `auth_me` null döner. Uygulama kapanınca oturum zaten biter.
//! * Giriş denemesi sınırı da süreçtedir: anahtar küçük harfli e-postadır; [`LOGIN_MAX_FAILURES`] başarısız
//!   denemeden sonra o anahtar [`LOGIN_LOCK_SECS`] boyunca kilitlenir; başarılı giriş sayacı sıfırlar.
//!   Parola ya da deneme içeriği saklanmaz, günlüğe yazılmaz. Sınır uygulama yeniden başlayınca sıfırlanır
//!   (yerel masaüstü uygulaması için kabul edilen sınır; docs/backend.md §9).
//! * Zaman tek bir yerden okunur (`now`); testler saati ilerletebilir, böylece süre davranışı beklemeden sınanır.
use crate::backend::db::Db;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

/// Boşta kalma: son yetkili çağrıdan bu yana geçen süre bunu aşarsa oturum düşer.
pub const SESSION_IDLE_SECS: u64 = 30 * 60;
/// Mutlak ömür: girişten bu yana geçen süre bunu aşarsa, etkinlik olsa da oturum düşer.
pub const SESSION_ABSOLUTE_SECS: u64 = 12 * 60 * 60;
/// Bir anahtar için pencere içinde izin verilen başarısız giriş sayısı.
pub const LOGIN_MAX_FAILURES: u32 = 5;
/// Başarısız denemelerin sayıldığı pencere; pencere dolunca sayaç sıfırdan başlar.
pub const LOGIN_WINDOW_SECS: u64 = 15 * 60;
/// Sınır aşılınca anahtarın kilitli kaldığı süre.
pub const LOGIN_LOCK_SECS: u64 = 15 * 60;
/// Bellekte tutulan en çok anahtar; aşılırsa önce süresi dolanlar, sonra en eskisi atılır.
const LOGIN_KEYS_MAX: usize = 256;

#[derive(Clone, Copy, Debug)]
pub struct Session {
    pub user_id: i64,
    pub started_at: u64,
    pub last_seen: u64,
}

#[derive(Clone, Copy, Debug, Default)]
struct Failures {
    count: u32,
    first_at: u64,
    locked_until: u64,
}

pub struct AppState {
    pub db: Db,
    session: Mutex<Option<Session>>,
    login_failures: Mutex<HashMap<String, Failures>>,
    /// Testlerde sabitlenen saat (Unix saniyesi); `None` ise sistem saati.
    clock_override: Mutex<Option<u64>>,
}

impl AppState {
    pub fn new(db: Db) -> Self {
        AppState { db, session: Mutex::new(None), login_failures: Mutex::new(HashMap::new()), clock_override: Mutex::new(None) }
    }

    /// Unix saniyesi; süre kararlarının tek kaynağı.
    pub fn now(&self) -> u64 {
        if let Ok(g) = self.clock_override.lock() {
            if let Some(t) = *g {
                return t;
            }
        }
        SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
    }

    /// Yalnız testler: saati sabitler/ilerletir.
    #[cfg(test)]
    pub fn set_now(&self, secs: u64) {
        if let Ok(mut g) = self.clock_override.lock() {
            *g = Some(secs);
        }
    }

    /// Geçerli oturumun kullanıcısı. Boşta kalma ya da mutlak ömür dolduysa oturum düşer ve `None` döner;
    /// aksi halde çağrı "görüldü" sayılır (boşta kalma süresi yeniden başlar).
    pub fn user(&self) -> Option<i64> {
        let now = self.now();
        let mut g = self.session.lock().ok()?;
        let s = (*g)?;
        if now.saturating_sub(s.last_seen) > SESSION_IDLE_SECS || now.saturating_sub(s.started_at) > SESSION_ABSOLUTE_SECS {
            *g = None;
            return None;
        }
        if let Some(cur) = g.as_mut() {
            cur.last_seen = now;
        }
        Some(s.user_id)
    }

    /// Yeni oturum açar (`Some`) ya da oturumu kapatır (`None`).
    pub fn set_user(&self, id: Option<i64>) {
        let now = self.now();
        if let Ok(mut g) = self.session.lock() {
            *g = id.map(|user_id| Session { user_id, started_at: now, last_seen: now });
        }
    }

    /// Oturumun başlangıcı ve son görülme zamanı (durum ekranı ve testler için).
    pub fn session(&self) -> Option<Session> {
        self.session.lock().ok().and_then(|g| *g)
    }

    fn login_key(email: &str) -> String {
        email.trim().to_lowercase()
    }

    /// Anahtar kilitliyse kalan saniye.
    pub fn login_locked_for(&self, email: &str) -> Option<u64> {
        let now = self.now();
        let g = self.login_failures.lock().ok()?;
        g.get(&Self::login_key(email)).filter(|f| f.locked_until > now).map(|f| f.locked_until - now)
    }

    /// Başarısız girişi sayar; sınır aşıldıysa anahtarı kilitler ve kalan saniyeyi döndürür.
    pub fn record_login_failure(&self, email: &str) -> Option<u64> {
        let now = self.now();
        let key = Self::login_key(email);
        let mut g = self.login_failures.lock().ok()?;
        if !g.contains_key(&key) && g.len() >= LOGIN_KEYS_MAX {
            g.retain(|_, f| f.locked_until > now || now.saturating_sub(f.first_at) <= LOGIN_WINDOW_SECS);
            if g.len() >= LOGIN_KEYS_MAX {
                if let Some(oldest) = g.iter().min_by_key(|(_, f)| f.first_at).map(|(k, _)| k.clone()) {
                    g.remove(&oldest);
                }
            }
        }
        let f = g.entry(key).or_default();
        if f.count == 0 || now.saturating_sub(f.first_at) > LOGIN_WINDOW_SECS {
            f.count = 0;
            f.first_at = now;
        }
        f.count += 1;
        if f.count >= LOGIN_MAX_FAILURES {
            f.locked_until = now + LOGIN_LOCK_SECS;
            f.count = 0;
            f.first_at = now;
            return Some(LOGIN_LOCK_SECS);
        }
        None
    }

    /// Başarılı giriş: anahtarın sayacı silinir.
    pub fn clear_login_failures(&self, email: &str) {
        if let Ok(mut g) = self.login_failures.lock() {
            g.remove(&Self::login_key(email));
        }
    }
}
