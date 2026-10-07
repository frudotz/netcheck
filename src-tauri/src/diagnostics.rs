// Tanılama testleri — hedefler burada sabittir; ön yüz yalnızca test türünü (enum) seçer.
// Kullanıcı girdisi hiçbir zaman kabuğa veya sistem komutuna aktarılmaz.
use std::net::{IpAddr, Ipv4Addr, ToSocketAddrs};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

use crate::network;

const TIMEOUT: Duration = Duration::from_secs(4);
const CLOUDFLARE: Ipv4Addr = Ipv4Addr::new(1, 1, 1, 1);
const GOOGLE_DNS: Ipv4Addr = Ipv4Addr::new(8, 8, 8, 8);
const DNS_HOST: &str = "cloudflare.com";
const INTERNET_URL: &str = "https://www.cloudflare.com/cdn-cgi/trace";

#[derive(Deserialize, Clone, Copy, Debug)]
#[serde(rename_all = "lowercase")]
pub enum DiagnosticKind {
    Gateway,
    Cloudflare,
    Google,
    Dns,
    Internet,
}

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Status {
    Success,
    Failed,
    Unavailable,
}

/// `code` makine tarafından okunur; Türkçe mesaj ön yüzde üretilir (ham hata gösterilmez).
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticOutcome {
    pub status: Status,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latency_ms: Option<f64>,
    pub code: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

type Failure = (Status, &'static str);

const UNSUPPORTED: Failure = (Status::Unavailable, "ping_unsupported");

fn outcome(target: String, result: Result<(f64, Option<String>), Failure>) -> DiagnosticOutcome {
    match result {
        Ok((latency, detail)) => DiagnosticOutcome {
            status: Status::Success,
            target: Some(target),
            latency_ms: Some(latency),
            code: "ok",
            detail,
        },
        Err((status, code)) => DiagnosticOutcome {
            status,
            target: Some(target),
            latency_ms: None,
            code,
            detail: None,
        },
    }
}

fn elapsed_ms(start: Instant) -> f64 {
    (start.elapsed().as_secs_f64() * 1000.0 * 10.0).round() / 10.0
}

pub fn run(kind: DiagnosticKind) -> DiagnosticOutcome {
    match kind {
        DiagnosticKind::Gateway => match network::default_gateway() {
            Some(gw) => outcome(gw.to_string(), ping(gw).map(|ms| (ms, None))),
            None => DiagnosticOutcome {
                status: Status::Unavailable,
                target: None,
                latency_ms: None,
                code: "no_gateway",
                detail: None,
            },
        },
        DiagnosticKind::Cloudflare => outcome(CLOUDFLARE.to_string(), ping(CLOUDFLARE.into()).map(|ms| (ms, None))),
        DiagnosticKind::Google => outcome(GOOGLE_DNS.to_string(), ping(GOOGLE_DNS.into()).map(|ms| (ms, None))),
        DiagnosticKind::Dns => outcome(DNS_HOST.to_string(), resolve(DNS_HOST)),
        DiagnosticKind::Internet => outcome(INTERNET_URL.to_string(), https_check(INTERNET_URL)),
    }
}

// ---------------------------------------------------------------- ICMP

/// Windows: iphlpapi `IcmpSendEcho` — yönetici yetkisi gerektirmez, gerçek RTT döner.
#[cfg(windows)]
fn ping(addr: IpAddr) -> Result<f64, Failure> {
    use std::mem::size_of;
    use std::ptr;
    use windows_sys::Win32::Foundation::{GetLastError, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::NetworkManagement::IpHelper::{
        IcmpCloseHandle, IcmpCreateFile, IcmpSendEcho, ICMP_ECHO_REPLY, IP_REQ_TIMED_OUT, IP_SUCCESS,
    };

    // IPv6 hedefler (yalnızca IPv6 gateway) bu sürümde desteklenmez.
    let IpAddr::V4(v4) = addr else { return Err(UNSUPPORTED) };

    let payload = *b"NetCheck";
    // Yanıt arabelleği: yanıt yapısı + veri + ICMP hata mesajı için pay (MS belgelerindeki öneri).
    let mut reply = vec![0u8; size_of::<ICMP_ECHO_REPLY>() + payload.len() + 8 + 64];

    unsafe {
        let handle = IcmpCreateFile();
        if handle == INVALID_HANDLE_VALUE {
            return Err((Status::Unavailable, "ping_unsupported"));
        }
        let count = IcmpSendEcho(
            handle,
            u32::from_ne_bytes(v4.octets()), // ağ bayt sırası
            payload.as_ptr().cast(),
            payload.len() as u16,
            ptr::null(),
            reply.as_mut_ptr().cast(),
            reply.len() as u32,
            TIMEOUT.as_millis() as u32,
        );
        let last_error = GetLastError();
        IcmpCloseHandle(handle);

        if count == 0 {
            return Err((Status::Failed, if last_error == IP_REQ_TIMED_OUT { "timeout" } else { "unreachable" }));
        }
        // Vec<u8> hizalı değildir; yapı hizasız okunur.
        let echo = ptr::read_unaligned(reply.as_ptr().cast::<ICMP_ECHO_REPLY>());
        match echo.Status {
            IP_SUCCESS => Ok(echo.RoundTripTime as f64),
            IP_REQ_TIMED_OUT => Err((Status::Failed, "timeout")),
            _ => Err((Status::Failed, "unreachable")),
        }
    }
}

/// Diğer platformlar: sistem `ping` ikilisi; kabuk kullanılmaz, hedef yalnızca doğrulanmış `IpAddr`.
#[cfg(not(windows))]
fn ping(addr: IpAddr) -> Result<f64, Failure> {
    use std::process::Command;

    let IpAddr::V4(v4) = addr else { return Err(UNSUPPORTED) };
    let secs = TIMEOUT.as_secs().max(1).to_string();
    let mut cmd = Command::new("ping");
    cmd.args(["-n", "-c", "1"]);
    if cfg!(target_os = "macos") {
        cmd.args(["-t", &secs]);
    } else {
        cmd.args(["-W", &secs]);
    }
    cmd.arg(v4.to_string());

    let output = cmd.output().map_err(|_| UNSUPPORTED)?;
    if !output.status.success() {
        return Err((Status::Failed, "timeout"));
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout
        .split("time=")
        .nth(1)
        .and_then(|rest| rest.split(|c: char| !(c.is_ascii_digit() || c == '.')).next())
        .and_then(|ms| ms.parse::<f64>().ok())
        .ok_or((Status::Failed, "unreachable"))
}

// ---------------------------------------------------------------- DNS

/// Sistem çözümleyicisi; std zaman aşımı sunmadığı için ayrı thread + `recv_timeout`.
fn resolve(host: &'static str) -> Result<(f64, Option<String>), Failure> {
    let (tx, rx) = mpsc::channel();
    let start = Instant::now();
    thread::spawn(move || {
        let result = (host, 443).to_socket_addrs().map(|addrs| addrs.map(|a| a.ip()).collect::<Vec<_>>());
        let _ = tx.send(result);
    });
    match rx.recv_timeout(TIMEOUT) {
        Ok(Ok(ips)) if !ips.is_empty() => {
            let latency = elapsed_ms(start);
            // IPv4 yanıtı varsa onu göster.
            let shown = ips.iter().find(|ip| ip.is_ipv4()).or(ips.first()).map(|ip| ip.to_string());
            Ok((latency, shown))
        }
        Ok(_) => Err((Status::Failed, "resolve_failed")),
        Err(_) => Err((Status::Failed, "timeout")),
    }
}

// ---------------------------------------------------------------- HTTPS

fn https_check(url: &str) -> Result<(f64, Option<String>), Failure> {
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .timeout_global(Some(TIMEOUT))
        .build()
        .into();
    let start = Instant::now();
    match agent.get(url).call() {
        Ok(mut response) => {
            let latency = elapsed_ms(start);
            // cdn-cgi/trace gövdesindeki "ip=" satırı genel IP'dir; yalnızca geçerli bir IP ise kullanılır.
            let public_ip = response
                .body_mut()
                .with_config()
                .limit(4096)
                .read_to_string()
                .ok()
                .and_then(|body| parse_trace_ip(&body));
            Ok((latency, public_ip))
        }
        Err(ureq::Error::Timeout(_)) => Err((Status::Failed, "timeout")),
        Err(ureq::Error::StatusCode(_)) => Err((Status::Failed, "http_error")),
        Err(ureq::Error::HostNotFound) => Err((Status::Failed, "resolve_failed")),
        Err(_) => Err((Status::Failed, "connection_failed")),
    }
}

fn parse_trace_ip(body: &str) -> Option<String> {
    body.lines()
        .find_map(|line| line.strip_prefix("ip="))
        .and_then(|value| value.trim().parse::<IpAddr>().ok())
        .map(|ip| ip.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trace_ip_parsing() {
        assert_eq!(parse_trace_ip("fl=1\nip=203.0.113.7\nts=1"), Some("203.0.113.7".into()));
        assert_eq!(parse_trace_ip("ip=2001:db8::1\n"), Some("2001:db8::1".into()));
        assert_eq!(parse_trace_ip("ip=<script>\n"), None);
        assert_eq!(parse_trace_ip("fl=1\n"), None);
    }

    #[test]
    fn all_diagnostics_return_without_panicking() {
        for kind in [
            DiagnosticKind::Gateway,
            DiagnosticKind::Cloudflare,
            DiagnosticKind::Google,
            DiagnosticKind::Dns,
            DiagnosticKind::Internet,
        ] {
            let out = run(kind);
            println!("{kind:?}: {}", serde_json::to_string(&out).unwrap());
            if out.status == Status::Success {
                assert!(out.latency_ms.is_some());
            }
        }
    }

    #[test]
    fn unroutable_address_fails_cleanly() {
        // TEST-NET-1 (RFC 5737) — yanıt vermemesi beklenir.
        let result = ping(IpAddr::V4(Ipv4Addr::new(192, 0, 2, 1)));
        assert!(matches!(result, Err((Status::Failed, _))));
    }
}
