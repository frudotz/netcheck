# Proje Beklemede — Devir Notu

> **Bu belge bir duraklatma anlık görüntüsüdür.** Bir sürüm, tamamlanma ya da onay beyanı değildir. **Batch 02 tamamlanmadı ve yayın için onaylanmadı;** `v0.2.0-batch-02` etiketi yoktur. Aşağıdaki SHA ve CI bilgileri 22.10.2026 tarihlidir; 27.10.2026'daki yerel denetimde yeniden okundu ve #43/#44 dışında değişmedi. Dönüşte önce [§ 8](#8-komutlar) komutlarıyla güncel durumu kontrol edin.

## 1. Tarih ve amaç

- **Duraklatma:** 22.10.2026, depo sahibinin isteğiyle, süresiz.
- **Amaç:** işi kaybetmeden durdurmak ve dönüşü kolaylaştırmak.
- **Duraklatmada yapılmayanlar:** PR birleştirme, etiket ya da sürüm, dağıtım, GitHub ayarı değişikliği, kaynak deponun arşivlenmesi.
- **Ayrıntı kaynakları:** Batch 02 ayrıntısı [`ilerleme-batch-02.md`](ilerleme-batch-02.md); gereksinim denetimi [`course-compliance.md`](course-compliance.md). Bu belge onları tekrarlamaz, yalnız duraklatma anındaki gerçek durumu ve dönüş sırasını verir.

## 2. Depo durumu

Kontrol: 22.10.2026, `git fetch origin --prune` sonrasında.

- **`master`:** `9970845` (PR #34). Yerel ve GitHub aynı. Batch 02 PR'larının hiçbiri birleşmedi.
- **Çalışma ağacı:** temiz. Stash yok, commit'lenmemiş ya da izlenmeyen dosya yok.
- **Yerel dallar:** biri dışında hepsi GitHub'dakiyle aynı. İstisna `feature/09-1-master-korumasi`:
  - Yalnız yerelde duruyor; GitHub dalı birleştirmede otomatik silindi.
  - Ucu `3c8a034`, PR #34'ün son commit'i. PR #34 squash ile `9970845` olarak birleşti.
  - Dokunduğu 7 dosya `master`'da birebir aynı, yani kayıp iş yok. Dal silinmedi.
- **Yalnız GitHub'da olan yedi dal:** altısı birleşmiş PR'lara ait (#26–#31). `feature/src-admin-prototype` açık PR #32'nin dalı. Hiçbirine dokunulmadı.

## 3. Değişmez etiket ve dal koruması

- **`v0.1.0-batch-01`:** etiket nesnesi `aebd3fe`, hedefi `b9fc299`. Yerelde ve GitHub'da aynı (`git ls-remote --tags origin`). Başka etiket ya da GitHub sürümü yok.
- **`Protectmaster` kural seti** (id 25080546), API'den okundu, değiştirilmedi:
  - `active`; yalnız varsayılan dal (`~DEFAULT_BRANCH`); atlama yetkisi yok.
  - Kurallar: silme ve force push yasak; PR zorunlu (0 onay, yorumlar çözülmeli).
  - Beş zorunlu kontrol, katı (strict): `Desktop (windows/ubuntu/macos-latest)`, `Mobile Rust (aarch64-linux-android / aarch64-apple-ios)`.
  - Son kayıt 21.10.2026 20:16 (+03). Klasik dal koruması yok (API 404).
- **Depo ayarları:** herkese açık; merge, squash ve rebase açık; birleşen dal otomatik siliniyor.

## 4. Açık PR'lar

Doğrulama düzeyleri:

- **Uygulandı:** kod dalda var.
- **CI:** beş zorunlu kontrol son commit'te geçti.
- **Araçla denendi:** yapay zeka aracı çalışan uygulamada ya da tarayıcıda denedi.
- **Bekliyor:** öğrenci kanıtı ya da eğitmen kararı gerekiyor.

| PR | İş | Dal (taban) | Son commit | CI | Durum |
|---|---|---|---|---|---|
| #35 | Görev 10 çalışma yöntemi | `feature/10-calisma-yontemi` (`master`) | `62a89c8` | 5/5 | Uygulandı (belge). Bekliyor: yeni sohbette kural testi (R10-d) |
| #36 | Görev 11 veri sözleşmesi | `feature/11-veri-sozlesmesi` (#35) | `12f50ce` | 5/5 | Araçla denendi (`check`, `build`). Bekliyor: C-1 eğitmen onayı |
| #37 | Uygulama dili | `feature/uygulama-dili` (#36) | `5ee481d` | 5/5 | Araçla denendi (Windows, TR/AR). Bekliyor: C-2 eğitmen onayı |
| #38 | Görev 12 kart | `feature/12-kart-bileseni` (#37) | `dfa6433` | 5/5 | Araçla denendi (320/420/1280 px, RTL) |
| #39 | Görev 13 üç durum | `feature/13-liste-ve-uc-durum` (#38) | `6259080` | 5/5 | Araçla denendi; dört ekran görüntüsünü araç aldı. Bekliyor: R13-e |
| #40 | Görev 14 detay | `feature/14-detay-ekrani` (#39) | `7573746` | 5/5 | Araçla denendi (tarayıcı ve Windows uygulaması) |
| #41 | Görev 15 Rust komutu | `feature/15-rust-komutu` (#40) | `392c5fd` | 5/5 | Araçla denendi (Windows IPC). macOS, Linux, iOS çalıştırılmadı (R15-h, ertelendi) |
| #42 | Yönetim paneli (yalnız arayüz) | `feature/admin-panel-tasima` (#41) | `a42ac5b` | 5/5 | Araçla denendi (Windows, üretim derlemesi). Veriyle çalışan kod yolları denenmedi |
| #43 | Görev 16 Batch 02 denetimi | `feature/16-batch-02-denetimi` (#42) | `1e4d7aa` (27.10, belge düzeltmesi; CI PR sayfasında) | 5/5 (`70bef01`) | Pencere sınırı Windows'ta doğrulandı. Rubrik bilinmiyor; etiket yok (R16-c FAIL) |
| #32 | Panel + SQLite (eğitmen) | `feature/src-admin-prototype` (`master`) | `c0c1a04` | 5/5, ama 14.10'daki eski tabanda | `master`'ın gerisinde, uygulamada hiç çalıştırılmadı. Birleştirilmemeli (§ 6) |

- #35–#43 GitHub'da `MERGEABLE` ve `CLEAN` görünüyor. Yorum ya da inceleme yok.
- **Birleştirme sırası:** #35 → #36 → … → #43, her biri "Create a merge commit" ile.
  - Her birleştirmeden sonra sıradaki dal `master` ile merge edilerek güncellenir (rebase yok) ve beş kontrol beklenir.
  - Squash kullanılmaz, zincirdeki dallar çakışır.
  - Komutlar: [`ilerleme-batch-02.md` § Birleştirme ve etiket](ilerleme-batch-02.md#birleştirme-ve-etiket).
- **Bu belgenin PR'ı (#44, taslak)** zincirin en sonundadır ve yalnız bir anlık görüntü taşır. Birleştirilmesi gerekmez.

**PR #32 ile #42'nin farkı:**

- **#32 (eğitmenin):** AI Studio panelinin kopyasını SQLite, giriş ve rol/izin katmanına bağlıyor. Kapsam ve güvenlik sorunları yüzünden birleştirilmemeli. Depo sahibi 21.10.2026'da (21:49 UTC) PR'a bunu yorum olarak yazdı.
- **#42:** aynı paneli yalnız arayüz olarak `admin/` altına taşıyor. Veri kaynağı, giriş ve IPC yok. Veri ekranları "bağlı değil" durumunu gösterir.
- Panelin veriye bağlanması ayrı bir iş (NC-11); C-3 kararını ve güvenlik düzeltmelerini bekliyor.

## 5. Bekleyen kararlar ve elle yapılacak kanıtlar

**Kararlar** (ayrıntı: [`course-compliance.md`](course-compliance.md), Conflicts):

- **C-1, C-2:** sahibin genel yetkisiyle geçici olarak karara bağlandı (örnek veri; uygulama dili). Eğitmen onayı bekliyor.
- **C-3:** giriş, veritabanı ve panel verisi kapsamda mı? PR #32'yi ve panelin veriye bağlanmasını (NC-11) engelliyor.
- **C-4:** Görev 03'ün README'ye yazdırdığı öğrenci numarası depoda duruyor; Hafta 05 durum raporu ise kişisel veriyi yasaklıyor. Numara geçmişte ve değişmez etikette de var.
- **Panel:** Hedefler ve İçerik düzenleyicileri kalacak mı? Panel uygulamadan açılacak ve mobil paketlerde bulunacak mı (RA-f)? Kaynak depo, #42 birleşip doğrulandıktan sonra arşivlenecek (RA-e).
- **Görev 16:** rubrik yayımlanmadı. Pencere değerleri (320 × 480) ve belge biçimi rubrikle karşılaştırılmadı.

**Öğrencinin kendisinin yapması gerekenler** (hiçbiri yapılmadı ya da kaydedilmedi):

- Görev 10–15'in her birindeki "§ 3 Kendiniz doğrulayın" adımları ve kontrol listesindeki "ekran görüntüleri günlükte" maddesi. Görüntüler ilgili dalın `docs/istemler/NN-*.md` günlüğüne eklenir; gerçek IP ve cihaz adı maskelenir.
- Görev 10: yeni bir sohbette kural testi (R10-d). Mevcut kayıt bir alt ajan denemesi ve bağlamı olan bir sohbet; ikisi de yeni sohbet sayılmaz.
- Görev 15 § 3.6: elinizdeki her cihazda uygulamayı açmak.
- İsteğe bağlı: `master`'a doğrudan push denemesi (R09.1-d).
- Eğitmenin raporundaki diğer istekler: yapay zekâ aracı hakkında Telegram'a geri bildirim, Batch 02 teslim biçimi (derste duyurulacak).

## 6. Riskler, ertelenen işler ve kapsam dışı

**Riskler:**

- Eğitmen raporundaki son tarih 27.10.2026 23:59; duraklatma bu tarihi geçebilir.
- Dokuz PR'lık zincir sırayla birleşir; her adımda CI yeniden çalışır (macOS işiyle 10–15 dakika). Squash ya da yanlış sıra çakışma çıkarır.
- **PR #32'deki çözülmemiş sorunlar:**
  - Ağ geçidi ve genel IP maskelenmiyor.
  - Kullanıcı güncelleme izniyle kişi kendini yönetici yapabiliyor.
  - Son yöneticinin kilitlenmesi mümkün.
  - Aynı e-postayla kullanıcı oluşturmak parolayı sessizce sıfırlıyor.
  - Rapor ve iletişim gönderimi oturumsuz ve sınırsız.
  - Genel oluşturma/güncelleme kural doğrulamasını atlıyor.
  - Oturumların süresi yok ve askıya alınan kullanıcının oturumu sürüyor.
  - Çok adımlı işlemlerde transaction yok.
  - Bu akışlar canlandırılmamalı; her düzeltmenin gerçek bir testi olmalı.
- **Belge ile depo arasındaki farklar:**
  - README ve dört Hakkında sayfası "macOS uygulama olarak çalıştırılmadı" diyor. PR #28 ise bir debug `.app` çalıştırmasını kaydetmiş (NC-10). `mimari-agac.md` da "doğrulanmadı" diyor.
  - Uyum matrisi, öğrenci § 3 kanıtını yalnız Görev 10 ve 13 için satır olarak tutuyor; Görev 11, 12, 14 ve 15 için de eksik.
  - [`ilerleme-batch-02.md`](ilerleme-batch-02.md) #43'ün CI sonucunu "PR sayfası" diye bırakıyor (şimdi 5/5) ve PR #32 yorumunu yapılacak iş olarak gösteriyor (yapıldı).
- `master`'daki belgeler eski. Batch 02 belgeleri yalnız açık PR dallarında.
- Commit'lerdeki e-posta adresi herkese açık; `noreply` adresine geçilmesi önerilir.

**Ertelenen işler:**

- macOS ve iOS doğrulaması (eğitmen yönlendirmesi), Linux'ta çalıştırma.
- Fiziksel iPhone (NC-05), Android imzası (NC-09), IPA (NC-12).
- Arka uç testleri (NC-13), sabit renk artıkları (NC-18).
- Görev listesi: [`lat.md/tasks.md`](../lat.md/tasks.md).

**Duraklatmada yapılmayacaklar:** PR birleştirme ya da kapatma, dal silme, etiket ya da sürüm oluşturma, dağıtım, kural seti veya depo ayarı değişikliği, gizli anahtar işlemi, AI Studio deposunu arşivleme, PR #32'deki giriş ve veritabanı kodunu genişletme.

## 7. Dönüş kontrol listesi

1. **Durumu doğrulayın:** § 8 komutlarıyla yerel değişiklik, `master` SHA'sı, etiket, açık PR'lar ve CI. Bu belgedekinden farklı olan her şeyi önce not edin.
2. **Yeni bilgiyi toplayın:** Görev 16 rubriği, son tarih değişikliği, C-1–C-4 ve panel kararları (Telegram, `docs/tasks/`, PR yorumları).
3. **Öğrenci kanıtlarını tamamlayın:** Görev 10–15'in § 3 adımları ve ekran görüntüleri, ilgili dalların günlüklerine.
4. **Belge farklarını düzeltin** (§ 6): ilgili dalda küçük commit'lerle.
5. **Birleştirin:** #35'ten #43'e sırayla. Ardından `master`'da yayın kapısını yeniden çalıştırın (`bun run build`, `bun run check`, `cargo test`, `lat check`). Etiketi ancak bütün ölçütler geçince ve onayınızla atın.
6. **Sonra:** #42 birleşip doğrulanınca AI Studio deposunu arşivleyin. C-3 kararından sonra NC-11 (panelin veriye bağlanması) ve güvenlik düzeltmeleri.

## 8. Komutlar

Durumu değiştirmeden kontrol (PowerShell, proje klasöründe):

```powershell
git status --short --branch          # yerel değişiklik var mı
git stash list
git fetch origin --prune             # yalnız indirir, dalları değiştirmez
git log --oneline -1 origin/master   # beklenen: 9970845 (değiştiyse not edin)
git ls-remote --tags origin          # v0.1.0-batch-01 -> aebd3fe / b9fc299
gh pr list --repo frudotz/netcheck --state open
gh pr checks 43 --repo frudotz/netcheck
gh pr view 35 --repo frudotz/netcheck --json mergeStateStatus,statusCheckRollup
gh api repos/frudotz/netcheck/rulesets/25080546 --jq "{enforcement, rules: [.rules[].type]}"
```

Değişiklik kaybetmeden işe dönme:

```powershell
git status --short                   # boş değilse önce commit'leyin; reset/clean kullanmayın
git switch feature/16-batch-02-denetimi
git pull --ff-only                   # yalnız ileri sarar; çakışma varsa durur
```

`master` ilerledikten sonra bir dalı güncelleme (rebase ve force push yok):

```powershell
git switch <dal>
git merge origin/master
git push
```

## 9. Bu duraklatma ne anlama gelmez

Batch 02 tamamlanmış, onaylanmış ya da yayınlanmış değildir. Bütün CI kontrollerinin geçmesi; eğitmen onayının, öğrenci kanıtlarının ve yayın ölçütlerinin yerine geçmez. Yayın kapısı BLOCKED durumdadır: PR'lar birleşmedi ve etiket onay bekliyor ([`ilerleme-batch-02.md` § Yayın kapısı](ilerleme-batch-02.md#yayın-kapısı)).
