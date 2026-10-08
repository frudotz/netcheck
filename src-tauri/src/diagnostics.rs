// Tanılama testleri — hedefler burada sabittir; ön yüz yalnızca test türünü (enum) seçer.
// Kullanıcı girdisi hiçbir zaman kabuğa veya sistem komutuna aktarılmaz.
use std::net::{IpAddr, Ipv4Addr, ToSocketAddrs};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

use crate::network;
use crate::platform::{self, icmp::EchoError};

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

/// Platform arka ucu (`platform::icmp`) sonucunu tanılama durum/kod modeline çevirir.
fn ping(addr: IpAddr) -> Result<f64, Failure> {
    platform::icmp::echo(addr, TIMEOUT).map_err(|e| match e {
        EchoError::Timeout => (Status::Failed, "timeout"),
        EchoError::Unreachable => (Status::Failed, "unreachable"),
        EchoError::Unsupported => UNSUPPORTED,
    })
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
}
