# Otomatik yayın (Release) ve Telegram bildirimi

Bu repoda `.github/workflows/release.yml` var. Bir sürüm etiketi (`v*`) gönderince GitHub Actions uygulamanı kendisi derler ve **Releases** sayfasına koyar:

| Platform | Dosya |
|---|---|
| Windows | `.msi` ve `.exe` |
| macOS | `.dmg` (Intel + Apple Silicon) |
| Linux | `.deb`, `.rpm`, `.AppImage` |
| Android | `<repo>_<etiket>_android.apk` |
| iPhone + iPad | `<repo>_<etiket>_ios_unsigned.ipa` (imzasız) |

İmzalama yoktur, Apple Developer hesabı gerekmez:

- **macOS:** ilk açılışta uygulamaya sağ tık → Aç.
- **Windows:** SmartScreen uyarısında "Ek bilgi" → "Yine de çalıştır".
- **Android:** `.apk` dosyasını telefona indirip aç (bilinmeyen kaynaklara izin ver).
- **iPhone / iPad:** `.ipa` imzasızdır; [Sideloadly](https://sideloadly.io) veya [AltStore](https://altstore.io) ile kendi Apple ID'nle imzalayıp kurarsın.

## Görevin (sırayla)

1. **PR'ı aç ve Actions'a bak.** Pull request sayfasında *Checks* altındaki **Release** çalışması bitince 5 işin hepsi (Windows, macOS, Linux, Android, iOS) yeşil olmalı. Kırmızı olan iş varsa tıkla, hata satırını oku, düzelt ve aynı dala yeni commit at (çalışma kendiliğinden yeniden başlar). Çözemezsen hata satırını ve işin linkini Telegram'daki **Soru & Cevap**'a yaz.
2. **Telegram botunu kur** (aşağıda). Bu adım isteğe bağlıdır ama görevin parçasıdır.
3. **PR'ı merge et.** Yeşil olduktan sonra *Merge pull request*.
4. **Sürümü dene.** `master` dalında şunu çalıştır:

   ```bash
   git pull
   git tag v0.0.1-deneme
   git push origin v0.0.1-deneme
   ```

   Birkaç dakika sonra **Releases** sayfasında dosyalar belirir. (Tire içeren etiketler "pre-release" olur; deneme için uygundur.)
5. **Dosyaları indirip dene:** en az bilgisayarındaki sürümü ve Android APK'yi aç.
6. **Telegram bota bak:** başlangıç mesajı, sonuç mesajı (✅/❌) ve dosyalar gelmiş olmalı.
7. **Teslim:** Telegram'da **Proje Teslimleri** konusuna Release sayfanın linkini ve bot mesajının ekran görüntüsünü gönder.

Gerçek sürüm için `package.json` ve `src-tauri/tauri.conf.json` içindeki `version` değerini artırıp yeni etiket at (`v0.1.0` gibi).

## Telegram bildirimi nasıl kurulur

Secret yoksa workflow yine çalışır, sadece Telegram'a mesaj atmaz. Kurunca bot şunları gönderir: derleme başladı, sonuç (başarılı/hatalı, iş iş) ve etiketli sürümde Release dosyaları (50 MB'a kadar; büyükler için link).

### 1. Bot oluştur

1. Telegram'da **@BotFather**'ı aç → `/newbot`.
2. Bota bir ad ve `...bot` ile biten bir kullanıcı adı ver.
3. BotFather'ın verdiği **token'ı** kopyala (`123456:ABC...` biçiminde).

> ⚠️ **Token bir paroladır.** Koda, README'ye, commit'e, ekran görüntüsüne, gruba yazma. Sızdırırsan BotFather'da `/revoke` ile yenile.

### 2. Chat ID'yi bul

- **Kendi hesabına gönderilsin istiyorsan:** oluşturduğun bota Telegram'da `/start` yaz. Sonra tarayıcıda şu adresi aç (`<TOKEN>` yerine kendi token'ın):
  `https://api.telegram.org/bot<TOKEN>/getUpdates`
  Çıkan yanıtta `"chat":{"id": 123456789` değerini al. Bu sayı chat ID'dir.
- **Bir gruba gönderilsin istiyorsan:** botu gruba ekle, gruba bir mesaj yaz, aynı adresi aç. Grup ID'si `-100` ile başlar (ör. `-1001234567890`); eksi işaretiyle birlikte al.
- Sayfa boş (`"result":[]`) çıkarsa bota/gruba yeniden mesaj yazıp sayfayı yenile.

### 3. GitHub'a secret olarak ekle

Repo sayfanda: **Settings → Secrets and variables → Actions → New repository secret**

| Name | Secret |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather'dan aldığın token |
| `TELEGRAM_CHAT_ID` | Bulduğun chat ID |

Adları tam olarak böyle yaz (büyük harf, alt çizgi). Secret'ları **Variables** sekmesine değil **Secrets** sekmesine ekle.

### 4. Dene

**Actions → Release → Run workflow** ile ya da yukarıdaki gibi bir etiket göndererek. Pull request çalışmaları Telegram'a mesaj atmaz; mesajlar etiket gönderince ve elle çalıştırınca gelir.

## Sık sorunlar

| Belirti | Çözüm |
|---|---|
| Telegram'dan hiç mesaj gelmiyor | Secret adlarını kontrol et; bota önce `/start` yazmış ol; chat ID'nin eksi işaretini unutma |
| `401 Unauthorized` | Token yanlış kopyalanmış; başında/sonunda boşluk olmasın |
| Grupta bot yazamıyor | Botu gruba ekle; konulu (forum) grupta botun yetkisini kontrol et |
| `version mismatched Tauri packages` | `bun update @tauri-apps/api @tauri-apps/cli` ve `cargo update` (workflow bunu kendisi de dener) |
| Android'de `429` / indirme hatası | Geçici; Actions'ta işi **Re-run** et |
| iPhone'da kurulmuyor | `.ipa` imzasızdır; Sideloadly/AltStore gerekir |
