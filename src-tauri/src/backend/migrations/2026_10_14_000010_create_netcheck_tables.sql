-- netcheck tabloları. Sütun adları ön yüz tipleriyle birebir (camelCase); tablo adları snake_case.

CREATE TABLE "devices" (
    "id" TEXT PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'tr' CHECK ("locale" IN ('tr', 'en', 'ar', 'fa', 'de')),
    "lastSeenAt" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "reports" (
    "id" TEXT PRIMARY KEY,
    "createdAt" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "network" TEXT NOT NULL,
    "tests" TEXT NOT NULL,
    "deviceId" TEXT REFERENCES "devices" ("id") ON DELETE SET NULL,
    "shared" INTEGER NOT NULL DEFAULT 1 CHECK ("shared" IN (0, 1)),
    "receivedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    "ruleVersion" INTEGER NOT NULL DEFAULT 1,
    CHECK ("score" BETWEEN 0 AND 100)
);
CREATE INDEX reports_createdAt_index ON "reports" ("createdAt");
CREATE INDEX reports_deviceId_index ON "reports" ("deviceId");

CREATE TABLE "score_rules" (
    "version" INTEGER PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'published')),
    "weights" TEXT NOT NULL,
    "latencyBands" TEXT NOT NULL,
    "levels" TEXT NOT NULL,
    "publishedAt" TEXT,
    "note" TEXT
);

CREATE TABLE "diagnostic_targets" (
    "kind" TEXT PRIMARY KEY,
    "target" TEXT NOT NULL,
    "enabled" INTEGER NOT NULL DEFAULT 1 CHECK ("enabled" IN (0, 1)),
    "timeoutMs" INTEGER NOT NULL DEFAULT 2000,
    CHECK ("kind" IN ('gateway', 'cloudflare', 'google', 'dns', 'internet'))
);
