# İzinler (yetkiler)

Bu uygulama yalnız gerçekten kullandığı izni ister. İlke: **açıklayamadığımız izni istemeyiz.**

İzin yüzeyi qLar deseninden damıtıldı: `permissions_status` (durumu döner, asla diyalog açmaz) ve `permission_request` (OS diyaloğunu açar). Arayüz bunları yalnız `src/lib/native.ts` üzerinden çağırır. Ekran: `/izinler`.

## İstenen izinler

| İzin | Ne için | Hangi ekran | Veri nereye gider |
|---|---|---|---|
| Bildirim (notification) | Ağ bağlantısı durumu bildirimi | /izinler + uygulama akışı | Hiçbir yere; bildirim yalnız cihazda gösterilir |

## Durum değerleri
granted · denied · prompt · unsupported · unknown (okunamadı — tahmin edilmez).

## Platform
Bildirim `tauri-plugin-notification` ile beş native hedefte çalışır; tarayıcı önizlemede sistem izni yoktur.
