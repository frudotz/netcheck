// Ağ anlık görüntüsü — yerel arayüzler, IP adresleri, gateway, DNS ve hostname.
// Değer alınamazsa alan boş (None / boş liste) döner; ön yüz "Kullanılamıyor" gösterir.
use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};

use netdev::interface::types::InterfaceType;
use netdev::Interface;
use serde::Serialize;

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionType {
    Ethernet,
    Wifi,
    Unknown,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NetworkInterface {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ipv4: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ipv6: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac: Option<String>,
    #[serde(rename = "type")]
    pub kind: ConnectionType,
    pub is_up: bool,
    pub is_default: bool,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NetworkSnapshot {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hostname: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "localIPv4")]
    pub local_ipv4: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "localIPv6")]
    pub local_ipv6: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gateway: Option<String>,
    pub dns_servers: Vec<String>,
    pub connection_type: ConnectionType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interface_name: Option<String>,
    pub interfaces: Vec<NetworkInterface>,
}

fn connection_type(kind: InterfaceType) -> ConnectionType {
    match kind {
        InterfaceType::Ethernet
        | InterfaceType::Ethernet3Megabit
        | InterfaceType::GigabitEthernet
        | InterfaceType::FastEthernetT
        | InterfaceType::FastEthernetFx => ConnectionType::Ethernet,
        InterfaceType::Wireless80211 => ConnectionType::Wifi,
        _ => ConnectionType::Unknown,
    }
}

/// Windows'ta `friendly_name` ("Wi-Fi", "Ethernet") GUID adından daha okunaklıdır.
fn display_name(iface: &Interface) -> String {
    iface.friendly_name.clone().unwrap_or_else(|| iface.name.clone())
}

fn is_link_local_v6(addr: &Ipv6Addr) -> bool {
    (addr.segments()[0] & 0xffc0) == 0xfe80
}

fn is_unique_local_v6(addr: &Ipv6Addr) -> bool {
    (addr.segments()[0] & 0xfe00) == 0xfc00
}

fn is_global_v6(addr: &Ipv6Addr) -> bool {
    !addr.is_loopback() && !addr.is_unspecified() && !is_link_local_v6(addr) && !is_unique_local_v6(addr)
}

/// Öncelik: global → unique-local (fc00::/7). Link-local (fe80::/10) yerel IPv6 sayılmaz.
fn preferred_ipv6(iface: &Interface) -> Option<Ipv6Addr> {
    let addrs = iface.ipv6_addrs();
    addrs
        .iter()
        .find(|a| is_global_v6(a))
        .or_else(|| addrs.iter().find(|a| is_unique_local_v6(a)))
        .copied()
}

fn first_ipv4(iface: &Interface) -> Option<Ipv4Addr> {
    iface.ipv4_addrs().into_iter().find(|a| !a.is_loopback() && !a.is_unspecified())
}

fn mac_string(iface: &Interface) -> Option<String> {
    iface
        .mac_addr
        .filter(|m| m.octets() != [0u8; 6])
        .map(|m| m.to_string().to_uppercase())
}

fn to_interface(iface: &Interface) -> NetworkInterface {
    NetworkInterface {
        name: display_name(iface),
        ipv4: first_ipv4(iface).map(|a| a.to_string()),
        ipv6: preferred_ipv6(iface)
            .or_else(|| iface.ipv6_addrs().first().copied())
            .map(|a| a.to_string()),
        mac: mac_string(iface),
        kind: connection_type(iface.if_type),
        is_up: iface.is_up(),
        is_default: iface.default,
    }
}

/// Sırayı koruyarak tekrarları atar (Windows aynı DNS'i birden fazla kez bildirebilir).
fn unique_strings(addrs: &[IpAddr]) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for a in addrs {
        let s = a.to_string();
        if !out.contains(&s) {
            out.push(s);
        }
    }
    out
}

pub fn hostname() -> Option<String> {
    let name = gethostname::gethostname().to_string_lossy().trim().to_string();
    (!name.is_empty()).then_some(name)
}

/// Varsayılan IPv4 gateway (varsa). Tanılama testleri de bu fonksiyonu kullanır.
pub fn default_gateway() -> Option<IpAddr> {
    let iface = netdev::get_default_interface().ok()?;
    let gw = iface.gateway?;
    gw.ipv4
        .into_iter()
        .find(|a| !a.is_unspecified())
        .map(IpAddr::V4)
        .or_else(|| gw.ipv6.into_iter().find(|a| !a.is_unspecified()).map(IpAddr::V6))
}

pub fn snapshot() -> NetworkSnapshot {
    let default = netdev::get_default_interface().ok();

    let mut interfaces: Vec<NetworkInterface> = netdev::get_interfaces()
        .iter()
        .filter(|i| i.is_up() && !i.is_loopback() && (i.has_ipv4() || i.has_ipv6()))
        .map(to_interface)
        .collect();
    // Varsayılan arayüz listenin başında.
    interfaces.sort_by_key(|i| !i.is_default);

    let (local_ipv4, local_ipv6, connection, interface_name, dns_servers) = match &default {
        Some(iface) => (
            first_ipv4(iface).map(|a| a.to_string()),
            preferred_ipv6(iface).map(|a| a.to_string()),
            connection_type(iface.if_type),
            Some(display_name(iface)),
            unique_strings(&iface.dns_servers),
        ),
        None => (None, None, ConnectionType::Unknown, None, Vec::new()),
    };

    NetworkSnapshot {
        hostname: hostname(),
        local_ipv4,
        local_ipv6,
        gateway: default_gateway().map(|a| a.to_string()),
        dns_servers,
        connection_type: connection,
        interface_name,
        interfaces,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snapshot_does_not_panic() {
        let snap = snapshot();
        println!("{}", serde_json::to_string_pretty(&snap).unwrap());
        assert!(snap.interfaces.iter().all(|i| i.is_up));
    }

    #[test]
    fn global_v6_filter() {
        assert!(!is_global_v6(&"fe80::1".parse().unwrap()));
        assert!(!is_global_v6(&"fd00::1".parse().unwrap()));
        assert!(is_global_v6(&"2001:4860:4860::8888".parse().unwrap()));
    }
}
