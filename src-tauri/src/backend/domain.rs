//! NetCheck iş işlevleri: Bağlantı Skoru, rapor kaydı, skor kuralı yayını, panel özeti, hassas alan maskeleme.
//! Skor kuralı `src/lib/score.ts` ile aynıdır; ağırlıklar ve bantlar `score_rules` tablosundan gelir.
use crate::backend::audit;
use crate::backend::crud;
use crate::backend::error::{AppError, AppResult};
use crate::backend::policy::authorize;
use crate::backend::schema;
use crate::backend::state::AppState;
use crate::backend::util::{now_iso, NOW_SQL};
use rusqlite::{params, Connection, OptionalExtension};
use serde::Deserialize;
use serde_json::{json, Map, Value};
use tauri::State;

pub const KINDS: [&str; 5] = ["gateway", "cloudflare", "google", "dns", "internet"];

#[derive(Debug, Clone, Deserialize)]
pub struct Weights {
    pub internet: i64,
    pub dns: i64,
    pub gateway: i64,
    pub cloudflare: i64,
    pub google: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Band {
    pub max_ms: Option<f64>,
    pub bonus: i64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Levels {
    pub iyi: i64,
    pub orta: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Rule {
    pub version: i64,
    pub weights: Weights,
    pub latency_bands: Vec<Band>,
    pub levels: Levels,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestResult {
    pub id: String,
    pub status: String,
    pub latency_ms: Option<f64>,
}

impl Weights {
    fn of(&self, kind: &str) -> i64 {
        match kind {
            "internet" => self.internet,
            "dns" => self.dns,
            "gateway" => self.gateway,
            "cloudflare" => self.cloudflare,
            "google" => self.google,
            _ => 0,
        }
    }
    fn total(&self) -> i64 {
        self.internet + self.dns + self.gateway + self.cloudflare + self.google
    }
}

/// Bağlantı Skoru: başarılı testlerin ağırlıkları + gecikme bonusu (en çok 100).
pub fn compute_score(tests: &[TestResult], rule: &Rule) -> i64 {
    let base: i64 = tests.iter().filter(|t| t.status == "success").map(|t| rule.weights.of(&t.id)).sum();
    let samples: Vec<f64> = tests
        .iter()
        .filter(|t| (t.id == "cloudflare" || t.id == "google") && t.status == "success")
        .filter_map(|t| t.latency_ms)
        .collect();
    let bonus = if samples.is_empty() {
        0
    } else {
        let avg = samples.iter().sum::<f64>() / samples.len() as f64;
        rule.latency_bands
            .iter()
            .find(|b| b.max_ms.map(|m| avg < m).unwrap_or(false))
            .or_else(|| rule.latency_bands.last())
            .map(|b| b.bonus)
            .unwrap_or(0)
    };
    (base + bonus).min(100)
}

pub fn score_level(score: i64, rule: &Rule) -> &'static str {
    if score >= rule.levels.iyi {
        "iyi"
    } else if score >= rule.levels.orta {
        "orta"
    } else {
        "zayif"
    }
}

fn parse_rule(version: i64, weights: String, bands: String, levels: String) -> AppResult<Rule> {
    Ok(Rule {
        version,
        weights: serde_json::from_str(&weights)?,
        latency_bands: serde_json::from_str(&bands)?,
        levels: serde_json::from_str(&levels)?,
    })
}

/// Geçerli (yayınlanmış en yüksek sürüm) kural.
pub fn current_rule(conn: &Connection) -> AppResult<Rule> {
    let row: Option<(i64, String, String, String)> = conn
        .query_row(
            "SELECT version, weights, latencyBands, levels FROM score_rules WHERE status = 'published' ORDER BY version DESC LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )
        .optional()?;
    let (v, w, b, l) = row.ok_or_else(|| AppError::NotFound("Yayınlanmış skor kuralı yok.".into()))?;
    parse_rule(v, w, b, l)
}

fn rule_by_version(conn: &Connection, version: i64) -> AppResult<Rule> {
    let row: Option<(i64, String, String, String)> = conn
        .query_row("SELECT version, weights, latencyBands, levels FROM score_rules WHERE version = ?1", [version], |r| {
            Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))
        })
        .optional()?;
    let (v, w, b, l) = row.ok_or_else(|| AppError::NotFound("Skor kuralı bulunamadı.".into()))?;
    parse_rule(v, w, b, l)
}

/// Kural doğrulaması: ağırlıklar toplamı 90, bantlar artan, eşikler sıralı.
pub fn validate_rule(rule: &Rule) -> AppResult<()> {
    let mut errs = Vec::new();
    if rule.weights.total() != 90 {
        errs.push(crate::backend::error::FieldError { field: "weights".into(), message: format!("Ağırlıklar toplamı 90 olmalı (şimdi {}).", rule.weights.total()) });
    }
    let mut last = f64::MIN;
    for (i, b) in rule.latency_bands.iter().enumerate() {
        match b.max_ms {
            Some(m) if m > last => last = m,
            Some(_) => errs.push(crate::backend::error::FieldError { field: "latencyBands".into(), message: "Gecikme eşikleri artan olmalı.".into() }),
            None if i + 1 != rule.latency_bands.len() => errs.push(crate::backend::error::FieldError { field: "latencyBands".into(), message: "Üst sınırsız (null) satır sonda olmalı.".into() }),
            None => {}
        }
    }
    if rule.levels.iyi <= rule.levels.orta {
        errs.push(crate::backend::error::FieldError { field: "levels".into(), message: "İyi eşiği Orta eşiğinden büyük olmalı.".into() });
    }
    if errs.is_empty() { Ok(()) } else { Err(AppError::Validation(errs)) }
}

/// Rapor kimliği biçimi: NCHK-YYYY-XXXXXXXX
pub fn is_report_id(s: &str) -> bool {
    let p: Vec<&str> = s.split('-').collect();
    p.len() == 3 && p[0] == "NCHK" && p[1].len() == 4 && p[1].chars().all(|c| c.is_ascii_digit()) && p[2].len() == 8 && p[2].chars().all(|c| matches!(c, '0'..='9' | 'A'..='F'))
}

/// IP, MAC ve ana bilgisayar adı gibi hassas ağ alanlarını maskeler.
pub fn mask_network(v: &Value) -> Value {
    const SENSITIVE: [&str; 7] = ["hostname", "localIPv4", "localIPv6", "gateway", "ipv4", "ipv6", "mac"];
    match v {
        Value::Object(m) => {
            let mut out = Map::new();
            for (k, val) in m {
                if SENSITIVE.contains(&k.as_str()) && val.is_string() {
                    out.insert(k.clone(), json!("••••"));
                } else if k == "dnsServers" && val.is_array() {
                    out.insert(k.clone(), json!(val.as_array().map(|a| a.iter().map(|_| "••••").collect::<Vec<_>>()).unwrap_or_default()));
                } else {
                    out.insert(k.clone(), mask_network(val));
                }
            }
            Value::Object(out)
        }
        Value::Array(a) => Value::Array(a.iter().map(mask_network).collect()),
        other => other.clone(),
    }
}

fn touch_device(conn: &Connection, id: &str, platform: &Value, app_version: &str, locale: &str) -> AppResult<()> {
    conn.execute(
        &format!(
            "INSERT INTO devices (id, platform, appVersion, locale, lastSeenAt, reportCount) VALUES (?1, ?2, ?3, ?4, {NOW_SQL}, 1)
             ON CONFLICT(id) DO UPDATE SET lastSeenAt = {NOW_SQL}, reportCount = reportCount + 1, appVersion = excluded.appVersion"
        ),
        params![id, platform.to_string(), app_version, locale],
    )?;
    Ok(())
}

/// Cihazdan gelen rapor (oturum gerekmez). `input`: `{ network, tests, createdAt?, shared?, device?: { id, platform, appVersion, locale } }`
/// Kimliği Rust üretir (`report_id::generate`), skoru geçerli kuraldan hesaplar.
pub fn do_report_submit(app: &AppState, input: &Value) -> AppResult<Value> {
    let tests_v = input.get("tests").cloned().unwrap_or(Value::Null);
    let tests: Vec<TestResult> = serde_json::from_value(tests_v.clone()).map_err(|_| AppError::validation("tests", "Test listesi geçerli değil."))?;
    if tests.len() != 5 || !KINDS.iter().all(|k| tests.iter().any(|t| t.id == *k)) {
        return Err(AppError::validation("tests", "Raporda beş testin hepsi (gateway, cloudflare, google, dns, internet) olmalı."));
    }
    if !tests.iter().all(|t| ["pending", "running", "success", "failed", "unavailable"].contains(&t.status.as_str())) {
        return Err(AppError::validation("tests", "Test durumu geçersiz."));
    }
    let network = input.get("network").filter(|n| n.is_object()).cloned().ok_or_else(|| AppError::validation("network", "Ağ bilgisi gerekli."))?;
    app.db.with(|c| {
        let rule = current_rule(c)?;
        let score = compute_score(&tests, &rule);
        let passed = tests.iter().filter(|t| t.status == "success").count() as i64;
        let id = crate::report_id::generate();
        let mut device_id: Option<String> = None;
        if let Some(d) = input.get("device").filter(|d| d.is_object()) {
            let did = d.get("id").and_then(Value::as_str).ok_or_else(|| AppError::validation("device.id", "Cihaz kimliği gerekli."))?;
            touch_device(c, did, d.get("platform").unwrap_or(&json!({})), d.get("appVersion").and_then(Value::as_str).unwrap_or("0.0.0"), d.get("locale").and_then(Value::as_str).unwrap_or("tr"))?;
            device_id = Some(did.to_string());
        }
        let created = input.get("createdAt").and_then(Value::as_str).map(str::to_string).map(Ok).unwrap_or_else(|| now_iso(c))?;
        let rec = json!({
            "id": id, "createdAt": created, "score": score, "passed": passed, "failed": 5 - passed,
            "network": network, "tests": tests_v, "deviceId": device_id,
            "shared": input.get("shared").and_then(Value::as_bool).unwrap_or(true), "ruleVersion": rule.version,
        });
        crud::insert(c, &schema::REPORT, &rec)
    })
}

/// Bir raporu gösterir; hassas alanlar varsayılan maskelidir. `reveal` için `Reveal:PII` gerekir ve denetim kaydına yazılır.
pub fn do_report_show(app: &AppState, id: &str, reveal: bool) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "View:Report")?;
        let mut r = crud::find(c, &schema::REPORT, &json!(id))?;
        if reveal {
            authorize(c, app.user(), "Reveal:PII")?;
            audit::record(c, Some(uid), "pii.reveal", "Report", id, None, None, None)?;
        } else if let Some(n) = r.get("network").cloned() {
            r["network"] = mask_network(&n);
        }
        Ok(r)
    })
}

pub fn do_report_set_sharing(app: &AppState, id: &str, shared: bool, reason: Option<&str>) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "Update:Report")?;
        let before = crud::find(c, &schema::REPORT, &json!(id))?;
        let mut after = crud::update(c, &schema::REPORT, &json!(id), &json!({ "shared": shared }))?;
        audit::record(
            c,
            Some(uid),
            if shared { "report.enable_sharing" } else { "report.disable_sharing" },
            "Report",
            id,
            reason,
            Some(&json!({ "shared": before["shared"] })),
            Some(&json!({ "shared": after["shared"] })),
        )?;
        if let Some(network) = after.get("network").cloned() {
            after["network"] = mask_network(&network);
        }
        Ok(after)
    })
}

/// Taslak kuralı yayınlar (`Publish:ScoreRule`). Eski raporlar kendi `ruleVersion` değerini korur.
pub fn do_score_rule_publish(app: &AppState, version: i64, note: Option<&str>) -> AppResult<Value> {
    app.db.with(|c| {
        let uid = authorize(c, app.user(), "Publish:ScoreRule")?;
        let rule = rule_by_version(c, version)?;
        validate_rule(&rule)?;
        let before = crud::find(c, &schema::SCORE_RULE, &json!(version))?;
        c.execute(
            &format!("UPDATE score_rules SET status = 'published', publishedAt = {NOW_SQL}, note = COALESCE(?2, note) WHERE version = ?1"),
            params![version, note],
        )?;
        let after = crud::find(c, &schema::SCORE_RULE, &json!(version))?;
        audit::record(c, Some(uid), "ScoreRule.publish", "ScoreRule", &version.to_string(), note, Some(&before), Some(&after))?;
        Ok(after)
    })
}

/// Kuralı seçili raporlarda dener: `[{ id, oldScore, newScore, oldLevel, newLevel }]`
pub fn do_score_rule_preview(app: &AppState, version: i64, report_ids: &[String]) -> AppResult<Vec<Value>> {
    app.db.with(|c| {
        authorize(c, app.user(), "ViewAny:ScoreRule")?;
        let rule = rule_by_version(c, version)?;
        let mut out = Vec::new();
        for id in report_ids {
            let r = crud::find(c, &schema::REPORT, &json!(id))?;
            let tests: Vec<TestResult> = serde_json::from_value(r["tests"].clone())?;
            let old = r["score"].as_i64().unwrap_or(0);
            let new = compute_score(&tests, &rule);
            out.push(json!({ "id": id, "oldScore": old, "newScore": new, "oldLevel": score_level(old, &rule), "newLevel": score_level(new, &rule) }));
        }
        Ok(out)
    })
}

/// Panel özeti: toplam, ortalama skor, seviye dağılımı, test başarı oranları, platform dağılımı, günlük eğilim.
pub fn do_report_dashboard(app: &AppState, from: Option<&str>, to: Option<&str>) -> AppResult<Value> {
    app.db.with(|c| {
        authorize(c, app.user(), "ViewAny:Report")?;
        let rule = current_rule(c)?;
        let (lo, hi) = (from.unwrap_or("0000"), to.unwrap_or("9999"));
        let (total, avg): (i64, Option<f64>) =
            c.query_row("SELECT COUNT(*), AVG(score) FROM reports WHERE createdAt >= ?1 AND createdAt <= ?2", params![lo, hi], |r| Ok((r.get(0)?, r.get(1)?)))?;
        let (mut iyi, mut orta, mut zayif) = (0, 0, 0);
        {
            let mut st = c.prepare("SELECT score FROM reports WHERE createdAt >= ?1 AND createdAt <= ?2")?;
            for s in st.query_map(params![lo, hi], |r| r.get::<_, i64>(0))? {
                match score_level(s?, &rule) {
                    "iyi" => iyi += 1,
                    "orta" => orta += 1,
                    _ => zayif += 1,
                }
            }
        }
        let mut test_rates = Map::new();
        for k in KINDS {
            let (n, ok): (i64, i64) = c.query_row(
                "SELECT COUNT(*), COALESCE(SUM(CASE WHEN json_extract(t.value, '$.status') = 'success' THEN 1 ELSE 0 END), 0)
                 FROM reports r, json_each(r.tests) t
                 WHERE json_extract(t.value, '$.id') = ?1 AND r.createdAt >= ?2 AND r.createdAt <= ?3",
                params![k, lo, hi],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )?;
            test_rates.insert(k.to_string(), json!({ "total": n, "success": ok, "rate": if n == 0 { 0.0 } else { ok as f64 / n as f64 } }));
        }
        let platforms: Vec<Value> = {
            let mut st = c.prepare(
                "SELECT COALESCE(json_extract(d.platform, '$.os'), 'bilinmiyor') AS os, COUNT(*) FROM reports r
                 LEFT JOIN devices d ON d.id = r.deviceId WHERE r.createdAt >= ?1 AND r.createdAt <= ?2 GROUP BY os ORDER BY COUNT(*) DESC",
            )?;
            let rows = st.query_map(params![lo, hi], |r| Ok(json!({ "os": r.get::<_, String>(0)?, "count": r.get::<_, i64>(1)? })))?;
            rows.collect::<Result<Vec<_>, _>>()?
        };
        let trend: Vec<Value> = {
            let mut st = c.prepare(
                "SELECT substr(createdAt, 1, 10) AS day, COUNT(*), AVG(score) FROM reports WHERE createdAt >= ?1 AND createdAt <= ?2 GROUP BY day ORDER BY day",
            )?;
            let rows = st.query_map(params![lo, hi], |r| Ok(json!({ "day": r.get::<_, String>(0)?, "count": r.get::<_, i64>(1)?, "avgScore": r.get::<_, f64>(2)? })))?;
            rows.collect::<Result<Vec<_>, _>>()?
        };
        Ok(json!({
            "total": total, "avgScore": avg, "levels": { "iyi": iyi, "orta": orta, "zayif": zayif },
            "thresholds": { "iyi": rule.levels.iyi, "orta": rule.levels.orta },
            "testRates": test_rates, "platforms": platforms, "trend": trend, "ruleVersion": rule.version,
        }))
    })
}

// ───────────────────────── Tauri komutları ─────────────────────────

#[tauri::command]
pub fn report_submit(state: State<'_, AppState>, input: Value) -> AppResult<Value> {
    do_report_submit(&state, &input)
}
#[tauri::command]
pub fn report_show(state: State<'_, AppState>, id: String, reveal: Option<bool>) -> AppResult<Value> {
    do_report_show(&state, &id, reveal.unwrap_or(false))
}
#[tauri::command]
pub fn report_set_sharing(state: State<'_, AppState>, id: String, shared: bool, reason: Option<String>) -> AppResult<Value> {
    do_report_set_sharing(&state, &id, shared, reason.as_deref())
}
#[tauri::command]
pub fn score_rule_publish(state: State<'_, AppState>, version: i64, note: Option<String>) -> AppResult<Value> {
    do_score_rule_publish(&state, version, note.as_deref())
}
#[tauri::command]
pub fn score_rule_preview(state: State<'_, AppState>, version: i64, report_ids: Vec<String>) -> AppResult<Vec<Value>> {
    do_score_rule_preview(&state, version, &report_ids)
}
#[tauri::command]
pub fn report_dashboard(state: State<'_, AppState>, from: Option<String>, to: Option<String>) -> AppResult<Value> {
    do_report_dashboard(&state, from.as_deref(), to.as_deref())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rule() -> Rule {
        serde_json::from_value(json!({
            "version": 1,
            "weights": { "internet": 35, "dns": 20, "gateway": 15, "cloudflare": 10, "google": 10 },
            "latencyBands": [{ "maxMs": 50, "bonus": 10 }, { "maxMs": 100, "bonus": 7 }, { "maxMs": 200, "bonus": 4 }, { "maxMs": null, "bonus": 1 }],
            "levels": { "iyi": 80, "orta": 50 }
        }))
        .unwrap()
    }
    fn t(id: &str, ok: bool, ms: Option<f64>) -> TestResult {
        TestResult { id: id.into(), status: if ok { "success".into() } else { "failed".into() }, latency_ms: ms }
    }

    // @lat: [[tests#Local backend#Score vectors]]
    #[test]
    fn score_vectors() {
        let all = vec![t("gateway", true, Some(3.0)), t("cloudflare", true, Some(18.0)), t("google", true, Some(21.0)), t("dns", true, Some(12.0)), t("internet", true, Some(96.0))];
        assert_eq!(compute_score(&all, &rule()), 100); // 90 + 10 bonus, üst sınır 100
        let slow = vec![t("gateway", true, None), t("cloudflare", true, Some(150.0)), t("google", true, Some(170.0)), t("dns", true, None), t("internet", true, None)];
        assert_eq!(compute_score(&slow, &rule()), 94); // 90 + 4
        let offline: Vec<TestResult> = KINDS.iter().map(|k| t(k, false, None)).collect();
        assert_eq!(compute_score(&offline, &rule()), 0);
        let only_internet = vec![t("internet", true, None)];
        assert_eq!(compute_score(&only_internet, &rule()), 35);
    }

    // @lat: [[tests#Local backend#Levels and report IDs]]
    #[test]
    fn levels_and_ids() {
        let r = rule();
        assert_eq!(score_level(80, &r), "iyi");
        assert_eq!(score_level(79, &r), "orta");
        assert_eq!(score_level(49, &r), "zayif");
        assert!(is_report_id("NCHK-2026-3F9A0C71"));
        assert!(!is_report_id("NCHK-2026-3f9a0c71"));
        assert!(!is_report_id("nchk-2026-3F9A0C71"));
    }

    // @lat: [[tests#Local backend#Rule validation and masking]]
    #[test]
    fn rule_validation_and_masking() {
        let mut r = rule();
        assert!(validate_rule(&r).is_ok());
        r.weights.dns = 30;
        assert!(validate_rule(&r).is_err());
        let masked = mask_network(&json!({ "hostname": "a", "dnsServers": ["1.1.1.1"], "interfaces": [{ "mac": "AA", "name": "Wi-Fi" }] }));
        assert_eq!(masked["hostname"], "••••");
        assert_eq!(masked["dnsServers"][0], "••••");
        assert_eq!(masked["interfaces"][0]["mac"], "••••");
        assert_eq!(masked["interfaces"][0]["name"], "Wi-Fi");
    }
}
