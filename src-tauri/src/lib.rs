mod command_error;
mod diagnostics;
mod network;
mod platform;
mod report_id;

use command_error::CommandError;

// NetCheck: ağ anlık görüntüsü — invoke("get_network_snapshot")
// Sistem çağrıları engelleyici olduğu için ana thread dışında çalıştırılır.
// Hata tiplidir (CommandError); ayrıntı: docs/komutlar.md
#[tauri::command]
async fn get_network_snapshot() -> Result<network::NetworkSnapshot, CommandError> {
    tauri::async_runtime::spawn_blocking(network::snapshot)
        .await
        .map_err(|_| CommandError::TaskFailed)
}

// NetCheck: tek bir tanılama testi — invoke("run_diagnostic", { kind: "gateway" | "cloudflare" | "google" | "dns" | "internet" })
// Hedefler Rust'ta sabittir; bilinmeyen `kind` panik değil `unknown_diagnostic` hatası döner.
#[tauri::command]
async fn run_diagnostic(kind: String) -> Result<diagnostics::DiagnosticOutcome, CommandError> {
    let kind: diagnostics::DiagnosticKind = kind.parse()?;
    tauri::async_runtime::spawn_blocking(move || diagnostics::run(kind))
        .await
        .map_err(|_| CommandError::TaskFailed)
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
            backend::commands::auth_setup_required,
            backend::commands::contact_message_assignees,
            backend::commands::contact_message_reply,
            backend::commands::user_index,
            backend::commands::user_store,
            backend::commands::user_sync_roles,
            backend::commands::user_sync_permissions,
            backend::commands::user_set_status,
            backend::commands::user_set_password,
            backend::commands::user_update,
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
            // `contact_submit` ve `report_submit` oturumsuz yazma uçlarıdır; hiçbir ekran kullanmadığı için kayıtlı değil.
            backend::domain::report_show,
            backend::domain::report_reveal_field,
            backend::domain::export_authorize,
            backend::domain::device_purge,
            backend::domain::report_set_sharing,
            backend::domain::score_rule_publish,
            backend::domain::score_rule_preview,
            backend::domain::report_dashboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
