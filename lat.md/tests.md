---
lat:
  require-code-mention: true
---
# Tests

Specifications for every Rust unit test (25 tests); each leaf is referenced by exactly one `@lat:` comment beside its test.

Run with `cd src-tauri && cargo test`. Some tests touch the real network or are limited to certain targets, as noted. There are no frontend unit tests; UI behavior is verified manually or with browser automation ([[workflows#Build and checks]]).

## Report IDs

Tests for [[src-tauri/src/report_id.rs#generate]] and its UTC year calculation ([[decisions#Report IDs come from Rust]]).

### Year boundaries

The year is derived correctly at the epoch, on a leap day, and exactly at the 2025/2026 UTC boundary.

### Stable format

A generated ID has the form `NCHK-YYYY-XXXXXXXX` with a 4-digit year and 8 uppercase hexadecimal digits.

### Burst uniqueness

Ten thousand IDs generated in a burst are all distinct.

This test is known to be flaky. With a 32-bit suffix, the birthday bound gives about a 1.2% chance of at least one collision ([[tasks#Deferred#NC-08 Flaky report ID burst test]]).

## Network snapshot

Tests for [[src-tauri/src/network.rs]] snapshot assembly and filtering ([[networking#Network snapshot]]).

### Own address is never the gateway

[[src-tauri/src/network.rs#pick_gateway]] drops a gateway equal to an interface's own address (the Turkcell case), keeps a separate LAN gateway, and ignores the unspecified address.

### Cellular interfaces map to cellular

[[src-tauri/src/network.rs#connection_type]] maps WWAN types to cellular, 802.11 to Wi-Fi, and unrelated types such as tunnels to unknown.

### Global IPv6 filter

Link-local and unique-local IPv6 addresses are not treated as global, while a public address is.

### Live snapshot smoke

Building a snapshot on the test machine does not panic and lists only interfaces that are up; it depends on the host network.

## ICMP

Tests for the ping backends in [[src-tauri/src/platform/icmp.rs]] ([[networking#Ping backends]]).

### Echo request checksum

An echo request carries type 8, the given identifier and sequence number, and an RFC 1071 checksum that verifies to zero.

### Echo reply matching

A Linux/Android-style reply without an IP header matches only an echo reply (type 0) with the expected sequence number, and short buffers are rejected.

### Darwin reply with IP header

A Darwin-style reply is accepted only after skipping the IPv4 header and only when both identifier and sequence match. A wrong identifier, a missing header, or a truncated packet is rejected.

### Darwin concurrent loopback

Three concurrent Darwin socket pings to 127.0.0.1 all succeed on a real XNU kernel; compiled only on macOS, so it runs in the macOS CI job.

### IPv6 targets are unsupported

Every backend returns `Unsupported` for an IPv6 target instead of attempting or faking a ping.

### Unroutable address fails cleanly

On desktop, pinging TEST-NET-1 (192.0.2.1) ends in a timeout or unreachable error within the deadline rather than hanging or panicking.

## Platform info

Tests for [[src-tauri/src/platform/mod.rs#info]] and [[src-tauri/src/platform/device.rs#name]] on desktop builds.

### Desktop family

A desktop build reports the desktop family, the compile-time OS, and a ping backend other than unavailable.

### Desktop keeps OS hostname

On desktop the device name equals the trimmed OS hostname, and the mobile-only `localhost` placeholder filter is not applied.

## Diagnostics

Tests for [[src-tauri/src/diagnostics.rs]] ([[networking#Diagnostics]]).

### Trace IP parsing

[[src-tauri/src/diagnostics.rs#parse_trace_ip]] extracts IPv4 and IPv6 values from the Cloudflare trace body and rejects missing or non-IP values such as injected markup.

### Live diagnostics smoke

All five diagnostics return without panicking, and any successful outcome carries a latency; results depend on the host network.

### Known kinds parse

Each of the five kind names the frontend sends (`gateway`, `cloudflare`, `google`, `dns`, `internet`) parses to its [[src-tauri/src/diagnostics.rs#DiagnosticKind]] (course Task 15, success case).

### Unknown kind is a typed error

Unknown, empty, differently cased and injection-like values parse to `CommandError::UnknownDiagnostic` carrying the input, instead of panicking or reaching a target (course Task 15, error case).

## Commands

Tests for the typed command error in [[src-tauri/src/command_error.rs]] ([[architecture#IPC contract]]).

### Error serialization

`CommandError` serializes as `{ "code": "task_failed" }` and `{ "code": "unknown_diagnostic", "value": … }`, the shape `src/lib/types/command.ts` expects.

## Local backend

Tests for the SQLite backend's pure business rules ([[architecture#Local SQLite backend]]); no test opens a database.

### Email validation

Email validation accepts a normal address and rejects a domain without a dot, embedded whitespace, and an empty local part.

### Password hash roundtrip

An Argon2id hash verifies the original password and rejects a different one.

### Score vectors

[[src-tauri/src/backend/domain.rs#compute_score]] returns 100 for all-pass fast results (capped), 94 for all-pass slow pings, 0 when everything fails, and 35 for internet only, matching [[frontend#Connection score]].

### Levels and report IDs

Score levels switch at 80 and 50, and [[src-tauri/src/backend/domain.rs#is_report_id]] accepts only the uppercase `NCHK-YYYY-XXXXXXXX` form.

### Rule validation and masking

The default rule validates, and a rule whose test weights no longer total 90 is rejected. [[src-tauri/src/backend/domain.rs#mask_network]] masks the hostname, DNS servers, and MAC addresses while keeping interface names.
