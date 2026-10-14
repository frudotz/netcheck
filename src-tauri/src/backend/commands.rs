//! Tauri komutları (ince sarmalayıcılar). İş mantığı `controllers.rs` içindedir.
//! Ön yüz çağrısı: `invoke("crud_index", { resource: "Order", query: { page: 1 } })`.
//! Rust'taki `snake_case` parametreler JS tarafında `camelCase` yazılır (`userId`, `groupBy`, `newName`).
use crate::backend::controllers as c;
use crate::backend::crud::{ListQuery, Paged};
use crate::backend::error::AppResult;
use crate::backend::migrate::MigrationStatus;
use crate::backend::state::AppState;
use serde_json::Value;
use tauri::State;

// ── Kimlik doğrulama ──
#[tauri::command]
pub fn auth_register(state: State<'_, AppState>, name: String, email: String, password: String) -> AppResult<Value> {
    c::auth_register(&state, &name, &email, &password)
}
#[tauri::command]
pub fn auth_login(state: State<'_, AppState>, email: String, password: String) -> AppResult<Value> {
    c::auth_login(&state, &email, &password)
}
#[tauri::command]
pub fn auth_logout(state: State<'_, AppState>) {
    c::auth_logout(&state)
}
#[tauri::command]
pub fn auth_me(state: State<'_, AppState>) -> AppResult<Value> {
    c::auth_me(&state)
}

// ── Kullanıcılar ──
#[tauri::command]
pub fn user_index(state: State<'_, AppState>) -> AppResult<Vec<Value>> {
    c::user_index(&state)
}
#[tauri::command]
pub fn user_store(state: State<'_, AppState>, name: String, email: String, role: String, password: Option<String>) -> AppResult<Value> {
    c::user_store(&state, &name, &email, &role, password.as_deref())
}
#[tauri::command]
pub fn user_sync_roles(state: State<'_, AppState>, user_id: i64, roles: Vec<String>) -> AppResult<Value> {
    c::user_sync_roles(&state, user_id, &roles)
}
#[tauri::command]
pub fn user_sync_permissions(state: State<'_, AppState>, user_id: i64, permissions: Vec<String>) -> AppResult<Value> {
    c::user_sync_permissions(&state, user_id, &permissions)
}
#[tauri::command]
pub fn user_set_status(state: State<'_, AppState>, user_id: i64, status: String, reason: Option<String>) -> AppResult<Value> {
    c::user_set_status(&state, user_id, &status, reason.as_deref())
}

// ── Roller ve izinler ──
#[tauri::command]
pub fn role_index(state: State<'_, AppState>) -> AppResult<Vec<Value>> {
    c::role_index(&state)
}
#[tauri::command]
pub fn role_store(state: State<'_, AppState>, name: String, permissions: Option<Vec<String>>) -> AppResult<Value> {
    c::role_store(&state, &name, &permissions.unwrap_or_default())
}
#[tauri::command]
pub fn role_update(state: State<'_, AppState>, name: String, new_name: String) -> AppResult<()> {
    c::role_update(&state, &name, &new_name)
}
#[tauri::command]
pub fn role_destroy(state: State<'_, AppState>, name: String, reason: Option<String>) -> AppResult<()> {
    c::role_destroy(&state, &name, reason.as_deref())
}
#[tauri::command]
pub fn role_sync_permissions(state: State<'_, AppState>, name: String, permissions: Vec<String>) -> AppResult<Vec<String>> {
    c::role_sync_permissions(&state, &name, &permissions)
}
#[tauri::command]
pub fn permission_index(state: State<'_, AppState>) -> AppResult<Vec<Value>> {
    c::permission_index(&state)
}
#[tauri::command]
pub fn permission_generate(state: State<'_, AppState>, extra_resources: Option<Vec<String>>) -> AppResult<usize> {
    c::permission_generate(&state, &extra_resources.unwrap_or_default())
}

// ── Kaynak (CRUD) denetleyicisi ──
#[tauri::command]
pub fn crud_resources(state: State<'_, AppState>) -> AppResult<Vec<Value>> {
    c::crud_resources(&state)
}
#[tauri::command]
pub fn crud_index(state: State<'_, AppState>, resource: String, query: Option<ListQuery>) -> AppResult<Paged> {
    c::crud_index(&state, &resource, query.unwrap_or_default())
}
#[tauri::command]
pub fn crud_show(state: State<'_, AppState>, resource: String, id: Value) -> AppResult<Value> {
    c::crud_show(&state, &resource, &id)
}
#[tauri::command]
pub fn crud_store(state: State<'_, AppState>, resource: String, data: Value) -> AppResult<Value> {
    c::crud_store(&state, &resource, &data)
}
#[tauri::command]
pub fn crud_update(state: State<'_, AppState>, resource: String, id: Value, data: Value) -> AppResult<Value> {
    c::crud_update(&state, &resource, &id, &data)
}
#[tauri::command]
pub fn crud_destroy(state: State<'_, AppState>, resource: String, id: Value, reason: Option<String>) -> AppResult<()> {
    c::crud_destroy(&state, &resource, &id, reason.as_deref())
}
#[tauri::command]
pub fn crud_destroy_many(state: State<'_, AppState>, resource: String, ids: Vec<Value>, reason: Option<String>) -> AppResult<usize> {
    c::crud_destroy_many(&state, &resource, &ids, reason.as_deref())
}
#[tauri::command]
pub fn crud_aggregate(state: State<'_, AppState>, resource: String, group_by: String, query: Option<ListQuery>) -> AppResult<Vec<Value>> {
    c::crud_aggregate(&state, &resource, &group_by, query.unwrap_or_default())
}

// ── Altyapı ve herkese açık ──
#[tauri::command]
pub fn db_migrate_status(state: State<'_, AppState>) -> AppResult<Vec<MigrationStatus>> {
    c::db_migrate_status(&state)
}
#[tauri::command]
pub fn contact_submit(state: State<'_, AppState>, name: String, email: String, subject: Option<String>, message: String, lang: Option<String>) -> AppResult<Value> {
    c::contact_submit(&state, &name, &email, subject.as_deref(), &message, lang.as_deref())
}

/// Uygulama açılışı: veritabanı dosyasını uygulama veri klasöründe açar, migration'ları çalıştırır ve durumu kaydeder.
/// `lib.rs`: `tauri::Builder::default().setup(|app| backend::commands::setup(app))`
pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::Manager;
    let dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&dir)?;
    let state = crate::backend::boot(&dir.join("app.sqlite")).map_err(|e| e.to_string())?;
    app.manage(state);
    Ok(())
}
