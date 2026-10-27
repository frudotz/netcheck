# Görev 09.1 — Master Dalını Koruma ve PR Güvenliği

Görev dosyası: [`docs/tasks/week-4/09-1-master-korumasi.task.md`](../tasks/week-4/09-1-master-korumasi.task.md). Bu günlük, şablon Görev 10'da oluşturulduğu için sonradan yazıldı; içerik o oturumun kaydına dayanır.

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-21. Windows, PowerShell.

## Şartname

- **Amaç:** `master` dalını kural setiyle korumak ve kuralı belgelemek; Batch 02'nin ön koşulu.
- **Kapsam dışı:** GitHub ayarları (yalnız depo sahibi değiştirir); `master`'a doğrudan push denemesi; kural setinin adını değiştirmek.
- **Kabul ölçütleri:** kural seti Active ve yalnız varsayılan dalda; deletion, force push, PR ve durum kontrolleri kuralları açık; merge commit ve dal otomatik silme açık; dış katkıcı iş akışı onayı açık; `docs/kurallar.md` içinde "PR güvenliği" ve `AGENTS.md`'den link; `docs/kanit/master-korumasi.png`.
- **Dokunulacak dosyalar:** `docs/kurallar.md`, `AGENTS.md`, `docs/kanit/master-korumasi.png`, `docs/klasor-mimarisi.md`, `docs/course-compliance.md`, `lat.md/`.
- **Doğrulama adımları:** ayarları GitHub API ile yalnız okuyarak kontrol etmek; `lat check`; `bun run build`; bağlantı ve başlık çapası kontrolü; `git diff --check`; PR'da beş CI kontrolü.

## İstem

Görev iki istemle yürüdü.

**1. "NetCheck — Batch 02 Execution and AI Studio Admin Migration" isteminden Görev 09.1 ile ilgili bölümler (alıntı):**

```text
## Phase 0 — Verify GitHub protection before pushing

Inspect the current GitHub repository and `Protectmaster` ruleset state using available read-only tools.
[...]
I will change repository settings manually. Do not modify GitHub settings or push a test branch until I confirm the settings are fixed. If anything remains incorrect, report the exact UI path and the needed change, then stop before any branch push.

## Phase 2 — Complete Task 09.1

Use the actual instructor task file under `docs/tasks/week-4/` as the requirement source.

Create a dedicated branch and PR for Task 09.1. Include:
- `docs/kurallar.md` with a clearly linked "PR güvenliği" section documenting the actual rules.
- An appropriate link from `AGENTS.md`.
- `docs/kanit/master-korumasi.png` only after I provide a screenshot of the final saved GitHub ruleset.
- A safe verification checklist for the master protection configuration.

Do not fabricate a screenshot, claim settings are active without evidence, or commit the instructor PDF. Do not test branch protection by attempting a prohibited push.

Run the relevant checks, review the full diff, open the PR, and stop before merging until the CI and evidence are reviewed.
```

**2. Görev 09.1 istemi (tam metin):**

```text
Settings are final and verified. Use the existing `Protectmaster` ruleset without renaming or changing it.

The screenshot has been saved in the repository as `docs/kanit/master-korumasi.png`. Use that exact file as the Task 09.1 evidence; verify it exists and is readable before proceeding. Do not recreate or replace it.

Proceed with Task 09.1:
1. Verify `master` and `origin/master` are current and the worktree is clean.
2. Create `feature/09-1-master-korumasi` from the latest master.
3. Add the required `docs/kurallar.md` PR safety section and link it from `AGENTS.md`.
4. Include `docs/kanit/master-korumasi.png` and accurately document the verified ruleset configuration.
5. Do not claim a direct-push rejection was tested. Record that the ruleset configuration was verified through GitHub settings/API and leave the prohibited-push self-test unperformed.
6. Run the relevant checks, `lat check`, and `git diff --check`. Review the complete diff and ensure no unrelated changes.
7. Push the feature branch and open a PR. Do not merge it.
8. Stop and report the PR URL, head SHA, changed files, checks/CI results, and any remaining checklist items.

Do not modify GitHub settings, attempt a direct push to master, use destructive Git commands, or change the immutable tag `v0.1.0-batch-01`.
```

## Plan

Araç önce ayarları yalnız okuyarak raporladı. İlk okumada kural seti bütün dalları hedefliyordu, dal otomatik silme kapalıydı ve dış katkıcı onayı yalnız ilk kez katkı verenler içindi. Depo sahibi ayarları düzeltti; ikinci okumada hepsi doğruydu. Araç ardından dal adını ve ekran görüntüsü gelene kadar PR açmadan bekleyeceğini bildirdi. Dosya düzeyindeki plan 2. istemin kendisiydi; ayrı bir plan onayı turu yapılmadı.

## Düzeltmeler

- Depo sahibi kural setinin adını `Protectmaster` olarak bıraktı (görev `master koruması` öneriyor; kontrol listesi adı şart koşmuyor).
- Doğrudan push öz testi depo sahibinin kararıyla yapılmadı.
- `AGENTS.md` § 5 ekran görüntüsünü yasaklıyordu; görev ekran görüntüsü istediği için araç dar bir istisna ekledi ve PR'da depo sahibinin onayına sundu. PR merge edildi.
- Araç kaynaklı hata: ilk commit denemesi PowerShell'de başarısız oldu ama push çalıştı; dal kısa süre `master` ile aynı commit'te uzak depoda durdu. Ardından doğru commit normal (fast-forward) push ile gönderildi; force push yapılmadı.

## Doğrulama

- GitHub API (2026-10-21, kural seti son kaydı 20:16): `Protectmaster` Active, hedef `~DEFAULT_BRANCH`, bypass boş; `deletion`, `non_fast_forward`, `pull_request` (0 onay), `required_status_checks` (5 iş, strict). Özellik dalı adı için kural dönmüyor. `delete_branch_on_merge=true`, `approval_policy=all_external_contributors`, iş akışı izni `read`.
- Ekran görüntüsü depo sahibinin dosyasıyla bayt bayt aynı (git blob karşılaştırması); kişisel veri içermiyor.
- `lat check`: geçti. `bun run build`: 21 sayfa, 0 hata. Değişen belgelerde 57 bağlantı ve çapa: kırık yok. `git diff --check`: temiz.
- PR #34 head `3c8a034`: beş CI kontrolü geçti. Squash merge `9970845`.

## Bilinen sınırlamalar ve açık maddeler

- `master`'a doğrudan push reddi (görev § 3.1) denenmedi; koruma yapılandırmadan doğrulandı.
- Ekran görüntüsünde durum kontrolü listesi ve strict ayarı kapalı panelde; bu değerler API'den belgelendi.

## PR

[#34](https://github.com/frudotz/netcheck/pull/34), merge commit `9970845`.
