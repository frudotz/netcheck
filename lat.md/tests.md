---
lat:
  require-code-mention: true
---
# Tests

Specifications for every Rust unit test (54 tests); each leaf is referenced by exactly one `@lat:` comment beside its test.

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

Tests for the SQLite backend ([[architecture#Local SQLite backend]]): five pure business-rule tests, then controller and domain tests in [[src-tauri/src/backend/tests.rs]] on a migrated in-memory database.

The database comes from [[src-tauri/src/backend/mod.rs#boot_memory]] with the first user registered as super admin; no file is touched. Time-dependent tests pin the clock with `set_now` on [[src-tauri/src/backend/state.rs#AppState]] instead of sleeping.

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

### Suspended session is rejected

After a support user is suspended, [[src-tauri/src/backend/policy.rs#authorize]] returns `unauthenticated` for the still-open session and [[src-tauri/src/backend/controllers.rs#auth_me]] returns null.

### Suspending the session user ends the session

When the session user is suspended by another super admin, [[src-tauri/src/backend/controllers.rs#user_set_status]] drops the in-memory session; a second active super admin may be suspended.

### No self-promotion to super admin

A user holding only `Update:User` cannot give themselves the `admin` role through [[src-tauri/src/backend/controllers.rs#user_sync_roles]]; the roles stay unchanged.

### Only a super admin grants the admin role

A delegated user with `Update:User` and `Create:User` can neither assign `admin` to another account nor create a user with that role via [[src-tauri/src/backend/controllers.rs#user_store]]; no user row is created on refusal, and other roles stay delegable.

### Only a super admin demotes or suspends an admin

A delegated user cannot remove the `admin` role from, or suspend, a super admin; both calls through [[src-tauri/src/backend/controllers.rs#user_sync_roles]] and [[src-tauri/src/backend/controllers.rs#user_set_status]] are `forbidden` and nothing changes.

### Duplicate e-mail is a conflict

[[src-tauri/src/backend/auth.rs#create_admin]] returns `conflict` for an existing e-mail (case-insensitive) and leaves the password hash, roles and the old login untouched.

### Last active super admin is protected

The only super admin can be neither suspended ([[src-tauri/src/backend/auth.rs#set_status]]) nor demoted; both return `conflict`.

### Suspended admins do not count as active

[[src-tauri/src/backend/auth.rs#active_super_admin_count]] ignores suspended admins, so suspending the second admin and then demoting the first is refused.

### Several active super admins can be managed

With two active super admins, demoting, re-promoting, suspending and reactivating the second and demoting the first all succeed through [[src-tauri/src/backend/controllers.rs#user_sync_roles]] and [[src-tauri/src/backend/controllers.rs#user_set_status]].

### Password change is an explicit flow

[[src-tauri/src/backend/controllers.rs#user_set_password]] replaces the password (old one fails, new one works), writes an audit row without the password, refuses a delegated user changing a super admin's password, allows a user's own change, and rejects a short password.

### User update changes only the name

[[src-tauri/src/backend/controllers.rs#user_update]] changes the name and leaves e-mail, password hash and roles unchanged.

### Published score rule is immutable

[[src-tauri/src/backend/domain.rs#write_policy]] rejects `crud_update` on a published `ScoreRule` with `conflict`, refuses `status: published` and invalid weights through generic CRUD, and still allows creating and editing a valid draft.

### Report fields are protected

Through generic CRUD a `Report` accepts only `shared`; [[src-tauri/src/backend/domain.rs#write_policy]] rejects `score`, `tests`, `network`, `createdAt`, `passed` and `ruleVersion`, and `crud_store` on `Report` is `forbidden`.

### Reply list is not writable through CRUD

[[src-tauri/src/backend/domain.rs#write_policy]] keeps `ContactMessage.replies` and the sender's original fields out of `crud_update`, while `status` stays writable.

### Mutation and audit roll back together

With the audit table renamed away, `crud_update` fails and the row keeps its old value, because `Db::transaction` in [[src-tauri/src/backend/db.rs]] rolls the change back with the failed audit insert.

### Report submission is bounded

[[src-tauri/src/backend/domain.rs#do_report_submit]] rejects a network object above 16 KiB, a non-ISO `createdAt`, a device id longer than 64 characters and fewer than five tests, and stores tests with only `id`, `status` and `latencyMs`.

### Contact submission is bounded

[[src-tauri/src/backend/controllers.rs#contact_submit]] rejects a message above 5000 characters and an e-mail without a domain dot.

### Reply author is the session user

[[src-tauri/src/backend/controllers.rs#contact_message_reply]] stores the caller's id as the author, marks the message answered, audits it, rejects an empty body and refuses a viewer.

### Device purge is atomic

[[src-tauri/src/backend/domain.rs#do_device_purge]] is `forbidden` for a viewer; with the audit table unavailable the device and its reports survive; on success both are gone, another device's report remains and one audit row exists.

### Export is authorized and audited

[[src-tauri/src/backend/domain.rs#do_export_authorize]] is `forbidden` for a viewer and writes no audit row; a support user may export CSV and PDF, each audited; an unknown kind is a validation error; no session is `unauthenticated`.

### PII reveal is per field and audited

[[src-tauri/src/backend/domain.rs#do_report_show]] and `crud_index` stay masked, and [[src-tauri/src/backend/domain.rs#do_report_reveal_field]] opens one field at a time under `Reveal:PII` with one `pii.reveal` audit row naming the field.

Without `Reveal:PII` the reveal is `forbidden` and writes no audit row; a super admin opens `hostname`, `dnsServer[0]` and `Wi-Fi.mac`; a whole-object field is rejected and the stored data is unchanged.

### Login is locked after repeated failures

After five failed sign-ins for one e-mail, [[src-tauri/src/backend/controllers.rs#auth_login]] returns `too_many_attempts` with the remaining seconds even for the correct password, opens no session, and accepts the password again once the lock has passed.

### Login lock is per account and success resets

Four failures followed by a correct sign-in reset the counter for that e-mail, and another account's failures do not lock the first ([[src-tauri/src/backend/state.rs#AppState]]).

### First-admin bootstrap is not rate limited

Failed sign-ins on an empty database lock that e-mail for `auth_login` but leave `auth_register` ([[src-tauri/src/backend/controllers.rs#auth_register]]) free to create the first super admin.

### Idle session expires

Activity within 30 minutes keeps the session alive and restarts the idle timer; after 30 idle minutes a protected command is `unauthenticated`, `auth_me` is null, the session record is gone, and a new sign-in works ([[src-tauri/src/backend/state.rs#AppState]]).

### Absolute session lifetime expires

A session touched every 15 minutes stays valid for 12 hours and is dropped once the absolute lifetime in [[src-tauri/src/backend/state.rs#AppState]] has passed.

### Suspension still ends the session with expiry in place

With expiry enforced, banning the session user still makes the next call `unauthenticated` and `auth_me` null ([[src-tauri/src/backend/policy.rs#authorize]]).

### Reserved role name variants are rejected

`Admin`, `ADMIN`, ` admin ` and `aDmIn` are refused by [[src-tauri/src/backend/controllers.rs#role_store]] and as a new name in [[src-tauri/src/backend/controllers.rs#role_update]] ([[src-tauri/src/backend/rbac.rs#is_reserved_role_name]]); a delegated user granting such a variant to another account or to themselves is `forbidden`, as is creating a user with it.

### Diagnostic targets are read only

`DiagnosticTarget` lists its five rows, while `crud_update`, `crud_store` and `crud_destroy` on it are `forbidden` and the stored target stays unchanged ([[src-tauri/src/backend/schema.rs#DIAGNOSTIC_TARGET]]).
