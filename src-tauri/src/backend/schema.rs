//! Bu uygulamanın tabloları ve kaynak tanımları.
//! Sütun adları `src/` altındaki TypeScript tipleriyle ve tasarım belgelerindeki alan adlarıyla birebir aynıdır.
use crate::backend::crud::{col, req, Entity, Kind};
use crate::backend::error::{AppError, AppResult};
pub use crate::backend::schema_common::*;

/// Kayıt olan (ilk kullanıcı dışındaki) herkese verilen rol; `None` ise rolsüz kalır.
pub const DEFAULT_ROLE: Option<&str> = None;

pub static DEVICE: Entity = Entity {
    resource: "Device",
    table: "devices",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        req("platform", Kind::Json),
        req("appVersion", Kind::Text),
        col("locale", Kind::Text),
        col("lastSeenAt", Kind::Date),
        col("reportCount", Kind::Int),
    ],
    search: &["id", "appVersion"],
    filters: &["locale", "lastSeenAt"],
    order_by: "\"lastSeenAt\" DESC",
    readonly: false,
};

pub static REPORT: Entity = Entity {
    resource: "Report",
    table: "reports",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        req("createdAt", Kind::Date),
        req("score", Kind::Int),
        req("passed", Kind::Int),
        req("failed", Kind::Int),
        req("network", Kind::Json),
        req("tests", Kind::Json),
        col("deviceId", Kind::Text),
        col("shared", Kind::Bool),
        col("receivedAt", Kind::Date),
        col("ruleVersion", Kind::Int),
    ],
    search: &["id"],
    filters: &["deviceId", "shared", "ruleVersion", "score", "createdAt"],
    order_by: "\"createdAt\" DESC",
    readonly: false,
};

pub static SCORE_RULE: Entity = Entity {
    resource: "ScoreRule",
    table: "score_rules",
    pk: "version",
    pk_kind: Kind::Int,
    cols: &[
        col("status", Kind::Text),
        req("weights", Kind::Json),
        req("latencyBands", Kind::Json),
        req("levels", Kind::Json),
        col("publishedAt", Kind::Date),
        col("note", Kind::Text),
    ],
    search: &[],
    filters: &["status"],
    order_by: "\"version\" DESC",
    readonly: false,
};

pub static DIAGNOSTIC_TARGET: Entity = Entity {
    resource: "DiagnosticTarget",
    table: "diagnostic_targets",
    pk: "kind",
    pk_kind: Kind::Text,
    cols: &[
        req("target", Kind::Text),
        col("enabled", Kind::Bool),
        col("timeoutMs", Kind::Int),
    ],
    search: &[],
    filters: &[],
    order_by: "\"kind\" ASC",
    // Hedefler Rust'ta sabittir ve uygulama bu tabloyu okumaz (AGENTS.md §6); panel yalnız gösterir.
    readonly: true,
};

pub static PROJECT: &[&Entity] = &[&DEVICE, &REPORT, &SCORE_RULE, &DIAGNOSTIC_TARGET];

/// Bütün kaynaklar: ortak + bu uygulamanınkiler.
pub fn all() -> Vec<&'static Entity> {
    let mut v: Vec<&'static Entity> = vec![&CONTACT_MESSAGE, &CONTENT_PAGE, &AUDIT_LOG];
    v.extend(PROJECT.iter().copied());
    v
}

pub fn entity(resource: &str) -> AppResult<&'static Entity> {
    all().into_iter().find(|e| e.resource == resource)
        .ok_or_else(|| AppError::NotFound(format!("`{resource}` adında bir kaynak yok.")))
}
