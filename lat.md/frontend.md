# Frontend

The UI is five Turkish app screens plus multilingual information pages, sharing one responsive shell and storing all state in the browser's local storage.

## Screens

Each app route mounts one Svelte component; all network data comes from [[architecture#IPC contract]].

- **Genel Bakış** (`/`, [[src/components/Overview.svelte]]): a quick check runs the `internet` and `cloudflare` diagnostics. The link state is "Bağlı" when the HTTPS `internet` test succeeds, "Bağlantı Yok" when there is no local IPv4 or IPv6, and otherwise "İnternet Yok". ICMP latency is shown separately. Snapshot fields and interfaces are listed as cards ([[frontend#Shared UI components]]), and the latest report score links to that report through a card.
- **Tanılama** (`/tanilama`, [[src/components/Diagnostics.svelte]]): runs the supported tests in parallel with live rows, then shows the score and a link to the new report ([[architecture#Diagnostic run data flow]]). A failed run shows `HataDurumu` with "Tekrar dene". Ping tests are skipped and hidden only when `destekleniyorMu("ping")` is false, which happens on no target platform ([[docs/platform-destegi.md]]).
- **Rapor** (`/rapor?id=`, [[src/components/ReportView.svelte]]): an `h1`, then score, test results and network facts of one stored report, all in the selected language. An unknown or missing ID shows `HataDurumu` with "Geçmişe dön". The "Geçmiş" link returns to the list's last address with its search and filter ([[src/lib/reports.svelte.ts#gecmisAdresi]]). The ID stays in the query string because a static build cannot pre-render per-report paths.
- **Geçmiş** (`/gecmis`, [[src/components/History.svelte]]): stored reports as link cards with score labels, a search over report ID and date, a score-level filter, and clearing history behind a confirmation step. Data comes from the single loader [[src/lib/reports.svelte.ts#Reports]] `yukle()`, and the screen shows exactly one of loading, error, empty and full. Search and filter live in the URL (`?ara=&seviye=`), so they survive going to a report and back. In development, `?durum=` forces a state ([[docs/gelistirme-notlari.md]]).
- **Ayarlar** (`/ayarlar`, [[src/components/Settings.svelte]]): theme, app language, local data, information-page links in the selected language, and app info. App info includes [[src/lib/sozluk.ts#platformEtiketi]] (for example "Mobil uygulama · Android") and the ping method.

## Connection score

[[src/lib/score.ts#computeScore]] is a deterministic 0–100 rating from test outcomes, explicitly not a professional network-quality measure.

Weights: internet 35, DNS 20, gateway 15, Cloudflare 10, Google 10. A latency bonus of up to 10 is based on the mean successful 1.1.1.1/8.8.8.8 latency: under 50 ms gives 10, under 100 ms 7, under 200 ms 4, otherwise 1. The total is capped at 100. [[src/lib/score.ts#scoreLevel]] maps ≥80 to "İyi", ≥50 to "Orta", otherwise "Zayıf". The local backend has a copy of this rule ([[architecture#Local SQLite backend]]).

## Reports and history

Reports live only on the device, in `localStorage` under [[src/lib/reports.svelte.ts#STORAGE_KEY]], newest first, capped at [[src/lib/reports.svelte.ts#MAX_REPORTS]].

Stored entries are shape-checked when loaded, so malformed data is dropped instead of crashing the screen. Since Task 14 each test also stores Rust's `code` and `detail`, so the report screen can rebuild its message in the selected language; older reports without them show their stored Turkish message. Storage is per WebView data directory, so changing the app identifier or uninstalling the app clears history; an in-place update keeps it (seen on Android). The theme choice is stored the same way by [[src/lib/tema.svelte.ts#tema]] (day, night, or system).

## Shared UI components

Data-agnostic components live in `src/lib/components/ui/`; their inputs are typed in [[src/lib/types/ui.ts]] and every color, spacing and radius comes from `src/styles/app.css` variables.

[[src/lib/components/ui/Kart.svelte]] (course Task 12) takes a title, optional subtitle, image with required alt text, label and label kind (`bilgi`, `basari`, `uyari`, `hata`, colored by the `--durum-*` tokens). With `href` it renders a link, with `onclick` a button, otherwise a plain card, so interactive cards are keyboard-focusable and open with Enter. Screens convert their data into these inputs; the card never imports app data types.

The state components from Task 13 are [[src/lib/components/ui/Yukleniyor.svelte]] (skeleton with one announced status text), [[src/lib/components/ui/BosDurum.svelte]] (title, description, optional link or button) and [[src/lib/components/ui/HataDurumu.svelte]] (message and optional "Tekrar dene"). Geçmiş and the Genel Bakış interface list both use them. Monospace values (`.mono`) are isolated as left-to-right so addresses and latencies read correctly in RTL.

## Localization

App screens default to Turkish and can be switched to English, Arabic or Persian; the four information pages exist in all four languages on their own routes. Arabic and Persian render right-to-left.

The app language lives in [[src/lib/dil.svelte.ts#dil]] and is stored in `localStorage` under `dil`. An inline script in [[src/layouts/Layout.astro]] applies it before first paint and after each client-side navigation, except on information pages, whose route fixes the language (`data-sabit-dil`). Texts come from [[src/lib/sozluk.ts#sozluk]], keyed identically in all four languages. All five app screens, the shell and the shared components use it. [[src/lib/labels.ts]] keeps only the Turkish name, target hint and message written into each report at creation time, plus latency formatting; the contact form and the information pages keep their own per-language texts.

The admin panel follows the same `dil` setting with its own dictionaries in `admin/i18n` ([[architecture#Admin panel]]).

[[src/lib/i18n.ts#LOCALES]] lists the locales and [[src/lib/i18n.ts#dirOf]] sets `dir="rtl"` for `ar` and `fa`. Turkish pages live at the root and the others under `/en`, `/ar`, `/fa`. Layout uses logical CSS properties so the navigation rail and borders mirror in RTL. Translations are maintained by hand in the MDX/Astro pages, so changes to the Turkish source must be applied to all four.

## Responsive layout

One shell and one set of pages adapt to phone, tablet, desktop, and TV by available width and height; there is no aspect-ratio detection or separate app per form factor.

- Tokens in [[src/styles/app.css]]: rem-based type and spacing, a 44 px touch-target token, content and reading widths, and focus color.
- Breakpoints, with [[docs/mimari-agac.md]] §3 as the single source: 48em tablet, 64em desktop where [[src/components/AppNav.svelte]] becomes a sticky side rail, short landscape also uses the rail, and very large screens scale the root font in steps (112.5%, 150%, 200%).
- Below 64em the navigation is a fixed bottom bar. Header and navigation respect safe-area insets (notch, home indicator).
- No container queries, because the iOS deployment target is 15.0 and WKWebView lacks `@container` before iOS 16 ([[decisions#No container queries]]).

## Browser preview

`bun run dev` serves the UI without Tauri for layout work only; every IPC call fails with [[src/lib/native.ts#NativeUnavailableError]] and screens say so.

[[src/lib/native.ts#hasNative]] gates calls. No screen uses mock data: the only sample records ([[src/lib/veri/ornek.ts]]) exist for the Task 11 type contract, and layout matrices in PR #30 replayed a real snapshot through a test harness that is not committed.
