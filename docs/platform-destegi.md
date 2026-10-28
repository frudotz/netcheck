# Platform Desteği

NetCheck tek kod tabanından Android, iOS, macOS, Windows ve Linux için derlenir (Görev 15 platform kuralı). Bu belge her özelliğin her platformda **nasıl** sağlandığını ve platformun **ne düzeyde doğrulandığını** ayrı ayrı gösterir. Yeni bir özellik eklenirken bu tablo güncellenir ([`AGENTS.md` § 4](../AGENTS.md#4-kod-yazım-kuralları)).

- **Destekleniyor:** her platformda aynı ortak kod.
- **Farklı yolla:** platforma özgü kod; yalnız [`src-tauri/src/platform/`](../src-tauri/src/platform/) altında yazılır.
- **Yok:** bu platformda sağlanmıyor; özellik arayüzde hiç görünmez.

## Özellik × platform

| Özellik | Windows | macOS | Linux | Android | iOS |
|---|---|---|---|---|---|
| Ağ bilgisi (adresler, ağ geçidi, arayüzler) | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor |
| DNS sunucu listesi | Farklı yolla: Windows API | Farklı yolla: SystemConfiguration | Farklı yolla: `/etc/resolv.conf` | Farklı yolla: `LinkProperties` (JNI) | Farklı yolla: yalnız `/etc/resolv.conf` |
| Cihaz adı | Destekleniyor: işletim sistemi adı | Destekleniyor | Destekleniyor | Farklı yolla: `Settings.Global "device_name"`, yoksa `Build.MODEL` (JNI) | Destekleniyor |
| Ping testleri (ağ geçidi, 1.1.1.1, 8.8.8.8) | Farklı yolla: `IcmpSendEcho` | Farklı yolla: sistem `ping` | Farklı yolla: sistem `ping` | Farklı yolla: ayrıcalıksız ICMP soketi | Farklı yolla: Darwin ICMP soketi |
| DNS çözümleme testi | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor |
| HTTPS testi ve genel IP | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor |
| Rapor kimliği (Rust) | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor |
| Geçmiş, tema, dil (`localStorage`) | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor |
| Bağlantıyı tarayıcıda açma | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor | Destekleniyor |

Kaynaklar: [`src-tauri/src/platform/icmp.rs`](../src-tauri/src/platform/icmp.rs) (ping yöntemleri), [`src-tauri/src/platform/device.rs`](../src-tauri/src/platform/device.rs) (cihaz adı), `netdev` özellikleri [`src-tauri/Cargo.toml`](../src-tauri/Cargo.toml). Ayrıntı: [`lat.md/networking.md`](../lat.md/networking.md).

### "Farklı yolla" ve "yok" satırları için ne yapıldı

- **Ping:** her platformun yöntemi `get_platform_info` yanıtında `icmp` olarak döner ve Ayarlar'da gösterilir. IPv6 hedefleri hiçbir platformda desteklenmez; hedefler zaten IPv4'tür.
- **DNS sunucu listesi:** listenin boş gelmesi geçerli bir sonuçtur ve "Bulunamadı" gösterilir. DNS testi ayrı çalışır, liste boşken de geçebilir.
- **Cihaz adı:** okunamazsa "Kullanılamıyor" gösterilir; uydurulmaz.
- **Yok:** beş hedef platformun hiçbirinde "yok" satırı yoktur. Arayüz bunu [`src/lib/native.ts`](../src/lib/native.ts) `destekleniyorMu(ozellik)` ile sorar; bileşenler platform adını kendileri sorgulamaz. Ping yöntemi olmayan bir derlemede (`icmp: "unavailable"`, beş platform dışında) ping testleri hiç çalıştırılmaz ve Tanılama listesinde görünmez.
- **Tarayıcı önizlemesi** (`bun run dev`) bir platform değildir. Rust olmadığı için `destekleniyorMu` her özellik için `false` döner, ekranlar çökmeden "yalnızca NetCheck uygulamasında" mesajını gösterir.

## Doğrulama düzeyi

Bir özelliğin kodda bulunması, o platformda çalıştırıldığı anlamına gelmez. Doğrulama düzeyleri [`lat.md/platforms.md`](../lat.md/platforms.md) ile aynıdır.

| Platform | Düzey | Kanıt |
|---|---|---|
| Windows | Doğrulandı | Geliştirme ve sürüm derlemesi çalıştırıldı; Görev 12–13 denetimleri çalışan uygulamada yapıldı |
| Android | Doğrulandı | Android 16 emülatörü ve fiziksel Redmi Note 13 Pro, Wi-Fi ve mobil veri (PR #23, PR #30) |
| macOS | CI + kısmi çalıştırma | CI'da derleme ve testler. PR #28'de debug `.app` açıldı ve yerel tanılamalar gerçek sonuç verdi; ekranlar etkileşimli denenmedi |
| Linux | CI | CI'da derleme ve testler; uygulama olarak çalıştırılmadı |
| iOS | Simülatör | PR #28'de iOS simülatöründe derlenip açıldı; fiziksel iPhone kaydı yok |

macOS ve iOS üzerinde bu dönem ek doğrulama yapılmadı (eğitmenin 21.10 yönlendirmesi). Bu satırlar yeni kanıt geldiğinde güncellenir.
