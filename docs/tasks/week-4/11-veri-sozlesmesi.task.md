# Görev 11 — Veri Sözleşmesi: Tipler ve Örnek Veri

Uygulamanızdaki her ekran aynı birkaç şeyi gösterir: bir ürün, bir usta, bir test sonucu, bir sipariş. Bunların hangi alanlardan oluştuğu tek yerde yazılı olursa yapay zeka aracı her ekranda aynı adları kullanır ve hataları derleme sırasında yakalarsınız.

> **Bu görevde kod yazmıyorsunuz.** İşi yapay zeka aracınız yapar; siz ne istediğinizi tarif eder, çıkan değişikliği okur ve sonucu denersiniz. Çalışma yöntemi: [Görev 10](10-calisma-yontemi.task.md).

---

## 1. Görev bittiğinde repoda ne olacak

- `src/lib/types/` klasörü: uygulamanın en az 3 ana veri tipi, her biri ayrı dosyada; `index.ts` hepsini dışa aktarır.
- Her alanın yanında tek satır açıklama; zorunlu ve isteğe bağlı alanlar ayrılmış; durum gibi alanlar serbest metin değil, sabit seçenek listesi.
- Örnek veri tek dosyada (`src/lib/data.ts` ya da `src/lib/veri/`): her tipten en az 6 kayıt, tiplere uygun.
- Bileşenlerin ve store'ların içine dağılmış tip tanımları `src/lib/types/` altına taşınmış; projede `any` kalmamış.
- `package.json` içinde `check` betiği (`astro check`); `bun run check` 0 hata.
- `docs/veri-modeli.md`: her tip için alan tablosu ve tipler arası ilişki; `AGENTS.md` indeksinde.

## 2. Yapay zekaya verilecek istem

Köşeli parantezli yerleri kendi uygulamanıza göre doldurun. Araç önce plan sunmalı; planı okuyup onaylamadan değişiklik yaptırmayın.

```text
Uygulamamın veri sözleşmesini tek yerde toplamak istiyorum. Uygulama: [UYGULAMANIZI 1 CÜMLEYLE ANLATIN].
Ana veri tiplerim: [ÖRN. Usta, Hizmet, İş emri]. Eksik gördüğün tipi öner.
1. Mevcut kodu tara: bileşenlerde, store'larda ve veri dosyalarında tanımlı ya da ima edilen tipleri listele.
2. `src/lib/types/` altında her tip için ayrı dosya ve bir `index.ts` oluştur. Her alana tek satır açıklama yaz. Durum alanlarını sabit seçenek listesi yap.
3. Dağınık tip tanımlarını buraya taşı, içe aktarmaları güncelle. Hiçbir yerde `any` bırakma.
4. Örnek veriyi tek dosyada topla; her tipten en az 6 gerçekçi kayıt olsun.
5. `package.json`'a `check` betiği ekle (`astro check`) ve hataları sıfırla.
6. `docs/veri-modeli.md` yaz ve `AGENTS.md` indeksine ekle. Ayrıca `AGENTS.md`'ye şu kuralı ekle: yeni veri alanı önce `src/lib/types/` içinde tanımlanır.

Son olarak: `bun run build` 0 hata vermeli. Bitince hangi dosyaları neden değiştirdiğini madde madde özetle ve benim elle denemem gereken adımları yaz.
```

**Bu işin bir kısmı sizde zaten varsa** önce şunu sorun:

```text
`docs/tasks/week-4/11-veri-sozlesmesi.task.md` dosyasındaki "Görev bittiğinde repoda ne olacak" maddelerini repodaki mevcut durumla tek tek karşılaştır.
Her madde için: karşılanıyor / kısmen / eksik ve kanıt olarak dosya yolu. Henüz hiçbir şeyi değiştirme.
```

Sonra yalnız "kısmen" ve "eksik" çıkan maddeleri yaptırın.

## 3. Kendiniz doğrulayın

1. `bun run check` ve `bun run build` çalıştırın; ikisi de 0 hata vermeli. Çıktıyı günlüğe yapıştırın.
2. `docs/veri-modeli.md` tablosunu okuyun: alan adları uygulamanızı doğru anlatıyor mu? Yanlış ya da eksik alan varsa araca düzelttirin.
3. Uygulamayı açın: ekranlar görev öncesiyle aynı görünmeli. Bu görev görünümü değiştirmez.
4. Araca sorun: "projede `any` geçen yer kaldı mı, liste ver". Yanıt boş olmalı.

## 4. Projenize göre

Ağ tanılama: Bağlantı, Servis, Test sonucu · Usta çağırma: Usta, Hizmet, İş emri · Kahve: Ürün, Seçenek, Sipariş · Oyun: Seviye, Sipariş fişi, Skor · Sinema: Film, Seans, Bilet · İlan: İlan, Kategori, Kullanıcı · Berber: Salon, Hizmet, Randevu.

## ✅ Kontrol listesi

- [ ] Dal: `feature/11-veri-sozlesmesi`; en az bir PR; `master`'a doğrudan commit yok.
- [ ] İstem günlüğü: `docs/istemler/11-veri-sozlesmesi.md` (istem, plan, düzeltmeler, doğrulama sonucu).
- [ ] Bölüm 1'deki her madde karşılandı.
- [ ] Bölüm 3'teki adımları kendim yaptım; ekran görüntüleri günlükte.
- [ ] `bun run build` 0 hata.

## 🎯 Puan rubriği (toplam 15 puan)

| Kriter | Puan | Tam puan koşulu |
|---|---|---|
| Tipler | 5 | En az 3 tip, ayrı dosyalarda; alan açıklamaları ve sabit seçenek listeleri var |
| Örnek veri | 3 | Tek dosyada, her tipten en az 6 kayıt |
| Temizlik | 3 | Dağınık tipler taşınmış; `any` yok |
| Denetim betiği | 2 | `bun run check` 0 hata |
| Belge | 2 | `docs/veri-modeli.md` ve AGENTS kuralı |

