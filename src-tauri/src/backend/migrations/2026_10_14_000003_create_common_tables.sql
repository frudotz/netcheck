-- Her projede ortak: iletişim mesajı, içerik sayfası, denetim günlüğü.
-- Sütun adları ön yüz tipleriyle birebir (camelCase).
CREATE TABLE contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'tr' CHECK (lang IN ('tr', 'en', 'ar', 'fa', 'de')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'answered', 'spam')),
    assignee TEXT,
    createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    replies TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX contact_messages_status_index ON contact_messages (status);

CREATE TABLE content_pages (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL CHECK (slug IN ('hakkinda', 'gizlilik', 'kosullar', 'iletisim')),
    lang TEXT NOT NULL CHECK (lang IN ('tr', 'en', 'ar', 'fa', 'de')),
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE (slug, lang)
);

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    actorId TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entityId TEXT NOT NULL,
    reason TEXT,
    before TEXT,
    after TEXT
);
CREATE INDEX audit_logs_entity_index ON audit_logs (entity, entityId);
CREATE INDEX audit_logs_at_index ON audit_logs (at);
