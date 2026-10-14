-- Laravel `users` tablosunun karşılığı. Parola Argon2id özetidir, düz metin tutulmaz.
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified_at TEXT,
    password TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    last_login_at TEXT,
    created_at TEXT,
    updated_at TEXT
);
