# Architecture

NetCheck is a static web frontend inside a Tauri v2 shell; every network operation runs in Rust and reaches the UI through a small IPC contract.

The frontend never touches the network directly. Rust owns network discovery, diagnostics, report identifiers, and all OS-specific behavior.

## IPC contract

The UI uses exactly four Tauri commands, wrapped in [[src/lib/native.ts]]; their names and payload shapes are the frontend–backend contract, documented in [[docs/komutlar.md]].

- `get_network_snapshot` → [[src-tauri/src/lib.rs#get_network_snapshot]] returns a [[networking#Network snapshot]].
- `run_diagnostic(kind)` runs one fixed test from [[networking#Diagnostics]]. `kind` arrives as a string and is parsed into [[src-tauri/src/diagnostics.rs#DiagnosticKind]]; an unknown value becomes a typed error, so the frontend cannot choose a target.
- `generate_report_id` returns `NCHK-YYYY-XXXXXXXX` from [[src-tauri/src/report_id.rs#generate]] (see [[decisions#Report IDs come from Rust]]).
- `get_platform_info` returns `{ os, family, icmp }` from [[src-tauri/src/platform/mod.rs#info]] so Settings can show the real platform and ping method.

Failures are typed: commands return [[src-tauri/src/command_error.rs#CommandError]] (`unknown_diagnostic` with the received value, or `task_failed`), serialized as `{ "code": … }`. `native.ts` rethrows it as `CommandFailure`, and screens show a localized message through `HataDurumu` rather than raw errors. Components call no Tauri API directly (course Task 15). `native.ts` also exposes `platform()` and `destekleniyorMu(ozellik)`, and screens ask the latter instead of checking platform names; the feature table is [[docs/platform-destegi.md]].

The TypeScript side of these payloads is the data contract in [[src/lib/types/index.ts]], one file per main type, with field tables in [[docs/veri-modeli.md]]. Rust's outcome codes are a closed union ([[src/lib/types/diagnostic.ts#DiagnosticCode]]), so a new code must be added to the contract before the UI can show it. One member, `command_failed`, is written only by the frontend: when the `run_diagnostic` call itself fails, [[src/lib/diagnostics.svelte.ts#diagnostics]] marks that test failed with this code so its message still comes from the dictionary.

Snapshot and diagnostics are blocking system calls, so they run on `spawn_blocking` instead of the async runtime thread. The command list is registered in [[src-tauri/src/lib.rs#run]], which also registers the backend commands described in [[architecture#Local SQLite backend]].

## Frontend structure

Astro pages are thin shells that mount Svelte components; shared state and IPC live in `src/lib`.

- **Pages** ([[src/pages]]): `/` overview, `/tanilama` diagnostics, `/rapor?id=` report, `/gecmis` history, `/ayarlar` settings, plus information pages `hakkinda`, `iletisim`, `kosullar`, `gizlilik` in Turkish (root) and under `/en`, `/ar`, `/fa`.
- **Shell:** [[src/layouts/Layout.astro]] with [[src/components/AppHeader.svelte]] and [[src/components/AppNav.svelte]]; information pages use [[src/layouts/InfoLayout.astro]].
- **State:** the diagnostics run store [[src/lib/diagnostics.svelte.ts#diagnostics]], the report store [[src/lib/reports.svelte.ts#reports]], and the theme store [[src/lib/tema.svelte.ts#tema]].
- **Presentation helpers:** labels in [[src/lib/labels.ts]], scoring in [[src/lib/score.ts]], locale helpers in [[src/lib/i18n.ts]].
- **Admin panel:** eleven `/admin` pages with their own shell; see [[architecture#Admin panel]].

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

A temporary local backend (migrations, users, roles and permissions, generic CRUD, audit log) is compiled into the app; since PR #48 the admin panel is its only caller, through [[src/lib/native.ts#invokeAdmin]].

It was merged in PR #31. [[src-tauri/src/backend/commands.rs#setup]] opens `app.sqlite` in the Tauri app data directory and runs pending migrations from [[src-tauri/src/backend/migrations.rs]] at startup on every platform. Roles and permissions follow the `spatie/laravel-permission` model ([[src-tauri/src/backend/rbac.rs]], [[src-tauri/src/backend/policy.rs]]); changes are recorded by [[src-tauri/src/backend/audit.rs#record]]; passwords use Argon2id ([[src-tauri/src/backend/auth.rs#hash_password]]). The command reference is [[docs/backend.md]].

Domain commands mirror the app's report model: report submission with server-style scoring ([[src-tauri/src/backend/domain.rs#compute_score]]), PII masking ([[src-tauri/src/backend/domain.rs#mask_network]]), score-rule publishing, and dashboard aggregates.

Current-state facts:

- The app's own screens still store reports only in `localStorage` and invoke none of these commands. The contact form ([[src/components/IletisimFormu.svelte]]) validates locally and sends nothing; `contact_submit` and `report_submit` exist in code with input bounds but are not registered as Tauri commands until a screen needs them ([[src-tauri/src/lib.rs]]).
- Every authorization goes through [[src-tauri/src/backend/policy.rs#authorize]], which also requires the session user to be `active`; a suspended or banned user loses the open session at once. The session itself lives in [[src-tauri/src/backend/state.rs#AppState]] with a 30-minute idle timeout and a 12-hour absolute lifetime enforced on every `user()` lookup, so an expired session cannot invoke protected commands and `auth_me` returns null. Sign-in is rate limited per e-mail in the same state (5 failures in 15 minutes lock the e-mail for 15 minutes, `too_many_attempts`); the limiter is in-process and resets with the app, stores no passwords, and does not apply to first-admin registration. Granting or removing the super-admin role, changing a super admin's status, permissions or password, and changing one's own roles or status are reserved to super admins; the last active super admin cannot be demoted or suspended ([[src-tauri/src/backend/controllers.rs]]). Case and whitespace variants of `admin` are reserved: they cannot be created or renamed to, and count as the super-admin role in role assignment ([[src-tauri/src/backend/rbac.rs#is_reserved_role_name]]).
- Each mutating command runs in one SQLite transaction with its audit row (`Db::transaction` in [[src-tauri/src/backend/db.rs]]); a failed audit insert rolls the change back. Generic CRUD is bounded by [[src-tauri/src/backend/domain.rs#write_policy]]: reports accept only `shared` and are never created from the panel, published score rules are immutable and rule JSON is validated on every write, message replies are built only by `contact_message_reply`, device counters are backend-owned, and `DiagnosticTarget` is read-only ([[src-tauri/src/backend/schema.rs#DIAGNOSTIC_TARGET]]) because the app's targets are Rust constants that this table never feeds ([[decisions#Fixed targets, enum-only IPC]]).
- Reports are masked by default everywhere ([[src-tauri/src/backend/domain.rs#mask_network]]); [[src-tauri/src/backend/domain.rs#do_report_reveal_field]] opens one field under `Reveal:PII` and audits it; [[src-tauri/src/backend/domain.rs#do_export_authorize]] gates CSV and print exports behind `Export:Report` and audits them; [[src-tauri/src/backend/domain.rs#do_device_purge]] deletes a device with its reports atomically.
- The backend score rule duplicates the frontend weights in [[src/lib/score.ts#computeScore]]; the two must be changed together.
- Runtime behavior of the backend on Android and iOS has not been verified (CI only checks that it compiles).
- Tests: five pure-rule tests plus 29 controller tests on a migrated in-memory database with a pinned clock ([[tests#Local backend]]). The packaged Windows app was driven over CDP against a throwaway database for the ten end-to-end scenarios recorded in [[docs/istemler/pr32-backend-hardening.md]] and the follow-up scenarios in [[docs/istemler/backend-security-followups.md]].
- The admin panel in [[admin]] is the only caller ([[architecture#Admin panel]]). The connection was merged in PR #48 (`9c74c34`) on the owner's decision; the instructor's course-scope answer C-3 is still pending and is tracked in [[tasks#Open work#NC-16 Conflicting course requirements]], not implied by the merge.

## Admin panel

A React admin panel, moved from the separate AI Studio repository at the instructor's request, lives in [[admin]] and is rendered as eleven static `/admin` pages; inside the Tauri app it uses the local SQLite backend over IPC behind a local sign-in.

[[src/pages/admin/index.astro]] and [[src/pages/admin/[gorunum].astro]] pass a screen name from [[admin/yol.ts#Gorunum]] to [[admin/App.tsx]] inside [[src/layouts/AdminLayout.astro]], a shell separate from the app's. Navigation is plain links between pages; a report is addressed as `/admin/rapor?id=` for the same static-build reason as the app's report page.

- **Data path:** [[admin/api/index.ts#api]] implements [[admin/api/index.ts#AdminApi]] and [[admin/api/index.ts#auth]] implements [[admin/api/index.ts#AuthApi]], both only through [[src/lib/native.ts#invokeAdmin]]; no component invokes IPC directly. Messages, audit logs and devices are paged by the backend (`crud_index` with search, filters and sort) when every filter is a backend column; reports and JSON-field filters still load the masked list and filter in the panel ([[tasks#Open work#NC-21 Report list filters in the backend]]). [[admin/api/index.ts#bagli]] is `hasNative()`, so in the browser preview every method rejects with [[admin/api/index.ts#PanelBagliDegil]] and `App.tsx` renders [[admin/components/BagliDegil.tsx#BagliDegil]] instead of the data screens. Only Settings ([[admin/yol.ts#YEREL_GORUNUMLER]]) works without IPC or a session.
- **Session and visibility:** [[admin/context/AdminAuthContext.tsx#AdminAuthProvider]] mirrors the backend's single local session (`auth_me`); [[admin/context/AdminAuthContext.tsx#AdminAuthBoundary]] shows first-admin setup, sign-in, "no role" and error states. Menu entries and screens follow [[admin/yol.ts#EKRAN_IZNI]] through `can()`, and the CSV and print buttons appear only with `Export:Report`; all of this is UX only, because every command is authorized again in Rust ([[architecture#Local SQLite backend]]). Backend error codes are shown through the dictionaries, never as raw messages.
- **Privacy in the panel:** reports arrive masked; [[admin/components/MaskedValue.tsx#MaskedValue]] shows only the value that `report_reveal_field` returns for that one field, and reloading the page shows masks again. Exports call `export_authorize` first. Replies are created by `contact_message_reply`, device deletion by `device_purge`, and new users need a temporary password (`user_store`); e-mail and password changes are not editable from the panel. The Hedefler screen is read-only and says why.
- **Shared preferences:** theme and language use the app's `localStorage` keys and values (`tema`, `dil`), so a choice made in either place applies to both; table density is panel-only.
- **Colors:** [[admin/styles/admin.css]] imports Tailwind with its default palette disabled and maps color utilities to the `app.css` tokens (plus `--renk-koyu-yazi` for the dark top bar). The app's CSS is unchanged by Tailwind; [[decisions#Admin panel on the local backend]] records why.
- **Text and types:** all visible text comes from `admin/i18n` (`tr.ts` is the source; the `Translations` type enforces the same keys in `en`, `ar`, `fa`); test names, connection types, dates and result messages reuse [[src/lib/sozluk.ts#sozluk]]. Core types are imported from [[src/lib/types/index.ts]]; only panel entities live in [[admin/domain/types.ts]].
