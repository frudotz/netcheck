// NetCheck veri modelleri — Rust tarafındaki serde yapılarıyla birebir (camelCase).

export type ConnectionType = "ethernet" | "wifi" | "unknown";

export interface NetworkInterface {
  name: string;
  ipv4?: string;
  ipv6?: string;
  mac?: string;
  type: ConnectionType;
  isUp: boolean;
  isDefault: boolean;
}

export interface NetworkSnapshot {
  hostname?: string;
  localIPv4?: string;
  localIPv6?: string;
  gateway?: string;
  dnsServers: string[];
  connectionType: ConnectionType;
  interfaceName?: string;
  interfaces: NetworkInterface[];
}
