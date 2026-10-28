// Bağlantı: Rust `get_network_snapshot` yanıtı (serde `camelCase` ile birebir).
// Kaynak: src-tauri/src/network.rs

/** Bağlantı türü; Rust arayüz türünden çıkarılır. */
export type ConnectionType = "ethernet" | "wifi" | "cellular" | "unknown";

/** Tek bir ağ arayüzü. */
export interface NetworkInterface {
  // Zorunlu
  /** İşletim sisteminin verdiği ad (ör. "Wi-Fi"); aynı ad iki arayüzde görülebilir. */
  name: string;
  /** Arayüzün bağlantı türü (Rust'ta `kind`, JSON'da `type`). */
  type: ConnectionType;
  /** Arayüz açık mı. */
  isUp: boolean;
  /** Varsayılan yolun geçtiği arayüz mü. */
  isDefault: boolean;
  // İsteğe bağlı (değer alınamazsa alan hiç gelmez)
  /** IPv4 adresi. */
  ipv4?: string;
  /** IPv6 adresi. */
  ipv6?: string;
  /** Donanım (MAC) adresi. */
  mac?: string;
}

/** Cihazın o anki ağ durumu. */
export interface NetworkSnapshot {
  // Zorunlu
  /** Sistemin DNS sunucuları; okunamazsa boş liste. */
  dnsServers: string[];
  /** Varsayılan arayüzün bağlantı türü. */
  connectionType: ConnectionType;
  /** Bütün arayüzler. */
  interfaces: NetworkInterface[];
  // İsteğe bağlı (değer alınamazsa alan hiç gelmez)
  /** Cihaz adı. */
  hostname?: string;
  /** Varsayılan arayüzün IPv4 adresi. */
  localIPv4?: string;
  /** Varsayılan arayüzün IPv6 adresi. */
  localIPv6?: string;
  /** Varsayılan ağ geçidi adresi; mobil veride çoğunlukla yoktur. */
  gateway?: string;
  /** Varsayılan arayüzün görünen adı. */
  interfaceName?: string;
}

/** Genel Bakış'taki bağlantı durumu; HTTPS testinin sonucundan türetilir, Rust'tan gelmez. */
export type LinkState = "checking" | "online" | "no-internet" | "offline" | "unknown";
