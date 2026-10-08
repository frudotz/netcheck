# AGENTS.md — NetCheck

Bu belge, bu depoda çalışan tüm yapay zeka ajanları (Antigravity, Cursor, Claude Code, Gemini) için bağlayıcı sistem talimatlarını içerir. `CLAUDE.md` ve `GEMINI.md` yalnızca bu dosyaya yönlendirir; kurallar yalnızca burada yazılır.

## 1. Temel Proje Haritası ve Tek Kaynak Kuralı (DRY Docs)

- **Dokümantasyon tekrar edilmez, link edilir:** Dizin ağaçları, renk tabloları, sayfa ağaçları ve kurulum adımları başka dosyalara kopyalanmaz; her zaman aşağıdaki tek kaynağa link verilir. Bir kural değişirse yalnızca ilgili belge güncellenir.

| Belge | Kapsam | Bağlayıcı Kural |
|---|---|---|
| [`docs/proje-fikri.md`](docs/proje-fikri.md) | Konsept, ekranlar, veri modeli, rapor kimliği | Veri modelleri, terimler ve ekran içerikleri bu konsepte sadık kalır. Kapsam dışı özellik eklenmez (aşağıdaki §6). |
| [`docs/klasor-mimarisi.md`](docs/klasor-mimarisi.md) | Dizin ve dosya mimarisi | Klasör yapısı yalnızca burada tanımlanır. Yeni dosya eklerken bu hiyerarşiye uy. |
| [`docs/branding.md`](docs/branding.md) | Marka, renk token'ları, ikonlar | Ad-hoc renk yazılmaz; yalnızca `src/styles/app.css` içindeki CSS değişkenleri kullanılır. Yeni token önce burada tanımlanır. |
| [`docs/mimari-agac.md`](docs/mimari-agac.md) | Sayfa ağacı, platformlar, breakpoint'ler | Yeni rota veya sayfa eklerken bu ağaca uyulur ve ağaç güncellenir. |
| [`docs/kurulum.md`](docs/kurulum.md) | Kurulum ve çalıştırma | Komutlar yalnızca burada ayrıntılandırılır; değiştirilen her komut gerçekten çalıştırılarak doğrulanır. |
| [`docs/kurallar.md`](docs/kurallar.md) | Kurallar indeksi | Kuralların kaynağı bu dosyadır (AGENTS.md); `kurallar.md` buraya yönlendirir. |
| [`docs/kaynaklar.md`](docs/kaynaklar.md) | Tasarım ve teknik referanslar | Tasarım kararlarında bu referanslar esas alınır. |
| [`docs/teslim.md`](docs/teslim.md) | Teslim adımları ve tarihler | Etiket/ZIP/Blackboard adımları buradadır. |
| [`docs/agent-compliance-test.md`](docs/agent-compliance-test.md) | Ajan uyum testi kaydı (görev 08) | Kural uyumu kanıtı; kurallar burada tekrarlanmaz. |
| [`docs/tasks/`](docs/tasks/) | Eğitmen görev dokümanları | Haftalık görevler bağlayıcıdır; değiştirilmez. |

## 2. Teknoloji Yığını ve Komutlar

- **Platform:** Tauri v2 (Rust çekirdek + WebView)
- **Web çatısı:** Astro (`output: 'static'`, port `1420`)
- **Arayüz:** Svelte 5 (Runes: `$state`, `$derived`, `$props`); React 19 bileşenleri ve MDX (mevcut entegrasyonlar korunur)
- **Paket yöneticisi:** Bun — başka paket yöneticisine veya çatıya geçilmez.

### Komutlar
- Web önizleme: `bun run dev` (127.0.0.1:1420 — Rust IPC yok)
- Tauri uygulaması: `bun run tauri dev`
- Derleme ve doğrulama: `bun run build`
- Rust testleri: `cd src-tauri && cargo test`
- Tip kontrolü: `bunx svelte-check --tsconfig ./tsconfig.json` (0 hata / 0 uyarı beklenir)
- CI: [`.github/workflows/cross-platform.yml`](.github/workflows/cross-platform.yml) — PR'larda Windows/Linux/macOS derleme + test ve Android/iOS Rust derleme kontrolü

## 3. Geliştirme ve Git Kuralları

1. **Doğrudan `master`/`main`'e commit atılmaz.** Her iş kendi dalında yapılır:
   - Özellik: `feature/<kisa-ad>` · Hata düzeltme: `fix/<kisa-ad>` · Yalnızca doküman: `docs/<kisa-ad>`
   - **Bir dal = bir özellik.** İlgisiz değişiklikler aynı dala karıştırılmaz.
2. **Pull Request zorunludur.** Dal GitHub'a gönderilir, PR açılır; açıklamada *ne değişti, neden, nasıl test edildi, bilinen sınırlamalar* yazılır. Files changed incelendikten sonra `master`'a birleştirilir.
3. **Commit mesajları** `feat:` / `fix:` / `docs:` önekiyle anlamlı yazılır (`update`, `wip` gibi mesajlar kullanılmaz). Git geçmişi yeniden yazılmaz.
4. **Kanıtsız teslim yapılmaz:** Her değişiklikten sonra `bun run build` 0 hata ile tamamlanmalı; Rust değiştiyse `cargo test` geçmeli; arayüz değiştiyse ilgili ekran çalışan uygulamada denenmelidir.
5. **Kapsam koruma:** Yalnızca görevin gerektirdiği dosyalara dokunulur; izinsiz büyük refactor veya "temizlik" yapılmaz.
6. **Bağımlılık:** Yeni paket eklemeden önce mevcut bağımlılıklarla çözülüp çözülemeyeceği kontrol edilir; eklenen her bağımlılığın gerekçesi PR'da yazılır.

## 4. Kod Yazım Kuralları

- **Dil:** Kullanıcıya görünen tüm metinler Türkçedir (`src/lib/labels.ts`); yeni kod tanımlayıcıları İngilizcedir. Mevcut CSS token adları (`--renk-ana` …) korunur.
- **Svelte 5 Runes:** Yeni bileşenlerde yalnızca `$state`, `$derived`, `$props`; Svelte 4 sözdizimi (`export let`, `$:`) kullanılmaz.
- **SSR güvenliği:** `window`, `document`, `localStorage` yalnızca istemcide (`onMount` içinde) veya `typeof … !== "undefined"` korumasıyla kullanılır. localStorage'dan gelen liste `onMount` sonrası çizilir.
- **Platform sınırı:** İşletim sistemine göre değişen Rust kodu (`#[cfg(windows)]`, `cfg(mobile)` …) yalnızca [`src-tauri/src/platform/`](src-tauri/src/platform/) altında yazılır; diğer modüller platformdan bağımsız kalır. Bir platformda olmayan yetenek sahte değer yerine açıkça "kullanılamıyor" döner. Platform farkı ön yüzde `get_platform_info` ile okunur, tarayıcı/OS tahmini yapılmaz.
- **Rust ↔ TS:** IPC çağrıları yalnızca [`src/lib/native.ts`](src/lib/native.ts) üzerinden yapılır; tipler [`src/types/netcheck.ts`](src/types/netcheck.ts) ile Rust serde yapıları (`camelCase`) birebir eşleşir.
- **Sahte veri yasak:** IP, gateway, DNS, gecikme, bağlantı durumu veya arayüz bilgisi asla uydurulmaz. Değer alınamazsa "Kullanılamıyor" / "Bulunamadı" gösterilir. Tauri dışında (tarayıcı) JS ile yedek veri veya rapor kimliği üretilmez.
- **Rapor kimliği** yalnızca Rust'ta üretilir (`generate_report_id` → `NCHK-YYYY-XXXXXXXX`).
- **Hata gösterimi:** Ham Rust/IPC hataları kullanıcıya gösterilmez; Rust makine kodu (`code`) döner, Türkçe mesaja ön yüzde çevrilir. Her asenkron işlemin yükleniyor / başarı / hata durumu vardır.

## 5. Arayüz Doğrulama (Tarayıcı Otomasyonu)

- Arayüz değişikliği; ilgili ekran açılarak, ana etkileşim denenerek ve **yükleniyor / başarı / hata** durumları görülerek doğrulanır. Gerekirse telefon (420 px) ve masaüstü (1280 px) genişlikleri kontrol edilir.
- **Birincil araç: Vercel Agent Browser** (`agent-browser`). Claude in Chrome yalnızca Agent Browser'ın yapamadığı bir işlem gerektiğinde kullanılır.
- Gerçek IPC'yi test etmek için Tauri penceresine bağlanılır:
  1. `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222` ile `bun run tauri dev` (Windows/WebView2).
  2. `http://127.0.0.1:9222/json/version` içindeki `webSocketDebuggerUrl` ile `agent-browser connect <ws-url>`.
- `bun run dev` (tarayıcı) yalnızca Tauri dışı hata yolunu ("yalnızca masaüstü uygulamasında") test eder.
- Ekran görüntüsü, kayıt ve geçici otomasyon dosyaları depoya commit edilmez.

## 6. Güvenlik ve Kapsam Sınırları

- Tanılama hedefleri Rust'ta **sabittir**; ön yüz yalnızca test türünü (enum) gönderir. Kullanıcı girdisi kabuğa, PowerShell'e, CMD'ye veya sistem komutuna asla aktarılmaz.
- Tauri izinleri ([`src-tauri/capabilities/default.json`](src-tauri/capabilities/default.json)) minimum tutulur; yeni izin gerekçesiz eklenmez. Gizli anahtar kodlanmaz.
- **Kapsam dışı:** giriş/kayıt, sunucu/API, veritabanı, bulut eşitleme, analitik, yapay zeka, hız testi, port/alt ağ tarayıcı, paket yakalama, traceroute arayüzü, VPN tespiti, uzaktan yönetim. NetCheck temel bir ağ tanılama aracıdır.
