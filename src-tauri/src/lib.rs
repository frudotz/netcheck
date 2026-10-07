use std::time::{SystemTime, UNIX_EPOCH};

mod diagnostics;
mod network;

// Adım 11: Rust komutu — ön yüz invoke("bilet_olustur", { etkinlikId }) ile çağırır
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn bilet_olustur(etkinlik_id: u32) -> String {
    let zaman = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("PSK-{:03}-{:07X}", etkinlik_id, zaman % 0xFFF_FFFF)
}

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![bilet_olustur, get_network_snapshot, run_diagnostic])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
