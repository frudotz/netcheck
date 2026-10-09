# Görev 13 — Liste Ekranı ve Üç Durum

Gerçek bir uygulamada veri her zaman hazır değildir: yükleniyor olabilir, hiç kayıt olmayabilir, bir şey ters gitmiş olabilir. Kullanıcı bu üç durumda da boş bir ekranla değil, ne olduğunu söyleyen bir ekranla karşılaşmalıdır.

> **Bu görevde kod yazmıyorsunuz.** İşi yapay zeka aracınız yapar; siz ne istediğinizi tarif eder, çıkan değişikliği okur ve sonucu denersiniz. Çalışma yöntemi: [Görev 10](10-calisma-yontemi.task.md).

---

## 1. Görev bittiğinde repoda ne olacak

- `src/lib/components/ui/` altında üç bileşen: `Yukleniyor` (iskelet görünüm), `BosDurum` (başlık, açıklama, isteğe bağlı düğme), `HataDurumu` (mesaj ve "Tekrar dene").
- Ana liste ekranı veriyi tek bir yükleme işlevinden alır; ekran dört halden birini gösterir: yükleniyor, hata, boş, dolu.
- Arama ya da süzgeç sonucu boşsa `BosDurum` görünür ve süzgeci temizleme düğmesi sunar.
- Üç durumun metinleri dört dilde (TR, EN, AR, FA).
- `docs/istemler/13-*.md` içinde dört halin ekran görüntüsü.
- Aynı üç bileşen uygulamadaki ikinci bir listede de kullanılır (geçmiş, siparişler, favoriler vb.).

## 2. Yapay zekaya verilecek istem

Köşeli parantezli yerleri kendi uygulamanıza göre doldurun. Araç önce plan sunmalı; planı okuyup onaylamadan değişiklik yaptırmayın.

```text
Ana liste ekranımda [EKRAN ADI] veri hazır değilken de düzgün bir şey göstermek istiyorum.
1. `src/lib/components/ui/` altında üç genel bileşen oluştur: Yukleniyor (iskelet), BosDurum (baslik, aciklama, dugmeMetni?, tıklama olayı), HataDurumu (mesaj, tekrar dene olayı). Renkler `app.css` değişkenlerinden.
2. Liste verisini tek bir yükleme işlevinden al. Ekran dört halden yalnız birini göstersin: yükleniyor, hata, boş, dolu.
3. Arama ya da süzgeç sonucu boşsa BosDurum göster ve süzgeci temizleme düğmesi ekle.
4. Metinleri dört dile ekle (TR, EN, AR, FA).
5. Aynı bileşenleri [İKİNCİ LİSTE EKRANI] ekranına da bağla.
6. Dört hali elle deneyebilmem için geliştirme sırasında kullanacağım basit bir yol öner (örn. adres çubuğuna `?durum=hata` yazmak) ve bunu `docs/gelistirme-notlari.md` içine yaz.

Son olarak: `bun run build` 0 hata vermeli. Bitince hangi dosyaları neden değiştirdiğini madde madde özetle ve benim elle denemem gereken adımları yaz.
```

**Bu işin bir kısmı sizde zaten varsa** önce şunu sorun:

```text
`docs/tasks/week-4/13-liste-ve-uc-durum.task.md` dosyasındaki "Görev bittiğinde repoda ne olacak" maddelerini repodaki mevcut durumla tek tek karşılaştır.
Her madde için: karşılanıyor / kısmen / eksik ve kanıt olarak dosya yolu. Henüz hiçbir şeyi değiştirme.
```

Sonra yalnız "kısmen" ve "eksik" çıkan maddeleri yaptırın.

## 3. Kendiniz doğrulayın

1. Aracın önerdiği yolla dört hali sırayla açın ve her birinin ekran görüntüsünü alın.
2. Hata halinde "Tekrar dene" düğmesine basın: liste geliyor mu?
3. Aramaya saçma bir kelime yazın: boş durum ve temizleme düğmesi çıkıyor mu?
4. Dili değiştirin: üç durumun metinleri de çevriliyor mu?

## 4. Projenize göre

Ağ tanılama: test geçmişi boşken "Henüz test yapılmadı" · Usta çağırma: süzgece uyan usta yok · Kahve: sepet ve sipariş geçmişi boş · Oyun: henüz fiş yok · Sinema: seçilen gün için seans yok · İlan: aramaya uyan ilan yok.

## ✅ Kontrol listesi

- [ ] Dal: `feature/13-liste-ve-uc-durum`; en az bir PR; `master`'a doğrudan commit yok.
- [ ] İstem günlüğü: `docs/istemler/13-liste-ve-uc-durum.md` (istem, plan, düzeltmeler, doğrulama sonucu).
- [ ] Bölüm 1'deki her madde karşılandı.
- [ ] Bölüm 3'teki adımları kendim yaptım; ekran görüntüleri günlükte.
- [ ] `bun run build` 0 hata.

## 🎯 Puan rubriği (toplam 20 puan)

| Kriter | Puan | Tam puan koşulu |
|---|---|---|
| Üç bileşen | 6 | Genel girdilerle, `ui/` altında, sabit renk yok |
| Dört hal | 5 | Ana liste yükleniyor, hata, boş ve dolu hallerini ayrı gösterir |
| Arama / süzgeç boş hali | 3 | Boş durum ve temizleme düğmesi |
| Çok dil | 3 | Metinler dört dilde |
| İkinci liste ve kanıt | 3 | İkinci ekranda kullanım; dört ekran görüntüsü günlükte |

