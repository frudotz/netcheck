# Workflows

How NetCheck is developed, built, tested, reviewed, and released; command details live in [[docs/kurulum.md]] and the binding rules in [[AGENTS.md]].

## Development

The web UI and the native app run from the same Astro build on port 1420.

- `bun run dev` — browser preview without Rust IPC ([[frontend#Browser preview]]).
- `bun run tauri dev` — the desktop app with real IPC. For UI automation on Windows, set `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222` and connect over CDP.
- Android: `bun run tauri android dev`, or debug/release APK builds. A debug APK's WebView is inspected via `adb forward tcp:<port> localabstract:webview_devtools_remote_<pid>`.
- iOS (macOS with Xcode only): `bun run tauri ios build --debug --target aarch64-sim`, then `xcrun simctl install`/`launch`. The `tauri ios` subcommand does not exist on Windows.

## Build and checks

A change is not done until the checks matching what it touched pass; CI enforces the Rust and type checks on every pull request.

- `bun run build` — static frontend; must finish with 0 errors (32 pages on `master`, 11 of them under `/admin`).
- `bun run check` — `astro check` and `svelte-check`; 0 errors and 0 warnings expected (CI runs `svelte-check` on Linux).
- `cd src-tauri && cargo check --locked && cargo test --locked` — Rust; specs in [[tests]].
- `lat check` — knowledge-graph validation; required whenever `lat.md/` or `@lat:` references change.

## Continuous integration

[[.github/workflows/cross-platform.yml]] runs on pull requests and pushes to `master`; it builds and tests code but never launches the app.

- **Desktop** (Windows, Ubuntu, macOS): `bun install --frozen-lockfile`, `bun run build`, svelte-check (Linux only), `cargo check --locked`, `cargo test --locked`. The macOS job is where [[tests#ICMP#Darwin concurrent loopback]] runs.
- **Mobile Rust:** `cargo check --locked --lib` for `aarch64-linux-android` (NDK clang from the runner) and `aarch64-apple-ios`.
- Not covered: installers, APK/IPA packaging, simulators, devices, and frontend behavior.

## Git and review rules

Every change goes through a branch and a pull request into a protected `master`.

- Branches: `feature/<name>`, `fix/<name>`, `docs/<name>`; one logical change per branch. The "Protectmaster" ruleset on the default branch requires a pull request and the five CI checks with the branch up to date, and blocks deletion and force-push; other branches are unprotected and merged head branches are deleted automatically ([[tasks#Open work#NC-15 Master protection ruleset]]).
- Who may merge and how outside PRs are reviewed is defined only in the "PR güvenliği" section of [[docs/kurallar.md]].
- Course tasks follow the "Çalışma döngüsü" in [[AGENTS.md]]: a filled [[docs/gorev-sartnamesi.md]], a plan approved before any change, a `feature/NN-kisa-ad` branch with a prompt log under [[docs/istemler/README.md]], validation, a PR, and a merge only with the owner's approval.
- Commit prefixes `feat:`, `fix:`, `docs:`. No history rewriting or force-push. PR descriptions state what changed, why, how it was tested, and known limitations.
- Screenshots, recordings, and automation scripts are not committed, except evidence images a task file explicitly requires, such as [[docs/kanit/master-korumasi.png]]. Device screenshots may contain public IPs.
- `upstream` (`keyvanarasteh/hello-mobil`) is fetch-only; nothing is pushed there.

## Release and verification requirements

Releases are annotated tags on `master`; the course baseline tag is immutable.

- `v0.1.0-batch-01` → `b9fc299` is the Batch 01 submission baseline and must never be moved, deleted, or recreated. Submission steps are in [[docs/teslim.md]]; Blackboard submission is done by the student, not by tools.
- `v0.2.0-batch-02` does not exist yet. [[docs/ilerleme-batch-02.md]] defines its release gate: every Batch 02 PR merged, then build, type check, Rust tests and `lat check` re-run on `master`, then the owner's approval. The PRs were merged on 2026-10-28 and the checks passed on `master` = `72abf11`; only the owner's approval and the tag command in that file remain.
- A platform may be described as supported only at the evidence level actually reached ([[platforms#Evidence levels]]). Simulator results are not device results, and CI compilation is not runtime verification.
- Mobile store releases are not set up. Android needs a keystore and AAB; iOS needs a development team, signing, and IPA export ([[tasks#Open work]]). Signing material and team IDs stay out of the repository.

## Course compliance

The traceable audit of all instructor requirements lives in [[docs/course-compliance.md]]; its gaps are tracked here as `NC` tasks rather than repeated.

The audit covers the Week 3 and Week 4 task files under [[docs/tasks]] and the instructor's Batch 01 evaluation [[docs/k1/01.review.md]] (107/108). It counts 86 PASS, 12 PARTIAL, 1 FAIL and 6 UNVERIFIED requirements, including the Task 09.1 settings re-checked on 2026-10-21 and the Batch 02 re-audit of 2026-10-28. Batch 01 is essentially complete. The Batch 02 prerequisite is configured, apart from the unperformed direct-push self-test ([[tasks#Open work#NC-15 Master protection ruleset]]); Tasks 10–16, the admin panel move and the local-audit fixes are merged into `master` (PRs #35–#43, #45); the Task 16 audit has no task file in the repository, and the only FAIL is the missing `v0.2.0-batch-02` tag. Four requirements conflict with project rules and need an instructor decision or confirmation ([[tasks#Open work#NC-16 Conflicting course requirements]]). Remaining work is tracked in [[tasks#Open work#NC-14 Week 04 course tasks]], [[tasks#Open work#NC-17 Documentation index completeness]], [[tasks#Open work#NC-10 Documentation consistency]] and [[tasks#Open work#NC-18 Ad-hoc colors and template leftovers]]. A file named `hoca-raporu.md` was not found anywhere accessible, so the audit does not rely on it.
