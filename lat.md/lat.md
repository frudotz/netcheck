This directory defines the high-level concepts, business logic, and architecture of this project using markdown. It is managed by [lat.md](https://www.npmjs.com/package/lat.md) — a tool that anchors source code to these definitions. Install the `lat` command with `npm i -g lat.md` and run `lat --help`.

- [[project]] — What NetCheck is, its scope, out-of-scope list, and non-negotiable product rules
- [[architecture]] — Tauri boundary, IPC contract, frontend and Rust modules, data flow, local SQLite backend
- [[networking]] — Network snapshot, gateway rule, ping backends per platform, fixed diagnostics
- [[frontend]] — Screens, connection score, report history, theme, localization, RTL, responsive layout
- [[decisions]] — Technical decisions that shape the current implementation, with rationale
- [[platforms]] — Platform support matrix, evidence levels, and the register of historical claims
- [[workflows]] — Development, build, test, CI, Git, release, and verification requirements
- [[tests]] — Specifications for the Rust unit tests, each linked to its implementation
- [[tasks]] — Delivery status and prioritized backlog with status and acceptance criteria
