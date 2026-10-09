# Görev 12 — Kart Bileşeni

Listelerde tekrar eden görsel parça karttır. Kartı bir kez, hangi veriyi göstereceğini bilmeden çalışacak biçimde kurarsanız aynı kartı uygulamanın her listesinde kullanırsınız ve görünüm her yerde tutarlı kalır.

> **Bu görevde kod yazmıyorsunuz.** İşi yapay zeka aracınız yapar; siz ne istediğinizi tarif eder, çıkan değişikliği okur ve sonucu denersiniz. Çalışma yöntemi: [Görev 10](10-calisma-yontemi.task.md).

---

## 1. Görev bittiğinde repoda ne olacak

- `src/lib/components/ui/Kart.svelte`: girdileri başlık, alt metin, görsel (isteğe bağlı), etiket (isteğe bağlı), etiket türü (bilgi / başarı / uyarı / hata) ve tıklama davranışı.
- Kart, uygulamanın veri tiplerini tanımaz; ürün ya da usta nesnesi değil, yalnız yukarıdaki genel girdileri alır.
- Renk, boşluk ve köşe değerlerinin hepsi `src/styles/app.css` değişkenlerinden gelir; bileşende sabit renk kodu yok.
- Görsel yokken, başlık çok uzunken ve AR / FA düzeninde bozulmaz.
- Klavyeyle odaklanır, Enter ile açılır; görselin alternatif metni vardır.
- Ana ekranınızda bu kartla en az 6 öğe görünür; eski, ekrana özel kart kodu kaldırılmıştır.

## 2. Yapay zekaya verilecek istem

Köşeli parantezli yerleri kendi uygulamanıza göre doldurun. Araç önce plan sunmalı; planı okuyup onaylamadan değişiklik yaptırmayın.

```text
Uygulamamda listelerde kullanacağım tek bir kart bileşeni istiyorum.
1. `src/lib/components/ui/Kart.svelte` oluştur. Girdiler: baslik, altMetin?, gorsel?, etiket?, etiketTuru? ('bilgi' | 'basari' | 'uyari' | 'hata'), href? ya da tıklama olayı. Girdi tipini `src/lib/types/ui.ts` içinde tanımla.
2. Bileşen benim veri tiplerimi içe aktarmasın; dönüşümü kartı kullanan ekran yapsın.
3. Bütün renk, boşluk ve köşe değerleri `src/styles/app.css` değişkenlerinden gelsin. Eksik değişken varsa önce oraya ekle.
4. Görselsiz, çok uzun başlıklı ve sağdan sola düzende düzgün görünsün. Klavyeyle odaklanıp Enter ile açılabilsin.
5. [ANA EKRANINIZIN ADI] ekranındaki mevcut listeyi bu kartla yeniden kur; ekrana özel eski kart kodunu sil.

Son olarak: `bun run build` 0 hata vermeli. Bitince hangi dosyaları neden değiştirdiğini madde madde özetle ve benim elle denemem gereken adımları yaz.
```

**Bu işin bir kısmı sizde zaten varsa** önce şunu sorun:

```text
`docs/tasks/week-4/12-kart-bileseni.task.md` dosyasındaki "Görev bittiğinde repoda ne olacak" maddelerini repodaki mevcut durumla tek tek karşılaştır.
Her madde için: karşılanıyor / kısmen / eksik ve kanıt olarak dosya yolu. Henüz hiçbir şeyi değiştirme.
```

Sonra yalnız "kısmen" ve "eksik" çıkan maddeleri yaptırın.

## 3. Kendiniz doğrulayın

1. Ana ekranı açın: en az 6 kart görünüyor mu?
2. Tab tuşuyla kartlar arasında gezin; odak çerçevesi görünüyor ve Enter kartı açıyor mu?
3. Dili Arapça ya da Farsça yapın: görsel ve metin yer değiştirdi mi, taşma var mı?
4. Araca sorun: "`Kart.svelte` içinde sabit renk kodu ya da benim veri tiplerime bağımlılık var mı?" İkisi de olmamalı.

## 4. Projenize göre

Ağ tanılama: servis kartı (ad, gecikme, durum etiketi) · Usta çağırma: usta kartı (uzmanlık, puan, müsaitlik) · Kahve: ürün kartı (boyut, fiyat) · Oyun: seviye ya da sipariş kartı · Sinema: film kartı (afiş, tür, puan) · İlan: ilan kartı (görsel, fiyat, konum).

## ✅ Kontrol listesi

- [ ] Dal: `feature/12-kart-bileseni`; en az bir PR; `master`'a doğrudan commit yok.
- [ ] İstem günlüğü: `docs/istemler/12-kart-bileseni.md` (istem, plan, düzeltmeler, doğrulama sonucu).
- [ ] Bölüm 1'deki her madde karşılandı.
- [ ] Bölüm 3'teki adımları kendim yaptım; ekran görüntüleri günlükte.
- [ ] `bun run build` 0 hata.

## 🎯 Puan rubriği (toplam 15 puan)

| Kriter | Puan | Tam puan koşulu |
|---|---|---|
| Genel girdiler | 4 | Kart veri tiplerini tanımıyor; girdi tipi `types/ui.ts` içinde |
| Tasarım değişkenleri | 3 | Bileşende sabit renk kodu yok |
| Dayanıklılık | 3 | Görselsiz, uzun başlık ve RTL düzgün |
| Klavye ve alternatif metin | 2 | Odaklanır, Enter ile açılır |
| Kullanım | 3 | Ana ekranda en az 6 kart; eski kart kodu silinmiş |

