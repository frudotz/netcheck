# Proje Duraklatma ve Devir

Numarasız iş; günlük dal adıyla tutulur ([`README.md`](README.md)). Dal: `docs/proje-duraklatma`, Görev 16 dalının üstünde (zincirin sonu). Sonuç belgesi: [`docs/PROJECT-PAUSE.md`](../PROJECT-PAUSE.md).

## Araç ve model

Claude Code, Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-22. Windows, PowerShell. Yalnız okuma komutları (`git`, `gh`) ve belge düzenleme; uygulama çalıştırılmadı, girdi otomasyonu yapılmadı.

## Şartname

- **Amaç:** Projeyi süresiz duraklatmadan önce depoyu bozmadan durumu belgelemek ve dönüşü kolaylaştırmak.
- **Kapsam dışı:** PR birleştirme ya da kapatma, dal silme, etiket ya da sürüm, dağıtım, kural seti veya ayar değişikliği, AI Studio deposunu arşivleme, PR #32'yi genişletme.
- **Kabul ölçütleri:**
  - Durum GitHub'dan yeniden okunmuş.
  - Tek bir kısa devir belgesi var ve istenen dokuz bölümü içeriyor.
  - Doğrulama düzeyleri (uygulandı, CI, araçla denendi, bekliyor, denenmedi) birbirinden ayrı.
  - Hiçbir mevcut iş kaybolmamış.
- **Dokunulacak dosyalar:** `docs/PROJECT-PAUSE.md` (yeni), bu günlük, `docs/istemler/README.md` (satır), `AGENTS.md` (indeks satırı).
- **Doğrulama adımları:** belgedeki her SHA, CI ve ayarın komutla yeniden kontrolü; `lat check`; bağlantı denetimi; `git diff --check`; Çince/Japonca karakter taraması.

## İstem

"NetCheck — Safe Pause and Handover" istemi, olduğu gibi:

```text
# NetCheck — Safe Pause and Handover

You are working on `frudotz/netcheck`. I am pausing this project for an indefinite period and will return to it later. Your task is to leave the repository in a safe, stable, fully documented state that makes resuming work straightforward.

**This is a controlled project pause, not a release, not a completion declaration, and not permission to merge unfinished work.** Work autonomously within the scope below. Do not ask me to make routine decisions; record genuine blockers and unresolved decisions clearly.

## 1. Protect the existing state

Before changing anything:

1. Inspect the current Git branch, working tree, staged and unstaged changes, untracked files, stashes, and recent commits.
2. Fetch GitHub state and inspect `master`, open pull requests, their current base/head branches, latest commit SHAs, mergeability, and CI status.
3. Confirm the current immutable tag `v0.1.0-batch-01` still points to its expected commit. Do not move, delete, or recreate it.
4. Confirm the `Protectmaster` ruleset and its current settings without modifying them.
5. Identify any work that exists only locally or on remote feature branches. Do not discard it.

If there are uncommitted changes, **do not reset, clean, stash, overwrite, or discard them automatically**. Preserve them and document exactly what they are. Do not use destructive Git commands, rewrite history, force-push, or bypass branch protections.

## 2. Keep unfinished work unmerged

The last known state has PRs #35–#43 open and intended to be handled in dependency order. Re-fetch their current state rather than relying on old reports.

- Do not merge PRs #35–#43.
- Do not merge PR #32 or PR #42.
- Do not close PRs or delete branches merely to make the project look clean.
- Do not create `v0.2.0-batch-02` or any other release/tag.
- Do not deploy to production, change live infrastructure, rotate secrets, or modify GitHub rulesets.
- Do not archive the AI Studio panel source repository.

These restrictions remain in force even if all CI checks pass. Passing CI does not mean instructor approval, required student evidence, or release acceptance criteria are complete.

## 3. Review and preserve the Batch 02 handover

Inspect `docs/ilerleme-batch-02.md`, the task documentation, `AGENTS.md`, and the relevant PR descriptions and review comments.

Document the current state of PRs #35–#43, including:

- PR number, title, branch, base branch, latest head SHA, and current CI result.
- Dependencies and the intended merge order.
- Missing student-run tests, screenshots, and other acceptance evidence.
- Unresolved instructor decisions and deferred platform work.
- Any conflicts, stale branches, or differences between documentation and the actual repository state.

Preserve the distinction between **implemented**, **CI-verified**, **manually tested**, **awaiting external approval**, and **not tested**. Never upgrade a status without evidence.

Known issues to re-check include:
- Task 10's new-chat test and its missing evidence.
- Task 11's sample-data decision and missing student evidence.
- Task 12–14's required student test steps/screenshots and the pending language decision.
- Task 15's deferred platform testing and any documentation discrepancy concerning macOS.
- Task 16's acceptance criteria and the blocked release gate.
- PR #32's unresolved authentication, authorization, data-integrity, session, and privacy concerns.
- PR #42's UI-only migration scope and the remaining decisions about authentication/data sources, administration features, and mobile support.

These are leads to verify, not permission to assume the current state is unchanged.

## 4. Make only safe, useful documentation changes

If the repository is clean and the existing documentation is insufficient, add or update a single concise handover document, preferably `docs/PROJECT-PAUSE.md`.

It must contain:

1. Pause date and purpose.
2. Actual `master` commit SHA and working-tree status.
3. The immutable tag and branch-protection status, with verification details.
4. Open PRs, their dependencies, latest verified CI state, and blockers.
5. Outstanding instructor decisions and user-run acceptance tests.
6. Known risks, deferred work, and explicit non-goals.
7. A safe, ordered checklist for resuming work later.
8. Exact commands for checking Git status, fetching updates, inspecting PRs, and resuming the work without losing changes.
9. A clear statement that this pause does not mean Batch 02 is complete or approved for release.

Do not duplicate existing documentation unnecessarily. If the current documentation already provides an adequate handover, prefer a small, accurate update rather than creating redundant files.

Only make documentation changes that are genuinely useful. If you modify files, use a separate branch and a small, reviewable diff. Do not commit directly to `master`. Do not push or open a PR unless the existing project workflow and repository state clearly support doing so safely. If uncertain, leave the changes local and report that explicitly.

## 5. Preserve the AI Studio panel work

Treat PR #42 as an unmerged, UI-only migration proposal unless current evidence proves otherwise. Do not merge it or archive the source repository. Record the relationship between PR #32 and PR #42, their different scopes, and the outstanding decisions. Do not revive or extend the unsafe authentication/database implementation in PR #32.

## 6. Final verification

Before finishing:

- Re-check the working tree and branch.
- Confirm that no release/tag, production deployment, live configuration change, or unintended merge occurred.
- Confirm no existing user changes or feature branches were lost.
- Verify any handover document against the actual current GitHub state.
- Run only safe, relevant checks for documentation changes; do not launch disruptive tests or synthetic global mouse/keyboard input.
- Report any verification you could not perform as **not verified**, not as a success.

## 7. Final report

Give me a concise Turkish report with:

- **Durum:** proje güvenli şekilde beklemeye hazır mı?
- **Korunanlar:** master SHA, immutable tag, branch protection, open PRs and branches.
- **Yapılanlar:** exact files changed and commit/branch/PR details, if any.
- **Yapılmayanlar:** merges, releases, deployments, live changes.
- **Açık konular:** remaining blockers, instructor decisions, and manual evidence.
- **Dönüş planı:** the first 3–5 actions to resume safely.
- **Working tree:** clean or dirty, with exact details.

Be factual and conservative. Do not claim the project is fully complete, released, or production-ready. The goal is to preserve everything safely and make it easy for me to return later.
```

## Plan

1. Yalnız okuyarak durumu topla: dal, çalışma ağacı, stash, yerel ve uzak dallar, PR'lar, CI, etiket, kural seti, AI Studio deposu.
2. Belgeler yetersizse tek bir devir belgesi yaz. Mevcut belgeleri tekrarlamadan onlara bağlantı ver.
3. Depo temiz ve iş akışı dal + PR olduğu için ayrı bir belge dalı aç, PR'ı birleştirmeye gerek olmayan bir anlık görüntü olarak aç.

## Düzeltmeler ve kararlar

- **Belgenin yeri:** dal, zincirin en üstündeki Görev 16 dalının üstünde. Böylece `ilerleme-batch-02.md`'ye verilen bağlantılar çalışıyor ve AGENTS.md indeksinin diğer dallarla çakışmadan güncellenebiliyor. `master` tabanlı bir dal bu belgelere bağlantı veremezdi.
- **Var olan belgeler değiştirilmedi.** Bulunan farklar devir belgesinin § 6 bölümünde listelendi: NC-10 macOS cümlesi, uyum matrisindeki öğrenci kanıtı eksiği, `ilerleme-batch-02.md`'deki iki eski satır. Dönüşte ilgili dallarda düzeltilecek.
- **Yalnız yerelde olan dal:** `feature/09-1-master-korumasi`, PR #34'ün başı. İçeriği `master`'da birebir duruyor; silinmedi.

## Doğrulama

- Durum komutları: `git status --porcelain --untracked-files=all` (boş), `git stash list` (boş), `git fetch origin --prune`, `origin/master` = `9970845`.
- `gh pr list` ve `gh pr view`: #35–#43 `MERGEABLE`/`CLEAN`, son commit'lerinde 5/5. #32 `BEHIND`.
- `git ls-remote --tags origin`: yalnız `v0.1.0-batch-01` (`aebd3fe` → `b9fc299`). GitHub sürümü yok.
- `gh api .../rulesets/25080546`: `active`, `~DEFAULT_BRANCH`, dört kural, beş katı kontrol.
- `gh api repos/frudotz/netcheck-gorev-aistudio`: arşivlenmemiş, `b5ba95d`.
- `lat check`, bağlantı denetimi, `git diff --check`, Çince/Japonca karakter taraması: PR açıklamasında.

## Bilinen sınırlamalar ve açık maddeler

- Belge 22.10.2026'nın anlık görüntüsü; dönüşte § 8 komutlarıyla yeniden doğrulanmalı.
- Eğitmenin Telegram'daki mesajları ve derste duyurulan bilgiler kontrol edilemedi (depo dışında).

## PR

Açılacak (taban: #43'ün dalı).
