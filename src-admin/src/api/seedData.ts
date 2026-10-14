import {
  Device,
  ReportRecord,
  ContactMessage,
  AdminUser,
  AuditLogEntry,
  ScoreRule,
  DiagnosticTarget,
  DiagnosticTest,
  ContentPage,
  Os,
  PlatformFamily,
  IcmpBackend,
  ConnectionType,
  Lang,
} from "../domain/types";

export const seedRule: ScoreRule = {
  version: 1,
  status: "published",
  weights: { internet: 35, dns: 20, gateway: 15, cloudflare: 10, google: 10 },
  latencyBands: [
    { maxMs: 50, bonus: 10 },
    { maxMs: 100, bonus: 7 },
    { maxMs: 200, bonus: 4 },
    { maxMs: null, bonus: 1 },
  ],
  levels: { iyi: 80, orta: 50 },
  publishedAt: "2026-09-01T10:00:00Z",
  note: "Başlangıç temel puanlama kuralı",
};

export const seedTargets: DiagnosticTarget[] = [
  { kind: "gateway", target: "auto", enabled: true, timeoutMs: 2000 },
  { kind: "cloudflare", target: "1.1.1.1", enabled: true, timeoutMs: 2000 },
  { kind: "google", target: "8.8.8.8", enabled: true, timeoutMs: 2000 },
  { kind: "dns", target: "cloudflare.com", enabled: true, timeoutMs: 3000 },
  { kind: "internet", target: "www.cloudflare.com", enabled: true, timeoutMs: 5000 },
];

export const seedAdmins: AdminUser[] = [
  {
    id: "adm-001",
    name: "Emre Yılmaz",
    email: "emre@netcheck.internal",
    role: "owner",
    active: true,
    lastLoginAt: "2026-10-14T05:20:00Z",
  },
  {
    id: "adm-002",
    name: "Selin Karaca",
    email: "selin@netcheck.internal",
    role: "support",
    active: true,
    lastLoginAt: "2026-10-13T16:45:00Z",
  },
  {
    id: "adm-003",
    name: "Mert Aydın",
    email: "mert@netcheck.internal",
    role: "content",
    active: true,
    lastLoginAt: "2026-10-12T11:10:00Z",
  },
  {
    id: "adm-004",
    name: "Zeynep Demir",
    email: "zeynep@netcheck.internal",
    role: "viewer",
    active: false,
    lastLoginAt: "2026-09-28T09:30:00Z",
  },
];

export const seedDevices: Device[] = [
  {
    id: "dev-001",
    platform: { os: "windows", family: "desktop", icmp: "system-ping" },
    appVersion: "1.4.2",
    locale: "tr",
    lastSeenAt: "2026-10-14T04:12:00Z",
    reportCount: 8,
  },
  {
    id: "dev-002",
    platform: { os: "macos", family: "desktop", icmp: "icmp-socket" },
    appVersion: "1.4.2",
    locale: "en",
    lastSeenAt: "2026-10-14T02:40:00Z",
    reportCount: 6,
  },
  {
    id: "dev-003",
    platform: { os: "android", family: "mobile", icmp: "icmp-api" },
    appVersion: "1.4.1",
    locale: "tr",
    lastSeenAt: "2026-10-13T20:15:00Z",
    reportCount: 5,
  },
  {
    id: "dev-004",
    platform: { os: "ios", family: "mobile", icmp: "unavailable" },
    appVersion: "1.4.2",
    locale: "en",
    lastSeenAt: "2026-10-13T18:22:00Z",
    reportCount: 4,
  },
  {
    id: "dev-005",
    platform: { os: "linux", family: "desktop", icmp: "icmp-socket" },
    appVersion: "1.4.0",
    locale: "tr",
    lastSeenAt: "2026-10-12T15:10:00Z",
    reportCount: 3,
  },
  {
    id: "dev-006",
    platform: { os: "android", family: "mobile", icmp: "icmp-api" },
    appVersion: "1.4.2",
    locale: "ar",
    lastSeenAt: "2026-10-12T11:05:00Z",
    reportCount: 3,
  },
  {
    id: "dev-007",
    platform: { os: "windows", family: "desktop", icmp: "system-ping" },
    appVersion: "1.3.9",
    locale: "fa",
    lastSeenAt: "2026-10-11T09:30:00Z",
    reportCount: 2,
  },
  {
    id: "dev-008",
    platform: { os: "ios", family: "mobile", icmp: "unavailable" },
    appVersion: "1.4.2",
    locale: "tr",
    lastSeenAt: "2026-10-10T14:45:00Z",
    reportCount: 2,
  },
];

// Helper to generate 33 realistic reports
export const generateSeedReports = (): ReportRecord[] => {
  const reports: ReportRecord[] = [];
  const dates = [
    "2026-10-14T05:12:00Z", "2026-10-14T04:22:00Z", "2026-10-14T03:45:00Z", "2026-10-14T01:10:00Z",
    "2026-10-13T22:30:00Z", "2026-10-13T19:15:00Z", "2026-10-13T16:40:00Z", "2026-10-13T12:05:00Z",
    "2026-10-12T20:50:00Z", "2026-10-12T17:15:00Z", "2026-10-12T14:05:00Z", "2026-10-12T09:30:00Z",
    "2026-10-11T23:00:00Z", "2026-10-11T18:40:00Z", "2026-10-11T13:20:00Z", "2026-10-11T08:15:00Z",
    "2026-10-10T21:10:00Z", "2026-10-10T15:35:00Z", "2026-10-10T11:00:00Z", "2026-10-09T19:25:00Z",
    "2026-10-09T14:40:00Z", "2026-10-09T08:50:00Z", "2026-10-08T22:15:00Z", "2026-10-08T16:00:00Z",
    "2026-10-08T10:30:00Z", "2026-10-07T18:45:00Z", "2026-10-07T12:20:00Z", "2026-10-06T15:10:00Z",
    "2026-10-05T17:30:00Z", "2026-10-04T14:00:00Z", "2026-10-03T11:20:00Z", "2026-10-02T16:45:00Z",
    "2026-10-01T10:00:00Z",
  ];

  const hexCodes = [
    "3F9A0C71", "A8B2C4D1", "5E7F9120", "89ACDEF0", "12345678", "FEDCBA98",
    "7890ABCD", "45678901", "B0C1D2E3", "F4E5D6C7", "9A8B7C6D", "5E4D3C2B",
    "1A2B3C4D", "E5F6A7B8", "C9D8E7F6", "01234567", "89ABCDEF", "23456789",
    "ABCDEF01", "3456789A", "BCDEF012", "456789AB", "CDEF0123", "56789ABC",
    "DEF01234", "6789ABCD", "EF012345", "789ABCDE", "F0123456", "89ABCDE0",
    "9ABCDEF1", "ABCDEF23", "BCDEF345"
  ];

  for (let i = 0; i < 33; i++) {
    const devIndex = i % seedDevices.length;
    const device = seedDevices[devIndex];
    const id = `NCHK-2026-${hexCodes[i]}`;
    const createdAt = dates[i];
    const receivedAt = new Date(new Date(createdAt).getTime() + 4000).toISOString();
    const connType: ConnectionType = i % 4 === 0 ? "ethernet" : i % 4 === 1 ? "wifi" : i % 4 === 2 ? "cellular" : "wifi";

    // Special cases:
    // Case 1: i === 7 -> completely offline (all failed)
    // Case 2: i === 12 -> 2 unavailable tests (e.g. ICMP ping unsupported or disabled)
    // Case 3: i === 18 -> 1 unavailable test
    // Scores: variety of good (>=80), medium (50-79), weak (<50)
    let score = 90;
    let passed = 5;
    let failed = 0;

    let tests: DiagnosticTest[] = [
      { id: "gateway", name: "Gateway", target: "192.168.1.1", status: "success", latencyMs: 2 + (i % 6) },
      { id: "cloudflare", name: "Cloudflare", target: "1.1.1.1", status: "success", latencyMs: 14 + (i % 25) },
      { id: "google", name: "Google DNS", target: "8.8.8.8", status: "success", latencyMs: 18 + (i % 30) },
      { id: "dns", name: "DNS Çözümleme", target: "cloudflare.com", status: "success", latencyMs: 12 + (i % 20) },
      { id: "internet", name: "İnternet (HTTPS)", target: "www.cloudflare.com", status: "success", latencyMs: 80 + (i % 90) },
    ];

    if (i === 7) {
      // Offline report
      score = 0;
      passed = 0;
      failed = 5;
      tests = [
        { id: "gateway", name: "Gateway", target: "192.168.1.1", status: "failed", code: "unreachable" as const, message: "Ağ geçidine ulaşılamıyor" },
        { id: "cloudflare", name: "Cloudflare", target: "1.1.1.1", status: "failed", code: "timeout" as const, message: "Paket zaman aşımına uğradı" },
        { id: "google", name: "Google DNS", target: "8.8.8.8", status: "failed", code: "timeout" as const, message: "Paket zaman aşımına uğradı" },
        { id: "dns", name: "DNS Çözümleme", target: "cloudflare.com", status: "failed", code: "resolve_failed" as const, message: "DNS sunucusuna erişilemedi" },
        { id: "internet", name: "İnternet (HTTPS)", target: "www.cloudflare.com", status: "failed", code: "connection_failed" as const, message: "İnternet bağlantısı kurulamadı" },
      ];
    } else if (i === 12) {
      // Two tests unavailable
      score = 45;
      passed = 2;
      failed = 1;
      tests = [
        { id: "gateway", name: "Gateway", target: "192.168.1.1", status: "success", latencyMs: 4 },
        { id: "cloudflare", name: "Cloudflare", target: "1.1.1.1", status: "unavailable", code: "ping_unsupported" as const, message: "Platformda ICMP soket izinleri kısıtlı" },
        { id: "google", name: "Google DNS", target: "8.8.8.8", status: "unavailable", code: "ping_unsupported" as const, message: "Platformda ICMP soket izinleri kısıtlı" },
        { id: "dns", name: "DNS Çözümleme", target: "cloudflare.com", status: "success", latencyMs: 45 },
        { id: "internet", name: "İnternet (HTTPS)", target: "www.cloudflare.com", status: "failed", code: "http_error" as const, message: "HTTPS yanıtı 504 Gateway Timeout" },
      ];
    } else if (i === 18) {
      // One test unavailable
      score = 72;
      passed = 4;
      failed = 0;
      tests = [
        { id: "gateway", name: "Gateway", target: "192.168.1.1", status: "success", latencyMs: 5 },
        { id: "cloudflare", name: "Cloudflare", target: "1.1.1.1", status: "unavailable", code: "ping_unsupported" as const, message: "Sistem ICMP ping arka ucu kullanılamıyor" },
        { id: "google", name: "Google DNS", target: "8.8.8.8", status: "success", latencyMs: 42 },
        { id: "dns", name: "DNS Çözümleme", target: "cloudflare.com", status: "success", latencyMs: 25 },
        { id: "internet", name: "İnternet (HTTPS)", target: "www.cloudflare.com", status: "success", latencyMs: 140 },
      ];
    } else if (i % 5 === 1) {
      // Weak score
      score = 35 + (i % 12);
      passed = 2;
      failed = 3;
      tests[0].status = "success";
      tests[1].status = "failed";
      tests[1].message = "1.1.1.1 sunucusuna ping zaman aşımı";
      tests[2].status = "failed";
      tests[2].message = "8.8.8.8 sunucusuna ping zaman aşımı";
      tests[3].status = "success";
      tests[4].status = "failed";
      tests[4].message = "HTTPS bağlantısı zaman aşımı";
    } else if (i % 3 === 0) {
      // Medium score
      score = 62 + (i % 14);
      passed = 4;
      failed = 1;
      tests[1].status = "failed";
      tests[1].latencyMs = undefined;
      tests[1].message = "Cloudflare paket kaybı";
    } else {
      // Good score
      score = 84 + (i % 16);
      passed = 5;
      failed = 0;
    }

    const hostNum = 10 + i;
    reports.push({
      id,
      createdAt,
      score,
      passed,
      failed,
      deviceId: device.id,
      shared: i % 6 !== 0,
      receivedAt,
      ruleVersion: 1,
      network: {
        hostname: `client-host-${hostNum}`,
        localIPv4: `192.168.1.${hostNum}`,
        localIPv6: i % 2 === 0 ? `fe80::${(hostNum * 111).toString(16)}:45ff` : undefined,
        gateway: "192.168.1.1",
        dnsServers: ["1.1.1.1", "8.8.8.8"],
        connectionType: connType,
        interfaceName: connType === "ethernet" ? "eth0" : "wlan0",
        interfaces: [
          {
            name: connType === "ethernet" ? "eth0" : "wlan0",
            ipv4: `192.168.1.${hostNum}`,
            ipv6: i % 2 === 0 ? `fe80::${(hostNum * 111).toString(16)}:45ff` : undefined,
            mac: `00:11:22:${(hostNum).toString(16).padStart(2, "0")}:AA:BB`,
            type: connType,
            isUp: true,
            isDefault: true,
          },
          {
            name: "lo",
            ipv4: "127.0.0.1",
            mac: "00:00:00:00:00:00",
            type: "unknown",
            isUp: true,
            isDefault: false,
          },
        ],
      },
      tests,
    });
  }

  return reports;
};

export const seedReports = generateSeedReports();

export const seedMessages: ContactMessage[] = [
  {
    id: "msg-001",
    name: "Barış Can",
    email: "baris@example.com",
    subject: "DNS Çözümleme Hatası",
    message: "Ofis ağımızda cloudflare.com alan adını çözümlerken sürekli 'resolve_failed' hatası alıyoruz, raporda skor 42 çıktı. Yardımcı olabilir misiniz?",
    lang: "tr",
    status: "new",
    assignee: "adm-002",
    createdAt: "2026-10-14T03:10:00Z",
    replies: [],
  },
  {
    id: "msg-002",
    name: "John Miller",
    email: "john.m@techcorp.fake",
    subject: "Report sharing privacy question",
    message: "Does sharing a diagnostic report expose my private internal IP address publicly, or can it be permanently hidden?",
    lang: "en",
    status: "in-progress",
    assignee: "adm-001",
    createdAt: "2026-10-13T19:40:00Z",
    replies: [
      {
        id: "rep-001",
        authorId: "adm-001",
        body: "All diagnostic reports feature privacy masks on private subnets and hostnames. You can also turn off public sharing anytime.",
        at: "2026-10-13T21:05:00Z",
        internal: false,
      },
    ],
  },
  {
    id: "msg-003",
    name: "Ali Rıza Kaya",
    email: "aliriza@firma.fake",
    subject: "Mobil uygulamada test zaman aşımı",
    message: "Android cihazımda hücresel bağlantıda iken Google DNS testi sürekli zaman aşımına uğruyor. Wi-Fi'da ise sorunsuz.",
    lang: "tr",
    status: "answered",
    assignee: "adm-002",
    createdAt: "2026-10-13T14:22:00Z",
    replies: [
      {
        id: "rep-002",
        authorId: "adm-002",
        body: "Operatör düzeyinde ICMP filtrelemesi yapılıyor olabilir; sonraki güncellemede TCP fallback ekliyoruz.",
        at: "2026-10-13T15:30:00Z",
        internal: false,
      },
      {
        id: "rep-003",
        authorId: "adm-002",
        body: "Kullanıcının operatör bilgisini not aldık, v1.4.3 sürümünde hedefleri kontrol edeceğiz.",
        at: "2026-10-13T15:31:00Z",
        internal: true,
      },
    ],
  },
  {
    id: "msg-004",
    name: "Tariq Al-Mansoor",
    email: "tariq@arabia.fake",
    subject: "استفسار بخصوص نتائج فحص البوابة",
    message: "عند فحص شبكة المكتب يظهر اختبار Gateway بحالة غير متاح، هل هناك إعداد خاص بالموجه؟",
    lang: "ar",
    status: "new",
    createdAt: "2026-10-13T10:05:00Z",
    replies: [],
  },
  {
    id: "msg-005",
    name: "Sohrab Moradi",
    email: "sohrab@domain.fake",
    subject: "مشکل در محاسبه تاخیر کلودفلر",
    message: "در تست پینگ کلودفلر زمان تاخیر بیش از ۲۵۰ میلی‌ثانیه ثبت شده اما اینترنت پایدار است.",
    lang: "fa",
    status: "new",
    createdAt: "2026-10-12T16:20:00Z",
    replies: [],
  },
  {
    id: "msg-006",
    name: "Spam Bot 99",
    email: "promo@cryptobroker.fake",
    subject: "Earn 5000 USD Daily Guaranteed",
    message: "Click here to buy automated crypto trading signals with low latency VPS networks today!",
    lang: "en",
    status: "spam",
    createdAt: "2026-10-12T09:15:00Z",
    replies: [],
  },
  {
    id: "msg-007",
    name: "Derya Korkmaz",
    email: "derya@teknik.fake",
    subject: "Kurumsal ağda ICMP kısıtlaması",
    message: "Kurum içi güvenlik politikamız nedeniyle ICMP ping kapalı. HTTP testleri geçiyor ancak skor düşük çıkıyor. Ağırlıkları düzenleyebilir miyiz?",
    lang: "tr",
    status: "in-progress",
    assignee: "adm-003",
    createdAt: "2026-10-11T13:40:00Z",
    replies: [
      {
        id: "rep-004",
        authorId: "adm-003",
        body: "Kurumsal müşteriler için özel ağırlık profili özelliğimiz roadmap'te bulunmaktadır.",
        at: "2026-10-11T16:00:00Z",
        internal: false,
      },
    ],
  },
  {
    id: "msg-008",
    name: "Sarah Jenkins",
    email: "sarah.j@consulting.fake",
    subject: "macOS Sonoma permission issue",
    message: "After updating macOS, local network permission dialog pops up every time diagnostic tests start.",
    lang: "en",
    status: "answered",
    assignee: "adm-001",
    createdAt: "2026-10-10T17:15:00Z",
    replies: [
      {
        id: "rep-005",
        authorId: "adm-001",
        body: "Please grant Permanent Local Network access under System Settings > Privacy & Security.",
        at: "2026-10-10T18:00:00Z",
        internal: false,
      },
    ],
  },
  {
    id: "msg-009",
    name: "Murat Güven",
    email: "murat@guven.fake",
    subject: "Toplu tanılama raporu indirme",
    message: "Tüm şubelerimizdeki 10 adet cihazın raporlarını tek seferde CSV veya PDF olarak arşivlemek istiyoruz.",
    lang: "tr",
    status: "new",
    createdAt: "2026-10-09T11:45:00Z",
    replies: [],
  },
  {
    id: "msg-010",
    name: "Kader Çetin",
    email: "kader@okul.fake",
    subject: "Öğrenci laboratuvarında internet kopmaları",
    message: "Rapor ID: NCHK-2026-FEDCBA98. Skor 38 görünüyor. Ağ geçidi sağlam ama dış dünya pingleri başarısız.",
    lang: "tr",
    status: "in-progress",
    assignee: "adm-002",
    createdAt: "2026-10-08T09:10:00Z",
    replies: [],
  },
  {
    id: "msg-011",
    name: "Casino Promotions",
    email: "marketing@vegasbonus.fake",
    subject: "Exclusive 200% Welcome Bonus",
    message: "Try your luck with instant deposit bonuses at top tier casino servers worldwide.",
    lang: "en",
    status: "spam",
    createdAt: "2026-10-07T04:20:00Z",
    replies: [],
  },
  {
    id: "msg-012",
    name: "Ahmet Ersoy",
    email: "ahmet@ersoy.fake",
    subject: "IPv6 desteği hakkında bilgi",
    message: "IPv6 adresimiz var fakat testler IPv4 üzerinden çalışıyor görünüyor. Tanılama hedeflerinde AAAA kaydı sorgulanıyor mu?",
    lang: "tr",
    status: "answered",
    assignee: "adm-001",
    createdAt: "2026-10-06T13:30:00Z",
    replies: [
      {
        id: "rep-006",
        authorId: "adm-001",
        body: "Evet, arayüz çift yığın (dual-stack) desteklerse DNS çözümleme hem A hem AAAA sorgulamaktadır.",
        at: "2026-10-06T15:20:00Z",
        internal: false,
      },
    ],
  },
];

export const seedContentPages: ContentPage[] = [
  // Hakkında
  {
    id: "cnt-001",
    slug: "hakkinda",
    lang: "tr",
    title: "NetCheck Hakkında",
    body: "NetCheck, cihazınızın yerel ağ durumunu ve dış dünya bağlantı kalitesini saniyeler içinde ölçümleyen modern bir tanılama aracıdır.\n\n* 5 temel bağlantı testi ile tam analiz\n* Anlık bağlantı skoru hesaplama\n* Paylaşılabilir tanılama raporları",
    status: "published",
    updatedAt: "2026-10-01T10:00:00Z",
  },
  {
    id: "cnt-002",
    slug: "hakkinda",
    lang: "en",
    title: "About NetCheck",
    body: "NetCheck is an intuitive network diagnostic utility designed to benchmark local interface health and external Internet connectivity in seconds.\n\n* 5 comprehensive automated tests\n* Real-time 0-100 Connection Score\n* Sharable cryptographic report identifiers",
    status: "published",
    updatedAt: "2026-10-01T10:00:00Z",
  },
  {
    id: "cnt-003",
    slug: "hakkinda",
    lang: "ar",
    title: "حول نت تشيك (NetCheck)",
    body: "نت تشيك هي أداة متطورة لتشخيص الشبكة وقياس جودة الاتصال المحلي والإنترنت في ثوانٍ معدودة.\n\n* 5 اختبارات اتصال شاملة\n* احتساب فوري لنقاط جودة الشبكة\n* تقارير موثقة وسهلة المشاركة",
    status: "published",
    updatedAt: "2026-10-01T10:00:00Z",
  },
  {
    id: "cnt-004",
    slug: "hakkinda",
    lang: "fa",
    title: "درباره نت‌چک (NetCheck)",
    body: "نت‌چک ابزاری هوشمند جهت بررسی وضعیت شبکه محلی و کیفیت اتصال اینترنت شما در چند ثانیه است.\n\n* انجام ۵ آزمون تشخیصی پایه\n* محاسبه امتیاز اتصال بین ۰ تا ۱۰۰\n* تولید گزارش‌های تشخیصی استاندارد",
    status: "published",
    updatedAt: "2026-10-01T10:00:00Z",
  },

  // Gizlilik
  {
    id: "cnt-005",
    slug: "gizlilik",
    lang: "tr",
    title: "Gizlilik Politikası",
    body: "NetCheck kullanıcı gizliliğine mutlak saygı duyar. Tanılama esnasında toplanan yerel IP ve MAC adresleri şifrelenir ve maskeli gösterilir.\n\n* Asla kişisel kimlik verisi toplanmaz\n* Rapor paylaşımı tamamen kullanıcının kontrolündedir\n* Paylaşımı istediğiniz an sonlandırabilirsiniz",
    status: "published",
    updatedAt: "2026-10-02T11:00:00Z",
  },
  {
    id: "cnt-006",
    slug: "gizlilik",
    lang: "en",
    title: "Privacy Policy",
    body: "NetCheck respects user privacy by design. IP addresses and MAC identifiers are masked in public reports.\n\n* Zero personal identity tracking\n* User-authoritative report sharing\n* Instant revocation of public links",
    status: "published",
    updatedAt: "2026-10-02T11:00:00Z",
  },
  {
    id: "cnt-007",
    slug: "gizlilik",
    lang: "ar",
    title: "سياسة الخصوصية",
    body: "نولي أولوية قصوى لخصوصيتك؛ يتم إخفاء عناوين IP و MAC الحساسة تلقائياً.\n\n* لا يتم جمع معلومات شخصية\n* مشاركة التقرير خاضعة لتحكمك الكامل\n* إمكانية إلغاء المشاركة في أي لحظة",
    status: "published",
    updatedAt: "2026-10-02T11:00:00Z",
  },
  {
    id: "cnt-008",
    slug: "gizlilik",
    lang: "fa",
    title: "سیاست حفظ حریم خصوصی",
    body: "حفظ حریم خصوصی شما اولویت ماست. شناسه‌های محلی و آدرس‌های مک در گزارش‌ها پنهان‌سازی می‌شوند.\n\n* عدم جمع‌آوری هویت شخصی\n* کنترل کامل روی اشتراک‌گذاری گزارش‌ها",
    status: "draft", // Intentionally draft for testing
    updatedAt: "2026-10-02T11:00:00Z",
  },

  // Koşullar
  {
    id: "cnt-009",
    slug: "kosullar",
    lang: "tr",
    title: "Kullanım Koşulları",
    body: "NetCheck tarafından sunulan bağlantı skoru yalnızca bilgilendirme ve ilk seviye tanılama amaçlıdır. Ağ sağlayıcınızın hizmet taahhüdü yerine geçmez.",
    status: "published",
    updatedAt: "2026-10-03T12:00:00Z",
  },
  {
    id: "cnt-010",
    slug: "kosullar",
    lang: "en",
    title: "Terms of Service",
    body: "The diagnostic score is an advisory metric calculated from core probe heuristics. It does not constitute a formal ISP SLA benchmark.",
    status: "published",
    updatedAt: "2026-10-03T12:00:00Z",
  },
  {
    id: "cnt-011",
    slug: "kosullar",
    lang: "ar",
    title: "شروط الاستخدام",
    body: "نقاط الاتصال هي مؤشر استرشادي ناتج عن فحوصات أولية ولا تعتبر مقياساً تعاقدياً لسرعة مزود الخدمة.",
    status: "published",
    updatedAt: "2026-10-03T12:00:00Z",
  },
  // Notice: kosullar in fa is deliberately omitted or draft to show missing translation!
  {
    id: "cnt-012",
    slug: "kosullar",
    lang: "fa",
    title: "شرایط استفاده",
    body: "امتیاز اتصال صرفاً جهت راهنمایی بوده و جایگزین آزمون‌های تخصصی ارائه‌دهنده سرویس نیست.",
    status: "draft",
    updatedAt: "2026-10-03T12:00:00Z",
  },

  // İletişim
  {
    id: "cnt-013",
    slug: "iletisim",
    lang: "tr",
    title: "İletişim & Destek",
    body: "Sorularınız, kurumsal lisans talepleriniz ve hata bildirimleriniz için destek ekibimizle iletişime geçebilirsiniz:\n\n* E-posta: destek@netcheck.internal\n* Yanıt süresi: 24 saat içinde",
    status: "published",
    updatedAt: "2026-10-04T13:00:00Z",
  },
  {
    id: "cnt-014",
    slug: "iletisim",
    lang: "en",
    title: "Contact & Support",
    body: "Reach out to our engineering and support crew for inquiries or bug disclosures:\n\n* Email: support@netcheck.internal\n* Typical turnaround: within 24 hours",
    status: "published",
    updatedAt: "2026-10-04T13:00:00Z",
  },
  {
    id: "cnt-015",
    slug: "iletisim",
    lang: "ar",
    title: "الاتصال والدعم",
    body: "تواصل مع فريق الدعم الفني لأي استفسارات أو تقارير مشاكل:\n\n* البريد الإلكتروني: support@netcheck.internal\n* متوسط وقت الرد: خلال 24 ساعة",
    status: "published",
    updatedAt: "2026-10-04T13:00:00Z",
  },
  {
    id: "cnt-016",
    slug: "iletisim",
    lang: "fa",
    title: "تماس و پشتیبانی",
    body: "برای ارسال پیشنهادات یا گزارش باگ با ما در تماس باشید:\n\n* ایمیل: support@netcheck.internal",
    status: "published",
    updatedAt: "2026-10-04T13:00:00Z",
  },
];

// Helper to generate 42 audit logs
export const generateSeedAuditLogs = (): AuditLogEntry[] => {
  const logs: AuditLogEntry[] = [];
  const actors = ["adm-001", "adm-002", "adm-003"];
  const actions = [
    { action: "pii.reveal", entity: "Report", reason: "Müşteri destek talebinde IP doğrulaması yapıldı" },
    { action: "report.disable_sharing", entity: "Report", reason: "Kullanıcı talebiyle genel paylaşım kapatıldı" },
    { action: "rule.save_draft", entity: "ScoreRule", reason: "Yeni gecikme kademeleri için taslak oluşturuldu" },
    { action: "rule.publish", entity: "ScoreRule", reason: "v1 skor kuralı canlı ortama alındı" },
    { action: "target.update", entity: "DiagnosticTarget", reason: "Cloudflare ping zaman aşımı 2000ms olarak güncellendi" },
    { action: "message.reply", entity: "ContactMessage", reason: "Destek bileti yanıtlandı" },
    { action: "message.status_change", entity: "ContactMessage", reason: "Durum 'answered' olarak güncellendi" },
    { action: "admin.invite", entity: "AdminUser", reason: "Yeni destek uzmanı davet edildi" },
    { action: "device.delete_data", entity: "Device", reason: "KVKK/GDPR kapsamında cihaz verisi temizlendi" },
    { action: "content.publish", entity: "ContentPage", reason: "Gizlilik politikası sayfası güncellendi" },
    { action: "message.mark_spam", entity: "ContactMessage", reason: "Reklam botu mesajı spam kutusuna taşındı" },
  ];

  const now = new Date("2026-10-14T05:00:00Z").getTime();

  for (let i = 0; i < 42; i++) {
    const act = actions[i % actions.length];
    const actorId = actors[i % actors.length];
    const logDate = new Date(now - i * 3600 * 1000 * (i % 3 === 0 ? 3 : 7)).toISOString();
    const entityId = act.entity === "Report"
      ? `NCHK-2026-${(i * 12345).toString(16).toUpperCase().padStart(8, "0")}`
      : act.entity === "Device"
      ? `dev-00${(i % 8) + 1}`
      : act.entity === "ContactMessage"
      ? `msg-0${(i % 12) + 1}`
      : `item-${i + 1}`;

    logs.push({
      id: `aud-${1000 + i}`,
      at: logDate,
      actorId,
      action: act.action,
      entity: act.entity,
      entityId,
      reason: act.reason,
      before: act.action.includes("update") || act.action.includes("publish") ? { status: "draft", timeoutMs: 3000 } : undefined,
      after: act.action.includes("update") || act.action.includes("publish") ? { status: "published", timeoutMs: 2000 } : undefined,
    });
  }

  return logs;
};

export const seedAuditLogs = generateSeedAuditLogs();
