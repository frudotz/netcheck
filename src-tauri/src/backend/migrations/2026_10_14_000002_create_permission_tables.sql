-- spatie/laravel-permission tabloları (teams kapalı, guard: web).
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    guard_name TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT,
    UNIQUE (name, guard_name)
);

CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    guard_name TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT,
    UNIQUE (name, guard_name)
);

CREATE TABLE model_has_permissions (
    permission_id INTEGER NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    model_type TEXT NOT NULL,
    model_id INTEGER NOT NULL,
    PRIMARY KEY (permission_id, model_id, model_type)
);
CREATE INDEX model_has_permissions_model_id_model_type_index ON model_has_permissions (model_id, model_type);

CREATE TABLE model_has_roles (
    role_id INTEGER NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    model_type TEXT NOT NULL,
    model_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, model_id, model_type)
);
CREATE INDEX model_has_roles_model_id_model_type_index ON model_has_roles (model_id, model_type);

CREATE TABLE role_has_permissions (
    permission_id INTEGER NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    PRIMARY KEY (permission_id, role_id)
);
