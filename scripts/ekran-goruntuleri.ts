// Ekran görüntüsü teslimi: derlenen her rotayı üç boyutta Vercel Agent Browser ile yakalar.
// Kullanım ve seçenekler: docs/kurulum.md ("Ekran görüntüleri"). Çıktılar (screenshots/,
// screenshots.zip) .gitignore içindedir ve commit edilmez.
//
// Güvenlik: tarayıcı önizlemesinde Rust IPC olmadığından ekranlar gerçek ağ verisi göstermez;
// yine de her sayfa yakalanmadan önce IP / MAC / e-posta / rapor kimliği taramasından geçer ve
// beklenmeyen bir değer görülürse üretim durur. Hakkında sayfalarındaki geliştirici bilgileri
// yalnızca yakalanan görüntüde maskelenir; uygulama içeriği değişmez.

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { arch, platform, tmpdir } from "node:os";
import { delimiter, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "screenshots");
const ZIP = join(ROOT, "screenshots.zip");
const HOST = "127.0.0.1";
const PORT = 1420;
const BASE = `http://${HOST}:${PORT}`;

const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const INFO_LANGS = ["en", "ar", "fa"] as const;

// Tanılama ekranı ve bilgi sayfaları Rust'taki sabit hedefleri adıyla gösterir
// (src-tauri/src/diagnostics.rs). Bunlar kişisel veya yerel ağ verisi değildir.
const ALLOWED_IPS = new Set(["1.1.1.1", "8.8.8.8"]);

// İletişim formunun yer tutucu örnek adresleri (src/components/IletisimFormu.svelte).
const ALLOWED_EMAILS = new Set(["ornek@eposta.com", "name@example.com"]);

// Tam sayfa görüntünün en büyük yüksekliği (Chromium doku sınırı 16384 px).
const MAX_HEIGHT = 16000;

// Hakkında sayfasındaki "Geliştirici" listesi: beş alan (ad, bölüm, üniversite, ders, kaynak kod).
const DEVELOPER_FIELDS = 5;

type Size = (typeof SIZES)[number];

interface Route {
  path: string;
  name: string;
  group: "app" | "info" | "admin";
  redact: boolean;
}

interface Capture {
  file: string;
  route: string;
  size: string;
  width: number;
  height: number;
  redactedFields: number;
}

const args = new Set(process.argv.slice(2));
const viewportOnly = args.has("--viewport-only");
const skipBuild = args.has("--no-build");

function fail(message: string): never {
  throw new Error(message);
}

// ---------------------------------------------------------------------------
// Agent Browser

const session = `netcheck-screenshots-${process.pid}`;
const tmp = join(tmpdir(), session);
let commandNo = 0;
let AB = "";

/** PATH üzerindeki agent-browser. Windows'ta npm .cmd kabuğu yerine yanındaki yerel ikili
 *  çalıştırılır (Node, .cmd dosyasını kabuksuz başlatamaz). AGENT_BROWSER_BIN ile değiştirilebilir. */
function agentBrowserBinary(): string {
  const override = process.env.AGENT_BROWSER_BIN;
  if (override) return override;
  const win = platform() === "win32";
  for (const dir of (process.env.PATH ?? "").split(delimiter).filter(Boolean)) {
    if (win && existsSync(join(dir, "agent-browser.exe"))) return join(dir, "agent-browser.exe");
    if (win && existsSync(join(dir, "agent-browser.cmd"))) {
      const native = join(dir, "node_modules", "agent-browser", "bin", `agent-browser-win32-${arch()}.exe`);
      if (existsSync(native)) return native;
    }
    if (!win && existsSync(join(dir, "agent-browser"))) return join(dir, "agent-browser");
  }
  fail(
    "agent-browser bulunamadı (ya da npm kabuğunun yanında yerel ikili yok). Kurulum: " +
      "npm install -g agent-browser && agent-browser install; başka bir yol için AGENT_BROWSER_BIN.",
  );
}

/** Kullanıcının AGENT_BROWSER_* ortam ayarları (headed, args, tema …) oturuma sızmasın. */
function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k.startsWith("AGENT_BROWSER_")) delete env[k];
  return env;
}

interface AbResult {
  success: boolean;
  data?: Record<string, unknown> & { result?: unknown };
  error?: string | null;
}

/** Bir Agent Browser komutu çalıştırır. Çıktı geçici dosyaya yazılır: ilk komut arka plan
 *  sürecini başlatır ve bu süreç bir boruyu devralırsa okuma hiç bitmez. */
async function ab(...command: string[]): Promise<AbResult> {
  const out = join(tmp, `cmd-${++commandNo}.json`);
  const outFd = openSync(out, "w");
  const errFd = openSync(`${out}.err`, "w");
  const proc = spawn(AB, ["--session", session, "--json", ...command], {
    cwd: ROOT,
    env: cleanEnv(),
    stdio: ["ignore", outFd, errFd],
    windowsHide: true,
  });
  const timer = setTimeout(() => proc.kill(), 90_000);
  const code = await new Promise<number | null>((resolve) => {
    proc.on("exit", (c) => resolve(c));
    proc.on("error", () => resolve(-1));
  });
  clearTimeout(timer);
  closeSync(outFd);
  closeSync(errFd);
  // Çıktı sayfa metni içerebilir: okunur okunmaz silinir.
  const text = existsSync(out) ? readFileSync(out, "utf8").trim() : "";
  const err = existsSync(`${out}.err`) ? readFileSync(`${out}.err`, "utf8").trim() : "";
  rmSync(out, { force: true });
  rmSync(`${out}.err`, { force: true });
  let parsed: AbResult | undefined;
  try {
    parsed = JSON.parse(text.split("\n").filter(Boolean).pop() ?? "") as AbResult;
  } catch {
    parsed = undefined;
  }
  if (code !== 0 || !parsed?.success) {
    // Sayfa metni hata iletisine taşınmasın diye yalnız hata alanı ve stderr yazdırılır.
    fail(`agent-browser ${command[0]} başarısız (çıkış ${code}): ${parsed?.error || err || "çıktı yok"}`);
  }
  return parsed;
}

async function evaluate<T>(js: string): Promise<T> {
  const res = await ab("eval", js);
  return res.data?.result as T;
}

// ---------------------------------------------------------------------------
// Rotalar: derlenmiş dist/ içindeki her index.html bir rotadır.

function listRoutes(): Route[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "index.html") files.push(full);
    }
  };
  walk(DIST);
  const paths = files.map((f) => {
    const rel = relative(DIST, f).split(sep).slice(0, -1).join("/");
    return rel ? `/${rel}` : "/";
  });
  const infoSlugs = new Set(
    paths.filter((p) => p.startsWith("/en/")).map((p) => p.slice("/en/".length)),
  );
  const routes = paths.map((path): Route => {
    const parts = path.split("/").filter(Boolean);
    let name: string;
    let group: Route["group"];
    if (parts[0] === "admin") {
      group = "admin";
      name = `admin-${parts[1] ?? "ozet"}`;
    } else if ((INFO_LANGS as readonly string[]).includes(parts[0] ?? "")) {
      group = "info";
      name = `${parts[0]}-${parts.slice(1).join("-")}`;
    } else if (parts.length === 1 && infoSlugs.has(parts[0])) {
      group = "info";
      name = `tr-${parts[0]}`;
    } else {
      group = "app";
      name = parts.length ? parts.join("-") : "home";
    }
    if (!/^[a-z0-9-]+$/.test(name)) fail(`ASCII olmayan dosya adı: ${name} (${path})`);
    return { path, name, group, redact: group === "info" && parts[parts.length - 1] === "hakkinda" };
  });
  const order = { app: 0, info: 1, admin: 2 } as const;
  routes.sort((a, b) => order[a.group] - order[b.group] || a.name.localeCompare(b.name));
  if (new Set(routes.map((r) => r.name)).size !== routes.length) fail("Rota adları benzersiz değil.");
  return routes;
}

// ---------------------------------------------------------------------------
// Sayfa hazırlığı, maskeleme ve gizlilik denetimi (tarayıcıda çalışan betikler)

const SETTLE_JS = `(async () => {
  const s = document.createElement("style");
  s.textContent = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
  document.head.appendChild(s);
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    status: nav ? nav.responseStatus : 0,
    path: location.pathname,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir || "ltr",
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    light: matchMedia("(prefers-color-scheme: light)").matches,
  };
})()`;

/** Geliştirici listesindeki değerleri döndürür. Değerler betikte yalnız bellekte tutulur; CLI'ın
 *  geçici çıktı dosyası okunduktan hemen sonra silinir (ab()). */
const DEVELOPER_VALUES_JS = `(() => {
  const h = document.querySelectorAll("article h2")[1];
  const ul = h && h.nextElementSibling;
  if (!ul || ul.tagName !== "UL") return null;
  return [...ul.children].map((li) => {
    const c = li.cloneNode(true);
    c.querySelector("strong")?.remove();
    return c.textContent.trim();
  });
})()`;

/** Etiketleri bırakır, değerleri sabit genişlikte bir çubukla değiştirir. Renkler app.css token'ı. */
const REDACT_JS = `(() => {
  const h = document.querySelectorAll("article h2")[1];
  const ul = h && h.nextElementSibling;
  if (!ul || ul.tagName !== "UL") return 0;
  let n = 0;
  for (const li of ul.children) {
    const label = li.querySelector(":scope > strong");
    if (!label) return -1;
    while (label.nextSibling) label.nextSibling.remove();
    const bar = document.createElement("span");
    bar.textContent = "\\u00a0";
    bar.setAttribute("aria-label", "gizlendi");
    bar.style.cssText = "display:inline-block;inline-size:12em;max-inline-size:60%;block-size:1em;margin-inline-start:.5em;vertical-align:middle;border-radius:4px;background:var(--yazi)";
    li.append(bar);
    n++;
  }
  return n;
})()`;

const SCAN_JS = `(() => {
  const placeholders = [...document.querySelectorAll("[placeholder]")].map((e) => e.getAttribute("placeholder"));
  const text = [document.body.innerText, ...placeholders].join(" | ");
  const fields = [...document.querySelectorAll("input, textarea, select")]
    .map((e) => e.value).filter((v) => v && v.length > 0 && !/^(on|tr|en|ar|fa|sistem|gunduz|gece|light|dark|system)$/i.test(v));
  const re = {
    ipv4: /\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b/g,
    ipv6: /\\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}\\b|(?:\\b[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}|\\d{1,3}(?:\\.\\d{1,3}){3})(?::[0-9a-f]{1,4})*/gi,
    mac: /\\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\\b|\\b[0-9a-f]{4}\\.[0-9a-f]{4}\\.[0-9a-f]{4}\\b/gi,
    email: /[\\w.+-]+@[\\w-]+\\.[\\w.-]+/g,
    reportId: /NCHK-\\d{4}-[A-Z0-9]{8}/g,
  };
  const found = {};
  for (const [k, r] of Object.entries(re)) found[k] = text.match(r) || [];
  return { text, fields, found };
})()`;

interface Settled {
  status: number;
  path: string;
  lang: string;
  dir: string;
  width: number;
  scrollWidth: number;
  reducedMotion: boolean;
  light: boolean;
}

interface Scan {
  text: string;
  fields: string[];
  found: Record<string, string[]>;
}

function privacyGuard(route: Route, scan: Scan, secrets: string[]): void {
  const problems: string[] = [];
  const ips = scan.found.ipv4.filter((ip) => !ALLOWED_IPS.has(ip));
  scan.found.email = scan.found.email.filter((e) => !ALLOWED_EMAILS.has(e.toLowerCase()));
  // Saat gösterimleri (12:30, 12:30:45) IPv6 sayılmaz.
  scan.found.ipv6 = scan.found.ipv6.filter((m) => !/^\d{1,2}(:\d{2}){1,2}$/.test(m));
  if (ips.length) problems.push(`IPv4 ${ips.length} adet`);
  for (const k of ["ipv6", "mac", "email", "reportId"]) {
    if (scan.found[k].length) problems.push(`${k} ${scan.found[k].length} adet`);
  }
  if (scan.fields.length) problems.push(`dolu form alanı ${scan.fields.length} adet`);
  // Ad parçaları tam sözcük olarak aranır (sıradan sözcüklerin içinde geçmesi sayılmaz).
  const lower = scan.text.toLocaleLowerCase("tr");
  const words = new Set(lower.split(/[^\p{L}\p{N}]+/u));
  if (secrets.some((s) => (s.includes(" ") ? lower.includes(s) : words.has(s)))) {
    problems.push("maskelenmemiş geliştirici adı");
  }
  // Değerlerin kendisi yazdırılmaz; yalnız tür ve sayı raporlanır.
  if (problems.length) fail(`Gizlilik denetimi durdurdu (${route.path}): ${problems.join(", ")}`);
}

// ---------------------------------------------------------------------------
// PNG ve ZIP yardımcıları (bağımlılıksız)

function pngSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47 || b.toString("ascii", 12, 16) !== "IHDR") fail(`PNG değil: ${file}`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Sabit tarih 1980-01-01, saat 00:00 (DOS biçimi): geçerli bir tarih ve aynı girdiden aynı ZIP. */
const DOS_DATE = (1 << 5) | 1;

/** Sıkıştırmasız (stored) ZIP; PNG zaten sıkıştırılmış olduğundan boyut farkı yoktur. */
function writeZip(target: string, files: { name: string; data: Buffer }[]): void {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, "ascii");
    const crc = crc32(f.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(f.data.length, 18);
    local.writeUInt32LE(f.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(DOS_DATE, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(f.data.length, 20);
    dir.writeUInt32LE(f.data.length, 24);
    dir.writeUInt16LE(name.length, 28);
    dir.writeUInt32LE(offset, 42);
    parts.push(local, name, f.data);
    central.push(dir, name);
    offset += local.length + name.length + f.data.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  writeFileSync(target, Buffer.concat([...parts, centralBuf, end]));
}

/** ZIP'i merkez dizininden geri okur; her girdinin adı, boyutu ve CRC'si dosyayla eşleşmelidir. */
function verifyZip(target: string, expected: { name: string; data: Buffer }[]): void {
  const b = readFileSync(target);
  const endAt = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (endAt < 0) fail("ZIP sonu bulunamadı.");
  const count = b.readUInt16LE(endAt + 10);
  let p = b.readUInt32LE(endAt + 16);
  if (count !== expected.length) fail(`ZIP ${count} girdi içeriyor, beklenen ${expected.length}.`);
  const byName = new Map(expected.map((e) => [e.name, e.data]));
  for (let i = 0; i < count; i++) {
    if (b.readUInt32LE(p) !== 0x02014b50) fail("ZIP merkez dizini bozuk.");
    const crc = b.readUInt32LE(p + 16);
    const size = b.readUInt32LE(p + 24);
    const nameLen = b.readUInt16LE(p + 28);
    const name = b.toString("ascii", p + 46, p + 46 + nameLen);
    const local = b.readUInt32LE(p + 42);
    const data = byName.get(name);
    if (!data || data.length !== size || crc32(data) !== crc) fail(`ZIP girdisi eşleşmiyor: ${name}`);
    if (b.readUInt32LE(local) !== 0x04034b50) fail(`ZIP yerel başlığı bozuk: ${name}`);
    if (b.readUInt32LE(local + 14) !== crc || b.readUInt32LE(local + 18) !== size) {
      fail(`ZIP yerel başlığı merkez dizinle eşleşmiyor: ${name}`);
    }
    const lNameLen = b.readUInt16LE(local + 26);
    const stored = b.subarray(local + 30 + lNameLen, local + 30 + lNameLen + size);
    if (crc32(stored) !== crc) fail(`ZIP verisi bozuk: ${name}`);
    byName.delete(name);
    p += 46 + nameLen;
  }
  if (byName.size) fail("ZIP eksik girdi içeriyor.");
}

// ---------------------------------------------------------------------------
// Önizleme sunucusu

async function serverUp(): Promise<boolean> {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(1000) });
    return true;
  } catch {
    return false;
  }
}

async function startPreview(): Promise<ChildProcess> {
  if (await serverUp()) fail(`${BASE} zaten kullanımda; başka sunucuyu (bun run dev / preview) kapatın.`);
  const astro = join(ROOT, "node_modules", "astro", "bin", "astro.mjs");
  const proc = spawn(process.execPath, [astro, "preview", "--host", HOST, "--port", String(PORT)], {
    cwd: ROOT,
    // Çıktı boru ile okunup atılır; stdout kapalıyken ("ignore") sunucu Bun altında açılmıyor.
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  proc.stdout?.resume();
  proc.stderr?.resume();
  let exited = false;
  proc.on("exit", () => (exited = true));
  for (let i = 0; i < 60; i++) {
    if (exited) fail("Önizleme sunucusu açılırken kapandı (port 1420 dolu olabilir).");
    if (await serverUp()) return proc;
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  fail("Önizleme sunucusu 30 saniyede açılmadı.");
}

function run(cmd: string[]): void {
  const [bin, ...rest] = cmd;
  const r = spawnSync(bin, rest, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) fail(`${cmd.join(" ")} başarısız (çıkış ${r.status}).`);
}

// ---------------------------------------------------------------------------

let server: ChildProcess | undefined;
let browserStarted = false;

/** Tarayıcı oturumunu, önizleme sunucusunu ve geçici klasörü kapatır; hata, Ctrl+C ve SIGTERM'de de. */
async function cleanup(): Promise<void> {
  if (browserStarted) {
    browserStarted = false;
    await ab("close").catch(() => undefined);
  }
  server?.kill();
  server = undefined;
  rmSync(tmp, { recursive: true, force: true });
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.error(`${signal} alındı; temizleniyor.`);
    void cleanup().finally(() => process.exit(130));
  });
}

async function main(): Promise<void> {
  for (const a of args) {
    if (!["--viewport-only", "--no-build"].includes(a)) fail(`Bilinmeyen seçenek: ${a}`);
  }
  AB = agentBrowserBinary();
  if (!skipBuild) run([process.execPath, "run", "build"]);
  if (!existsSync(join(DIST, "index.html"))) fail("dist/ yok; önce bun run build çalıştırın.");

  const routes = listRoutes();
  const counts = { app: 0, info: 0, admin: 0 };
  for (const r of routes) counts[r.group]++;
  console.log(`Rotalar: ${routes.length} (uygulama ${counts.app}, bilgi ${counts.info}, panel ${counts.admin})`);

  rmSync(OUT, { recursive: true, force: true });
  rmSync(ZIP, { force: true });
  mkdirSync(OUT, { recursive: true });

  const captures: Capture[] = [];
  try {
    mkdirSync(tmp, { recursive: true });
    server = await startPreview();
    // Temiz oturum: açık tema, azaltılmış hareket, boş localStorage; dil uygulamanın varsayılanı
    // (Türkçe). Betik yine de öldürülürse tarayıcı 2 dakika boşta kalınca kendiliğinden kapanır.
    browserStarted = true;
    await ab("--idle-timeout", "2m", "--color-scheme", "light", "set", "viewport", "390", "844", "1");
    await ab("set", "media", "light", "reduced-motion");

    // Gizlilik denetiminin aradığı geliştirici değerleri (yalnız bellekte).
    await ab("open", `${BASE}/hakkinda`);
    const values = await evaluate<string[] | null>(DEVELOPER_VALUES_JS);
    if (!values || values.length !== DEVELOPER_FIELDS) fail("Hakkında sayfasında geliştirici listesi bulunamadı.");
    // Ad soyadın tamamı ve her parçası (en az 3 harf) küçük harfle aranır.
    const name = values[0].toLocaleLowerCase("tr");
    const secrets = [name, ...name.split(/\s+/)].filter((v) => v.length >= 3);
    if (!secrets.length) fail("Geliştirici adı okunamadı; gizlilik denetimi kurulamadı.");

    for (const size of SIZES) {
      await ab("set", "viewport", String(size.width), String(size.height), "1");
      for (const route of routes) captures.push(await capture(route, size, secrets));
    }
  } finally {
    await cleanup();
  }

  // Doğrulama: adet, benzersiz ad, piksel boyutu.
  const expected = routes.length * SIZES.length;
  if (captures.length !== expected) fail(`${captures.length} görüntü üretildi, beklenen ${expected}.`);
  if (new Set(captures.map((c) => c.file)).size !== expected) fail("Dosya adları benzersiz değil.");
  const pngs = readdirSync(OUT).filter((f) => f.endsWith(".png")).sort();
  if (pngs.length !== expected) fail(`screenshots/ içinde ${pngs.length} PNG var, beklenen ${expected}.`);

  const files = pngs.map((name) => ({ name, data: readFileSync(join(OUT, name)) }));
  writeZip(ZIP, files);
  verifyZip(ZIP, files);
  writeFileSync(
    join(OUT, "manifest.json"),
    JSON.stringify({ mode: viewportOnly ? "viewport" : "full-page", sizes: SIZES, captures }, null, 2) + "\n",
  );
  const redacted = captures.filter((c) => c.redactedFields > 0).length;
  console.log(`${expected} PNG → screenshots/ · ZIP → screenshots.zip (${files.length} girdi) · maskelenen ${redacted} görüntü`);
}

async function capture(route: Route, size: Size, secrets: string[]): Promise<Capture> {
  const url = `${BASE}${route.path}`;
  // Her rota boş yerel depolamayla açılır: önce temizle, sonra yeniden yükle.
  await ab("open", url);
  await evaluate("(localStorage.clear(), sessionStorage.clear(), true)");
  await ab("open", url);
  await ab("wait", "--load", "networkidle");
  const s = await evaluate<Settled>(SETTLE_JS);
  if (s.status !== 200) fail(`${route.path} HTTP ${s.status} döndü.`);
  if (s.path.replace(/\/$/, "") !== route.path.replace(/\/$/, "")) fail(`${route.path} → ${s.path} yönlendirildi.`);
  if (!s.reducedMotion || !s.light) fail(`${route.path}: açık tema / azaltılmış hareket öykünmesi etkin değil.`);
  if (s.width !== size.width) fail(`${route.path}: görünüm genişliği ${s.width}, beklenen ${size.width}.`);
  if (s.scrollWidth > size.width) console.warn(`uyarı: ${route.path} ${size.name} yatay taşma (${s.scrollWidth}px)`);

  let redactedFields = 0;
  if (route.redact) {
    redactedFields = await evaluate<number>(REDACT_JS);
    if (redactedFields !== DEVELOPER_FIELDS) fail(`${route.path}: maskeleme ${redactedFields}/${DEVELOPER_FIELDS} alan.`);
  }
  const file = `${route.name}-${size.name}.png`;
  const target = join(OUT, file);
  if (!viewportOnly) {
    // Tam sayfa: görünüm yüksekliği belge yüksekliğine büyütülür. `screenshot --full` görünümü
    // büyütmeden yakaladığından sabit alt menü sayfanın ortasında kalıyordu; böylece uzun bir
    // ekrandaki gibi en altta durur. Yükseklik sabitlenene kadar (en çok 3 kez) ölçülür ve
    // Chromium'un doku sınırının altında tutulur.
    let height: number = size.height;
    let stable = false;
    for (let i = 0; i < 3 && !stable; i++) {
      const measured = await evaluate<number>("document.documentElement.scrollHeight");
      const next = Math.min(MAX_HEIGHT, Math.max(size.height, measured));
      stable = next === height && i > 0;
      if (!stable) {
        height = next;
        await ab("set", "viewport", String(size.width), String(height), "1");
      }
    }
    if (!stable) console.warn(`uyarı: ${route.path} ${size.name} sayfa yüksekliği sabitlenmedi (${height}px)`);
  }
  // Tarama, görünüm son hâlini aldıktan sonra ve yakalamadan hemen önce yapılır.
  privacyGuard(route, await evaluate<Scan>(SCAN_JS), secrets);
  await ab("screenshot", target);
  if (!viewportOnly) await ab("set", "viewport", String(size.width), String(size.height), "1");
  const px = pngSize(target);
  if (px.width !== size.width || px.height < size.height) {
    fail(`${file}: ${px.width}x${px.height}, beklenen genişlik ${size.width} ve yükseklik ≥ ${size.height}.`);
  }
  if (viewportOnly && px.height !== size.height) fail(`${file}: yükseklik ${px.height}, beklenen ${size.height}.`);
  console.log(`✓ ${file} ${px.width}x${px.height}${redactedFields ? " (maskeli)" : ""}`);
  return { file, route: route.path, size: size.name, width: px.width, height: px.height, redactedFields };
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
