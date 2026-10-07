// Tanılama raporu kimliği — biçim: NCHK-YYYY-XXXXXXXX
// YYYY: UTC yıl · XXXXXXXX: 8 haneli büyük harf onaltılık sonek.
// Sonek, işlem başına rastgele anahtarlanan `RandomState` ile (zaman ns + sayaç + pid) özetlenir;
// harici `rand` bağımlılığı gerekmez ve yerel raporlar için yeterince benzersizdir.
use std::collections::hash_map::RandomState;
use std::hash::{BuildHasher, Hasher};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

static COUNTER: AtomicU64 = AtomicU64::new(0);
static KEYS: OnceLock<RandomState> = OnceLock::new();

pub fn generate() -> String {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    let mut hasher = KEYS.get_or_init(RandomState::new).build_hasher();
    hasher.write_u128(now.as_nanos());
    hasher.write_u64(COUNTER.fetch_add(1, Ordering::Relaxed));
    hasher.write_u32(std::process::id());
    let suffix = hasher.finish() as u32;
    format!("NCHK-{}-{:08X}", utc_year(now.as_secs()), suffix)
}

/// Unix zamanından UTC yıl (H. Hinnant `civil_from_days` algoritması).
fn utc_year(unix_secs: u64) -> i64 {
    let z = (unix_secs / 86_400) as i64 + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    yoe + era * 400 + i64::from(month <= 2)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn year_boundaries() {
        assert_eq!(utc_year(0), 1970);
        assert_eq!(utc_year(951_782_400), 2000); // 2000-02-29
        assert_eq!(utc_year(1_767_225_599), 2025); // 2025-12-31T23:59:59Z
        assert_eq!(utc_year(1_767_225_600), 2026); // 2026-01-01T00:00:00Z
        assert_eq!(utc_year(1_791_383_897), 2026);
    }

    #[test]
    fn format_is_stable() {
        let id = generate();
        let parts: Vec<&str> = id.split('-').collect();
        assert_eq!(parts.len(), 3, "{id}");
        assert_eq!(parts[0], "NCHK");
        assert_eq!(parts[1].len(), 4);
        assert!(parts[1].chars().all(|c| c.is_ascii_digit()));
        assert_eq!(parts[2].len(), 8);
        assert!(parts[2].chars().all(|c| c.is_ascii_digit() || ('A'..='F').contains(&c)));
    }

    #[test]
    fn ids_are_unique_in_a_burst() {
        let ids: HashSet<String> = (0..10_000).map(|_| generate()).collect();
        assert_eq!(ids.len(), 10_000);
    }
}
