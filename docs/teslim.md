# Teslim

> Görev tanımları: [`docs/tasks/week-3/09-progress-batch-01.task.md`](tasks/week-3/09-progress-batch-01.task.md), [`docs/tasks/week-3/01-pr-merge.task.md`](tasks/week-3/01-pr-merge.task.md)

## Son tarihler (Hafta 3)
| Teslim | Tarih |
|---|---|
| Proje fikri özeti (Blackboard) | 07.10.2026 23:59 |
| Batch 01 — tüm hafta 3 görevleri | 09.10.2026 23:59 |

## Adımlar
1. Her özellik kendi dalında geliştirilir (`feature/…`, `fix/…`, `docs/…`) ve PR ile `master`'a birleştirilir. Kurallar: [`AGENTS.md`](../AGENTS.md).
2. Birleştirme öncesi doğrulama:
   ```bash
   bun run build
   ```
   Çıktı `Complete!` ile bitmeli ve tüm sayfalar listelenmeli (build kanıtı ekran görüntüsü).
3. Tüm PR'lar birleştikten sonra kilometre taşı etiketi:
   ```bash
   git checkout master
   git pull origin master
   git tag -a v0.1.0-batch-01 -m "Hafta 3: Batch 01 - Proje altyapısı, markalama ve sayfalar tamamlandı"
   git push origin v0.1.0-batch-01
   ```
4. Blackboard'a PR linki gönderilmez (eğitmen `keyvanarasteh` repoda collaborator). Tüm görevler bitince GitHub'dan **Code → Download ZIP** ile alınan tek `.zip` yüklenir.

## Batch 01 kontrol matrisi
Kontrol listesi: [`09-progress-batch-01.task.md` § 1](tasks/week-3/09-progress-batch-01.task.md#1-batch-01-tamamlama-kontrol-matrisi).
