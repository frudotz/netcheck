-- Başlangıç (referans) verisi. Yinelenebilir: INSERT OR IGNORE.

-- score_rules
INSERT OR IGNORE INTO "score_rules" ("version", "status", "weights", "latencyBands", "levels", "publishedAt", "note") VALUES (1, 'published', '{"internet":35,"dns":20,"gateway":15,"cloudflare":10,"google":10}', '[{"maxMs":50,"bonus":10},{"maxMs":100,"bonus":7},{"maxMs":200,"bonus":4},{"maxMs":null,"bonus":1}]', '{"iyi":80,"orta":50}', '2026-10-14T00:00:00Z', 'İlk yayın');

-- diagnostic_targets
INSERT OR IGNORE INTO "diagnostic_targets" ("kind", "target", "enabled", "timeoutMs") VALUES ('gateway', 'auto', 1, 2000);
INSERT OR IGNORE INTO "diagnostic_targets" ("kind", "target", "enabled", "timeoutMs") VALUES ('cloudflare', '1.1.1.1', 1, 2000);
INSERT OR IGNORE INTO "diagnostic_targets" ("kind", "target", "enabled", "timeoutMs") VALUES ('google', '8.8.8.8', 1, 2000);
INSERT OR IGNORE INTO "diagnostic_targets" ("kind", "target", "enabled", "timeoutMs") VALUES ('dns', 'cloudflare.com', 1, 3000);
INSERT OR IGNORE INTO "diagnostic_targets" ("kind", "target", "enabled", "timeoutMs") VALUES ('internet', 'www.cloudflare.com', 1, 5000);

