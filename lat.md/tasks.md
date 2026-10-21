# Tasks

Delivery status and the prioritized backlog; each item has an ID, priority, status, dependencies, and acceptance criteria tied to evidence.

## Conventions

Task fields and status values used below; owners, deadlines, and estimates are deliberately not recorded.

- **ID:** `NC-NN`, stable once assigned; never reused.
- **Priority:** P1 blocks a correct or verifiable release, P2 is important but not blocking, P3 is minor polish. Priorities are proposed from impact and should be confirmed by the project owner.
- **Status:** `done` (merged, with evidence), `in progress` (open branch or PR, or partial results), `blocked` (needs a missing prerequisite), `planned` (not started), `deferred` (known and accepted for now; not reopened without a decision).
- **Evidence** follows [[platforms#Evidence levels]]; a task is `done` only at the evidence level its acceptance criteria name.

## Done

Recently completed work, kept so that open items can reference it.

### NC-01 Responsive layout system

One shell for phone, tablet, desktop, and TV, driven by available size ([[frontend#Responsive layout]]).

- Priority P2 · Status `done` · Evidence: PR #30, merge `a592f57`. A 180-load browser matrix, the iOS simulator, and the physical Redmi were checked, including live rotation and RTL.

### NC-02 Duplicate interface name fix

The overview no longer hangs when two interfaces share a name; the list is keyed by position plus name.

- Priority P1 · Status `done` · Evidence: PR #29, merge `fafb9bc`; reproduced with real macOS snapshot data containing two "iPhone" interfaces.

### NC-03 iOS project and simulator build

The Tauri iOS project exists and the app runs in the iOS simulator using only iOS-supported networking APIs.

- Priority P1 · Status `done` · Evidence: PR #28 (simulator level only; see [[platforms#iOS]]).

## Open work

Work that is planned, blocked, or in progress, highest priority first.

### NC-05 Physical iPhone validation

Record a reproducible physical-iPhone run; smoke tests are reported as successful but no record exists ([[platforms#Historical claims]]).

- Priority P1 · Status `in progress` (reported, unrecorded) · Depends on: a local signing identity and development team on the Mac, never committed.
- Acceptance: a PR records device, iOS version, build commit, and results for Wi-Fi and mobile data. Results cover all five diagnostics, the DNS server list versus the DNS test, touch navigation across the five screens, rotation, information pages in all four languages with RTL, and history persistence. Unverified items are listed as such.

### NC-04 iOS local network permission

Decide on a physical iPhone whether the gateway ping needs `NSLocalNetworkUsageDescription`, and add it only if it does ([[decisions#Least-privilege mobile permissions]]).

- Priority P2 · Status `planned` · Depends on: [[tasks#Open work#NC-05 Physical iPhone validation]].
- Acceptance: the gateway test's behavior with and without the key is recorded on a device; no other permission is added.

### NC-12 IPA export

Produce a signed IPA; an export attempt reportedly failed on a `libc`/`netdev` dependency-resolution error, with no log preserved.

- Priority P2 · Status `blocked` · Depends on: [[tasks#Open work#NC-05 Physical iPhone validation]] signing setup and a reproduction of the error.
- Acceptance: either a successful export with commands documented in [[docs/kurulum.md]], or the full error log and root cause recorded in a PR. `ExportOptions.plist` and project files must not contain team IDs or certificates.

### NC-09 Android signed release

Android release APKs are unsigned; there is no keystore, AAB, or store configuration.

- Priority P2 · Status `planned` · Depends on: a decision on store distribution and key custody.
- Acceptance: a signed release build is installed and smoke-tested on a device, with the keystore and passwords kept outside the repository.

### NC-11 Admin panel on SQLite

Connect an admin panel to the local SQLite backend ([[architecture#Local SQLite backend]]).

- Priority P2 · Status `in progress` · Evidence: open PR #32 (`feature/src-admin-prototype`), not merged. Its description states real IPC was not tested end to end in a running Tauri app.
- Acceptance: defined by that PR's review; once merged, update [[architecture#Local SQLite backend]] and [[project#Scope]].

### NC-13 Backend database tests

Add tests that open the in-memory database, because migrations, RBAC, and CRUD controllers are untested on `master`.

- Priority P2 · Status `planned` · Depends on: none (the unused helper `boot_memory` already exists).
- Acceptance: tests cover migration ordering, first-user-is-admin, permission checks, and one CRUD round trip. [[tests#Local backend]] gains matching specs.

### NC-10 Documentation consistency

Repository documents contradict each other on iOS status and on whether the app has a database.

- Priority P2 · Status `planned` · Depends on: none.
- Acceptance: [[README.md]], [[docs/proje-fikri.md]], [[docs/klasor-mimarisi.md]], and the four Hakkında pages match [[platforms#Support matrix]]. README's "no database" sentence reflects the unused SQLite backend, and [[docs/backend.md]] §8 matches the actual tests.

### NC-14 Week 04 course tasks

Course tasks 10–15 (method log, data contract, card, list states, detail screen, typed Rust command) from [[docs/tasks/week-4/README.md]] have no recorded work yet; task 09.1 is done.

- Priority P1 · Status `planned` · Evidence for 09.1: the "Protectmaster" ruleset is active on `master`. No `docs/istemler/` records exist for tasks 10–15. Whether existing code already satisfies parts of them has not been audited.
- Acceptance: as defined in each task file; deadline and grading are announced in class (Task 16).

## Deferred

Known issues accepted for now; they stay visible but are not reopened without a decision.

### NC-06 Transient no-internet after network switch

Right after switching from Wi-Fi to mobile data, the overview can show "İnternet Yok" until the next refresh.

- Priority P3 · Status `deferred` · Evidence: observed on the physical Redmi (PR #30); two refreshes later the state was "Bağlı".
- Note: the state follows the HTTPS `internet` test ([[frontend#Screens]]), so a fix belongs there, not in ICMP.

### NC-07 Report page heading

The report screen has no `h1`, unlike the other four app screens, which affects heading navigation for assistive technology.

- Priority P3 · Status `deferred` · Evidence: [[src/components/ReportView.svelte]] contains only `h2` headings.

### NC-08 Flaky report ID burst test

[[tests#Report IDs#Burst uniqueness]] fails about 1.2% of the time because 10 000 IDs share a 32-bit suffix space.

- Priority P3 · Status `deferred` · Evidence: PR #28 analysis; recorded as D-56 in the Mac-side vault (not accessible here).
- Acceptance when reopened: a deterministic test (or a wider suffix agreed with the format in [[decisions#Report IDs come from Rust]]) with no change to the visible ID format unless decided.
