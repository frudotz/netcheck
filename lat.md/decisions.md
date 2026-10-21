# Decisions

Decisions that constrain how NetCheck is built today, each with its reason; Obsidian decision IDs are given where the accessible vault records them.

## Report IDs come from Rust

Report identifiers are generated only by [[src-tauri/src/report_id.rs#generate]] as `NCHK-YYYY-XXXXXXXX` (UTC year, 8 uppercase hex digits).

There is one generator for the app and the local backend ([[src-tauri/src/backend/domain.rs#is_report_id]] validates the same format). The suffix is a 32-bit keyed hash of time, a counter, and the process ID. That is unique enough for one device's history but not collision-free at scale, which makes the burst test flaky ([[tasks#Deferred#NC-08 Flaky report ID burst test]]).

## Fixed targets, enum-only IPC

The frontend can only choose a [[src-tauri/src/diagnostics.rs#DiagnosticKind]]; targets, URLs, and timeouts are Rust constants.

This removes any path from user input to a network target or shell, a course security requirement recorded in [[AGENTS.md]].

## Single platform layer

All OS-specific Rust lives under `src-tauri/src/platform/`; shared modules call its interfaces and never branch on the OS themselves.

Introduced by the mobile foundation (PR #22). Each target compiles exactly one ICMP backend and one device-name implementation, and [[src-tauri/src/platform/mod.rs#info]] exposes which backend is active so the UI can be honest about it.

## Real ICMP or nothing

A platform without a real ICMP path reports the ping tests as unavailable; no TCP, HTTP, or other probe is ever presented as ICMP.

Mobile platforms do not spawn processes, so Android and iOS use unprivileged ICMP datagram sockets (D-45, D-52) rather than a `ping` binary.

## Constant ICMP sequence on Android

Each Android echo uses a fresh socket and sequence number 1, because the kernel already gives every socket a unique identifier.

A process-wide incrementing sequence lost replies when concurrent pings passed through the emulator's NAT (measured 0/6 for 8.8.8.8 alongside 1.1.1.1). Constant per-socket sequence restored 6/6, matching iputils `ping` (D-46).

## Own address is never a gateway

An interface's own address is excluded from gateway candidates by [[src-tauri/src/network.rs#pick_gateway]] on every platform (D-51).

Found on a physical Android phone on Turkcell mobile data, where the default route points at the phone itself. See [[networking#Network snapshot#Gateway selection]].

## Darwin socket verified on macOS CI

The Darwin ICMP path is unit-tested against loopback on GitHub's macOS runner, while macOS desktop builds keep using the system `ping` (D-53).

iOS shares the XNU kernel with macOS, so this is the only reproducible check of the socket logic available without an iOS device in CI. It does not prove on-device iOS behavior.

## netdev features per target

`netdev` is built with default features off: `gateway` on every target, `android-extra` only on Android, and `apple-system-configuration-extra` only on macOS.

The SystemConfiguration symbols that netdev's default Apple feature uses are `API_UNAVAILABLE(ios)` in the iOS SDK. Linking the framework only hid the problem (PR #28). iOS therefore uses Network.framework, `getifaddrs`, route `sysctl`, and `/etc/resolv.conf`, which is why iOS DNS server discovery is weaker ([[networking#Network snapshot#DNS servers and device name]]).

## Least-privilege mobile permissions

Android declares only `INTERNET` and `ACCESS_NETWORK_STATE`; iOS declares no extra usage descriptions or entitlements beyond the generated template.

`ACCESS_WIFI_STATE` is not needed because link speed is not shown (D-48). Whether iOS needs `NSLocalNetworkUsageDescription` for the gateway ping must be decided on a physical device (D-54; [[tasks#Open work#NC-04 iOS local network permission]]).

## No container queries

Responsive rules use media queries only, because the iOS deployment target is 15.0 and WKWebView lacks `@container` before iOS 16.

Recorded with the responsive layout (PR #30); see [[frontend#Responsive layout]].

## Local-first storage

Reports, history, and theme are stored in WebView `localStorage`; there is no server, account, or sync in the shipped screens.

The SQLite backend from PR #31 is a separate, temporary layer meant to keep command names stable when a server is introduced. It does not change where the current screens store data ([[architecture#Local SQLite backend]]).

## Turkish-first interface

App screens stay Turkish; multilingual support is limited to the four information pages, where Arabic and Persian are RTL.

This follows the course's Turkish-first rule in [[AGENTS.md]] and keeps translation scope small; see [[frontend#Localization]].
