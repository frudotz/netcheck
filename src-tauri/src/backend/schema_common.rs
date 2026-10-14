//! Her projede ortak olan tabloların kaynak tanımları (iletişim mesajı, içerik sayfası, denetim günlüğü).
use crate::backend::crud::{col, req, Entity, Kind};

pub static CONTACT_MESSAGE: Entity = Entity {
    resource: "ContactMessage",
    table: "contact_messages",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        req("name", Kind::Text),
        req("email", Kind::Text),
        col("subject", Kind::Text),
        req("message", Kind::Text),
        col("lang", Kind::Text),
        col("status", Kind::Text),
        col("assignee", Kind::Text),
        col("createdAt", Kind::Date),
        col("replies", Kind::Json),
    ],
    search: &["name", "email", "subject", "message"],
    filters: &["status", "lang", "assignee"],
    order_by: "\"createdAt\" DESC",
    readonly: false,
};

pub static CONTENT_PAGE: Entity = Entity {
    resource: "ContentPage",
    table: "content_pages",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        req("slug", Kind::Text),
        req("lang", Kind::Text),
        req("title", Kind::Text),
        col("body", Kind::Text),
        col("status", Kind::Text),
        col("updatedAt", Kind::Date),
    ],
    search: &["title", "body"],
    filters: &["slug", "lang", "status"],
    order_by: "\"slug\" ASC, \"lang\" ASC",
    readonly: false,
};

pub static AUDIT_LOG: Entity = Entity {
    resource: "AuditLog",
    table: "audit_logs",
    pk: "id",
    pk_kind: Kind::Text,
    cols: &[
        col("at", Kind::Date),
        col("actorId", Kind::Text),
        req("action", Kind::Text),
        req("entity", Kind::Text),
        req("entityId", Kind::Text),
        col("reason", Kind::Text),
        col("before", Kind::Json),
        col("after", Kind::Json),
    ],
    search: &["action", "entity", "entityId", "reason"],
    filters: &["actorId", "action", "entity", "entityId", "at"],
    order_by: "\"at\" DESC",
    readonly: true,
};
