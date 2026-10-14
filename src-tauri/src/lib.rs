mod diagnostics;
mod network;
mod platform;
mod report_id;

// NetCheck: ağ anlık görüntüsü — invoke("get_network_snapshot")
// Sistem çağrıları engelleyici olduğu için ana thread dışında çalıştırılır.
#[tauri::command]
async fn get_network_snapshot() -> Result<network::NetworkSnapshot, String> {
    tauri::async_runtime::spawn_blocking(network::snapshot)
        .await
        .map_err(|_| "snapshot_failed".to_string())
}

// NetCheck: tek bir tanılama testi — invoke("run_diagnostic", { kind: "gateway" | "cloudflare" | "google" | "dns" | "internet" })
// Hedefler Rust'ta sabittir; serde bilinmeyen `kind` değerlerini reddeder.
#[tauri::command]
async fn run_diagnostic(kind: diagnostics::DiagnosticKind) -> Result<diagnostics::DiagnosticOutcome, String> {
    tauri::async_runtime::spawn_blocking(move || diagnostics::run(kind))
        .await
        .map_err(|_| "diagnostic_failed".to_string())
}

// NetCheck: tanılama raporu kimliği — invoke("generate_report_id") → "NCHK-2026-XXXXXXXX"
#[tauri::command]
fn generate_report_id() -> String {
    report_id::generate()
}

// NetCheck: çalışma ortamı — invoke("get_platform_info") → { os, family: "desktop" | "mobile", icmp }
#[tauri::command]
fn get_platform_info() -> platform::PlatformInfo {
    platform::info()
}

mod backend;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| backend::commands::setup(app))
        .invoke_handler(tauri::generate_handler![
            get_network_snapshot,
            run_diagnostic,
            generate_report_id,
            get_platform_info,
            backend::commands::auth_register,
            backend::commands::auth_login,
            backend::commands::auth_logout,
            backend::commands::auth_me,
            backend::commands::user_index,
            backend::commands::user_store,
            backend::commands::user_sync_roles,
            backend::commands::user_sync_permissions,
            backend::commands::user_set_status,
            backend::commands::role_index,
            backend::commands::role_store,
            backend::commands::role_update,
            backend::commands::role_destroy,
            backend::commands::role_sync_permissions,
            backend::commands::permission_index,
            backend::commands::permission_generate,
            backend::commands::crud_resources,
            backend::commands::crud_index,
            backend::commands::crud_show,
            backend::commands::crud_store,
            backend::commands::crud_update,
            backend::commands::crud_destroy,
            backend::commands::crud_destroy_many,
            backend::commands::crud_aggregate,
            backend::commands::db_migrate_status,
            backend::commands::contact_submit,
            backend::domain::report_submit,
            backend::domain::report_show,
            backend::domain::score_rule_publish,
            backend::domain::score_rule_preview,
            backend::domain::report_dashboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
