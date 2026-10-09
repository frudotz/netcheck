# Görev 15 — Rust Komutu: Tipli Sonuç ve Hata

Uygulamanızı web sayfasından ayıran taraf Rust çekirdeğidir. Arayüz Rust'a bir iş yaptırır ve yanıt bekler. Bu yanıtın biçimi ve bir şey ters gittiğinde ne döneceği baştan belli olmalıdır.

> **Bu görevde kod yazmıyorsunuz.** İşi yapay zeka aracınız yapar; siz ne istediğinizi tarif eder, çıkan değişikliği okur ve sonucu denersiniz. Çalışma yöntemi: [Görev 10](10-calisma-yontemi.task.md).

---

## 1. Görev bittiğinde repoda ne olacak

- `src-tauri/src/` içinde uygulamanıza özgü en az bir komut; şablondan kalan örnek komut yeniden adlandırılmış ya da kaldırılmış.
- Komut, başarıda alanları belli bir yapı, başarısızlıkta türü belli bir hata döndürür; düz metin döndürmez. Geçersiz girdide çökmez, hata döner.
- Arayüz Rust'ı yalnız tek dosya üzerinden çağırır: `src/lib/native.ts`. Bileşenlerin içinde doğrudan Tauri çağrısı yoktur.
- Uygulama tarayıcıda açıldığında (Rust yokken) `native.ts` anlamlı bir yedek sonuç ya da "yalnız uygulamada" hatası verir; ekran çökmez.
- Sonuç ve hata tipleri `src/lib/types/` içinde, Rust tarafındaki yapıyla aynı alanlarla.
- Hata arayüzde Görev 13'teki `HataDurumu` ile gösterilir.
- Rust tarafında komutun en az 2 otomatik testi; `cargo test` geçer.

## 2. Yapay zekaya verilecek istem

Köşeli parantezli yerleri kendi uygulamanıza göre doldurun. Araç önce plan sunmalı; planı okuyup onaylamadan değişiklik yaptırmayın.

```text
Uygulamamın Rust tarafında şu işi yapan bir komut istiyorum: [KOMUTUN İŞİ, ÖRN. hizmet türü ve mesafeye göre fiyat tahmini].
1. Komut başarıda alanları belli bir yapı (struct), başarısızlıkta türleri belli bir hata (enum) döndürsün. Düz String döndürme. Geçersiz girdide panik yapma, hata döndür.
2. Şablondan kalan örnek komutu kaldır ya da bu komuta dönüştür.
3. Arayüz tarafında `src/lib/native.ts` oluştur (varsa genişlet): Rust çağrılarının hepsi yalnız bu dosyadan geçsin. Bileşenlerdeki doğrudan çağrıları buraya taşı.
4. Uygulama tarayıcıda çalışıyorsa `native.ts` çökmesin: makul bir yedek sonuç ya da "yalnız uygulamada" hatası dönsün.
5. Sonuç ve hata tiplerini `src/lib/types/` altına, Rust yapısıyla aynı alanlarla yaz.
6. Hatayı arayüzde HataDurumu bileşeniyle göster.
7. Rust tarafına en az 2 test yaz (bir başarılı, bir hatalı girdi) ve `cargo test` çalıştır.
8. Komutu, girdilerini, çıktısını ve hata türlerini `docs/komutlar.md` içine yaz; `AGENTS.md` indeksine ekle.

Son olarak: `bun run build` 0 hata vermeli. Bitince hangi dosyaları neden değiştirdiğini madde madde özetle ve benim elle denemem gereken adımları yaz.
```

**Bu işin bir kısmı sizde zaten varsa** önce şunu sorun:

```text
`docs/tasks/week-4/15-rust-komutu.task.md` dosyasındaki "Görev bittiğinde repoda ne olacak" maddelerini repodaki mevcut durumla tek tek karşılaştır.
Her madde için: karşılanıyor / kısmen / eksik ve kanıt olarak dosya yolu. Henüz hiçbir şeyi değiştirme.
```

Sonra yalnız "kısmen" ve "eksik" çıkan maddeleri yaptırın.

## 3. Kendiniz doğrulayın

1. `bun run tauri dev` ile uygulamayı açın, komutu tetikleyen ekrana gidin: sonuç görünüyor mu? Ekran görüntüsü alın.
2. Hatalı bir girdi deneyin (boş alan, eksi sayı): uygulama çökmeden hata ekranı çıkıyor mu?
3. Aynı ekranı tarayıcıda (`bun run dev`) açın: çökme yok, yedek sonuç ya da açıklama var mı?
4. `src-tauri` klasöründe `cargo test` çalıştırın; çıktıyı günlüğe yapıştırın.
5. Araca sorun: "`native.ts` dışında Tauri çağrısı yapan dosya var mı?" Yanıt boş olmalı.

## 4. Projenize göre

Ağ tanılama: ağ bilgisini okuma, tanılama çalıştırma · Usta çağırma: fiyat tahmini, iş emri numarası · Kahve: sipariş kodu ve toplam hesaplama · Oyun: skor kaydını dosyaya yazma · Sinema: bilet kodu üretme · Berber: uygun saatleri hesaplama · İlan: ilan numarası, fiyat biçimleme.

## ✅ Kontrol listesi

- [ ] Dal: `feature/15-rust-komutu`; en az bir PR; `master`'a doğrudan commit yok.
- [ ] İstem günlüğü: `docs/istemler/15-rust-komutu.md` (istem, plan, düzeltmeler, doğrulama sonucu).
- [ ] Bölüm 1'deki her madde karşılandı.
- [ ] Bölüm 3'teki adımları kendim yaptım; ekran görüntüleri günlükte.
- [ ] `bun run build` 0 hata.

## 🎯 Puan rubriği (toplam 20 puan)

| Kriter | Puan | Tam puan koşulu |
|---|---|---|
| Komut | 5 | Projeye özgü; tipli sonuç ve tipli hata; panik yok |
| Tek giriş noktası | 4 | Bütün çağrılar `native.ts` üzerinden |
| Tarayıcı yedeği | 3 | Rust yokken ekran çökmüyor |
| Tipler ve hata gösterimi | 3 | Tipler `types/` içinde; hata arayüzde görünüyor |
| Testler | 3 | En az 2 Rust testi; `cargo test` geçiyor |
| Belge | 2 | `docs/komutlar.md` |

