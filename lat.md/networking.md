# Networking

All network facts and measurements come from Rust, using OS APIs available to an unprivileged app; nothing is estimated or synthesized.

## Network snapshot

[[src-tauri/src/network.rs#snapshot]] describes the default interface plus all up interfaces, using `netdev` for addresses, gateway, DNS servers, and interface type.

Fields: connection type, interface name, local IPv4, preferred IPv6, gateway, DNS servers, device name, and the interface list with MAC addresses.

### Gateway selection

[[src-tauri/src/network.rs#pick_gateway]] returns the first usable IPv4 gateway, then IPv6, excluding unspecified addresses and the interface's own addresses.

Cellular point-to-point routes can list the phone's own address as the next hop (seen on Turkcell, `0.0.0.0/0 -> <own IP>`). Pinging it produced a fake 0.1 ms "gateway reachable". With the rule, such networks show "Bulunamadı" and the gateway test reports "Kullanılamıyor". The rule is OS-independent, so it lives in `network.rs`, not the platform layer.

### Interface facts

Connection type, IPv6 choice, and MAC display apply filters so the UI never shows misleading values.

- [[src-tauri/src/network.rs#connection_type]] maps `netdev` types to [[src-tauri/src/network.rs#ConnectionType]]: Ethernet variants, Wi-Fi, and WWAN variants as cellular ("Mobil veri"); anything else is unknown.
- [[src-tauri/src/network.rs#preferred_ipv6]] prefers a global address over unique-local over link-local. A Wi-Fi network with only link-local IPv6 therefore shows IPv6 as unavailable.
- [[src-tauri/src/network.rs#mac_string]] hides the placeholder `02:00:00:00:00:00` that Android and iOS return to apps.
- Interface names are not unique (macOS reported two interfaces named "iPhone"), so the overview keys its list by position plus name ([[src/components/Overview.svelte]]).

### DNS servers and device name

DNS server discovery and the device name depend on what each OS exposes, and may legitimately be empty.

- DNS servers come from `netdev`: Windows APIs, Android `LinkProperties` via JNI, macOS SystemConfiguration, Linux `/etc/resolv.conf`, and on iOS only `/etc/resolv.conf` (SystemConfiguration is excluded from iOS builds, see [[decisions#netdev features per target]]). An empty list renders as "Bulunamadı" (dictionary key `bulunamadi` in [[src/lib/sozluk.ts#sozluk]]). This list is independent of the DNS diagnostic, which uses the system resolver, so "Bulunamadı" can coexist with a passing DNS test.
- [[src-tauri/src/platform/device.rs#name]] uses the OS hostname on desktop and iOS. On Android it reads `Settings.Global "device_name"` via JNI, falling back to `Build.MODEL`. On mobile, `localhost` placeholders are hidden.

## Ping backends

ICMP echo is implemented per platform in [[src-tauri/src/platform/icmp.rs]]; the active backend is reported as [[src-tauri/src/platform/icmp.rs#Backend]].

Targets are always a validated `IpAddr`; IPv6 targets return [[src-tauri/src/platform/icmp.rs#EchoError]] `Unsupported` on every backend in this version.

| Target | Backend | Mechanism |
|---|---|---|
| Windows | `icmp-api` | iphlpapi `IcmpSendEcho`; no administrator rights |
| macOS, Linux | `system-ping` | system `ping` binary with fixed arguments built only from the `IpAddr` |
| Android | `icmp-socket` | unprivileged `SOCK_DGRAM` + `IPPROTO_ICMP` socket |
| iOS | `icmp-socket` | Darwin unprivileged ICMP datagram socket |

### Android ICMP socket

Android allows ICMP datagram sockets for apps (`ping_group_range 0 2147483647`); the kernel assigns each socket its own echo identifier.

Each request uses its own unconnected socket and a constant sequence number 1. A process-wide incrementing sequence lost 8.8.8.8 replies when several pings ran concurrently behind the emulator's NAT; see [[decisions#Constant ICMP sequence on Android]].

### Darwin ICMP socket

XNU supports the same unprivileged socket type as Apple's SimplePing sample, but returns the IPv4 header and does not demultiplex replies by identifier.

The Darwin path therefore sets a per-socket identifier and accepts a reply only when source address, identifier, and sequence all match, so concurrent pings cannot take each other's replies. It is used by iOS builds; macOS desktop keeps `system-ping`, and a macOS-only unit test exercises the socket against loopback ([[tests#ICMP#Darwin concurrent loopback]]). On-device iOS behavior is not reproducibly verified; see [[platforms#iOS]].

## Diagnostics

[[src-tauri/src/diagnostics.rs#run]] executes one of five fixed tests, each bounded by [[src-tauri/src/diagnostics.rs#TIMEOUT]] (4 s).

| Kind | Test | Implementation |
|---|---|---|
| `gateway` | ICMP to the snapshot gateway; "Kullanılamıyor" when none | [[src-tauri/src/diagnostics.rs#ping]] |
| `cloudflare` | ICMP to 1.1.1.1 | [[src-tauri/src/diagnostics.rs#ping]] |
| `google` | ICMP to 8.8.8.8 | [[src-tauri/src/diagnostics.rs#ping]] |
| `dns` | resolve `cloudflare.com` with the system resolver | [[src-tauri/src/diagnostics.rs#resolve]] |
| `internet` | HTTPS GET `https://www.cloudflare.com/cdn-cgi/trace` | [[src-tauri/src/diagnostics.rs#https_check]] |

The HTTPS test also yields the public IP. [[src-tauri/src/diagnostics.rs#parse_trace_ip]] accepts the `ip=` line only if it parses as an IP address, and the body read is capped. Outcomes carry a status (success, failed, unavailable), latency, and a code that [[src/lib/labels.ts]] turns into Turkish text.
