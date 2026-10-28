# Geliştirme Notları

Geliştirme sırasında kullanılan küçük yardımcılar. Kurulum ve çalıştırma komutları: [`docs/kurulum.md`](kurulum.md).

## Liste hallerini elle deneme (Görev 13)

Geçmiş ekranı dört halden yalnız birini gösterir: yükleniyor, hata, boş, dolu. Gerçek veride her hali görmek zor olduğu için geliştirme sunucusunda adrese `durum` parametresi eklenerek bir hal zorlanabilir:

| Adres | Görünen hal |
|---|---|
| `/gecmis?durum=yukleniyor` | Yükleniyor (iskelet); yükleme hiç bitmez |
| `/gecmis?durum=hata` | Hata ("Kayıtlı raporlar okunamadı." ve "Tekrar dene") |
| `/gecmis?durum=bos` | Boş ("Henüz test yapılmadı"); kayıtlar silinmez, yalnız gösterilmez |
| `/gecmis` | Gerçek veri: rapor varsa dolu, yoksa boş |

- Parametre **yalnız geliştirme sunucusunda** (`bun run dev`, `bun run tauri dev`) çalışır (`import.meta.env.DEV`); `bun run build` çıktısında yok sayılır. Kullanıcı sahte bir hal göremez.
- Hata halinde "Tekrar dene" parametreyi adresten kaldırır ve listeyi gerçekten yeniden yükler.
- Arama ya da süzgeç sonucu boşsa ayrı bir boş durum ve "Süzgeci temizle" düğmesi görünür. Denemek için aramaya listede olmayan bir metin yazın.
- Dolu hal için raporlar yalnız Tauri uygulamasında oluşur; tarayıcı önizlemesinde rapor üretilmez.
- Metinleri başka dilde görmek için Ayarlar'dan dili değiştirin; seçim `localStorage` anahtarı `dil` içinde durur.

## Çalışan uygulamayı denetleme

Arayüzü gerçek IPC ile denetleme adımları (WebView2 uzaktan hata ayıklama portu ve CDP) [`AGENTS.md` § 5](../AGENTS.md#5-arayüz-doğrulama-tarayıcı-otomasyonu) içindedir. Gerçek ağ adresleri görünen ekran görüntüleri depoya eklenmez.
