//! Genel kaynak denetleyicisinin (Laravel resource controller) veri katmanı.
//!
//! Her tablo bir [`Entity`] tanımıyla anlatılır (`schema.rs`). Sütun adları ön yüzdeki
//! TypeScript tiplerinin alan adlarıyla **birebir aynıdır** (camelCase), böylece bir satır
//! doğrudan o tipe dönüşür. Tablo/sütun adları yalnızca bu statik tanımlardan gelir;
//! kullanıcı girdisi SQL'e değer olarak, her zaman parametreyle bağlanır.
use crate::backend::error::{AppError, AppResult, FieldError};
use crate::backend::util::{new_id, NOW_SQL};
use rusqlite::types::{Value as SqlValue, ValueRef};
use rusqlite::{params_from_iter, Connection, OptionalExtension, Row};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Kind {
    Text,
    Int,
    Real,
    Bool,
    /// JSON metin olarak saklanır, okunurken ayrıştırılır
    Json,
    /// ISO-8601 metin
    Date,
}

#[derive(Debug)]
pub struct Col {
    pub name: &'static str,
    pub kind: Kind,
    pub required: bool,
}

pub const fn col(name: &'static str, kind: Kind) -> Col {
    Col { name, kind, required: false }
}
pub const fn req(name: &'static str, kind: Kind) -> Col {
    Col { name, kind, required: true }
}

#[derive(Debug)]
pub struct Entity {
    /// İzin adlarındaki kaynak adı: `ViewAny:Order`
    pub resource: &'static str,
    pub table: &'static str,
    pub pk: &'static str,
    /// `Kind::Text` (kimlik/kod; verilmezse üretilir) ya da `Kind::Int` (otomatik artan)
    pub pk_kind: Kind,
    /// Birincil anahtar hariç sütunlar
    pub cols: &'static [Col],
    /// `search` ile LIKE taranacak metin sütunları
    pub search: &'static [&'static str],
    /// Süzülebilir sütunlar (tam eşleşme, liste = IN; `<ad>Min` / `<ad>Max` = aralık)
    pub filters: &'static [&'static str],
    /// Varsayılan sıralama (statik ifade), örn. `"createdAt DESC"`
    pub order_by: &'static str,
    /// true ise yalnız okunur (denetim günlüğü gibi)
    pub readonly: bool,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ListQuery {
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub sort: Option<Sort>,
    pub filters: Option<Map<String, Value>>,
}

#[derive(Debug, Deserialize)]
pub struct Sort {
    pub key: String,
    pub dir: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Paged {
    pub items: Vec<Value>,
    pub total: i64,
    pub page: u32,
    pub page_size: u32,
}

fn q(name: &str) -> String {
    format!("\"{}\"", name.replace('"', "\"\""))
}

fn kind_of(e: &Entity, name: &str) -> Option<Kind> {
    if name == e.pk {
        return Some(e.pk_kind);
    }
    e.cols.iter().find(|c| c.name == name).map(|c| c.kind)
}

fn has_filter(e: &Entity, name: &str) -> bool {
    e.filters.iter().any(|f| *f == name)
}

fn select_list(e: &Entity) -> String {
    std::iter::once(e.pk).chain(e.cols.iter().map(|c| c.name)).map(q).collect::<Vec<_>>().join(", ")
}

fn read(r: &Row<'_>, idx: usize, kind: Kind) -> rusqlite::Result<Value> {
    Ok(match (r.get_ref(idx)?, kind) {
        (ValueRef::Null, _) => Value::Null,
        (ValueRef::Integer(i), Kind::Bool) => Value::Bool(i != 0),
        (ValueRef::Integer(i), _) => json!(i),
        (ValueRef::Real(f), _) => json!(f),
        (ValueRef::Text(t), Kind::Json) => {
            let s = String::from_utf8_lossy(t).into_owned();
            serde_json::from_str(&s).unwrap_or(Value::String(s))
        }
        (ValueRef::Text(t), _) => Value::String(String::from_utf8_lossy(t).into_owned()),
        (ValueRef::Blob(_), _) => Value::Null,
    })
}

fn row_to_value(e: &Entity, r: &Row<'_>) -> rusqlite::Result<Value> {
    let mut m = Map::new();
    m.insert(e.pk.to_string(), read(r, 0, e.pk_kind)?);
    for (i, c) in e.cols.iter().enumerate() {
        m.insert(c.name.to_string(), read(r, i + 1, c.kind)?);
    }
    Ok(Value::Object(m))
}

fn bad(field: &str, message: &str) -> FieldError {
    FieldError { field: field.into(), message: message.into() }
}

fn to_sql(field: &str, kind: Kind, v: &Value) -> Result<SqlValue, FieldError> {
    if v.is_null() {
        return Ok(SqlValue::Null);
    }
    match kind {
        Kind::Text | Kind::Date => v.as_str().map(|s| SqlValue::Text(s.to_string())).ok_or_else(|| bad(field, "Metin olmalı.")),
        Kind::Int => v.as_i64().map(SqlValue::Integer).ok_or_else(|| bad(field, "Tam sayı olmalı.")),
        Kind::Real => v.as_f64().map(SqlValue::Real).ok_or_else(|| bad(field, "Sayı olmalı.")),
        Kind::Bool => v.as_bool().map(|b| SqlValue::Integer(b as i64)).ok_or_else(|| bad(field, "true ya da false olmalı.")),
        Kind::Json => serde_json::to_string(v).map(SqlValue::Text).map_err(|_| bad(field, "Geçerli JSON olmalı.")),
    }
}

/// Kimlik değerini (sayı ya da metin gelebilir) birincil anahtar türüne çevirir.
pub fn pk_value(e: &Entity, id: &Value) -> AppResult<SqlValue> {
    match e.pk_kind {
        Kind::Int => match id {
            Value::Number(n) => n.as_i64().map(SqlValue::Integer),
            Value::String(s) => s.trim().parse::<i64>().ok().map(SqlValue::Integer),
            _ => None,
        },
        _ => match id {
            Value::String(s) => Some(SqlValue::Text(s.clone())),
            Value::Number(n) => Some(SqlValue::Text(n.to_string())),
            _ => None,
        },
    }
    .ok_or_else(|| AppError::validation(e.pk, "Kimlik değeri geçersiz."))
}

fn escape_like(s: &str) -> String {
    s.replace('\\', "\\\\").replace('%', "\\%").replace('_', "\\_")
}

fn build_where(e: &Entity, qy: &ListQuery) -> (String, Vec<SqlValue>) {
    let mut wh: Vec<String> = Vec::new();
    let mut args: Vec<SqlValue> = Vec::new();

    if let Some(s) = qy.search.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        if !e.search.is_empty() {
            let like = format!("%{}%", escape_like(s));
            let parts: Vec<String> = e.search.iter().map(|c| format!("{} LIKE ? ESCAPE '\\'", q(c))).collect();
            wh.push(format!("({})", parts.join(" OR ")));
            for _ in e.search {
                args.push(SqlValue::Text(like.clone()));
            }
        }
    }

    if let Some(filters) = &qy.filters {
        for (key, val) in filters {
            // tam eşleşme ya da <ad>Min / <ad>Max
            let (name, op) = if has_filter(e, key) {
                (key.as_str(), "=")
            } else if let Some(b) = key.strip_suffix("Min").filter(|b| has_filter(e, b)) {
                (b, ">=")
            } else if let Some(b) = key.strip_suffix("Max").filter(|b| has_filter(e, b)) {
                (b, "<=")
            } else {
                continue;
            };
            let Some(kind) = kind_of(e, name) else { continue };
            match val {
                Value::Null => wh.push(format!("{} IS NULL", q(name))),
                Value::Array(list) if op == "=" => {
                    let vals: Vec<SqlValue> = list.iter().filter_map(|v| to_sql(name, kind, v).ok()).collect();
                    if vals.is_empty() {
                        continue;
                    }
                    wh.push(format!("{} IN ({})", q(name), vec!["?"; vals.len()].join(", ")));
                    args.extend(vals);
                }
                v => {
                    if let Ok(sv) = to_sql(name, kind, v) {
                        wh.push(format!("{} {} ?", q(name), op));
                        args.push(sv);
                    }
                }
            }
        }
    }

    let clause = if wh.is_empty() { String::new() } else { format!(" WHERE {}", wh.join(" AND ")) };
    (clause, args)
}

/// `index`: arama + süzgeç + sıralama + sayfalama
pub fn list(conn: &Connection, e: &Entity, qy: &ListQuery) -> AppResult<Paged> {
    let (clause, args) = build_where(e, qy);
    let page = qy.page.unwrap_or(1).max(1);
    let page_size = qy.page_size.unwrap_or(25).clamp(1, 100);

    let total: i64 = conn.query_row(&format!("SELECT COUNT(*) FROM {}{}", q(e.table), clause), params_from_iter(args.iter()), |r| r.get(0))?;

    let order = match &qy.sort {
        Some(s) if kind_of(e, &s.key).is_some() => {
            let dir = if s.dir.as_deref().map(|d| d.eq_ignore_ascii_case("desc")).unwrap_or(false) { "DESC" } else { "ASC" };
            format!("{} {}", q(&s.key), dir)
        }
        _ => e.order_by.to_string(),
    };
    let mut all_args = args;
    all_args.push(SqlValue::Integer(page_size as i64));
    all_args.push(SqlValue::Integer(((page - 1) * page_size) as i64));
    let sql = format!("SELECT {} FROM {}{} ORDER BY {} LIMIT ? OFFSET ?", select_list(e), q(e.table), clause, order);
    let mut st = conn.prepare(&sql)?;
    let items = st
        .query_map(params_from_iter(all_args.iter()), |r| row_to_value(e, r))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(Paged { items, total, page, page_size })
}

/// `show`
pub fn find(conn: &Connection, e: &Entity, id: &Value) -> AppResult<Value> {
    let pk = pk_value(e, id)?;
    conn.query_row(
        &format!("SELECT {} FROM {} WHERE {} = ?1", select_list(e), q(e.table), q(e.pk)),
        [&pk],
        |r| row_to_value(e, r),
    )
    .optional()?
    .ok_or_else(|| AppError::NotFound(format!("{} kaydı bulunamadı.", e.resource)))
}

fn ensure_writable(e: &Entity) -> AppResult<()> {
    if e.readonly {
        return Err(AppError::Forbidden(format!("{} salt okunurdur.", e.resource)));
    }
    Ok(())
}

/// `store`
pub fn insert(conn: &Connection, e: &Entity, input: &Value) -> AppResult<Value> {
    ensure_writable(e)?;
    let obj = input.as_object().ok_or_else(|| AppError::validation("_", "Gövde bir nesne olmalı."))?;
    let mut errors: Vec<FieldError> = Vec::new();
    let mut names: Vec<&str> = Vec::new();
    let mut vals: Vec<SqlValue> = Vec::new();

    match obj.get(e.pk).filter(|v| !v.is_null()) {
        Some(v) => {
            names.push(e.pk);
            vals.push(pk_value(e, v)?);
        }
        None if e.pk_kind != Kind::Int => {
            names.push(e.pk);
            vals.push(SqlValue::Text(new_id()));
        }
        None => {}
    }
    for c in e.cols {
        match obj.get(c.name).filter(|v| !v.is_null()) {
            Some(v) => match to_sql(c.name, c.kind, v) {
                Ok(sv) => {
                    names.push(c.name);
                    vals.push(sv);
                }
                Err(fe) => errors.push(fe),
            },
            None if c.required => errors.push(bad(c.name, "Zorunlu alan.")),
            None => {}
        }
    }
    if !errors.is_empty() {
        return Err(AppError::Validation(errors));
    }
    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        q(e.table),
        names.iter().map(|n| q(n)).collect::<Vec<_>>().join(", "),
        vec!["?"; names.len()].join(", ")
    );
    conn.execute(&sql, params_from_iter(vals.iter()))?;
    let id = if e.pk_kind == Kind::Int && !names.contains(&e.pk) {
        json!(conn.last_insert_rowid())
    } else {
        match &vals[0] {
            SqlValue::Integer(i) => json!(i),
            SqlValue::Text(s) => json!(s),
            _ => Value::Null,
        }
    };
    find(conn, e, &id)
}

/// `update` (kısmi: yalnız gönderilen alanlar değişir)
pub fn update(conn: &Connection, e: &Entity, id: &Value, input: &Value) -> AppResult<Value> {
    ensure_writable(e)?;
    let current = find(conn, e, id)?;
    let obj = input.as_object().ok_or_else(|| AppError::validation("_", "Gövde bir nesne olmalı."))?;
    let mut errors: Vec<FieldError> = Vec::new();
    let mut sets: Vec<String> = Vec::new();
    let mut vals: Vec<SqlValue> = Vec::new();
    for c in e.cols {
        let Some(v) = obj.get(c.name) else { continue };
        if v.is_null() && c.required {
            errors.push(bad(c.name, "Zorunlu alan."));
            continue;
        }
        match to_sql(c.name, c.kind, v) {
            Ok(sv) => {
                sets.push(format!("{} = ?", q(c.name)));
                vals.push(sv);
            }
            Err(fe) => errors.push(fe),
        }
    }
    if !errors.is_empty() {
        return Err(AppError::Validation(errors));
    }
    if sets.is_empty() {
        return Ok(current);
    }
    if e.cols.iter().any(|c| c.name == "updatedAt") && !obj.contains_key("updatedAt") {
        sets.push(format!("{} = {}", q("updatedAt"), NOW_SQL));
    }
    vals.push(pk_value(e, id)?);
    let sql = format!("UPDATE {} SET {} WHERE {} = ?", q(e.table), sets.join(", "), q(e.pk));
    conn.execute(&sql, params_from_iter(vals.iter()))?;
    find(conn, e, id)
}

/// `destroy`
pub fn delete(conn: &Connection, e: &Entity, id: &Value) -> AppResult<()> {
    ensure_writable(e)?;
    find(conn, e, id)?;
    conn.execute(&format!("DELETE FROM {} WHERE {} = ?1", q(e.table), q(e.pk)), [&pk_value(e, id)?])?;
    Ok(())
}

/// `deleteAny`
pub fn delete_many(conn: &Connection, e: &Entity, ids: &[Value]) -> AppResult<usize> {
    ensure_writable(e)?;
    let mut n = 0;
    for id in ids {
        n += conn.execute(&format!("DELETE FROM {} WHERE {} = ?1", q(e.table), q(e.pk)), [&pk_value(e, id)?])?;
    }
    Ok(n)
}

/// Panel özeti için gruplu sayım: `[{ value, count }]` (JSON olmayan bir sütuna göre).
pub fn aggregate(conn: &Connection, e: &Entity, group_by: &str, qy: &ListQuery) -> AppResult<Vec<Value>> {
    let kind = kind_of(e, group_by).ok_or_else(|| AppError::validation("groupBy", "Bilinmeyen sütun."))?;
    if kind == Kind::Json {
        return Err(AppError::validation("groupBy", "JSON sütunlar gruplanamaz."));
    }
    let (clause, args) = build_where(e, qy);
    let sql = format!(
        "SELECT {c}, COUNT(*) AS n FROM {t}{w} GROUP BY {c} ORDER BY n DESC",
        c = q(group_by),
        t = q(e.table),
        w = clause
    );
    let mut st = conn.prepare(&sql)?;
    let rows = st
        .query_map(params_from_iter(args.iter()), |r| Ok(json!({ "value": read(r, 0, kind)?, "count": r.get::<_, i64>(1)? })))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}
