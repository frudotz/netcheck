# Görev 09.1 — Master Dalını Koruma ve PR Güvenliği

Reponuz herkese açık. Bu, dünyadaki herkesin reponuzu fork'layıp size PR açabileceği anlamına gelir. PR açmak zararsızdır; tehlike, okunmadan merge edilen bir PR'ın ya da yanlışlıkla `master`'a atılan bir commit'in çalışan uygulamanızı bozmasıdır. Bu görevde `master` dalını korumaya alırsınız: her değişiklik PR'dan geçer, geçmiş silinemez, PR'ı yalnız yetkili kişiler merge eder.

> Bu görev kod gerektirmez; ayarlar GitHub'ın web arayüzünden yapılır. Hafta 04 görevlerine başlamadan önce tamamlayın.

---

## 1. Görev bittiğinde repoda ne olacak

- `master` dalı için etkin bir kural seti (ruleset): PR zorunlu, zorla gönderme (force push) kapalı, dal silme kapalı.
- `master`'a doğrudan `git push` reddediliyor; değişiklik yalnız PR ile giriyor.
- Eğitmen (`keyvanarasteh`) collaborator ve PR'ları merge edebiliyor.
- Dışarıdan (fork'tan) gelen PR'larda otomatik iş akışları onaysız çalışmıyor.
- `docs/kurallar.md` içinde "PR güvenliği" bölümü: kim merge edebilir, dışarıdan gelen PR nasıl incelenir.
- `docs/kanit/master-korumasi.png`: kural setinin ekran görüntüsü.

## 2. Adımlar

### A. Kural setini oluşturun

1. Reponuzda **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.
2. **Ruleset Name:** `master koruması` · **Enforcement status:** `Active`.
3. **Bypass list:** boş bırakın (kendinizi de eklemeyin).
4. **Target branches → Add target → Include default branch.**
5. **Rules** bölümünde şunları işaretleyin:
   - **Restrict deletions**
   - **Block force pushes**
   - **Require a pull request before merging** → *Required approvals:* `0` (tek kişi çalışıyorsanız kendi PR'ınızı merge edebilmeniz için; takımsanız `1` yapın ve PR'ı başka bir üye onaylasın)
6. **Create** ile kaydedin.

### B. Merge ayarlarını açın

**Settings → General → Pull Requests:**

- **Allow merge commits:** açık (eğitmenin ve sizin PR'larınız bununla merge edilir).
- **Automatically delete head branches:** açık (merge edilen dallar kendiliğinden silinir).

### C. Kimin merge edebildiğini kontrol edin

**Settings → Collaborators:** listede yalnız siz, takım arkadaşlarınız ve `keyvanarasteh` olmalı. PR'ı yalnız bu listedekiler merge edebilir; dışarıdan PR açan biri kendi PR'ını merge edemez.

### D. Dışarıdan gelen PR'lar için iş akışı onayı

**Settings → Actions → General:**

- **Fork pull request workflows from outside collaborators:** `Require approval for all external contributors`.
- **Workflow permissions:** `Read repository contents and packages permissions`.

### E. Kuralı belgeye yazın

Yapay zeka aracınıza şu istemi verin:

```text
`docs/kurallar.md` dosyasına "PR güvenliği" bölümü ekle:
- master dalı korumalıdır; her değişiklik PR ile girer, force push ve dal silme kapalıdır.
- PR'ı yalnız collaborator'lar merge eder.
- Tanımadığımız birinden gelen PR merge edilmeden önce: Files changed sekmesinde her dosya okunur; `.github/workflows/`, `package.json` betikleri, `src-tauri/` ve bağımlılık dosyalarındaki değişikliklere özellikle bakılır; PR yerelde derlenip denenir.
- Okunmayan PR merge edilmez.
`AGENTS.md` içindeki git kurallarından bu bölüme link ver.
```

## 3. Kendiniz doğrulayın

1. Bilgisayarınızda `master` dalında küçük bir değişiklik yapıp `git push origin master` deneyin: GitHub reddetmeli (`push declined due to repository rule violations`). Değişikliği geri alın.
2. Aynı değişikliği bir dalda yapıp PR açın ve merge edin: çalışmalı.
3. **Settings → Rules → Rulesets** sayfasının ekran görüntüsünü `docs/kanit/master-korumasi.png` olarak ekleyin.
4. Eğitmenin açtığı bekleyen bir PR varsa **Files changed** sekmesinden okuyun ve merge edin.

## ✅ Kontrol listesi

- [ ] Kural seti `Active`; hedef: varsayılan dal.
- [ ] Restrict deletions, Block force pushes ve Require a pull request işaretli.
- [ ] `master`'a doğrudan push reddedildi (denedim).
- [ ] Merge commit açık; merge edilen dallar otomatik siliniyor.
- [ ] Dış katkıcılar için iş akışı onayı açık.
- [ ] `docs/kurallar.md` içinde "PR güvenliği" bölümü; ekran görüntüsü `docs/kanit/` altında.

## 🎯 Değerlendirme

Bu görev Batch 02'nin ön koşuludur ve Görev 16 denetiminde kontrol edilir: kural seti etkin değilse Görev 16'nın yapılandırma ölçütü puan almaz.
