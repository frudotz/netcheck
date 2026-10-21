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
| [`docs/backend.md`](docs/backend.md) | Geçici yerel SQLite arka ucu (migration, rol/izin, komutlar) | Arka uç tabloları, rolleri ve komutları yalnız burada ayrıntılandırılır. Kapsam kararı bekliyor: [`docs/course-compliance.md`](docs/course-compliance.md) C-3. |
| [`docs/course-compliance.md`](docs/course-compliance.md) | Ders gereksinimleri uyum matrisi | Her görev gereksinimi için durum ve kanıt; kurallar burada tekrarlanmaz, görevler `lat.md/tasks.md`'de izlenir. |
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
- Android: `bun run tauri android build --target aarch64 --apk` (önkoşullar: [`docs/kurulum.md`](docs/kurulum.md))
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
- Android'de WebView, debug APK'da `adb forward tcp:<port> localabstract:webview_devtools_remote_<pid>` ile aynı CDP yöntemiyle denetlenir. Emülatör ve `adb` iş bitince kapatılır.
- `bun run dev` (tarayıcı) yalnızca Tauri dışı hata yolunu ("yalnızca masaüstü uygulamasında") test eder.
- Ekran görüntüsü, kayıt ve geçici otomasyon dosyaları depoya commit edilmez.

## 6. Güvenlik ve Kapsam Sınırları

- Tanılama hedefleri Rust'ta **sabittir**; ön yüz yalnızca test türünü (enum) gönderir. Kullanıcı girdisi kabuğa, PowerShell'e, CMD'ye veya sistem komutuna asla aktarılmaz.
- Tauri izinleri ([`src-tauri/capabilities/default.json`](src-tauri/capabilities/default.json)) minimum tutulur; yeni izin gerekçesiz eklenmez. Gizli anahtar kodlanmaz.
- **Kapsam dışı:** giriş/kayıt, sunucu/API, veritabanı, bulut eşitleme, analitik, yapay zeka, hız testi, port/alt ağ tarayıcı, paket yakalama, traceroute arayüzü, VPN tespiti, uzaktan yönetim. NetCheck temel bir ağ tanılama aracıdır.

%% lat:begin %%
# Before starting work

Use Lat's knowledge graph to ground each task before changing code.

- Run `lat search` to find sections relevant to your task. Read them to understand the design intent before writing code.

# Post-task checklist (REQUIRED — do not skip)

After EVERY task, before responding to the user:

- [ ] Update `lat.md/` if you added or changed meaningful implemented functionality, architecture, tests, or behavior. Keep it a focused snapshot of the current implemented state, not a journal/changelog. Plans may be drafted in `lat.md/` alongside implementation, with the intent that by commit time they describe what was implemented. Otherwise, keep proposals, hypothetical designs, and future work outside `lat.md/` unless the user explicitly requests them there.
- [ ] Run `lat check` — all validations must pass
- [ ] Do not skip these steps. Do not consider your task done until both are complete.

---

# What is lat.md?

Lat.md is the project's structured knowledge graph for architecture, design decisions, behavior, and tests.

The graph lives in `lat.md/` as cross-linked Markdown describing **what** the project does and **why**. Use it to ground work in actual architecture, and keep it a focused snapshot of the current implemented state rather than a journal or changelog.

Project-specific lat documentation belongs in `lat.md/`. Do not modify this generated instruction file or a generated `lat-md` `SKILL.md` to record project guidance: both are owned by lat tooling and may be replaced by a later `lat init`.

# Commands

Use these commands to navigate and validate the project knowledge graph.

```bash
lat locate "Section Name"      # find a section by name (exact, fuzzy)
lat refs "file#Section"        # find what references a section
lat search "natural language"  # semantic search across all sections
lat external show <handle>      # inspect a pinned external source before cloning it
lat check                      # run full graph and documentation validation
```

Run `lat --help` when in doubt about available commands or options.

If `lat search` fails because no API key is configured, explain to the user that semantic search requires a key provided via `LAT_LLM_KEY` (direct value), `LAT_LLM_KEY_FILE` (path to key file), or `LAT_LLM_KEY_HELPER` (command that prints the key). Supported key prefixes: `sk-...` (OpenAI) or `vck_...` (Vercel). If the user doesn't want to set it up, use `lat locate` for direct lookups instead.

# Syntax primer

Lat uses stable section ids, wiki links, source links, and code references to connect documentation with implementation.

- **Section ids**: `lat.md/path/to/file#Heading#SubHeading` — full form uses project-root-relative path (e.g. `lat.md/tests/search#RAG Replay Tests`). Short form uses bare file name when unique (e.g. `search#RAG Replay Tests`, `cli#search#Indexing`).
- **Wiki links**: `[[target]]` or `[[target|alias]]` — cross-references between sections. Can also reference repository paths or source code: `[[schema.sql]]`, `[[src/components]]`, `[[src/foo.ts#myFunction]]`.
- **Link specificity**: When documenting implemented behavior, prefer the narrowest relevant source-symbol link over a whole-file link. Use whole-file or directory links when discussing the module or resource as a whole, or when no supported symbol represents the target. If prose names a symbol, link that symbol directly.
- **Repository path links**: Wiki links without a `#` fragment may target any existing file or directory inside the project. Unsupported formats validate but cannot be opened by Lat; fragments require a `lat.md/` section or supported source file.
- **Source code links**: Wiki links in `lat.md/` files can reference functions, classes, constants, and methods in supported source files. Use the full path: `[[src/config.ts#getConfigDir]]`, `[[src/server.ts#App#listen]]` (class method), `[[lib/utils.py#parse_args]]`, `[[src/lib.rs#Greeter#greet]]` (Rust impl method), `[[src/app.go#Greeter#Greet]]` (Go method), `[[src/app.h#Greeter]]` (C struct). When prose names an implementation symbol or a behavior governed by one, link the symbol instead of using a bare code span or copying its literal value. Prefer `[[src/config.ts#DEFAULT_TIMEOUT]]` (or an aliased form) over a bare identifier or copied value. `lat check` validates these exist.
- **Code refs**: `// @lat: [[section-id]]` (JS/TS/Rust/Go/C/PHP) or `# @lat: [[section-id]]` (Python/PHP) — ties source code to concepts

# Diagrams

Default to prose. Reserve Mermaid diagrams for concepts involving more than seven interacting subjects (such as components, states, or stages) with complex sequencing, branching, or dependencies that prose alone makes hard to follow.

The subject count alone does not justify a diagram; omit diagrams for simple sequences or relationships that a short paragraph or list explains clearly. A diagram should give users and later agents an overview of the interactions.

Keep each diagram focused on one process, use readable labels, and explain the important decisions in surrounding prose with precise source-symbol links. Prefer a small overview or several focused diagrams over one dense diagram. Use fenced `mermaid` blocks and run `lat check` to validate syntax and readability.

# Test specs

Key tests can be described as sections in `lat.md/` files (e.g. `tests.md`). Add frontmatter to require that every leaf section is referenced by a `// @lat:` or `# @lat:` comment in test code:

```markdown
---
lat:
  require-code-mention: true
---
# Tests

Authentication and authorization test specifications.

## User login

Verify credential validation and error handling for the login endpoint.

### Rejects expired tokens
Tokens past their expiry timestamp are rejected with 401, even if otherwise valid.

### Handles missing password
Login request without a password field returns 400 with a descriptive error.
```

Every section MUST have a description — at least one sentence explaining what the test verifies and why. Empty sections with just a heading are not acceptable. (This is a specific case of the general leading paragraph rule below.)

Each test in code should reference its spec with exactly one comment placed next to the relevant test — not at the top of the file:

```python
# @lat: [[tests#User login#Rejects expired tokens]]
def test_rejects_expired_tokens():
    ...

# @lat: [[tests#User login#Handles missing password]]
def test_handles_missing_password():
    ...
```

Do not duplicate refs. One `@lat:` comment per spec section, placed at the test that covers it. `lat check` will flag any spec section not covered by a code reference, and any code reference pointing to a nonexistent section.

# Section structure

Concise opening paragraphs give every section a stable overview for validation and discovery.

Every section in `lat.md/` **must** have a leading paragraph — at least one sentence immediately after the heading, before any child headings or other block content. The first paragraph must be ≤250 characters (excluding `[[wiki link]]` content). This paragraph serves as the section's overview and is used in search results, command output, and RAG context — keeping it concise guarantees the section's essence is always captured.

```markdown
# Good Section

Brief overview of what this section documents and why it matters.

More detail can go in subsequent paragraphs, code blocks, or lists.

## Child heading

Details about this child topic.
```

```markdown
# Bad Section

## Child heading

Details about this child topic.
```

The second example is invalid because `Bad Section` has no leading paragraph. `lat check` validates this rule and reports errors for missing or overly long leading paragraphs.
%% lat:end %%
