//! İzin (yetki) yüzeyi — qLar deseninden damıtıldı.
//!
//! `permissions_status`: durumu döner ve ASLA sistem diyaloğu açmaz
//! ("snapshot never prompts"). `permission_request`: OS diyaloğunu açar.
//! Gerçek izin: bildirim (notification), beş native hedefte çalışır.

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_notification::{NotificationExt, PermissionState};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PermissionSnapshot {
    pub id: String,
    pub title: String,
    /// "granted" | "denied" | "prompt" | "unsupported" | "unknown"
    pub status: String,
    pub can_request: bool,
    pub notes: String,
}

fn notification_status(state: PermissionState) -> (&'static str, bool) {
    match state {
        PermissionState::Granted => ("granted", false),
        PermissionState::Denied => ("denied", false),
        _ => ("prompt", true),
    }
}

fn snapshot<R: tauri::Runtime>(app: &AppHandle<R>) -> Vec<PermissionSnapshot> {
    let (status, can_request) = match app.notification().permission_state() {
        Ok(state) => notification_status(state),
        Err(_) => ("unknown", false),
    };
    let out = vec![PermissionSnapshot {
        id: "notification".into(),
        title: "Bildirimler".into(),
        status: status.into(),
        can_request,
        notes: "Ağ bağlantısı durumu bildirimi".into(),
    }];
    out
}

/// Durumu döner; asla diyalog açmaz.
#[tauri::command]
pub fn permissions_status<R: tauri::Runtime>(app: AppHandle<R>) -> Vec<PermissionSnapshot> {
    snapshot(&app)
}

/// İlgili izin için OS diyaloğunu açar, sonra güncel durumu döner.
#[tauri::command]
pub fn permission_request<R: tauri::Runtime>(
    app: AppHandle<R>,
    id: String,
) -> Result<Vec<PermissionSnapshot>, String> {
    match id.as_str() {
        "notification" => {
            app.notification()
                .request_permission()
                .map_err(|e| e.to_string())?;
            Ok(snapshot(&app))
        }
        other => Err(format!("bu izin çalışma zamanında istenemiyor: {other}")),
    }
}

/// Uygulamanın gerçek bildirim kullanımı.
#[tauri::command]
pub fn bildirim_gonder<R: tauri::Runtime>(
    app: AppHandle<R>,
    baslik: String,
    govde: String,
) -> Result<(), String> {
    app.notification()
        .builder()
        .title(baslik)
        .body(govde)
        .show()
        .map_err(|e| e.to_string())
}
