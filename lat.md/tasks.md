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

### NC-15 Master protection ruleset

Course task 09.1: the "Protectmaster" ruleset protects only the default branch with PR, status-check, deletion and force-push rules.

- Priority P0 · Status `in progress` · Depends on: the owner's optional direct-push self-test; the settings were fixed on 2026-10-21 and the documentation merged in PR #34 (`9970845`).
- Evidence: rows R09.1-a to R09.1-k in [[docs/course-compliance.md]]. The "PR güvenliği" section of [[docs/kurallar.md]] records the configuration read from the GitHub API, with [[docs/kanit/master-korumasi.png]] as the screenshot; the prompt log is [[docs/istemler/09-1-master-korumasi.md]].
- Open: the direct-push self-test (R09.1-d) was deliberately not performed; the configuration is the evidence.
- Acceptance: every Task 09.1 checklist item is met; the self-test result is recorded if the owner runs it.

### NC-05 Physical iPhone validation

Record a reproducible physical-iPhone run; smoke tests are reported as successful but no record exists ([[platforms#Historical claims]]).

- Priority P1 · Status `in progress` (reported, unrecorded) · Depends on: a local signing identity and development team on the Mac, never committed.
- Acceptance: a PR records device, iOS version, build commit, and results for Wi-Fi and mobile data. Results cover all five diagnostics, the DNS server list versus the DNS test, touch navigation across the five screens, rotation, information pages in all four languages with RTL, and history persistence. Unverified items are listed as such.

### NC-16 Conflicting course requirements

Four course requirements contradict binding project rules and need an owner or instructor decision.

- Priority P1 · Status `blocked` · Depends on: the instructor's answer for C-3, a decision on C-4, and confirmation of the C-1 and C-2 decisions.
- Conflicts C-1 to C-4 in [[docs/course-compliance.md]]:
  - Task 11 sample data versus [[project#Product rules]] (no fake data). Decided on 2026-10-21 under the owner's general authorization: documentation-range records in [[src/lib/veri/ornek.ts]] that no screen imports, recorded in [[AGENTS.md]]; instructor confirmation pending.
  - Four-language state and detail texts versus Turkish-only app screens. Decided on 2026-10-21 under the same authorization: an app language setting with a dictionary ([[decisions#Turkish-first interface]]), recorded in [[AGENTS.md]]; instructor confirmation pending.
  - The AGENTS.md out-of-scope list versus [[architecture#Local SQLite backend]].
  - C-4: the Task 03 README requires the student number, while the 2026-10-21 status report forbids personal data in the public repository; the number also stays in history and in the immutable Batch 01 tag. Undecided.
- Acceptance: each decision is recorded once in [[AGENTS.md]] and reflected here.

### NC-17 Documentation index completeness

The AGENTS.md documentation index must list every `docs/*.md`; [[docs/backend.md]] from PR #31 was missing, a Task 08 regression.

- Priority P1 · Status `in progress` · Evidence: the row is added on the PR #33 branch; the task is done when PR #33 merges.
- Acceptance: every top-level `docs/*.md` appears in the AGENTS.md index with a working link (row R08-a).

### NC-14 Week 04 course tasks

Course tasks 10–16 (method log, data contract, card, list states, detail screen, typed Rust command, Batch 02 audit) from [[docs/tasks/week-4/README.md]] and, for Task 16, the instructor's 2026-10-21 status report; all seven are in review as PRs #35–#43.

- Priority P1 · Status `in progress` · Depends on: [[tasks#Open work#NC-15 Master protection ruleset]] (the Task 09.1 prerequisite) and, for Tasks 11, 13 and 14, [[tasks#Open work#NC-16 Conflicting course requirements]].
- Evidence: rows R10 to R15 in [[docs/course-compliance.md]]. Task 10 is on `feature/10-calisma-yontemi` with its log [[docs/istemler/10-calisma-yontemi.md]]; the student's own new-chat rule test is still open. Task 11 is on `feature/11-veri-sozlesmesi` with its log [[docs/istemler/11-veri-sozlesmesi.md]], Task 12 on `feature/12-kart-bileseni` with [[docs/istemler/12-kart-bileseni.md]], Task 13 on `feature/13-liste-ve-uc-durum` with [[docs/istemler/13-liste-ve-uc-durum.md]], Task 14 on `feature/14-detay-ekrani` with [[docs/istemler/14-detay-ekrani.md]], Task 15 on `feature/15-rust-komutu` with [[docs/istemler/15-rust-komutu.md]], and Task 16 on `feature/16-batch-02-denetimi` with [[docs/istemler/16-batch-02-denetimi.md]] and the release gate in [[docs/ilerleme-batch-02.md]]. Open: merging the PRs in order and the `v0.2.0-batch-02` tag (R16-c, owner's approval), the student's own runs and screenshots (R10-d, R13-e) and macOS, Linux and iOS runs (R15-h, deferred).
- Acceptance: as defined in each task file, one branch, PR and prompt log per task, and the release gate in [[docs/ilerleme-batch-02.md]] passing on `master`. Deadline 27.10.2026 23:59; the Task 16 rubric is announced in class.

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

### NC-19 Admin panel move into the project

Move the AI Studio admin panel into the main project as an interface that follows the project rules (instructor's 21.10.2026 status report).

- Priority P1 · Status `in progress` · Evidence: PR #42 (`feature/admin-panel-tasima`) with its log [[docs/istemler/admin-panel-tasima.md]]; [[architecture#Admin panel]] describes the result and [[docs/yonetim-paneli.md]] the rules. Checked in the running Windows app and in a browser on the production build: 11 screens at 320–1280 px in TR, AR and FA, both themes.
- Open: archiving the separate repository is the owner's step after merge; whether the panel is reachable from the app or ships in mobile builds is undecided (RA-f in [[docs/course-compliance.md]]).
- Acceptance: merged with 0 hex/rgb/palette classes and no visible text outside the dictionaries in `admin/`; the app's CSS unchanged apart from the new token.

### NC-11 Admin panel on SQLite

Connect the admin panel to the local SQLite backend ([[architecture#Local SQLite backend]]).

- Priority P2 · Status `blocked` · Depends on: [[tasks#Open work#NC-16 Conflicting course requirements]] (C-3), [[tasks#Open work#NC-19 Admin panel move into the project]], and fixes for the backend security findings from the PR #32 review (masking, self-promotion, admin lockout, password reset by duplicate e-mail, unauthenticated submissions).
- Evidence: open PR #32 (`feature/src-admin-prototype`, instructor-authored) wires the AI Studio copy of the panel to SQLite; not merged, and its real IPC was never run in the app.
- Acceptance: the panel's [[admin/api/index.ts#AdminApi]] is implemented through [[src/lib/native.ts]], each security finding has a test, and [[architecture#Local SQLite backend]] and [[project#Scope]] are updated.

### NC-13 Backend database tests

Add tests that open the in-memory database, because migrations, RBAC, and CRUD controllers are untested on `master`.

- Priority P2 · Status `planned` · Depends on: none (the unused helper `boot_memory` already exists).
- Acceptance: tests cover migration ordering, first-user-is-admin, permission checks, and one CRUD round trip. [[tests#Local backend]] gains matching specs.

### NC-10 Documentation consistency

Repository documents contradict each other on platform run status and on whether the app has a database.

- Priority P2 · Status `in progress` · Depends on: [[tasks#Open work#NC-16 Conflicting course requirements]] for the database sentence.
- Done on the PR #33 branch: iOS status in [[README.md]], [[docs/proje-fikri.md]], [[docs/klasor-mimarisi.md]] and the four Hakkında pages now matches [[platforms#iOS]]: simulator build, physical iPhone not verified.
- Still open: README and Hakkında say macOS was never run as an app, although PR #28 recorded a debug `.app` launch. README also says there is no database.
- Acceptance: [[README.md]], [[docs/proje-fikri.md]], [[docs/klasor-mimarisi.md]], and the four Hakkında pages match [[platforms#Support matrix]]. README's "no database" sentence reflects the unused SQLite backend, and [[docs/backend.md]] §8 matches the actual tests.

### NC-18 Ad-hoc colors and template leftovers

Two files bypass the color-token rule: the React demo badge hard-codes colors, and an unused template stylesheet keeps the old palette.

- Priority P2 · Status `planned` · Depends on: none.
- Evidence: [[src/components/react/CanliRozet.tsx]] and [[src/app.css]], which nothing imports (row R05-f).
- Acceptance: no hex colors outside [[src/styles/app.css]], and the unused file is removed.

## Deferred

Known issues accepted for now; they stay visible but are not reopened without a decision.

### NC-06 Transient no-internet after network switch

Right after switching from Wi-Fi to mobile data, the overview can show "İnternet Yok" until the next refresh.

- Priority P3 · Status `deferred` · Evidence: observed on the physical Redmi (PR #30); two refreshes later the state was "Bağlı".
- Note: the state follows the HTTPS `internet` test ([[frontend#Screens]]), so a fix belongs there, not in ICMP.

### NC-07 Report page heading

The report screen had no `h1`, unlike the other four app screens, which affects heading navigation for assistive technology.

- Priority P3 · Status `in progress` · Evidence: the Task 14 branch adds an `h1` to [[src/components/ReportView.svelte]]; done when it merges.

### NC-08 Flaky report ID burst test

[[tests#Report IDs#Burst uniqueness]] fails about 1.2% of the time because 10 000 IDs share a 32-bit suffix space.

- Priority P3 · Status `deferred` · Evidence: PR #28 analysis; recorded as D-56 in the Mac-side vault (not accessible here).
- Acceptance when reopened: a deterministic test (or a wider suffix agreed with the format in [[decisions#Report IDs come from Rust]]) with no change to the visible ID format unless decided.
