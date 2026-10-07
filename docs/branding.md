# NetCheck — Marka ve Tasarım Kılavuzu

> Görev tanımı: [`docs/tasks/week-3/05-branding.task.md`](tasks/week-3/05-branding.task.md). Renkler **yalnızca** bu belgede tanımlanır ve [`src/styles/app.css`](../src/styles/app.css) içinde aynı adlarla `:root` (gündüz) ve `:root[data-tema="gece"]` (gece) altında birebir uygulanır. Bileşenlerde ad-hoc renk yazılmaz.

Karakter: teknik, sakin, güven veren. Ana renk camgöbeği (cyan) — ağ/sinyal çağrışımı; koyu lacivert üst bar.

---

## 1. Marka Renk Paleti

Kontrast oranları WCAG 2.x formülüyle ölçülmüştür (metin/zemin; AA eşiği 4.5:1).

| Token | Gündüz | Gece | Kullanım yeri | Kontrast (gündüz · gece) |
|---|---|---|---|---|
| `--renk-ana` | `#0e7490` | `#22d3ee` | Butonlar, aktif sekme, bağlantılar, vurgu kenarları | bağlantı/zemin 4.98 · bağlantı/kart 9.42 |
| `--renk-ana-yazi` | `#ffffff` | `#062a33` | Ana renk üzerindeki metin (buton, rozet) | 5.36 · 8.38 |
| `--renk-vurgu` | `#22d3ee` | `#22d3ee` | Üst bardaki logo ve işaret | 9.34 (üst bar üzerinde) |
| `--renk-koyu` | `#0b1f2a` | `#0b1f2a` | Üst bar zemini (beyaz metin) | 16.89 (beyaz metin) |
| `--zemin` | `#f4f7fa` | `#0b1220` | Sayfa arka planı | — |
| `--kart` | `#ffffff` | `#131c2e` | Kartlar, liste ve alt menü yüzeyi | — |
| `--yazi` | `#0f172a` | `#e6edf6` | Başlıklar ve gövde metni | zemin 16.60 · 15.88 |
| `--yazi-soluk` | `#556476` | `#94a3b8` | Etiketler, tarihler, açıklamalar | zemin 5.63 / kart 6.05 · kart 6.64 |
| `--kenar` | `#e2e8f0` | `#23304a` | Kart ve satır ayırıcıları | — |

### Durum renkleri (tanılama)

| Token | Gündüz | Gece | Kullanım yeri | Kontrast (metin/zemin) |
|---|---|---|---|---|
| `--durum-basarili` / `-zemin` | `#15803d` / `#dcfce7` | `#4ade80` / `#052e16` | "Başarılı", "Bağlı", skor ≥ 80 | 4.57 · 8.55 |
| `--durum-hata` / `-zemin` | `#b91c1c` / `#fee2e2` | `#fca5a5` / `#450a0a` | "Başarısız", "Bağlantı Yok", skor < 50, tehlikeli buton | 5.30 · 8.51 |
| `--durum-uyari` / `-zemin` | `#92400e` / `#fef3c7` | `#fcd34d` / `#451a03` | "Kullanılamıyor", "İnternet Yok", skor 50–79 | 6.37 · 10.39 |

## 2. Tipografi ve Köşe Yuvarlaklığı

- **Yazı tipi:** System UI (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`)
- **Teknik değerler** (IP, rapor kimliği, gecikme): `ui-monospace, "Cascadia Mono", Consolas, monospace` (`.mono`)
- **Köşe yuvarlaklığı (`--radius`):** `14px`
- **İkonlar:** satır içi SVG (çizgi, 2 px), emoji kullanılmaz.

## 3. Logo ve İkon

- **Sembol:** üç kademeli sinyal yayı (`--renk-vurgu`) + altında onay işareti (beyaz) — "ağ kontrol edildi".
- **Logo metni:** `net`**`check`** — üst barda `AppHeader.svelte` içinde, "check" `--renk-vurgu` ile.
- **Slogan:** Ağınızda ne olduğunu saniyeler içinde görün.
- **Kaynak ikon:** [`src-tauri/app-icon.svg`](../src-tauri/app-icon.svg) (1024×1024, `--renk-koyu` zemin).
- **Platform ikonları:** `bun run tauri icon src-tauri/app-icon.svg` ile üretilir.

| Platform | Dosya / Konum |
|---|---|
| Windows | `src-tauri/icons/icon.ico`, `Square*Logo.png`, `StoreLogo.png` |
| macOS | `src-tauri/icons/icon.icns` |
| Linux | `src-tauri/icons/32x32.png`, `64x64.png`, `128x128.png`, `128x128@2x.png`, `icon.png` |
| iOS | `src-tauri/icons/ios/` |
| Android | `src-tauri/icons/android/` (mipmap-*, adaptive) |
| Web | `public/favicon.png` (64 px), `public/apple-touch-icon.png` (180 px) |
