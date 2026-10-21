// Uygulama komutlarının tipli hatası (Görev 15). Ön yüze `{ "code": "...", ... }` olarak serileşir;
// düz metin ya da ham Rust hatası dönmez. TypeScript karşılığı: src/lib/types/command.ts
use serde::Serialize;

#[derive(Serialize, Debug, PartialEq, Eq)]
#[serde(tag = "code", rename_all = "snake_case")]
pub enum CommandError {
    /// `run_diagnostic` bilinmeyen bir test türüyle çağrıldı; `value` gelen değerdir.
    UnknownDiagnostic { value: String },
    /// Arka plandaki iş parçacığı tamamlanamadı (panik ya da iptal).
    TaskFailed,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // @lat: [[tests#Commands#Error serialization]]
    #[test]
    fn errors_serialize_with_code() {
        assert_eq!(serde_json::to_value(CommandError::TaskFailed).unwrap(), json!({ "code": "task_failed" }));
        assert_eq!(
            serde_json::to_value(CommandError::UnknownDiagnostic { value: "foo".into() }).unwrap(),
            json!({ "code": "unknown_diagnostic", "value": "foo" })
        );
    }
}
