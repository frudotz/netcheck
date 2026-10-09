# Görev 14 — Detay Ekranı ve Gezinme

Karta dokunan kullanıcı o öğenin ayrıntısını görmek ister. Detay ekranının kendi adresi olmalıdır; böylece geri tuşu doğru çalışır ve ekran doğrudan açılabilir.

> **Bu görevde kod yazmıyorsunuz.** İşi yapay zeka aracınız yapar; siz ne istediğinizi tarif eder, çıkan değişikliği okur ve sonucu denersiniz. Çalışma yöntemi: [Görev 10](10-calisma-yontemi.task.md).

---

## 1. Görev bittiğinde repoda ne olacak

- Karta tıklayınca öğenin detay ekranı açılır; adres öğenin kimliğini içerir (örn. `/usta/3`).
- Geri dönüş çalışır; listeye dönünce arama ve süzgeç seçimi korunur.
- Olmayan bir kimlikle açılırsa `HataDurumu` ya da "bulunamadı" ekranı görünür, boş sayfa değil.
- Detay ekranı dört dilde derlenir; AR ve FA'da sağdan sola düzen.
- `docs/mimari-agac.md` sayfa ağacı güncellenir.

## 2. Yapay zekaya verilecek istem

Köşeli parantezli yerleri kendi uygulamanıza göre doldurun. Araç önce plan sunmalı; planı okuyup onaylamadan değişiklik yaptırmayın.

```text
[ÖĞE TÜRÜ, ÖRN. usta] için detay ekranı istiyorum.
1. Karta tıklayınca `/[rota]/[id]` adresinde detay ekranı açılsın. Mevcut dil rotası düzenine uy.
2. Detayda şunlar görünsün: [GÖRMEK İSTEDİĞİNİZ ALANLARI YAZIN].
3. Geri düğmesi listeye dönsün; listedeki arama ve süzgeç seçimi kaybolmasın.
4. Olmayan bir kimlikle açılırsa Görev 13'teki HataDurumu bileşeniyle "bulunamadı" göster.
5. `docs/mimari-agac.md` içindeki sayfa ağacını güncelle.

Son olarak: `bun run build` 0 hata vermeli. Bitince hangi dosyaları neden değiştirdiğini madde madde özetle ve benim elle denemem gereken adımları yaz.
```

**Bu işin bir kısmı sizde zaten varsa** önce şunu sorun:

```text
`docs/tasks/week-4/14-detay-ekrani.task.md` dosyasındaki "Görev bittiğinde repoda ne olacak" maddelerini repodaki mevcut durumla tek tek karşılaştır.
Her madde için: karşılanıyor / kısmen / eksik ve kanıt olarak dosya yolu. Henüz hiçbir şeyi değiştirme.
```

Sonra yalnız "kısmen" ve "eksik" çıkan maddeleri yaptırın.

## 3. Kendiniz doğrulayın

1. Üç farklı karta tıklayın: her birinde doğru öğe açılıyor mu?
2. Adres çubuğundaki kimliği olmayan bir sayıyla değiştirin: "bulunamadı" ekranı çıkıyor mu?
3. Listede süzgeç seçip bir detaya girin ve geri dönün: süzgeç duruyor mu?
4. Detay adresini kopyalayıp yeni pencerede açın: aynı ekran geliyor mu?

## 4. Projenize göre

Ağ tanılama: tek bir test raporunun detayı · Usta çağırma: usta profili · Kahve: ürün detayı ve seçenekler · Oyun: seviye bilgisi ya da fiş detayı · Sinema: film ve seanslar · İlan: ilan detayı.

## ✅ Kontrol listesi

- [ ] Dal: `feature/14-detay-ekrani`; en az bir PR; `master`'a doğrudan commit yok.
- [ ] İstem günlüğü: `docs/istemler/14-detay-ekrani.md` (istem, plan, düzeltmeler, doğrulama sonucu).
- [ ] Bölüm 1'deki her madde karşılandı.
- [ ] Bölüm 3'teki adımları kendim yaptım; ekran görüntüleri günlükte.
- [ ] `bun run build` 0 hata.

## 🎯 Puan rubriği (toplam 10 puan)

| Kriter | Puan | Tam puan koşulu |
|---|---|---|
| Rota ve içerik | 4 | Kimlikli adres; doğru öğe açılıyor |
| Geri dönüş | 2 | Liste durumu korunuyor |
| Bulunamadı hali | 2 | Olmayan kimlikte anlamlı ekran |
| Çok dil ve ağaç | 2 | Dört dilde derleniyor; mimari ağaç güncel |

