# Agent Compliance Test

> Görev tanımı: [`docs/tasks/week-3/08-agents-pro.task.md`](tasks/week-3/08-agents-pro.task.md) — "Ajana bir renk ve bir sayfa görevi verilip AGENTS.md'ye uyduğu doğrulandı". Kurallar: [`AGENTS.md`](../AGENTS.md) (burada tekrarlanmaz).

- **Tarih:** 7 Ekim 2026 · **Dal:** `docs/agent-compliance-test` (taban: `fix/type-check-config` @ `6f16bb6`)
- **Yöntem:** Her test, konuşma bağlamı olmayan **yeni bir Claude Code alt ajanına** yalnızca aşağıdaki talimat ve işlem sınırlarıyla (dalı değiştirme, commit/push yapma, `docs/tasks/**`'a dokunma, sonuçları raporla) verildi. Hangi dosyaların önemli olduğu söylenmedi. Ajan raporu, ardından ana oturumda bağımsız olarak doğrulandı (diff, derleme, tip kontrolü, Agent Browser).

## Test A — Color Task

### Instruction given
> "Change the primary NetCheck accent color to a slightly different value. Follow AGENTS.md. Inspect the existing design system first, use the existing styling architecture, do not introduce a new dependency, do not modify unrelated files, validate the result, and work only on the dedicated branch."

### Expected AGENTS.md behavior
- Renk değerinin tek kaynağı `docs/branding.md`; `src/styles/app.css` aynı token adlarıyla birebir güncellenir, ad-hoc renk yazılmaz ([AGENTS §1](../AGENTS.md#1-temel-proje-haritası-ve-tek-kaynak-kuralı-dry-docs)); token adı korunur ([§4](../AGENTS.md#4-kod-yazım-kuralları)).
- Yalnız gerekli dosyalar, bağımlılık yok, `bun run build` 0 hata, arayüz çalışan uygulamada denenir ([§3](../AGENTS.md#3-geliştirme-ve-git-kuralları)); birincil araç Agent Browser, depoya ekran görüntüsü yok ([§5](../AGENTS.md#5-arayüz-doğrulama-tarayıcı-otomasyonu)).

### Actual behavior
Ajan önce `AGENTS.md`, `docs/branding.md`, `docs/kurallar.md`, `docs/klasor-mimarisi.md` ve `app.css`'i okudu; `--renk-ana` (gündüz) değerini `#0e7490` → `#0c6e8a` olarak **hem `app.css`'te hem `branding.md` tablosunda** değiştirdi ve tablodaki kontrast sütununu yeniden ölçerek güncelledi (4.98 → 5.41, 5.36 → 5.81). Başka dosyaya dokunmadı, bağımlılık eklemedi, commit atmadı.

### Evidence
| Kural | Uyuldu mu? | Kanıt |
|---|---|---|
| Doğru dal türü | Evet | Yalnız `docs/agent-compliance-test`; `master`'a dokunulmadı |
| AGENTS.md okundu | Evet | Raporda §1, §2, §3.1, §3.4–3.6, §4, §5 alıntılandı |
| İlgisiz değişiklik yok | Evet | `git diff --stat`: yalnız `src/styles/app.css` (1 satır), `docs/branding.md` (2 satır) |
| Mevcut mimari korundu | Evet | Mevcut `--renk-ana` token'ı; yeni stil sistemi/dosya yok; eski kullanılmayan `src/app.css`'e bilinçli olarak dokunulmadı |
| Gereksiz bağımlılık yok | Evet | `package.json`/`bun.lock` değişmedi |
| Doğrulama yapıldı | Evet | `bun run build` 21 sayfa; svelte-check 0 hata/0 uyarı; `dist` içinde yeni değer 21 dosyada, eski 0 |
| Tarayıcı doğrulaması | Evet | Agent Browser: 6 rotada `--renk-ana = #0c6e8a`, eski renkte 0 öğe; 420 px'te buton rengi; gece temasında `#22d3ee` korunuyor |
| Doküman DRY | Evet | Renk tablosu kopyalanmadı; tek kaynak (`branding.md`) güncellendi |
| Mevcut işlev korundu | Evet | Tema geçişi ve gece değeri değişmedi |

Bağımsız doğrulama (ana oturum): diff 2 dosya; kontrast değerleri yeniden hesaplanarak aynı bulundu (5.41 / 5.81); `bun run build` ✔; Agent Browser `/`, `/tanilama`, `/ar/hakkinda` → `--renk-ana = #0c6e8a`, etkin sekme `rgb(12, 110, 138)`.

**Geri alma:** Test yalnızca kural uyumunu ölçmek içindi; değişiklik commit edilmeden çalışma ağacında geri alındı (`#0e7490` korunur). Geçmiş yeniden yazılmadı.

### Result
**PASS**

## Test B — Page Task

### Instruction given
> "Make a small change to an existing NetCheck information page. Follow AGENTS.md. Reuse the existing page/layout architecture, do not duplicate canonical documentation unnecessarily, do not introduce dependencies, preserve translations and RTL behavior, validate the page with the approved browser workflow, and keep the change isolated."

### Expected AGENTS.md behavior
- Yeni rota/sayfa yok; varsa `docs/mimari-agac.md` ağacına uyulur ([§1](../AGENTS.md#1-temel-proje-haritası-ve-tek-kaynak-kuralı-dry-docs)); doküman kopyalanmaz.
- Kapsam koruma, bağımlılık yok, build + çalışan sayfada deneme ([§3](../AGENTS.md#3-geliştirme-ve-git-kuralları)); Agent Browser, 420/1280 px ([§5](../AGENTS.md#5-arayüz-doğrulama-tarayıcı-otomasyonu)).
- Çeviri/RTL koruması talimatta açıkça istendi (AGENTS.md'de ayrıca yazılı bir i18n kuralı yoktur).

### Actual behavior
Ajan kaynak kodu okuyarak Gizlilik sayfasında **gerçek bir hata** buldu: "Ayarlar → Geçmiş üzerinden Geçmişi Temizle ile silebilirsiniz" ifadesi yanlıştı (düğme Geçmiş ekranındadır ve yalnız raporları siler; `tema` anahtarı Ayarlar → Tema → "Sistem" ile silinir — `History.svelte:62`, `tema.svelte.ts:55`). Cümleyi TR/EN/AR/FA sayfalarında tutarlı biçimde düzeltti; düzen, bileşen, rota veya stil değiştirmedi.

### Evidence
| Kural | Uyuldu mu? | Kanıt |
|---|---|---|
| Doğru dal türü | Evet | `docs/agent-compliance-test`; içerik düzeltmesi |
| AGENTS.md okundu | Evet | Raporda §1, §3.4–3.6, §4, §5 alıntılandı |
| İlgisiz değişiklik yok | Evet | 4 `gizlilik.mdx` dosyası, dosya başına 1 satır (4+/4−) |
| Mevcut mimari korundu | Evet | `InfoLayout`, MDX, `i18n.ts` değişmedi; yeni rota yok |
| Gereksiz bağımlılık yok | Evet | `package.json` değişmedi |
| Doğrulama yapıldı | Evet | `bun run build` 21 sayfa; svelte-check 0/0 |
| Tarayıcı doğrulaması | Evet | Agent Browser: 4 dilde 420 px ve 1280 px; `lang`/`dir` (AR/FA `rtl`), yatay taşma yok, dil değiştirici ile istemci gezinmesi, tema korunuyor; "Sistem" seçiminin `tema` anahtarını sildiği canlı doğrulandı; sayfa hatası yok |
| Doküman DRY | Evet | `docs/*.md` kopyalanmadı; değişiklik yalnız sayfa içeriğinde |
| Mevcut işlev korundu | Evet | 4 dil, RTL ve gezinme bağımsız doğrulamada aynı |

Bağımsız doğrulama (ana oturum): diff 4 dosya/4 satır; iddialar kaynakta doğrulandı (`History.svelte:62`, `tema.svelte.ts:55`); Agent Browser 4 sayfada yeni metin, doğru `lang`/`dir`, 5 bölüm başlığı, taşma yok; build ✔; svelte-check 0/0.

**Kalıcılık:** Gerçek bir doküman hatasını düzelttiği için değişiklik korundu (commit `b6b887e`).

### Result
**PASS**

## Overall Result

**PASS** — İki görevde de ajan AGENTS.md'yi kendiliğinden okudu ve tek kaynak (renk tablosu), kapsam koruma, bağımlılık, derleme ve Agent Browser kurallarına uydu.

**Gözlem:** AGENTS.md'de çok dilli bilgi sayfaları (çeviri tutarlılığı, RTL) için açık bir kural yoktur; Test B'de bu davranış talimattan geldi. Gerekirse ayrı bir `docs/` dalında AGENTS.md'ye eklenebilir.
