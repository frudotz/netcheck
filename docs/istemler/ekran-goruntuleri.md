# Ekran Görüntüleri (Blackboard teslimi)

Numarasız iş; günlük dal adıyla tutulur ([`README.md`](README.md)). Dal: `feature/ekran-goruntuleri`. Kaynak: eğitmenin ekran görüntüsü teslim mesajı. `docs/tasks/` altında bu iş için bir görev dosyası **yok**; mesajın kendisi bu oturuma verilmedi, gereksinimler orkestratörün onaylanmış uygulama isteminden (aşağıda) alındı.

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-11-14. Windows 11, Bun 1.4.2, Vercel Agent Browser 0.36.0, Lat 0.13.8. Görev, Codex yazılım orkestratörü (`TASK-20261114-151810-5085`) üzerinden yönetildi; ayrı bir worktree'de (`origin/master` = `7d435ab` tabanlı) çalışıldı.

## Şartname

- **Amaç:** NetCheck'in bütün güncel rotalarının telefon, tablet ve masaüstü boyutunda ekran görüntüsünü üreten yeniden kullanılabilir bir betik ve Blackboard'a yüklenecek görüntü paketi. Uygulamanın davranışı ve içeriği değişmez.
- **Eğitmen gereksinimlerinin özeti:** tüm sayfalar; üç boyut (390x844, 820x1180, 1440x900); tam sayfa görüntü (eğitmenin örneğindeki gibi); her görüntü ayrı PNG ve hepsi bir `screenshots.zip`; betik projeye PR ile eklenir; proje ayrıca ZIP olarak teslim edilir.
- **Kapsam dışı:** uygulama ekranları, Rust kodu, rota yapısı, metinler; simülatör/cihaz görüntüsü; Blackboard'a yükleme veya üçüncü kişilere ileti; PR'ı birleştirme.
- **Kabul ölçütleri:**
  - [x] 33 rota (6 uygulama, 16 bilgi, 11 panel) × 3 boyut = 99 PNG ve geçerli `screenshots.zip`.
  - [x] Gerçek ağ verisi, cihaz adı, rapor kimliği yok; Hakkında sayfalarındaki geliştirici bilgileri yalnız görüntüde maskeli; beklenmeyen kişisel/ağ verisinde betik duruyor.
  - [x] Önce Vercel Agent Browser; Playwright yalnız CLI yetmezse (yetti, eklenmedi).
  - [x] `bun run build`, `bun run check`, `lat check` geçiyor; görüntüler gözle incelendi; ZIP içerikleri doğrulandı.
  - [x] Çıktılar (`screenshots/`, `screenshots.zip`) git tarafından yok sayılıyor.
- **Dokunulacak dosyalar:** `scripts/ekran-goruntuleri.ts` (yeni), `package.json` (`screenshots` betiği), `.gitignore`, `docs/kurulum.md` (komut), `docs/klasor-mimarisi.md` (`scripts/`), `lat.md/frontend.md`, `lat.md/workflows.md`, bu günlük ve `README.md` dizini. `docs/mimari-agac.md` değişmedi (rota değişmedi).

## İstem

Kullanıcının bu oturuma verdiği istem, olduğu gibi:

```text
Read AGENTS.md and .orchestrator/prompts/implementation.md, then implement TASK-20261114-151810-5085 on branch feature/ekran-goruntuleri in this managed worktree. User approved implementation. Use Claude Code skills and subagents as specified. Start with repo/Lat context and inspect the actual current code. Use Vercel Agent Browser for route and responsive validation first; only use Playwright for the reusable capture script if Agent Browser's CLI is demonstrably insufficient. Make the requested 33-route, 3-size screenshot deliverable, protect/redact personal data in screenshots only, keep project outputs ignored, and follow all repo requirements. Do not merge. Before pushing or creating a PR, use the operation gate and stop if policy denies. Report progress in the task log and orchestrator evidence.
```

Orkestratör uygulama istemi (`.orchestrator/prompts/implementation.md`, depoya girmez) ilgili kısımları: 33 rota × 3 boyut, 99 PNG ve `screenshots.zip`; statik derleme ve önizleme (127.0.0.1:1420), IPC/sahte veri yok; temiz tarayıcı bağlamı, sabit dil/tema/hareket; gerçek IP, cihaz adı, rapor kimliği yakalanmaz ve bir denetim üretimi durdurur; `/hakkinda` sayfalarındaki geliştirici kimliği/bağlılığı yalnız görüntüde maskelenir; varsayılan tam sayfa, isteğe bağlı yalnız görünüm bayrağı; ASCII `<sayfa>-<boyut>.png` adları; `proje.zip` bitmiş dal commit'inden `git archive` ile depo dışına; Blackboard'a yükleme yok; push/PR yalnız orkestratör işlem kapısı izin verirse.

## Plan

Kapsam ve plan kullanıcı tarafından orkestratörde onaylandı ("User approved implementation"); yeniden onay istenmedi.

1. Rotaları say: `src/pages` ve `bun run build` çıktısı → 33 sayfa (uygulama: `/`, `/tanilama`, `/gecmis`, `/rapor`, `/ayarlar`, `/izinler`; bilgi: `hakkinda`, `gizlilik`, `kosullar`, `iletisim` × tr/en/ar/fa; panel: `/admin` + `admin/yol.ts` `ALT_GORUNUMLER` içindeki 10 ekran).
2. Agent Browser yetenek değerlendirmesi: `set viewport <w> <h> 1`, `set media light reduced-motion`, `--color-scheme`, `--args --lang=tr-TR`, `screenshot [--full]`, `eval`, `wait --load networkidle`, `--json` çıktı ve adlandırılmış `--session`. Hepsi denendi ve yeterli bulundu → Playwright eklenmedi.
3. Betik: `dist/` → `astro preview`; her boyutta her rota için depolamayı temizle, yeniden aç, oturt, maskele, gizlilik taraması, yakala, PNG boyutunu doğrula; sonunda ad/adet denetimi, bağımlılıksız ZIP yazımı ve geri okuma doğrulaması, `manifest.json`.
4. Belgeler: komut `docs/kurulum.md`'de, klasör `docs/klasor-mimarisi.md`'de, Lat güncel durum.

## Düzeltmeler

- **Tam sayfada sabit alt menü sayfanın ortasında kalıyordu.** İlk çalıştırmada `screenshot --full` görünümü büyütmeden yakaladığı için 390 px'te alt menü 844. pikselde, Hakkında sayfasının "Geliştirici" listesinin üzerinde çiziliyordu; 820 px'te "Diğer bilgi sayfaları" kartını örtüyordu. Betik artık tam sayfa için görünüm yüksekliğini belge yüksekliğine büyütüp normal görüntü alıyor, sonra görünümü geri koyuyor. Uygulama CSS'i değişmedi.
- **Bun altında `astro preview` açılmıyordu** (`stdio: "ignore"`); çıktı boru ile okunup atılacak şekilde düzeltildi.
- **Bun API'leri yerine Node API'leri:** `tsconfig.json` tüm dosyaları `types: ["node"]` ile denetlediği için `Bun.*` kullanımı `bun run check`'i bozardı; betik `node:` modülleriyle yazıldı (yine `bun` ile çalışır).
- **Ajan tarayıcısı boru kilitlenmesi:** `agent-browser` ilk komutta arka plan sürecini başlatır; çıktı boruya bağlıyken okuma bitmiyordu. Betik her komutun çıktısını geçici dosyaya yazar.
- **Bağımsız kod incelemesi (ayrı Claude alt ajanı, standart düzey, salt okunur): kritik bulgu yok.** Uygulanan düzeltmeler:
  - Ctrl+C / SIGTERM'de de tarayıcı oturumu, önizleme sunucusu ve geçici klasör kapatılıyor; tarayıcı arka planı 2 dakika boşta kalınca kendiliğinden kapanıyor (`--idle-timeout 2m`).
  - CLI'ın geçici çıktı dosyaları (sayfa metni içerebilir) okunur okunmaz siliniyor; hata iletisine sayfa metni taşınmıyor; yanlış "dosyaya yazılmaz" yorumu düzeltildi.
  - Seçenek denetimi, `agent-browser` çözümlemesi ve geçici klasör `main()` içine alındı (temiz hata iletisi, sızıntı yok); önizleme sunucusu açılırken kapanırsa hemen hata veriliyor.
  - Gizlilik taraması görünüm son yüksekliğine büyütüldükten sonra ve yer tutucu metinleri de kapsayarak yapılıyor; ad soyadın parçaları da (tam sözcük, büyük/küçük harf duyarsız) aranıyor; IPv6 deseni `::1` / `::ffff:a.b.c.d` biçimlerini yakalıyor, saatleri (12:30:45) saymıyor; MAC deseni noktalı biçimi de yakalıyor.
  - Tam sayfa yüksekliği 16000 px ile sınırlı; sabitlenmezse uyarı yazılıyor.
  - ZIP girdileri geçerli DOS tarihi (1980-01-01) taşıyor; doğrulama yerel başlık imzası, CRC ve boyutunu da merkez dizinle karşılaştırıyor.
  - Kullanıcının `AGENT_BROWSER_*` ortam değişkenleri oturuma aktarılmıyor; etkisiz `--lang=tr-TR` bayrağı kaldırıldı ve belgedeki "Türkçe tarayıcı dili" ifadesi "uygulamanın varsayılan dili" olarak düzeltildi.
  - Uygulanmayanlar: Windows arm64 / pnpm-yarn genel kurulumları ve Node'suz macOS/Linux için ek çözümleme (yalnız hata iletisi iyileştirildi, `AGENT_BROWSER_BIN` ile aşılabilir); kurulumda `npm install -g agent-browser` (CLI'ın resmi kurulumu; proje bağımlılığı değil) korundu.
- **İnceleme sonrası iki yanlış alarm, denetimin çalıştığını da gösterdi:** İletişim formunun yer tutucu örnek e-posta adresleri (`IletisimFormu.svelte`) denetimi durdurdu → bu iki adres izin listesine alındı; ad parçası sıradan bir Türkçe sözcüğün içinde geçtiği için Kullanım Koşulları durdu → ad parçaları tam sözcük olarak aranıyor.
- **`lat.md/frontend.md`:** ekran görüntüsü işi rota sayımını doğrularken "beş ekran" ifadesinin `/izinler` eklendikten sonra eskidiği görüldü; altıya düzeltildi (görev isteminde istenen güncelleme).
- **Dosya adı düzeltmesi (2026-11-14, ikinci istem):** betik telefon boyutunu `mobile` adıyla üretiyordu; eğitmen `phone` istiyor (örnek: `home-phone.png`). Boyut anahtarı `phone` yapıldı; `docs/kurulum.md` ve bu günlükteki dosya adları güncellendi (gözle inceleme satırındaki adlar ilk çalıştırmada `-mobile` idi). 99 PNG ve `screenshots.zip` yeniden üretildi; `proje.zip` düzeltme commit'inden yeniden alındı. İstem (olduğu gibi):

  ```text
  Continue TASK-20261114-151810-5085 in the same worktree and session, but do local corrective work only. The script currently emits mobile filenames; the instructor requires phone, with example home-phone.png. Rename the viewport key and all output filenames to phone; update docs and task log; regenerate all 99 PNGs and screenshots.zip; verify the full archive, unique names and dimensions; visually inspect representative captures. Refresh proje.zip from the corrected final local commit after committing the correction if appropriate. Run build/check/lat checks as applicable, refresh evidence, and review the corrected diff. Do not change .orchestrator/OPERATION_POLICY.json, do not invoke push/PR gates, do not push or create a PR, and do not upload anything. Keep all existing commits/history and preserve the earlier blocked-operation audit record. Report the exact pending PR authorization needed.
  ```

## Doğrulama

Ham çıktılar orkestratör kayıtlarında (`.orchestrator/logs/`, depoya girmez).

- `bun install --frozen-lockfile` → 317 paket, çıkış 0.
- `bun run build` → 33 sayfa, 0 hata. Sayfa listesi yukarıdaki 33 rotayla birebir aynı.
- `bun run check` → ilk çalıştırmada betikte 1 tip hatası (`let height` sabit boyut birleşim tipini aldı); `number` olarak düzeltildi. Son çalıştırma: `astro check` 0 hata, 0 uyarı, 1 ipucu (`CanliRozet.tsx` kullanılmayan `React` içe aktarımı, `master`'da da var); `svelte-check` 818 dosya, 0 hata, 0 uyarı.
- `bun run screenshots` (son çalıştırma, derleme dahil) → `Rotalar: 33 (uygulama 6, bilgi 16, panel 11)`, `99 PNG → screenshots/ · ZIP → screenshots.zip (99 girdi) · maskelenen 12 görüntü`, çıkış 0. Yatay taşma uyarısı yok. Betiğin kendi denetimleri: HTTP 200 ve yönlendirme yok, görünüm genişliği, açık tema + azaltılmış hareket, PNG genişliği = görünüm genişliği ve yükseklik ≥ görünüm yüksekliği, 99 benzersiz ad, ZIP merkez dizini adı/boyutu/CRC'si. Ayrıca betikten bağımsız: `unzip -tq` hatasız (99 girdi), PNG başlıklarından 33 × 3 boyutun hepsi doğru genişlik ve en az görünüm yüksekliği, çalıştırma sonunda 1420 portunda dinleyen süreç yok, `git status` çıktıları göstermiyor.
- Gözle inceleme (Agent Browser ile alınan görüntüler): `tr-hakkinda-phone`, `ar-hakkinda-tablet` (RTL), `tanilama-tablet`, `admin-ozet-desktop`, `admin-ayarlar-phone`; alt menü en altta, metin okunur, maskeler beş değeri tamamen örtüyor, etiketler görünür.
- Bağımsız gizlilik incelemesi (ayrı Claude alt ajanı, salt okunur): 12 Hakkında görüntüsünün hepsi GEÇTİ (beş değer tamamen örtülü, etiketler okunur); 21 örnek görüntüde kişisel ad, e-posta, MAC, ana makine adı ya da gerçek rapor kimliği yok; IP olarak yalnız 1.1.1.1 ve 8.8.8.8; iletişim formu yalnız yer tutucu metin gösteriyor. Proje bilgisi olarak işaretlenenler aşağıda (sınırlamalar).
- `lat check` → "All checks passed".
- `cargo test` → **yapılmadı**; Rust değişmedi.
- İnceleme düzeltmelerinden sonra yeniden: `bun run check` (0 hata, 0 uyarı), `bun run build` (33 sayfa), `lat check` geçti; `bun run screenshots` 99 PNG + ZIP, çıkış 0; `unzip -tq` hatasız, girdi tarihi 1980-01-01; geçici klasör, 1420 portu ve tarayıcı oturumu çalıştırma sonunda boş. Ctrl+C yolu elle denenmedi.
- `phone` düzeltmesinden sonra: `bun run screenshots` 99 PNG + ZIP, çıkış 0, taşma uyarısı yok; `-mobile` adlı dosya 0, `home-phone.png` var. Arşivin tamamı Python `zipfile` ile okundu: 99 girdi, 99 benzersiz ASCII ad, ZIP adları klasördeki PNG'lerle aynı ve her girdi dosyayla bayt bayt eşit; boyut başına 33 görüntü (phone 390, tablet 820, desktop 1440 px genişlik, yükseklik en az görünüm yüksekliği); 33 sayfanın her biri 3 boyutta. `unzip -tq` hatasız. Gözle: `home-phone`, `fa-hakkinda-phone` (RTL, beş alan maskeli), `tr-iletisim-desktop`. `bun run build` (33 sayfa), `bun run check` (0 hata, 0 uyarı) ve `lat check` yeniden geçti.
- `proje.zip` → `git archive --format=zip --prefix=netcheck/ HEAD` ile depo dışına (worktree'nin yanındaki `teslim/` klasörü) üretildi: `unzip -tq` hatasız, 379 izlenen dosya (dizinlerle 475 girdi), `scripts/ekran-goruntuleri.ts` içinde; `node_modules`, `target`, `dist`, `dist-admin`, `.astro`, `.orchestrator`, `screenshots/`, `screenshots.zip`, `.lat-build` ve Android derleme çıktısı girdisi 0. Arşiv, bu günlüğü de içeren son commit'ten yeniden üretilir. Blackboard'a yükleme yapılmadı (öğrenci yapar).

## Bilinen sınırlamalar ve açık maddeler

- Görüntüler tarayıcı önizlemesidir: ağ ekranları "yalnızca NetCheck uygulamasında", Geçmiş boş, Rapor "bulunamadı", panel "bağlı değil" durumundadır. Gerçek tanılama sonucu içeren ekran yoktur; bu bilinçli bir karardır (sahte veri yasağı, gerçek ağ verisinin görüntüye girmemesi).
- Maskelenen yalnız Hakkında sayfalarındaki beş geliştirici alanıdır. İletişim, Gizlilik ve Kullanım Koşulları sayfalarındaki herkese açık depo adresi (`github.com/…/netcheck`) ile Kullanım Koşulları ve Ayarlar'daki üniversite/ders adı proje bilgisidir ve maskelenmedi. Bağımsız incelemenin notu: İletişim sayfasındaki depo adresi GitHub kullanıcı adını, Kullanım Koşulları'ndaki ders şablonu bağlantısı (`keyvanarasteh/hello-mobil`) öğretim görevlisinin kullanıcı adını, Ayarlar ve Kullanım Koşulları üniversite/ders adını gösterir; bunlar Hakkında'da maskelenen değerlerin bir kısmını ortaya koyar. Maskelemenin bu sayfalara genişletilmesi depo sahibinin kararıdır.
- İnceleme uygulama içeriğinde (bu işin kapsamı dışında, değiştirilmedi) şunları gördü: ar/fa Hakkında sayfalarında `$state`, `$derived` kod parçaları RTL'de karışık sırada; `ar-hakkinda-desktop`'ta `NCHK-YYYY-XXXXXXXX` iki satıra bölünüyor; uygulama gezinmesi bilgi sayfalarının diğer dillerinde de Türkçe (sayfa dili rotaya sabit, uygulama dili ayrı — mevcut tasarım).
- Gizlilik denetimi bilinen kalıpları (IP, MAC, e-posta, rapor kimliği, dolu form alanı, geliştirici adı) yakalar; serbest metindeki her türlü kişisel bilgiyi tanıyamaz. Tarayıcı önizlemesi cihaz adı alamaz.
- Betik genel kurulu `agent-browser` CLI'ını kullanır; projeye bağımlılık eklenmedi. Yalnız Windows'ta çalıştırıldı; macOS/Linux'ta PATH çözümlemesi yazıldı ama denenmedi.
- Orkestratör işlem politikasında push ve PR hedefleri boş; dal gönderilmedi, PR açılmadı (aşağıda).

## PR

Henüz yok. Commit orkestratör işlem kapısından geçti (`authorize-operation commit` → izinli; denetim kaydı `.orchestrator/audit/operations.jsonl`). Push için kapı reddetti: "Branch 'feature/ekran-goruntuleri' is not in allowed_push_branches." (`allowed_push_branches` ve `allowed_pr_base_branches` boş). Bu nedenle dal gönderilmedi ve PR açılmadı; engellenen deneme denetim kaydına yazıldı. `phone` düzeltmesinde push/PR kapısı istenmedi (yerel düzeltme). Gereken yetki: depo sahibinin `.orchestrator/OPERATION_POLICY.json` içinde `allowed_push_branches` listesine `feature/ekran-goruntuleri`, `allowed_pr_base_branches` listesine `master` eklemesi ve push/PR için açık onay vermesi; ardından kapı, dalın son commit'iyle `push` ve `pr-create` için yeniden çalıştırılır. Bağlantı buraya eklenir.
