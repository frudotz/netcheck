//! Migration listesi (sıra önemlidir). Yeni migration: `migrations/` altına bir SQL dosyası ekle ve buraya sona ekle.
use crate::backend::migrate::Migration;

pub const ALL: &[Migration] = &[
    Migration { name: "2026_10_14_000001_create_users_table", sql: include_str!("migrations/2026_10_14_000001_create_users_table.sql") },
    Migration { name: "2026_10_14_000002_create_permission_tables", sql: include_str!("migrations/2026_10_14_000002_create_permission_tables.sql") },
    Migration { name: "2026_10_14_000003_create_common_tables", sql: include_str!("migrations/2026_10_14_000003_create_common_tables.sql") },
    Migration { name: "2026_10_14_000010_create_netcheck_tables", sql: include_str!("migrations/2026_10_14_000010_create_netcheck_tables.sql") },
    Migration { name: "2026_10_14_000020_seed_roles_and_permissions", sql: include_str!("migrations/2026_10_14_000020_seed_roles_and_permissions.sql") },
    Migration { name: "2026_10_14_000030_seed_reference_data", sql: include_str!("migrations/2026_10_14_000030_seed_reference_data.sql") },
];
