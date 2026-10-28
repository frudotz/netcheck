# Frontend

The UI is five Turkish app screens plus multilingual information pages, sharing one responsive shell and storing all state in the browser's local storage.

## Screens

Each app route mounts one Svelte component; all network data comes from [[architecture#IPC contract]].

- **Genel Bakış** (`/`, [[src/components/Overview.svelte]]): a quick check runs the `internet` and `cloudflare` diagnostics. The link state is "Bağlı" when the HTTPS `internet` test succeeds, "Bağlantı Yok" when there is no local IPv4 or IPv6, and otherwise "İnternet Yok". ICMP latency is shown separately. The screen also shows snapshot fields, interfaces, and the latest report score.
- **Tanılama** (`/tanilama`, [[src/components/Diagnostics.svelte]]): runs all five tests in parallel with live rows, then shows the score and a link to the new report ([[architecture#Diagnostic run data flow]]).
- **Rapor** (`/rapor?id=`, [[src/components/ReportView.svelte]]): score, test results, and network facts of one stored report; unknown IDs show "Rapor bulunamadı". The page has no `h1` (see [[tasks#Deferred#NC-07 Report page heading]]).
- **Geçmiş** (`/gecmis`, [[src/components/History.svelte]]): stored reports with counts, and clearing history behind a confirmation step.
- **Ayarlar** (`/ayarlar`, [[src/components/Settings.svelte]]): theme, app language, local data, information-page links in the selected language, and app info. App info includes [[src/lib/sozluk.ts#platformEtiketi]] (for example "Mobil uygulama · Android") and the ping method.

## Connection score

[[src/lib/score.ts#computeScore]] is a deterministic 0–100 rating from test outcomes, explicitly not a professional network-quality measure.

Weights: internet 35, DNS 20, gateway 15, Cloudflare 10, Google 10. A latency bonus of up to 10 is based on the mean successful 1.1.1.1/8.8.8.8 latency: under 50 ms gives 10, under 100 ms 7, under 200 ms 4, otherwise 1. The total is capped at 100. [[src/lib/score.ts#scoreLevel]] maps ≥80 to "İyi", ≥50 to "Orta", otherwise "Zayıf". The local backend has a copy of this rule ([[architecture#Local SQLite backend]]).

## Reports and history

Reports live only on the device, in `localStorage` under [[src/lib/reports.svelte.ts#STORAGE_KEY]], newest first, capped at [[src/lib/reports.svelte.ts#MAX_REPORTS]].

Stored entries are shape-checked when loaded, so malformed data is dropped instead of crashing the screen. Storage is per WebView data directory, so changing the app identifier or uninstalling the app clears history; an in-place update keeps it (seen on Android). The theme choice is stored the same way by [[src/lib/tema.svelte.ts#tema]] (day, night, or system).

## Localization

App screens default to Turkish and can be switched to English, Arabic or Persian; the four information pages exist in all four languages on their own routes. Arabic and Persian render right-to-left.

The app language lives in [[src/lib/dil.svelte.ts#dil]] and is stored in `localStorage` under `dil`. An inline script in [[src/layouts/Layout.astro]] applies it before first paint and after each client-side navigation, except on information pages, whose route fixes the language (`data-sabit-dil`). Texts come from [[src/lib/sozluk.ts#sozluk]], keyed identically in all four languages. So far the shell (header and menu) and Settings use it; older texts in [[src/lib/labels.ts]] and the remaining screens are still Turkish.

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
