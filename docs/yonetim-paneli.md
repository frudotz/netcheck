# Yönetim Paneli

14.10.2026'da AI Studio ile ayrı bir depoda (`frudotz/netcheck-gorev-aistudio`, `b5ba95d`) üretilen yönetim paneli, eğitmenin Hafta 05 durum raporundaki isteğiyle ana projeye, `admin/` klasörüne taşındı. Taşıma kaydı: [`docs/istemler/admin-panel-tasima.md`](istemler/admin-panel-tasima.md).

## Durum

- **Yalnız arayüz.** Panel hiçbir veri kaynağına bağlı değildir. Örnek ya da sahte kayıt yoktur; giriş ekranı ve veritabanı bağlantısı yoktur. Bunlar [`docs/course-compliance.md`](course-compliance.md) C-3 kararından sonra ayrı bir değişiklikle eklenir.
- **Veri ekranları** (Özet, Raporlar, Rapor detayı, Cihazlar, Destek mesajları, Skor kuralları, Tanılama hedefleri, İçerik sayfaları, Yöneticiler, Denetim günlüğü) kendi içerikleri yerine "bu ekran henüz bir veri kaynağına bağlı değil" durumunu gösterir. Çalışamayacak liste, form ve düğme gösterilmez.
- **Ayarlar** çalışır: tema ve dil uygulamayla ortaktır (aynı `localStorage` anahtarları `tema` ve `dil`), tablo yoğunluğu yalnız panele aittir.
- Ekranların kodu (tablolar, düzenleyiciler, onay pencereleri) bağlantı aşaması için depodadır, tip denetiminden geçer ve aşağıdaki kurallara uyar; ama bu aşamada çizilmez.

## Açma

- Geliştirme sunucusu: `bun run dev` → `http://127.0.0.1:1420/admin`.
- Derleme: `bun run build` panelin 11 sayfasını `dist/admin/` altına üretir; sayfalar Tauri paketine de girer.
- Uygulama menüsünden panele bağlantı yoktur; panelin uygulama içinde nasıl açılacağı ve mobil derlemelere girip girmeyeceği açık karardır ([`docs/course-compliance.md`](course-compliance.md) RA-f).

## Yapı

| Yer | İçerik |
|---|---|
| `admin/App.tsx` | Sağlayıcılar (tema, dil, yoğunluk, bildirim) ve ekran seçimi; bağlı değilken durum açıklaması |
| `admin/yol.ts` | Ekran adları ve adresleri (`/admin/<ekran>`); istemci tarafı yönlendirici yoktur |
| `admin/api/index.ts` | `AdminApi` arayüzü ve "bağlı değil" uygulaması (`bagli = false`) |
| `admin/domain/` | Panele özgü tipler (yönetici, mesaj, kural …); çekirdek tipler `src/lib/types/`'tan |
| `admin/features/`, `admin/components/` | Ekranlar ve panel bileşenleri |
| `admin/i18n/` | Sözlükler: `tr.ts` kaynak, `en.ts`, `ar.ts`, `fa.ts` aynı anahtarlarla |
| `admin/styles/admin.css` | Tailwind girişi ve token eşlemesi |
| `src/pages/admin/` | `index.astro` (Özet) ve `[gorunum].astro` (diğer 10 ekran) |
| `src/layouts/AdminLayout.astro` | Panel sayfa kabuğu; tema ve dili ilk boyamadan önce uygular |

## Kurallar

- **Renk:** yalnız [`src/styles/app.css`](../src/styles/app.css) token'ları ([`docs/branding.md`](branding.md)). `admin.css` Tailwind'in hazır renk paletini kapatır (`--color-*: initial`); `bg-red-500`, `text-white` gibi sınıflar CSS üretmez. Kullanılabilen renk sınıfları token adlarıdır: `ana`, `ana-yazi`, `vurgu`, `koyu`, `koyu-yazi`, `zemin`, `kart`, `yazi`, `yazi-soluk`, `kenar`, `basarili`, `hata`, `uyari`, `bilgi` ve `-zemin` eşleri (ör. `bg-kart`, `text-yazi-soluk`, `hover:bg-yazi/5`). Gece teması `dark:` ile değil `data-tema="gece"` token'larıyla çalışır.
- **Metin:** görünen her metin `t("anahtar")` ile `admin/i18n/` sözlüklerinden gelir. Yeni anahtar dört dosyaya birlikte eklenir; `Translations` tipi eksik anahtarı derleme hatası yapar.
- **Veri:** sahte kayıt, kişi, e-posta ya da IP yazılmaz. Biçim örneği gerekiyorsa belgeleme değerleri kullanılır (`192.0.2.x`, `example.com`, `NCHK-YYYY-XXXXXXXX`).
- **Tauri:** panel IPC çağırmaz. Bağlantı aşamasında çağrılar yalnız [`src/lib/native.ts`](../src/lib/native.ts) üzerinden yapılır.
- **Odak:** genel odak halkası kaldırılmaz (`focus-visible:outline-none` kullanılmaz).

## Bağımlılıklar

| Paket | Tür | Gerekçe |
|---|---|---|
| `tailwindcss`, `@tailwindcss/vite` | geliştirme | Panel kodu Tailwind sınıflarıyla yazılmış; elle CSS'e çevirmek binlerce sınıfı yeniden yazmak demekti. Yalnız `admin/styles/admin.css` Tailwind'i içe aktarır ve tarama `admin/` ile sınırlıdır; uygulama sayfalarının CSS'i değişmez. |
| `lucide-react` | çalışma | Panelin ~75 ikonu. Satır içi, 2 px çizgili SVG üretir ([`docs/branding.md`](branding.md) §3 ikon kuralı); yalnız kullanılan ikonlar pakete girer. |

Kaynak depodan alınmayanlar: `react-router-dom` (ekranlar Astro sayfası), AI Studio şablon artıkları (`@google/genai`, `express`, `dotenv`, `motion`, `tsx`, Vite yapılandırması, `metadata.json`).

## Kaynaktan farklar

- `api/mockAdapter.ts` ve `api/seedData.ts` (33 rapor, 8 cihaz, 12 mesaj, 40+ denetim kaydı) ve Ayarlar'daki "örnek veriyi sıfırla" kartı alınmadı.
- `styles/tokens.css` (uygulama token'larının ikinci kopyası) alınmadı; panel `app.css`'i kullanır. Üst bar metni için `--renk-koyu-yazi` token'ı eklendi.
- Sahte kişi, e-posta ve IP'ler kaldırıldı (üst bardaki "aktif yönetici" rozeti dahil). Denetim kaydında işlemi yapan kişi istemciden gönderilmez; arka uç oturumdan belirler.
- Kullanılmayan `Stepper`, `Tabs` ve 404 ekranı silindi; bilinmeyen adres uygulamanın 404 sayfasına düşer.
- Panelin kendi `localStorage` anahtarları (`netcheck-admin:locale`, `netcheck-admin:theme`) yerine uygulamanınkiler kullanılır; desteklenmeyen `de` dili kaldırıldı.

## Sonraki adımlar

C-3 kararına bağlıdır ve bu sürümün kapsamında değildir: arka uç güvenlik düzeltmeleri, panelin SQLite'a `native.ts` üzerinden bağlanması ve giriş, raporların panele gönderilip gönderilmeyeceği (gizlilik kararı). Tanılama hedefleri ve içerik sayfaları düzenleyicileri, hedeflerin Rust'ta sabit olduğu kuralıyla çelişir ([`AGENTS.md`](../AGENTS.md) §6); kaldırılıp kaldırılmayacakları da aynı karara bağlıdır.

Kaynak depo, bu taşıma birleştirilip doğrulandıktan sonra depo sahibi tarafından arşivlenir.
