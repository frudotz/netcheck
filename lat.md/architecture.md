# Architecture

NetCheck is a static web frontend inside a Tauri v2 shell; every network operation runs in Rust and reaches the UI through a small IPC contract.

The frontend never touches the network directly. Rust owns network discovery, diagnostics, report identifiers, and all OS-specific behavior.

## IPC contract

The UI uses exactly four Tauri commands, wrapped in [[src/lib/native.ts]]; their names and payload shapes are the frontend–backend contract.

- `get_network_snapshot` → [[src-tauri/src/lib.rs#get_network_snapshot]] returns a [[networking#Network snapshot]].
- `run_diagnostic(kind)` runs one fixed test from [[networking#Diagnostics]]. Unknown `kind` values are rejected by serde, so the frontend cannot choose a target.
- `generate_report_id` returns `NCHK-YYYY-XXXXXXXX` from [[src-tauri/src/report_id.rs#generate]] (see [[decisions#Report IDs come from Rust]]).
- `get_platform_info` returns `{ os, family, icmp }` from [[src-tauri/src/platform/mod.rs#info]] so Settings can show the real platform and ping method.

Snapshot and diagnostics are blocking system calls, so they run on `spawn_blocking` instead of the async runtime thread. The command list is registered in [[src-tauri/src/lib.rs#run]], which also registers the backend commands described in [[architecture#Local SQLite backend]].

## Frontend structure

Astro pages are thin shells that mount Svelte components; shared state and IPC live in `src/lib`.

- **Pages** ([[src/pages]]): `/` overview, `/tanilama` diagnostics, `/rapor?id=` report, `/gecmis` history, `/ayarlar` settings, plus information pages `hakkinda`, `iletisim`, `kosullar`, `gizlilik` in Turkish (root) and under `/en`, `/ar`, `/fa`.
- **Shell:** [[src/layouts/Layout.astro]] with [[src/components/AppHeader.svelte]] and [[src/components/AppNav.svelte]]; information pages use [[src/layouts/InfoLayout.astro]].
- **State:** the diagnostics run store [[src/lib/diagnostics.svelte.ts#diagnostics]], the report store [[src/lib/reports.svelte.ts#reports]], and the theme store [[src/lib/tema.svelte.ts#tema]].
- **Presentation helpers:** labels in [[src/lib/labels.ts]], scoring in [[src/lib/score.ts]], locale helpers in [[src/lib/i18n.ts]].

## Rust modules

The Rust crate separates platform-independent logic from OS-specific code, which may live only under `src-tauri/src/platform/`.

- [[src-tauri/src/network.rs]] — snapshot assembly and the gateway rule.
- [[src-tauri/src/diagnostics.rs]] — the five fixed tests and their outcome model.
- [[src-tauri/src/report_id.rs]] — report identifiers.
- [[src-tauri/src/platform/mod.rs]] — [[src-tauri/src/platform/mod.rs#PlatformInfo]]; [[src-tauri/src/platform/icmp.rs]] ping backends; [[src-tauri/src/platform/device.rs]] device name.
- [[src-tauri/src/backend/mod.rs]] — the local SQLite backend.

Platform selection uses Tauri's `desktop`/`mobile` cfg aliases and `target_os`; see [[decisions#Single platform layer]].

## Diagnostic run data flow

A diagnostics run collects one snapshot and five test outcomes in parallel, then builds and stores a report entirely on the device.

1. `start()` in [[src/lib/diagnostics.svelte.ts#diagnostics]] requests the snapshot and all [[src/lib/diagnostics.svelte.ts#DIAGNOSTIC_KINDS]] concurrently; each outcome updates its row as it arrives.
2. When all finish, it asks Rust for a report ID and computes the score with [[src/lib/score.ts#computeScore]].
3. The report (ID, timestamp, score, pass/fail counts, snapshot, tests) is added to [[src/lib/reports.svelte.ts#reports]] and persisted to `localStorage` (see [[frontend#Reports and history]]).
4. `/rapor?id=` and `/gecmis` read from the same store; nothing leaves the device.

The overview screen runs a lighter quick check (internet + Cloudflare ping) and does not create a report; see [[frontend#Screens]].

## Local SQLite backend

A temporary local backend (migrations, users, roles and permissions, generic CRUD, audit log) is compiled into the app but not called by any current screen.

It was merged in PR #31. [[src-tauri/src/backend/commands.rs#setup]] opens `app.sqlite` in the Tauri app data directory and runs pending migrations from [[src-tauri/src/backend/migrations.rs]] at startup on every platform. Roles and permissions follow the `spatie/laravel-permission` model ([[src-tauri/src/backend/rbac.rs]], [[src-tauri/src/backend/policy.rs]]); changes are recorded by [[src-tauri/src/backend/audit.rs#record]]; passwords use Argon2id ([[src-tauri/src/backend/auth.rs#hash_password]]). The command reference is [[docs/backend.md]].

Domain commands mirror the app's report model: report submission with server-style scoring ([[src-tauri/src/backend/domain.rs#compute_score]]), PII masking ([[src-tauri/src/backend/domain.rs#mask_network]]), score-rule publishing, and dashboard aggregates.

Current-state facts:

- The UI still stores reports only in `localStorage`; no frontend code invokes `auth_*`, `crud_*`, `report_*`, or `contact_submit`. The contact form ([[src/components/IletisimFormu.svelte]]) validates locally and sends nothing.
- The backend score rule duplicates the frontend weights in [[src/lib/score.ts#computeScore]]; the two must be changed together.
- Runtime behavior of the backend on Android and iOS has not been verified (CI only checks that it compiles).
- Unit tests cover email validation, password hashing, scoring, levels, rule validation, and masking ([[tests#Local backend]]). Migrations, RBAC, and the CRUD controllers have no tests on `master`, although [[docs/backend.md]] §8 says they do.
- An admin panel that uses this backend is in open PR #32 and is not part of `master`; see [[tasks#Open work#NC-11 Admin panel on SQLite]].
