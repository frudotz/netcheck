# Project

NetCheck is a Turkish-first, local-first network diagnostic app for desktop and mobile, built with Tauri v2, Rust, and an Astro/Svelte web frontend.

It shows the current network's basic facts, runs five fixed connectivity tests, turns the results into a scored report with a Rust-generated identifier, and keeps report history on the device. It was developed for the MYO063 Mobil Programlama course at İstinye University, starting from the `keyvanarasteh/hello-mobil` template (configured as the read-only `upstream` remote; `frudotz/netcheck` is the delivery repository).

## Stack

The runtime is a Tauri v2 shell around a statically built web frontend, with all network access in Rust.

- **Shell:** Tauri 2 (`tauri-cli` 2.12.1) with the opener plugin; one window, capabilities in [[src-tauri/capabilities/default.json]].
- **Frontend:** Astro 7 static output, Svelte 5 components (runes), one React 19 island ([[src/components/react/CanliRozet.tsx]]), MDX information pages. Bun is the package manager and script runner.
- **Backend:** Rust crate in [[src-tauri]]; networking via `netdev`, HTTPS via `ureq`, ICMP via platform code (see [[networking#Ping backends]]).

## Scope

NetCheck is a basic diagnostic tool; the feature set is intentionally small and fixed.

In scope: network snapshot ([[networking#Network snapshot]]), five diagnostics ([[networking#Diagnostics]]), connection score ([[frontend#Connection score]]), reports and local history ([[frontend#Reports and history]]), theme, settings, a four-language app setting and four-language information pages ([[frontend#Localization]]).

Out of scope, per [[AGENTS.md]]: login/registration in the app, server/API, cloud sync, analytics, AI features, speed test, port or subnet scanning, packet capture, traceroute UI, VPN detection, and remote management. A temporary local SQLite backend exists in the code; the app's own screens do not use it, and on this branch only the admin panel does, behind a local sign-in ([[architecture#Local SQLite backend]], [[architecture#Admin panel]]). Whether that connection ships is the pending scope decision C-3.

## Product rules

These rules apply to every change and are the main review criteria for features.

- **No fake data.** Outside Tauri, IPC calls throw [[src/lib/native.ts#NativeUnavailableError]] and the UI says data is only available in the app. Missing values render as "Kullanılamıyor" or "Bulunamadı" (dictionary keys `kullanilamiyor` and `bulunamadi` in [[src/lib/sozluk.ts#sozluk]]), never as invented values. The Task 11 sample records in [[src/lib/veri/ornek.ts]] only illustrate the types: they use documentation address ranges and no screen, store or command imports them.
- **Fixed targets.** Diagnostic targets live in Rust; the frontend only sends a [[src-tauri/src/diagnostics.rs#DiagnosticKind]]. User input never reaches a shell, PowerShell, CMD, or any spawned process.
- **Least privilege.** Tauri capabilities stay at `core:default` and `opener:default`; Android requests only `INTERNET` and `ACCESS_NETWORK_STATE`.
- **Honest capability reporting.** A platform that cannot do something reports it as unavailable; another check is never relabeled as ICMP (see [[decisions#Real ICMP or nothing]]).
- **Turkish-first UI.** Turkish is the default; app screens can switch to EN/AR/FA through the dictionary, and every new visible text is added in all four languages (see [[frontend#Localization]]).
