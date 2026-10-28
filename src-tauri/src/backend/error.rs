//! Tek hata türü: Tauri komutları `Result<T, AppError>` döndürür, ön yüze
//! `{ code, message, errors? }` olarak serileşir.
use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};

#[derive(Debug, Clone, Serialize)]
pub struct FieldError {
    pub field: String,
    pub message: String,
}

#[derive(Debug)]
pub enum AppError {
    /// Oturum yok (401)
    Unauthenticated,
    /// İzin yok (403)
    Forbidden(String),
    /// Kayıt yok (404)
    NotFound(String),
    /// Doğrulama hatası (422)
    Validation(Vec<FieldError>),
    /// Benzersizlik / durum çakışması (409)
    Conflict(String),
    /// Giriş denemesi sınırı aşıldı (429); kalan kilit süresi saniye
    TooManyAttempts(u64),
    Db(String),
    Internal(String),
}

pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn validation(field: &str, message: &str) -> Self {
        AppError::Validation(vec![FieldError { field: field.into(), message: message.into() }])
    }
    pub fn code(&self) -> &'static str {
        match self {
            AppError::Unauthenticated => "unauthenticated",
            AppError::Forbidden(_) => "forbidden",
            AppError::NotFound(_) => "not_found",
            AppError::Validation(_) => "validation",
            AppError::Conflict(_) => "conflict",
            AppError::TooManyAttempts(_) => "too_many_attempts",
            AppError::Db(_) => "db",
            AppError::Internal(_) => "internal",
        }
    }
    pub fn message(&self) -> String {
        match self {
            AppError::Unauthenticated => "Bu işlem için giriş yapmalısın.".into(),
            AppError::Forbidden(m) | AppError::NotFound(m) | AppError::Conflict(m) | AppError::Db(m) | AppError::Internal(m) => m.clone(),
            AppError::Validation(_) => "Gönderilen veri geçerli değil.".into(),
            AppError::TooManyAttempts(secs) => format!("Çok fazla başarısız giriş denemesi. {secs} saniye sonra yeniden dene."),
        }
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code(), self.message())
    }
}
impl std::error::Error for AppError {}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let errors = match self {
            AppError::Validation(v) => Some(v),
            _ => None,
        };
        let retry_after = match self {
            AppError::TooManyAttempts(secs) => Some(*secs),
            _ => None,
        };
        let mut st = s.serialize_struct("AppError", 2 + usize::from(errors.is_some()) + usize::from(retry_after.is_some()))?;
        st.serialize_field("code", self.code())?;
        st.serialize_field("message", &self.message())?;
        if let Some(e) = errors {
            st.serialize_field("errors", e)?;
        }
        if let Some(secs) = retry_after {
            st.serialize_field("retryAfterSecs", &secs)?;
        }
        st.end()
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        if let rusqlite::Error::SqliteFailure(f, msg) = &e {
            if f.code == rusqlite::ErrorCode::ConstraintViolation {
                return AppError::Conflict(msg.clone().unwrap_or_else(|| "Kayıt kısıtlamaya takıldı (benzersizlik ya da ilişki).".into()));
            }
        }
        AppError::Db(e.to_string())
    }
}
impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Internal(e.to_string())
    }
}
