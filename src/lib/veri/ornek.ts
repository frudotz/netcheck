// Görev 11 örnek verisi: veri sözleşmesinin (src/lib/types) her ana tipinden 6 kayıt.
//
// Bu dosya YALNIZ tiplerin nasıl doldurulduğunu gösterir ve `bun run check` ile tiplere uygunluğu
// denetlenir. Hiçbir ekran, store ya da Rust komutu bu dosyayı içe aktarmaz; uygulama gerçek
// olmayan ağ verisi göstermez (AGENTS.md § 4, "Sahte veri yasak").
//
// Adresler belgeleme için ayrılmış aralıklardandır ve gerçek bir cihaza ait değildir:
// IPv4 RFC 5737 (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24), IPv6 RFC 3849 (2001:db8::/32),
// MAC RFC 7042 (00:00:5E:00:53:xx). 1.1.1.1, 8.8.8.8 ve cloudflare.com uygulamanın sabit test hedefleridir.
// Mesajlar ve skorlar src/lib/labels.ts ile src/lib/score.ts'in ürettiği değerlerle aynıdır.
import type { DiagnosticReport, DiagnosticTest, NetworkSnapshot } from "../types";

const HTTPS_HEDEFI = "https://www.cloudflare.com/cdn-cgi/trace";

/** Altı ağ durumu: Wi-Fi, kablolu, mobil veri, yavaş Wi-Fi, DNS sorunu, internetsiz yerel ağ. */
export const ornekAgDurumlari: NetworkSnapshot[] = [
  {
    hostname: "ornek-dizustu",
    localIPv4: "192.0.2.24",
    localIPv6: "2001:db8::24",
    gateway: "192.0.2.1",
    dnsServers: ["192.0.2.1"],
    connectionType: "wifi",
    interfaceName: "Wi-Fi",
    interfaces: [
      { name: "Wi-Fi", ipv4: "192.0.2.24", ipv6: "2001:db8::24", mac: "00:00:5E:00:53:01", type: "wifi", isUp: true, isDefault: true },
      { name: "Ethernet", mac: "00:00:5E:00:53:02", type: "ethernet", isUp: false, isDefault: false },
    ],
  },
  {
    hostname: "ornek-masaustu",
    localIPv4: "198.51.100.40",
    gateway: "198.51.100.1",
    dnsServers: ["198.51.100.53", "198.51.100.54"],
    connectionType: "ethernet",
    interfaceName: "Ethernet",
    interfaces: [
      { name: "Ethernet", ipv4: "198.51.100.40", mac: "00:00:5E:00:53:10", type: "ethernet", isUp: true, isDefault: true },
    ],
  },
  {
    localIPv4: "203.0.113.77",
    dnsServers: [],
    connectionType: "cellular",
    interfaceName: "rmnet_data0",
    interfaces: [
      { name: "rmnet_data0", ipv4: "203.0.113.77", type: "cellular", isUp: true, isDefault: true },
      { name: "wlan0", type: "wifi", isUp: false, isDefault: false },
    ],
  },
  {
    hostname: "ornek-tablet",
    localIPv4: "192.0.2.150",
    gateway: "192.0.2.1",
    dnsServers: ["192.0.2.1"],
    connectionType: "wifi",
    interfaceName: "wlan0",
    interfaces: [
      { name: "wlan0", ipv4: "192.0.2.150", mac: "00:00:5E:00:53:20", type: "wifi", isUp: true, isDefault: true },
    ],
  },
  {
    hostname: "ornek-dizustu-2",
    localIPv4: "198.51.100.12",
    gateway: "198.51.100.1",
    dnsServers: ["198.51.100.53"],
    connectionType: "wifi",
    interfaceName: "Wi-Fi",
    interfaces: [
      { name: "Wi-Fi", ipv4: "198.51.100.12", mac: "00:00:5E:00:53:30", type: "wifi", isUp: true, isDefault: true },
    ],
  },
  {
    hostname: "ornek-masaustu-2",
    localIPv4: "192.0.2.88",
    gateway: "192.0.2.1",
    dnsServers: ["192.0.2.1"],
    connectionType: "ethernet",
    interfaceName: "Ethernet",
    interfaces: [
      { name: "Ethernet", ipv4: "192.0.2.88", mac: "00:00:5E:00:53:40", type: "ethernet", isUp: true, isDefault: true },
      { name: "Ethernet", type: "ethernet", isUp: false, isDefault: false },
    ],
  },
];

/** Altı test sonucu: başarı, gecikme, zaman aşımı, ağ geçidi yok, DNS hatası, HTTPS hatası. */
export const ornekTestler: DiagnosticTest[] = [
  { id: "gateway", name: "Gateway", target: "192.0.2.1", status: "success", latencyMs: 2.4, message: "Ağ geçidi yanıt verdi." },
  { id: "cloudflare", name: "Cloudflare", target: "1.1.1.1", status: "success", latencyMs: 18, message: "Hedef yanıt verdi." },
  { id: "google", name: "Google DNS", target: "8.8.8.8", status: "failed", message: "Zaman aşımı: yanıt alınamadı." },
  { id: "gateway", name: "Gateway", target: "Varsayılan ağ geçidi", status: "unavailable", message: "Gateway bulunamadı." },
  { id: "dns", name: "DNS Çözümleme", target: "cloudflare.com", status: "failed", message: "DNS çözümlemesi başarısız." },
  { id: "internet", name: "İnternet (HTTPS)", target: HTTPS_HEDEFI, status: "failed", message: "HTTPS bağlantısı kurulamadı." },
];

/** Beş testin hepsinin başarılı olduğu bir set; ping gecikmeleri ve genel IP parametre. */
function basarili(gateway: string, cfMs: number, googleMs: number, genelIp: string): DiagnosticTest[] {
  return [
    { id: "gateway", name: "Gateway", target: gateway, status: "success", latencyMs: 2.1, message: "Ağ geçidi yanıt verdi." },
    { id: "cloudflare", name: "Cloudflare", target: "1.1.1.1", status: "success", latencyMs: cfMs, message: "Hedef yanıt verdi." },
    { id: "google", name: "Google DNS", target: "8.8.8.8", status: "success", latencyMs: googleMs, message: "Hedef yanıt verdi." },
    { id: "dns", name: "DNS Çözümleme", target: "cloudflare.com", status: "success", latencyMs: 12, message: "cloudflare.com → 198.51.100.7" },
    { id: "internet", name: "İnternet (HTTPS)", target: HTTPS_HEDEFI, status: "success", latencyMs: 96, message: `HTTPS bağlantısı başarılı · Genel IP ${genelIp}` },
  ];
}

/**
 * Altı rapor. Skorlar src/lib/score.ts ile hesaplanmıştır:
 * İnternet 35 + DNS 20 + Gateway 15 + 1.1.1.1 10 + 8.8.8.8 10 + gecikme bonusu (en çok 100).
 */
export const ornekRaporlar: DiagnosticReport[] = [
  {
    id: "NCHK-2026-0000000A",
    createdAt: "2026-10-20T08:15:00.000Z",
    score: 100, // 90 + 10 (ortalama 19,5 ms)
    passed: 5,
    failed: 0,
    network: ornekAgDurumlari[0],
    tests: basarili("192.0.2.1", 18, 21, "203.0.113.24"),
  },
  {
    id: "NCHK-2026-0000000B",
    createdAt: "2026-10-20T12:40:00.000Z",
    score: 100, // 90 + 10 (ortalama 10,7 ms)
    passed: 5,
    failed: 0,
    network: ornekAgDurumlari[1],
    tests: basarili("198.51.100.1", 9.4, 12, "203.0.113.25"),
  },
  {
    id: "NCHK-2026-0000000C",
    createdAt: "2026-10-20T18:05:00.000Z",
    score: 82, // 75 + 7 (ortalama 54,5 ms); mobil veride ağ geçidi yok
    passed: 4,
    failed: 1,
    network: ornekAgDurumlari[2],
    tests: [
      { id: "gateway", name: "Gateway", target: "Varsayılan ağ geçidi", status: "unavailable", message: "Gateway bulunamadı." },
      { id: "cloudflare", name: "Cloudflare", target: "1.1.1.1", status: "success", latencyMs: 48, message: "Hedef yanıt verdi." },
      { id: "google", name: "Google DNS", target: "8.8.8.8", status: "success", latencyMs: 61, message: "Hedef yanıt verdi." },
      { id: "dns", name: "DNS Çözümleme", target: "cloudflare.com", status: "success", latencyMs: 40, message: "cloudflare.com → 198.51.100.7" },
      { id: "internet", name: "İnternet (HTTPS)", target: HTTPS_HEDEFI, status: "success", latencyMs: 210, message: "HTTPS bağlantısı başarılı · Genel IP 203.0.113.77" },
    ],
  },
  {
    id: "NCHK-2026-0000000D",
    createdAt: "2026-10-21T07:30:00.000Z",
    score: 94, // 90 + 4 (ortalama 160 ms)
    passed: 5,
    failed: 0,
    network: ornekAgDurumlari[3],
    tests: basarili("192.0.2.1", 140, 180, "203.0.113.26"),
  },
  {
    id: "NCHK-2026-0000000E",
    createdAt: "2026-10-21T10:10:00.000Z",
    score: 45, // 35 + 10 (ortalama 23,5 ms); DNS çözülemediği için HTTPS de başarısız
    passed: 3,
    failed: 2,
    network: ornekAgDurumlari[4],
    tests: [
      { id: "gateway", name: "Gateway", target: "198.51.100.1", status: "success", latencyMs: 3.2, message: "Ağ geçidi yanıt verdi." },
      { id: "cloudflare", name: "Cloudflare", target: "1.1.1.1", status: "success", latencyMs: 22, message: "Hedef yanıt verdi." },
      { id: "google", name: "Google DNS", target: "8.8.8.8", status: "success", latencyMs: 25, message: "Hedef yanıt verdi." },
      { id: "dns", name: "DNS Çözümleme", target: "cloudflare.com", status: "failed", message: "DNS çözümlemesi başarısız." },
      { id: "internet", name: "İnternet (HTTPS)", target: HTTPS_HEDEFI, status: "failed", message: "DNS çözümlemesi başarısız." },
    ],
  },
  {
    id: "NCHK-2026-0000000F",
    createdAt: "2026-10-21T16:45:00.000Z",
    score: 15, // yalnız ağ geçidi yanıt verdi; gecikme bonusu yok
    passed: 1,
    failed: 4,
    network: ornekAgDurumlari[5],
    tests: [
      { id: "gateway", name: "Gateway", target: "192.0.2.1", status: "success", latencyMs: 1.8, message: "Ağ geçidi yanıt verdi." },
      { id: "cloudflare", name: "Cloudflare", target: "1.1.1.1", status: "failed", message: "Zaman aşımı: yanıt alınamadı." },
      { id: "google", name: "Google DNS", target: "8.8.8.8", status: "failed", message: "Zaman aşımı: yanıt alınamadı." },
      { id: "dns", name: "DNS Çözümleme", target: "cloudflare.com", status: "failed", message: "Zaman aşımı: yanıt alınamadı." },
      { id: "internet", name: "İnternet (HTTPS)", target: HTTPS_HEDEFI, status: "failed", message: "HTTPS bağlantısı kurulamadı." },
    ],
  },
];
