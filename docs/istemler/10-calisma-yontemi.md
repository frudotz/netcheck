# Görev 10 — Çalışma Yöntemi: Şartname, İstem Günlüğü, Doğrulama

Görev dosyası: [`docs/tasks/week-4/10-calisma-yontemi.task.md`](../tasks/week-4/10-calisma-yontemi.task.md). Dal: `feature/10-calisma-yontemi` (`master` `9970845`'ten).

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-21. Windows, PowerShell.

## Şartname

- **Amaç:** Bundan sonraki her görevin aynı döngüyle yapılması: şartname, plan, onay, değişiklik, doğrulama, PR.
- **Kapsam dışı:** uygulama kodu; yönetim paneli taşıması; GitHub ayarları; PR #32; eğitmenin görev dosyaları.
- **Kabul ölçütleri:**
  - `docs/gorev-sartnamesi.md` beş başlıkla ve NetCheck'e özgü örnek satırlarla.
  - `docs/istemler/README.md` (dosya adı `NN-kisa-ad.md`, bölümler) ve bu günlük.
  - `AGENTS.md` içinde "Çalışma döngüsü": önce plan ve onay, her görev ayrı dal ve PR, `bun run build` temiz olmadan iş bitmez.
  - İki yeni belge `AGENTS.md` indeksinde.
  - Eğitmenin 21.10 raporundaki kural: ajan Çince ya da Japonca karakter yazmaz. `CLAUDE.md` ve `GEMINI.md` yalnız `AGENTS.md`'ye yönlendirir.
- **Dokunulacak dosyalar:** `docs/gorev-sartnamesi.md`, `docs/istemler/README.md`, `docs/istemler/10-calisma-yontemi.md`, `docs/istemler/09-1-master-korumasi.md` (Görev 09.1'in eksik günlüğü), `AGENTS.md`, `docs/kurallar.md` (kural indeksi), `docs/course-compliance.md`, `lat.md/tasks.md`, `lat.md/workflows.md`.
- **Doğrulama adımları:** `lat check`; `bun run build`; değişen belgelerde bağlantı ve başlık çapası kontrolü; `git diff --check`; tüm diff'in okunması; görevin § 3 kural testi; PR'da beş CI kontrolü.

## İstem

Görev dosyasındaki örnek istem yerine depo sahibinin kendi istemi kullanıldı; görev dosyasının istediği maddelerin hepsini kapsıyor. Tam metin:

```text
# NetCheck — Task 10: Çalışma Yöntemi

Continue in the existing Windows Claude Code session.

Repository: `https://github.com/frudotz/netcheck`
Task: Batch 02 / Task 10 — Çalışma yöntemi
Task 09.1 PR #34 has been merged. Merge commit: `9970845f5e4558ad2db510d0e00b83fe2ff6621b`.
Expected current master: `9970845f5e4558ad2db510d0e00b83fe2ff6621b`, unless new commits have landed.

## 1. Verify before starting

- Fetch origin and verify the latest `origin/master`.
- Inspect the worktree, staged and untracked files, local branches, and stashes.
- Preserve all existing work; never use destructive commands, reset --hard, rebase, or force push.
- Confirm Task 09.1 files are present on master: `docs/kurallar.md`, `docs/kanit/master-korumasi.png`, and the relevant AGENTS.md links.
- Preserve the immutable `v0.1.0-batch-01` tag.

If the worktree is not clean or the expected merge is not present, stop and report before creating a branch.

## 2. Read the actual Task 10 requirements

Read the exact task file under `docs/tasks/week-4/`. Also read the relevant sections of `AGENTS.md`, `docs/kurallar.md`, and the instructor's requirements already available in the project context.

Do not infer requirements solely from the compliance matrix or previous summaries. The task file is authoritative.

## 3. Create the task branch

Create `feature/10-calisma-yontemi` from the latest `origin/master`.

One task, one branch, one PR. Do not combine unrelated cleanup or admin panel implementation with Task 10.

## 4. Implement the required work

At minimum, evaluate and implement the task-file requirements for:

- `docs/gorev-sartnamesi.md`: a practical task specification template.
- `docs/istemler/`: prompt logs, naming conventions, and a concise README explaining how each task's prompt, decisions, validation, and limitations are recorded.
- The first task prompt log, documenting Task 10 itself and the actual prompt used.
- `AGENTS.md`: the required "Çalışma döngüsü" section describing the standard task lifecycle.

Also ensure the repository has one authoritative instruction source. `AGENTS.md` remains the source of project rules; any `CLAUDE.md` or `GEMINI.md` files should point to it rather than duplicating rules.

Add the instructor-required rule prohibiting Chinese and Japanese characters in agent-generated content, in the appropriate authoritative section of `AGENTS.md`. Do not add broad language restrictions that prevent legitimate source material, user-provided text, or code identifiers from being handled when needed.

Make the workflow actionable and concise: inspect task requirements, create a branch, log the prompt, implement only the task scope, validate, review the diff, open a PR, and wait for approval before merging.

## 5. Validation

Run the checks required by the actual task, including where appropriate:

- `lat check`
- `bun run build`
- `git diff --check`
- Markdown links and heading anchors for changed documentation
- A review of the complete diff for unrelated or duplicated rules

Report actual command results. Do not claim a check passed if it was not run.

## 6. Pull request

Push the branch and open a PR into `master`. Include:
- What changed and why.
- The exact task requirements addressed.
- Validation results.
- Known limitations and any requirements still unverified.
- A link to the task prompt log.

Check all five required CI checks on the exact PR head. Since strict mode is enabled, the branch must be up to date with master. If it becomes outdated, merge master into the feature branch; do not rebase.

Do not merge the PR. Stop and report the PR URL, head SHA, changed files, CI results, and any remaining checklist items.

## Restrictions

- Do not modify GitHub settings.
- Do not merge PRs automatically.
- Do not modify PR #32.
- Do not start the admin panel migration in this task.
- Do not change the release tag.
- Do not commit secrets, personal data, or the instructor's private report.
- Do not claim Task 09.1's direct-push self-test passed; it remains unperformed.
```

## Plan

**Ayrı bir plan onayı turu yapılmadı.** İstem kapsamı, dosyaları ve doğrulama adımlarını kendisi belirliyordu ve uygulamayı açıkça istiyordu; araç bu yüzden plan sunup beklemeden uyguladı. Bu, bu görevle eklenen "önce plan, onay bekle" kuralından bir sapmadır. Görev 11'den itibaren araç planı ayrı sunup onay bekleyecek. Uygulanan sıra:

1. `origin/master`'ı ve PR #34'ün merge'ünü doğrula; çalışma ağacı temiz mi bak.
2. Görev dosyasını oku, dalı aç.
3. Şartname şablonunu, istem günlüğü kurallarını ve bu günlüğü yaz. Görev 09.1'in eksik günlüğünü ekle.
4. `AGENTS.md`: § 3 altına "Çalışma döngüsü"; § 4'e yazı sistemi kuralı; indekse iki belge.
5. Uyum matrisi ve `lat.md`'yi güncelle, kontrolleri çalıştır, kural testini yap, PR aç.

## Düzeltmeler

Depo sahibinin istemi görev dosyasına şunları ekledi:

- Çince ve Japonca karakter kuralı. Eğitmenin 21.10 raporundan geliyor; yalnız ajanın ürettiği metni kapsayacak, kullanıcının verdiği ya da kaynaktan aktarılan metni engellemeyecek kadar dar yazıldı.
- `CLAUDE.md` ve `GEMINI.md`'nin yalnız `AGENTS.md`'ye yönlendirdiğinin kontrolü. Değişiklik gerekmedi; başka bir ajan talimat dosyası yok.
- Döngüye günlük, diff okuma ve merge için onay bekleme adımları.

Aracın kendi seçimleri:

- "Çalışma döngüsü" `AGENTS.md` § 3'ün alt bölümü oldu. Yeni bir numaralı bölüm, `docs/kurallar.md`'deki § bağlantılarını bozacaktı.
- Görevlerin istediği ekran görüntüleri `docs/kanit/NN-kisa-ad-*.png` adıyla durur, `AGENTS.md` § 5 istisnasına uygun.
- Depoda Çince ya da Japonca karakter yok. İlk taramada çıkan dosyalar, emojiye eklenen görünüm seçicisini (U+FE0F) yanlışlıkla yakalayan geniş aralıktan geliyordu.

## Doğrulama

- `lat check`: ilk çalıştırmada tek hata, henüz yazılmamış bu günlüğe giden bağlantıydı. Günlük yazıldıktan sonra: "All checks passed".
- `bun run build`: 21 sayfa, `Complete!`, 0 hata.
- Değişen yedi Markdown dosyasında 75 yerel bağlantı ve başlık çapası: kırık yok (`#çalışma-döngüsü` dahil).
- Değişen dosyalarda Çince ya da Japonca karakter: 0.
- `git diff --check`: temiz.
- Uyum matrisi yeniden sayıldı: Hafta 4 19 PASS, 13 PARTIAL, 15 FAIL, 2 UNVERIFIED; özet tablosuyla aynı.
- CI sonucu PR'da.

### Kural testi (görev § 3.3)

**Vekil test:** bu oturumun bağlamını taşımayan, yalnız okuyabilen bir alt ajana yalnız şu soru soruldu: "bu repoda bir görevi hangi sırayla yaparsın?" Alt ajan aynı makinede, bu dalın çalışma ağacını okudu. Yanıtı (dosya listesi çıkarıldı):

```text
Bu depoda bir görevi şu sırayla yaparım: şartname → plan → onay → değişiklik → doğrulama → PR → onayla merge. Bu sıra AGENTS.md dosyasında, §3 "Çalışma döngüsü" bölümünde yazıyor. CLAUDE.md yalnızca bu dosyaya yönlendiriyor.

1. Gereksinimi okurum. Kaynak docs/tasks/ altındaki görev dosyasıdır; özet ya da eski rapor değildir. Görev bir proje kuralıyla çelişirse kendim karar vermem, kullanıcıya sorarım. Ayrıca AGENTS.md içindeki lat bölümü ("Before starting work") gereği lat search ile lat.md/ içindeki ilgili bölümleri okurum.
2. Şartnameyi ve planı hazırlarım. docs/gorev-sartnamesi.md şablonunu doldururum: amaç, kapsam dışı, kabul ölçütleri, dokunulacak dosyalar, doğrulama adımları. Hangi dosyayı neden değiştireceğimi ve nasıl doğrulayacağımı plan olarak sunarım. Onay gelene kadar hiçbir dosyayı değiştirmem.
3. Dalı ve günlüğü açarım. Güncel master'dan feature/NN-kisa-ad dalı açarım; bir görev bir dal ve bir PR demektir. İstem günlüğünü aynı dalda docs/istemler/NN-kisa-ad.md olarak tutarım. Günlüğün bölümleri docs/istemler/README.md dosyasında tanımlı.
4. Değişikliği yaparım. Yalnızca plandaki ve görev kapsamındaki dosyalara dokunurum (§3 madde 5). Kod yazarken §4 kurallarına uyarım: Türkçe arayüz metni, Svelte 5 Runes, IPC yalnızca native.ts üzerinden, sahte veri yok.
5. Doğrularım. bun run build 0 hatayla bitmeli. Rust değiştiyse cargo test, lat.md/ değiştiyse lat check çalıştırırım. Arayüz değiştiyse ekranı çalışan uygulamada denerim; birincil araç Agent Browser'dır (§5). Sonuçları günlüğe olduğu gibi yazarım; çalıştırmadığım bir kontrolü "geçti" saymam. Diff'i baştan sona okurum. lat bölümündeki "Post-task checklist" gereği gerekirse lat.md/ dosyalarını da güncellerim.
6. PR açarım. feat:, fix: ya da docs: önekli commit atarım. PR açıklamasında ne değişti, neden, nasıl test edildi, bilinen sınırlamalar ve günlüğün bağlantısı yer alır. Beş CI kontrolü PR'ın son commit'inde geçmelidir. Dal master'ın gerisinde kalırsa master'ı dala merge ederim; rebase yapmam.
7. Merge'i kullanıcıya bırakırım. PR'ı kendim merge etmem, kullanıcının onayını beklerim.

Dikkat edilecek bir nokta: "Çalışma döngüsü" bölümü henüz commit edilmemiş. Bu bölüm feature/10-calisma-yontemi dalında AGENTS.md dosyasındaki commit edilmemiş değişiklik olarak duruyor; docs/gorev-sartnamesi.md ile docs/istemler/ de henüz git'e eklenmemiş dosyalar. docs/istemler/README.md 09-1 ve 10 numaralı günlükleri listeliyor, ama bu dosyalar klasörde yok.
```

Yanıt `AGENTS.md`'deki döngüyü adım adım anlatıyor. Sondaki not doğruydu: test, değişiklikler commit edilmeden ve iki günlük yazılmadan önce yapıldı.

## Bilinen sınırlamalar ve açık maddeler

- **Öğrencinin kendi kural testi yapılmadı.** Görev, öğrencinin yeni bir sohbet açıp soruyu sormasını ve yanıtı günlüğe eklemesini istiyor. Yukarıdaki alt ajan testi bunun yerine geçmez.
- **Ekran görüntüleri yok.** Kontrol listesindeki "ekran görüntüleri günlükte" maddesi öğrencinin elle yapacağı adımlara bağlı. Görüntüler `docs/kanit/10-calisma-yontemi-*.png` adıyla eklenebilir.
- Plan onayı adımı bu görevde ayrı yapılmadı (yukarıda, "Plan").

## PR

Bu günlüğü içeren PR'ın bağlantısı PR açıldıktan sonra eklenir.
