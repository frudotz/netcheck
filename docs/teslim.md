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
Görev listesi: [`09-progress-batch-01.task.md` § 1](tasks/week-3/09-progress-batch-01.task.md#1-batch-01-tamamlama-kontrol-matrisi). Durum (7 Ekim 2026, `master`; PR #1–#20 birleştirildi):

| No | Alan | Kontrol | Kanıt |
|:---:|---|:---:|---|
| 1 | Fork & İşbirliği | [x] | `frudotz/netcheck`, `keyvanarasteh/hello-mobil` fork'u; `keyvanarasteh` collaborator daveti gönderildi (7 Ekim 2026) |
| 2 | Blackboard Teslimi | [x] | GitHub kullanıcı adı ve fork linki öğrenci tarafından Blackboard'a gönderildi |
| 3 | Proje Fikri | [x] | [`docs/proje-fikri.md`](proje-fikri.md) — 3 ekran (Genel Bakış → Tanılama → Tanılama Raporu), Rust kodu `NCHK-YYYY-XXXXXXXX` |
| 4 | Kurumsal README | [x] | [`README.md`](../README.md) — üniversite logosu, rozetler, akademik ve öğrenci bilgileri |
| 5 | Ajan Kural Dosyaları | [x] | [`AGENTS.md`](../AGENTS.md), [`CLAUDE.md`](../CLAUDE.md), [`GEMINI.md`](../GEMINI.md); uyum testi: [`agent-compliance-test.md`](agent-compliance-test.md) |
| 6 | Markalama | [x] | [`docs/branding.md`](branding.md) ↔ `src/styles/app.css` (`:root`, `[data-tema="gece"]`); `src-tauri/icons/` |
| 7 | Bilgi Sayfaları | [x] | `src/pages/hakkinda.mdx`, `iletisim.astro`, `kosullar.mdx`, `gizlilik.mdx` (+ `en/`, `ar/`, `fa/`) |
| 8 | Mimari Ağaç | [x] | [`docs/mimari-agac.md`](mimari-agac.md) — sayfa ağacı (21 rota), 5 platform matrisi, breakpoint'ler |
| 9 | Derleme Doğrulaması | [x] | `bun run build` → 21 sayfa, `Complete!`, 0 hata (ekran görüntüsü öğrenci teslimine eklenir) |
