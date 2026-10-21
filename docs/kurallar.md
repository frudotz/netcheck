# Kurallar

Bu depodaki tüm geliştirme kuralları **tek kaynakta** tutulur: [`AGENTS.md`](../AGENTS.md). Kurallar burada tekrar yazılmaz; değişiklik yalnızca `AGENTS.md` üzerinde yapılır. Tek istisna aşağıdaki [PR güvenliği](#pr-güvenliği) bölümüdür (Görev 09.1): yalnız burada tanımlanır, `AGENTS.md` § 3 buraya link verir.

| Konu | Bölüm |
|---|---|
| Git akışı (feature/fix/docs dalı → PR → merge), commit mesajları, derleme kanıtı | [`AGENTS.md` § 3](../AGENTS.md#3-geliştirme-ve-git-kuralları) |
| Görev çalışma döngüsü (şartname, plan, onay, doğrulama, PR) | [`AGENTS.md` § Çalışma döngüsü](../AGENTS.md#çalışma-döngüsü) |
| `master` koruması, merge yetkisi ve dışarıdan gelen PR'ların incelenmesi | [PR güvenliği](#pr-güvenliği) (bu dosya) |
| Kod yazım kuralları (Svelte 5 Runes, SSR güvenliği, Rust ↔ TS, sahte veri yasağı) | [`AGENTS.md` § 4](../AGENTS.md#4-kod-yazım-kuralları) |
| Arayüz doğrulama ve tarayıcı otomasyonu | [`AGENTS.md` § 5](../AGENTS.md#5-arayüz-doğrulama-tarayıcı-otomasyonu) |
| Güvenlik ve kapsam sınırları | [`AGENTS.md` § 6](../AGENTS.md#6-güvenlik-ve-kapsam-sınırları) |
| Dokümantasyon tek kaynak (DRY) kuralı | [`AGENTS.md` § 1](../AGENTS.md#1-temel-proje-haritası-ve-tek-kaynak-kuralı-dry-docs) |

## PR güvenliği

Depo herkese açıktır; herkes fork'layıp PR açabilir. PR açmak zararsızdır; tehlike, okunmadan merge edilen bir PR'dır.

### Kurallar

- `master` dalı korumalıdır: her değişiklik PR ile girer; force push ve dal silme kapalıdır. PR, beş CI kontrolü geçmeden ve dal `master` ile güncel olmadan merge edilemez.
- PR'ı yalnız collaborator'lar merge eder. Dışarıdan PR açan biri kendi PR'ını merge edemez.
- Tanımadığımız birinden gelen PR merge edilmeden önce:
  1. **Files changed** sekmesinde her dosya okunur.
  2. Şu değişikliklere özellikle bakılır: `.github/workflows/`, `package.json` betikleri, `src-tauri/` (özellikle `tauri.conf.json`, `capabilities/`, `build.rs`) ve bağımlılık dosyaları (`package.json`, `bun.lock`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`).
  3. Fork'tan gelen PR'ın iş akışları onaysız çalışmaz; onay vermeden önce iş akışı değişiklikleri okunur.
  4. PR yerelde derlenip denenir ([`docs/kurulum.md`](kurulum.md) komutlarıyla). `package.json` betikleri okunmadan bağımlılık kurulmaz.
- Okunmayan PR merge edilmez.

### Yapılandırma

Aşağıdaki değerler 2026-10-21'de GitHub API'den okundu (kural seti son kaydı: 2026-10-21 20:16). Ayarları yalnız depo sahibi GitHub arayüzünden değiştirir; değişirse bu tablo güncellenir.

| Ayar | Değer | Yer |
|---|---|---|
| Kural seti | `Protectmaster`, **Active**, bypass listesi boş | Settings → Rules → Rulesets |
| Hedef | Varsayılan dal (`master`); diğer dallara kural uygulanmaz | Aynı sayfa |
| Restrict deletions | Açık | Aynı sayfa |
| Block force pushes | Açık | Aynı sayfa |
| Require a pull request before merging | Açık; gereken onay `0` (tek geliştirici); çözülmemiş inceleme konuşması merge'i engeller | Aynı sayfa |
| Require status checks to pass | Açık; dal güncel olmalı (strict). Kontroller: `Desktop (windows-latest)`, `Desktop (ubuntu-latest)`, `Desktop (macos-latest)`, `Mobile Rust (aarch64-linux-android)`, `Mobile Rust (aarch64-apple-ios)` | Aynı sayfa |
| Allow merge commits | Açık (squash ve rebase de açık) | Settings → General → Pull Requests |
| Automatically delete head branches | Açık | Aynı sayfa |
| Fork pull request workflows from outside collaborators | Require approval for all external contributors | Settings → Actions → General |
| Workflow permissions | Read repository contents and packages permissions | Aynı sayfa |
| Collaborators | `frudotz` (admin), `keyvanarasteh` (eğitmen, write) | Settings → Collaborators |

Kanıt: [`docs/kanit/master-korumasi.png`](kanit/master-korumasi.png), kural setinin kayıtlı hali. Durum kontrolleri listesi ve strict ayarı ekranda kapalı panelde kaldığı için bu iki değer API'den alındı.

### Doğrulama listesi

Bu adımlar ayarları değiştirmez. Sonuçlar 2026-10-21 tarihlidir.

- [x] Kural seti `Active`, hedef varsayılan dal, bypass listesi boş (ekran görüntüsü ve API).
- [x] Restrict deletions, Block force pushes, Require a pull request ve Require status checks işaretli (ekran görüntüsü ve API).
- [x] Beş durum kontrolü ve strict ayarı tanımlı: `gh api repos/frudotz/netcheck/rulesets/25080546`.
- [x] Kurallar yalnız `master`'a uygulanıyor: `gh api repos/frudotz/netcheck/rules/branches/master` dört kural döndürüyor, bir özellik dalı adı için boş dönüyor.
- [x] Merge commit açık, merge edilen dallar otomatik siliniyor, dış katkıcıların iş akışları onay bekliyor, iş akışı izni yalnız okuma.
- [x] Collaborator listesinde yalnız `frudotz` ve `keyvanarasteh` var.
- [ ] **`master`'a doğrudan push reddi (Görev 09.1 § 3.1): denenmedi.** Yasak bir push bilerek yapılmadı; koruma yukarıdaki yapılandırmayla doğrulandı. Test yapılırsa GitHub'ın ret mesajı (`push declined due to repository rule violations`) buraya eklenir.
