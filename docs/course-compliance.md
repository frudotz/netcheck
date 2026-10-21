# Course Compliance Matrix — MYO063

Traceable audit of every instructor requirement in [`docs/tasks/`](tasks/) and the instructor evaluation [`docs/k1/01.review.md`](k1/01.review.md), checked against the repository, GitHub settings and CI. It is not a statement of grades.

- **Audited state:** `origin/master` at `dbe4c91` (2026-10-21), plus the documentation fixes in PR #33 (marked "fixed in PR #33"). GitHub repository settings were read through the API on the same day and re-read before the final update; they were unchanged. The Task 09.1 rows were re-checked later on 2026-10-21, after the owner changed the settings (ruleset saved at 20:16); its documentation rows are met on `feature/09-1-master-korumasi`.
- **Sources:** the 18 files in [`docs/tasks/week-3/`](tasks/week-3/) and [`docs/tasks/week-4/`](tasks/week-4/), plus [`docs/k1/01.review.md`](k1/01.review.md).
- **Not found:** `hoca-raporu.md` is not in this repository, its Git history, any fetched branch, the upstream `keyvanarasteh/hello-mobil` repository, GitHub PRs, or local folders. This matrix does not reconstruct it. The instructor-authored evaluation that does exist is `docs/k1/01.review.md` (Batch 01: 107/108 at `9992001`).
- **Method:** each row was checked directly in code, files, Git, the GitHub API or CI output. A row marked "instructor-verified" relies on `01.review.md` because it cannot be checked from the repository; it was re-checked where possible.

## Status legend

| Status | Meaning |
|---|---|
| **PASS** | Requirement met; evidence checked in this audit or recorded by the instructor |
| **PARTIAL** | Partly met; the missing part is named |
| **FAIL** | Not met in the audited state |
| **UNVERIFIED** | Cannot be checked from the repository or settings (student-side action, value not confirmed, or criteria not yet published) |

Priority: **P0** blocks a graded prerequisite, **P1** is a graded requirement, **P2** is accuracy or hygiene. Task IDs (`NC-NN`) refer to [`lat.md/tasks.md`](../lat.md/tasks.md).

## Summary

| Scope | PASS | PARTIAL | FAIL | UNVERIFIED | Total |
|---|---|---|---|---|---|
| Week 3 — Batch 01 (Tasks 01–09) | 37 | 7 | 0 | 2 | 46 |
| Week 4 — Batch 02 pre-release (Tasks 09.1–15, general rules) | 19 | 13 | 15 | 2 | 49 |
| **All** | **56** | **20** | **15** | **4** | **95** |

Batch 01 is essentially complete. The only instructor deduction, a direct commit to `master`, cannot be undone without rewriting history. Two regressions appeared after grading. PR #33 fixes the incomplete documentation index and the stale iOS statements. The remaining stale statements are the macOS run status and the "no database" sentence. Batch 02's prerequisite (Task 09.1) is now configured: `master` requires a pull request and the five CI checks. Its documentation and screenshot were merged in PR #34; only the direct-push self-test was not performed. Task 10 (working method) is on its branch; Tasks 11–16 have not started.

## Week 3 — Batch 01

### Task 01.1 — Fork and collaboration

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R01.1-a | Fork of `keyvanarasteh/hello-mobil` in the student's account | PASS | GitHub API: `fork=true`, `parent=keyvanarasteh/hello-mobil` |
| R01.1-b | `keyvanarasteh` invited as collaborator | PASS | GitHub API collaborators: `keyvanarasteh` (write) |
| R01.1-c | Username and fork link sent on Blackboard by 07.10.2026 | PASS (instructor-verified) | `01.review.md`: "form süresinde"; not checkable from the repository |

### Task 01.2 — Branch, PR and merge

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R01.2-a | No direct commits to `master` | PARTIAL | Student direct commit `c2b6c2b` (−1 in `01.review.md`). No student direct commits since; later first-parent commits are instructor commits or PR squash merges (#31). Cannot be undone without rewriting history; prevention depends on R09.1-c |
| R01.2-b | Conventional commit messages | PARTIAL | 72/75 non-merge commits on `master` are conventional. Exceptions: `c2b6c2b` (student) and template commits `12a05a5`, `394cb14` |
| R01.2-c | PR description states what was done and the task given to the AI | PARTIAL | Earlier PRs have a "Yapay zekâya verilen görev" section; student PRs #28, #29, #30 lack it. **Missing:** add the section to those PR descriptions (editing a description does not rewrite history) — P2 |
| R01.2-d | Files changed reviewed; at least one merged feature PR | PASS | 31 merged PRs, all from `feature/`, `fix/` or `docs/` branches |

### Task 02 — Project idea

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R02-a | `docs/proje-fikri.md` per template: student, inspiration, summary, three screens, target audience | PASS | [`docs/proje-fikri.md`](proje-fikri.md) §1–§3 |
| R02-b | Format of the Rust-generated code defined | PASS | `NCHK-YYYY-XXXXXXXX` in §5; `generate` in `src-tauri/src/report_id.rs` |
| R02-c | Idea submitted on Blackboard by 07.10.2026 | PASS (instructor-verified) | `01.review.md` Task 02 10/10 |

### Task 03 — README

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R03-a | Title, one-sentence description, İstinye/MYO063 info | PASS | `README.md` title and "Akademik Bilgiler" |
| R03-b | At least 3 working badges | PASS | 18 shields.io badges; instructor found no broken links |
| R03-c | Table of contents with working anchors | PASS | `README.md` "İçindekiler"; local file links re-checked (0 broken); anchors instructor-verified |
| R03-d | Working setup commands (clone, `bun install`, `bun run dev` / `tauri dev` / `build`) | PASS | `README.md` "Hızlı Başlangıç"; `bun run build` re-run in this audit (21 pages); `tauri dev` not re-run |
| R03-e | License link, student name and number, instructor info | PASS | `README.md` "Akademik Bilgiler", "Lisans" |
| R03-f | Student details correct | UNVERIFIED | `README.md` shows the section as "Şube 1" twice; this value has never been confirmed. **Missing:** student confirms or corrects it — P2 |
| R03-g | No copied folder tree; links to `docs/klasor-mimarisi.md` | PASS | Instructor-verified; README links the document |
| R03-h | Technology and feature sections match the app | PARTIAL | iOS status fixed in PR #33: simulator build and launch, physical iPhone not verified (PR #28). Still open: README says macOS was never run as an app, but PR #28 records a debug `.app` launch. It also says "veritabanı yoktur", while the SQLite backend from #31 is compiled in (decision C-3). **Missing:** NC-10 |

### Task 04 — AGENTS.md, CLAUDE.md, GEMINI.md

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R04-a | AGENTS.md covers technology, commands, Git rules and code rules | PASS | [`AGENTS.md`](../AGENTS.md) §2–§4 |
| R04-b | CLAUDE.md and GEMINI.md only link to AGENTS.md | PASS | Both are the single template line |
| R04-c | Every AGENTS.md link resolves | PASS | 0 broken local links (checked in this audit, including the lat.md block) |
| R04-d | Branch and PR obligation written | PASS | AGENTS.md §3 |

### Task 05 — Branding and icons

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R05-a | Light and dark token values in `docs/branding.md` match `app.css` `:root` and `[data-tema="gece"]` exactly | PASS | 26 unique hex values in each, identical sets (re-checked after PR #30) |
| R05-b | Text contrast ≥ 4.5:1, measured values in the table | PASS | Instructor-verified; ratios present in [`docs/branding.md`](branding.md) |
| R05-c | Icon sets for iOS, Android, macOS, Windows, Linux | PASS | `src-tauri/icons/`: `ios/` (18), `android/` (17), `icon.icns`, `icon.ico`, PNG sizes |
| R05-d | Favicon and header logo updated | PASS | `public/favicon.png`, `public/apple-touch-icon.png`, `src/components/AppHeader.svelte` |
| R05-e | `tauri.conf.json` productName and window title | PASS | Both "NetCheck" |
| R05-f | No ad-hoc colors; tokens only (AGENTS.md §1) | PARTIAL | `src/components/react/CanliRozet.tsx` hard-codes four colors. `src/app.css` is an unused template file that still carries the PassoKlon palette. **Missing:** move the badge colors to tokens and remove the unused file — P2 |

### Task 06 — Information pages

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R06-a | Hakkında (MDX): purpose, developer info, technologies, ≥1 interactive component | PASS | `src/pages/{,en/,ar/,fa/}hakkinda.mdx`: name, number, department, university; 2 `client:` islands each |
| R06-b | İletişim: Svelte form with simulated "sent" notice and reset | PASS | `src/components/IletisimFormu.svelte` (`gonder` sets the notice and clears the fields) |
| R06-c | Koşullar and Gizlilik in MDX; localStorage and KVKK notice | PASS | All four languages mention localStorage and KVKK; terms pages state it is a course project |
| R06-d | Every page in TR/EN/AR/FA; AR/FA `dir="rtl"`; all build | PASS | 16 routes built in `dist/`; `dir="rtl"` present in the built AR/FA pages |
| R06-e | Reachable from navigation or settings | PASS | `src/components/Settings.svelte` links all four pages; `src/components/AppNav.svelte` keeps the Ayarlar tab active on them |
| R06-f | Content accurate | PARTIAL | iOS sentence fixed in all four languages in PR #33. Still open: the pages say macOS was never run as an app (PR #28 records a debug `.app` launch). **Missing:** NC-10 |

### Task 07 — Architecture tree

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R07-a | Folder tree lists only main folders and root files | PASS | [`docs/klasor-mimarisi.md`](klasor-mimarisi.md); instructor-verified |
| R07-b | Page and feature tree matches routes | PASS | [`docs/mimari-agac.md`](mimari-agac.md) §1 lists every route in `src/pages/` |
| R07-c | Five-platform matrix with outputs | PASS | `docs/mimari-agac.md` §2 |
| R07-d | Breakpoints, layout and navigation for phone, tablet, desktop and large screen, with `max-width` and grid | PASS | `docs/mimari-agac.md` §3; implemented in PR #30. This fixes the single-column issue the instructor observed on 09.10 |

### Task 08 — Advanced AGENTS.md

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R08-a | Every `docs/*.md` listed in the AGENTS.md index | PASS (fixed in PR #33) | [`docs/backend.md`](backend.md) (from PR #31) and this document are now listed; all 11 top-level `docs/*.md` are indexed |
| R08-b | Commands work; no stale or copied information | PARTIAL | Commands verified (`bun run build`). AGENTS.md §6 lists "giriş/kayıt, sunucu/API, veritabanı" as out of scope, yet `master` contains the SQLite and auth backend (PR #31, instructor-authored). **Missing:** decision C-3 |
| R08-c | Single-source rule; no colors in AGENTS.md | PASS | 0 hex values in AGENTS.md |
| R08-d | Agent compliance test (one color task, one page task) | PASS | [`docs/agent-compliance-test.md`](agent-compliance-test.md) Tests A and B (PR #20) |

### Task 09 — Batch 01 and tag

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R09-a | Control matrix 9/9 with evidence | PASS | [`docs/teslim.md`](teslim.md) matrix; instructor 8/8 |
| R09-b | Build proof screenshot | PASS (instructor-accepted) | `docs/tauri-dev-kaniti.png`, which shows `tauri dev`, not `bun run build` output; the instructor accepted it |
| R09-c | `v0.1.0-batch-01` tag on `master` | PASS | Annotated tag → `b9fc299`, an ancestor of `master`; unchanged |
| R09-d | Final ZIP uploaded to Blackboard | UNVERIFIED | Student action outside the repository; excluded from the 107/108 total |

## Week 4 — Batch 02 (pre-release)

Deadline, submission format and the Task 16 audit are "announced in class" ([`week-4/README.md`](tasks/week-4/README.md)); rubric points are drafts.

### Task 09.1 — Master protection (prerequisite)

If the ruleset is not effective, Task 16 gives no points for configuration. Settings were re-read from the GitHub API on 2026-10-21 after the owner's change (ruleset saved at 20:16).

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R09.1-a | Active ruleset targeting the default branch | PASS | Ruleset "Protectmaster" is `active`, targets `~DEFAULT_BRANCH` (`master` only) and has an empty bypass list. The task suggests the name "master koruması"; the owner kept "Protectmaster", and the checklist does not require the name |
| R09.1-b | Restrict deletions and block force pushes | PASS | Rules `deletion`, `non_fast_forward` |
| R09.1-c | Require a pull request before merging | PASS | `pull_request` rule with 0 required approvals and required review-thread resolution; also `required_status_checks` with the five CI jobs in strict mode |
| R09.1-d | Direct `git push origin master` rejected (self-test) | UNVERIFIED | Not attempted, by the owner's decision. R09.1-a to R09.1-c imply rejection, but the self-test itself is not recorded — owner action |
| R09.1-e | Merge commits allowed | PASS | `allow_merge_commit=true` |
| R09.1-f | Head branches deleted automatically | PASS | `delete_branch_on_merge=true`; the deletion rule now applies to `master` only |
| R09.1-g | Only the student, teammates and the instructor are collaborators | PASS | `frudotz` (admin), `keyvanarasteh` (write) |
| R09.1-h | Fork PR workflows require approval for all external contributors | PASS | `approval_policy=all_external_contributors` |
| R09.1-i | Workflow permissions read-only | PASS | `default_workflow_permissions=read` |
| R09.1-j | "PR güvenliği" section in `docs/kurallar.md`, linked from AGENTS.md | PASS | [`docs/kurallar.md` § PR güvenliği](kurallar.md#pr-güvenliği), linked from AGENTS.md §3 and the documentation index; merged in PR #34 (`9970845`) |
| R09.1-k | Screenshot `docs/kanit/master-korumasi.png` | PASS | [`docs/kanit/master-korumasi.png`](kanit/master-korumasi.png), the saved ruleset, captured by the owner; merged in PR #34. The status-check list is collapsed in the image and is evidenced through the API |

### Task 10 — Working method

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R10-a | `docs/gorev-sartnamesi.md` with five headings | PASS (Task 10 branch) | [`docs/gorev-sartnamesi.md`](gorev-sartnamesi.md): the five headings with NetCheck example lines |
| R10-b | `docs/istemler/README.md` and log `docs/istemler/10-calisma-yontemi.md` | PASS (Task 10 branch) | [`docs/istemler/README.md`](istemler/README.md) (naming, sections, rules) and [`10-calisma-yontemi.md`](istemler/10-calisma-yontemi.md); the Task 09.1 log was backfilled |
| R10-c | AGENTS.md "Çalışma döngüsü": plan first, branch + PR, clean build | PASS (Task 10 branch) | [AGENTS.md § Çalışma döngüsü](../AGENTS.md#çalışma-döngüsü); both new documents are in the AGENTS.md index |
| R10-d | New-chat rule test answer recorded in the log | PARTIAL | The Task 10 log records two answers that describe the AGENTS.md cycle: a context-free subagent (proxy) and the student's question in an existing ChatGPT conversation that already carried project context. Neither is a new chat. **Missing:** a new-chat test and the screenshots required by the checklist — P1, student action |
| R10-e | Branch `feature/10-calisma-yontemi` with a PR | PASS (Task 10 branch) | Branch created from `9970845`; PR #35, linked in the log |

### Task 11 — Data contract

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R11-a | `src/lib/types/` with ≥3 types in separate files and `index.ts` | PARTIAL | 11 types exist, all in a single file, `src/types/netcheck.ts`. **Missing:** split and move — P1 |
| R11-b | One-line comment per field; required and optional separated; status fields as fixed options | PARTIAL | Status fields are literal unions; only 7 comment lines across 70 lines — P1 |
| R11-c | Sample data in one file, ≥6 records per type | FAIL | None. **Conflict C-1:** AGENTS.md forbids fake network data — P1, needs decision |
| R11-d | Scattered types moved; no `any` | PARTIAL | No `any` found. Types remain in `Overview.svelte`, `i18n.ts`, `score.ts`, `tema.svelte.ts` — P1 |
| R11-e | `check` script (`astro check`) in `package.json`, 0 errors | FAIL | No `check` script; CI runs `svelte-check` instead — P1 |
| R11-f | `docs/veri-modeli.md` and AGENTS.md rule | FAIL | Absent; the model is in `docs/proje-fikri.md` §4 — P1 |

### Task 12 — Card component

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R12-a | Generic `src/lib/components/ui/Kart.svelte`, input type in `types/ui.ts`, no hard-coded colors | FAIL | Absent — P1 |
| R12-b | Robust without image, with long titles and in RTL; keyboard focus, Enter, alt text | FAIL | Component absent — P1 |
| R12-c | Main screen shows ≥6 items with the card; old card code removed | FAIL | Screens use ad-hoc `.kart` sections — P1 |

### Task 13 — List screen and three states

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R13-a | `Yukleniyor`, `BosDurum`, `HataDurumu` in `src/lib/components/ui/` | FAIL | Absent — P1 |
| R13-b | Main list uses one loader and shows exactly one of loading, error, empty, full | PARTIAL | Each screen handles states itself (`Overview.svelte` loading/error, `History.svelte` "Henüz kayıtlı rapor yok."), not through shared components — P1 |
| R13-c | Empty search or filter result shows `BosDurum` with a clear button | FAIL | No search or filter exists — P1 |
| R13-d | State texts in TR/EN/AR/FA | FAIL | App screens are Turkish only. **Conflict C-2** — P1, needs decision |
| R13-e | Screenshots of the four states in `docs/istemler/13-*.md` | FAIL | Absent — P1 |
| R13-f | Same components used on a second list | FAIL | Absent — P1 |

### Task 14 — Detail screen and navigation

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R14-a | Detail screen opens from a card; the address contains the item ID | PASS | `/rapor?id=NCHK-…` (`src/components/ReportView.svelte`). History links to it. A query string is used because the build is static |
| R14-b | Back navigation keeps the list's search and filter | PARTIAL | Back is plain page navigation (not tested); there is no search or filter to keep (depends on R13-c) — P1 |
| R14-c | Unknown ID shows `HataDurumu` or a not-found screen | PARTIAL | Shows "Rapor bulunamadı", but not through `HataDurumu` (R13-a) — P1 |
| R14-d | Detail screen in four languages; RTL for AR/FA | FAIL | Turkish only. **Conflict C-2** — P1 |
| R14-e | Page tree in `docs/mimari-agac.md` updated | PASS | `/rapor?id=` listed in §1 |

### Task 15 — Rust command with typed result and error

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| R15-a | At least one app-specific command; template example removed | PASS | `get_network_snapshot`, `run_diagnostic`, `generate_report_id`, `get_platform_info` in `src-tauri/src/lib.rs`; no `greet` |
| R15-b | Typed success struct and typed error enum; no panic on invalid input | PARTIAL | Success values are typed structs. Errors are `String` codes (`Result<_, String>` in `lib.rs`). An invalid `kind` is rejected by serde without a panic. The backend's `AppError` is typed but no screen uses it — P1 |
| R15-c | All Tauri calls go through `src/lib/native.ts` | PARTIAL | `src/components/ExternalLink.svelte` imports `isTauri` and `openUrl` directly — P1 |
| R15-d | Browser fallback without crashing | PASS | `NativeUnavailableError` and `hasNative` in `src/lib/native.ts` |
| R15-e | Result and error types in `src/lib/types/`, matching Rust fields | PARTIAL | Types match Rust's camelCase fields but live in `src/types/netcheck.ts` (R11-a) — P1 |
| R15-f | Error shown with `HataDurumu` | FAIL | Component absent; errors are inline messages — P1 |
| R15-g | ≥2 automated Rust tests; `cargo test` passes | PASS | 22 tests: 21/21 on Windows and 22/22 on macOS CI (PR #33) |
| R15-h | App works on all five platforms; unsupported features hidden on that platform | PARTIAL | Windows and Android verified. macOS: CI plus a partial run. Linux: CI only. iOS: simulator only ([`lat.md/platforms.md`](../lat.md/platforms.md)). Every platform has a ping backend, so nothing is hidden by platform — P1 |
| R15-i | `docs/platform-destegi.md` feature × platform table and AGENTS.md rule | FAIL | Absent; `docs/mimari-agac.md` §2 is platform-level only — P1 |
| R15-j | `native.ts` exposes `platform()` and `destekleniyorMu(...)` | PARTIAL | `getPlatformInfo()` exists; there is no per-feature support query — P1 |
| R15-k | `docs/komutlar.md` documenting the commands | FAIL | Absent; [`docs/backend.md`](backend.md) covers only the backend commands — P1 |

### General Week 4 rules

| ID | Requirement | Status | Evidence / missing work |
|---|---|---|---|
| RG-a | Each task on its own `feature/NN-kisa-ad` branch with a PR and a `docs/istemler/NN-*.md` log | PARTIAL | Task 09.1 (PR #34, log backfilled) and Task 10 follow it; Tasks 11–15 not started — P1, NC-14 |
| RG-b | Batch 02 deadline, format and Task 16 audit criteria | UNVERIFIED | To be announced in class; not in the repository |

## Conflicts requiring an instructor decision

These requirements contradict binding rules already in the project. Resolve them before implementing the affected tasks (NC-16).

- **C-1 — Sample data vs. no fake data.** Task 11 asks for ≥6 sample records per type. AGENTS.md §4 forbids fabricated IPs, latencies or reports. One option is clearly labeled fixtures used only in development and tests, never shown as real data.
- **C-2 — Four-language state and detail texts vs. Turkish-first screens.** Tasks 13 and 14 require TR/EN/AR/FA texts on app screens. AGENTS.md and [`lat.md/frontend.md`](../lat.md/frontend.md) keep app screens Turkish only.
- **C-3 — Out-of-scope list vs. merged backend.** AGENTS.md §6 excludes login, server and database, yet PR #31 (instructor-authored) merged a SQLite and auth backend that no screen uses.

## Remediation plan

Ordered by priority. Nothing in this plan is implemented by this audit.

1. **Done except the self-test — Task 09.1 (NC-15).** The owner fixed the settings on 2026-10-21. The "PR güvenliği" section, its AGENTS.md link and `docs/kanit/master-korumasi.png` were merged in PR #34. **Remaining:** the direct-push self-test (R09.1-d), which the owner chose not to perform.
2. **P1 — Decisions C-1 to C-3 (NC-16).** **Acceptance:** each decision is recorded in AGENTS.md, which is the single source for rules.
3. **Done in PR #33 — Documentation index (NC-17).** `docs/backend.md` added to the AGENTS.md index.
4. **P1 — Tasks 10 → 15 in order (NC-14).** One `feature/NN-*` branch, PR and `docs/istemler/` log per task. Run each task's own audit prompt first and implement only the PARTIAL and FAIL rows above. **Acceptance:** each task's "Görev bittiğinde repoda ne olacak" list and checklist are met, with `bun run build` at 0 errors.
5. **P2 — Accuracy and hygiene.** iOS statements were fixed in PR #33. Still open: the macOS run status in README and Hakkında, and the README "no database" sentence after decision C-3 (NC-10). Confirm "Şube" (R03-f). Ad-hoc colors and the unused `src/app.css` (R05-f, NC-18). AI-task section in the descriptions of PRs #28–#30 (R01.2-c).

Related current-state descriptions: [`lat.md/project.md`](../lat.md/project.md) (scope and rules), [`lat.md/architecture.md`](../lat.md/architecture.md) (IPC contract, SQLite backend), [`lat.md/platforms.md`](../lat.md/platforms.md) (evidence levels), [`lat.md/workflows.md`](../lat.md/workflows.md) (Git and CI rules).
