# Görev 10 — Çalışma Yöntemi: Şartname, İstem Günlüğü, Doğrulama

Bu dönem uygulamanızı yapay zeka aracıyla geliştireceksiniz. Aracın iyi iş çıkarması, ona ne istediğinizi ne kadar açık tarif ettiğinize ve çıkan işi nasıl denetlediğinize bağlıdır. Bu görevde o düzeni bir kez kurarsınız; sonraki bütün görevler bu düzenle yapılır.

> **Bu dönem kod yazmıyorsunuz.** İşi yapay zeka aracınız yapar; siz ne istediğinizi tarif eder, çıkan değişikliği okur ve sonucu denersiniz.

---

## 1. Görev bittiğinde repoda ne olacak

- `docs/gorev-sartnamesi.md`: her görevde dolduracağınız şablon. Başlıkları: Amaç, Kapsam dışı, Kabul ölçütleri, Dokunulacak dosyalar, Doğrulama adımları.
- `docs/istemler/` klasörü ve içinde `README.md`: her görev için bir dosya açılacağını, dosya adının `NN-kisa-ad.md` olacağını açıklar.
- İlk kayıt `docs/istemler/10-calisma-yontemi.md`: kullandığınız araç ve model, verdiğiniz istem, aracın önerdiği plan, sizin düzelttiğiniz yerler, doğrulama sonucu.
- `AGENTS.md` içine "Çalışma döngüsü" bölümü: önce plan, onaydan sonra değişiklik, her görev ayrı dalda, `bun run build` temiz olmadan iş bitmiş sayılmaz.
- `AGENTS.md` doküman indeksine iki yeni belge eklenir.

## 2. Yapay zekaya verilecek istem

Köşeli parantezli yerleri kendi uygulamanıza göre doldurun. Araç önce plan sunmalı; planı okuyup onaylamadan değişiklik yaptırmayın.

```text
Bu repoda bundan sonra her görevi şu döngüyle yapacağız: şartname, plan, değişiklik, doğrulama.
1. `docs/gorev-sartnamesi.md` adında, benim her görevde dolduracağım kısa bir şablon oluştur. Başlıklar: Amaç, Kapsam dışı, Kabul ölçütleri, Dokunulacak dosyalar, Doğrulama adımları.
2. `docs/istemler/README.md` oluştur: her görev için `NN-kisa-ad.md` dosyası açılır; içinde araç ve model, istem, plan, düzeltmeler ve doğrulama sonucu yazar.
3. `AGENTS.md` dosyasına "Çalışma döngüsü" bölümü ekle: önce plan sun ve onayımı bekle; onaydan sonra değiştir; her görev ayrı dalda ve PR ile; `bun run build` 0 hata vermeden bitti deme.
4. Yeni belgeleri `AGENTS.md` doküman indeksine ekle.
Önce planını göster, ben onaylayınca uygula.

Son olarak: `bun run build` 0 hata vermeli. Bitince hangi dosyaları neden değiştirdiğini madde madde özetle ve benim elle denemem gereken adımları yaz.
```

## 3. Kendiniz doğrulayın

1. Araç değişiklik yapmadan önce plan sundu mu? Sunmadıysa istemi tekrar edin; planı günlüğe yapıştırın.
2. `docs/gorev-sartnamesi.md` dosyasını açın: beş başlık da var mı, sizin anlayacağınız dilde mi?
3. Yeni bir sohbet açıp araca "bu repoda bir görevi hangi sırayla yaparsın?" diye sorun. Yanıt `AGENTS.md`'deki döngüyü anlatıyorsa kural çalışıyor; yanıtı günlüğe ekleyin.

## 4. Projenize göre

Her proje türünde aynıdır; yalnız şartnamedeki örnek satırlar sizin uygulamanıza göre yazılır.

## ✅ Kontrol listesi

- [ ] Dal: `feature/10-calisma-yontemi`; en az bir PR; `master`'a doğrudan commit yok.
- [ ] İstem günlüğü: `docs/istemler/10-calisma-yontemi.md` (istem, plan, düzeltmeler, doğrulama sonucu).
- [ ] Bölüm 1'deki her madde karşılandı.
- [ ] Bölüm 3'teki adımları kendim yaptım; ekran görüntüleri günlükte.
- [ ] `bun run build` 0 hata.

## 🎯 Puan rubriği (toplam 10 puan)

| Kriter | Puan | Tam puan koşulu |
|---|---|---|
| Şartname şablonu | 3 | Beş başlık var; örnek satırlar projeye özgü |
| İstem günlüğü | 3 | `docs/istemler/` ve ilk kayıt; istem, plan, düzeltme, doğrulama yazılı |
| AGENTS.md çalışma döngüsü | 2 | Plan-önce kuralı ve derleme şartı yazılı; indeks güncel |
| Kural testi | 2 | Yeni sohbette aracın döngüyü anlattığı yanıt günlükte |

