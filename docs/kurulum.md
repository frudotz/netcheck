# Kurulum ve Çalıştırma

### Ön Gereksinimler
- [Bun](https://bun.sh/) (Windows: `powershell -c "irm bun.sh/install.ps1 | iex"` veya `npm install -g bun`; macOS/Linux: `curl -fsSL https://bun.sh/install | bash`).
- [Rust & Cargo](https://rustup.rs/).
- İşletim sisteminize göre [Tauri Önkoşulları](https://v2.tauri.app/start/prerequisites/) (Windows: Microsoft C++ Build Tools + WebView2).

### Adım Adım Çalıştırma

1. **Depoyu klonlayın:**
```bash
git clone https://github.com/frudotz/netcheck.git
cd netcheck
```

2. **Bağımlılıkları yükleyin:**
```bash
bun install
```

3. **Masaüstü uygulamasını çalıştırın (önerilen):**
```bash
bun run tauri dev
```
> Gerçek ağ bilgileri ve tanılama testleri yalnızca Tauri penceresinde çalışır (Rust IPC).

4. **Yalnızca web arayüzü (önizleme):**
```bash
bun run dev
```
> [http://127.0.0.1:1420](http://127.0.0.1:1420) adresinde açılır. Tarayıcıda Rust komutlarına erişilemediği için ağ ekranları "yalnızca masaüstü uygulamasında" uyarısı gösterir; sahte veri üretilmez.

5. **Üretim derlemesi (statik ön yüz):**
```bash
bun run build
```
> Çıktılar `dist/` klasörüne üretilir ve Tauri tarafından paketlenir. Kurulum paketi için: `bun run tauri build`.

6. **Android (isteğe bağlı):** ek gereksinimler — JDK 17, Android SDK (platform-tools, `platforms;android-37.0`, build-tools), Android NDK (r27+; doğrulanan: 29.0.14206865), `JAVA_HOME`, `ANDROID_HOME`, `NDK_HOME` ortam değişkenleri ve Rust hedefleri (`rustup target add aarch64-linux-android x86_64-linux-android`). Android projesi depoda hazırdır (`src-tauri/gen/android`); `tauri android init` gerekmez.
```bash
bun run tauri android build --target aarch64 --apk           # telefon için sürüm APK'sı (imzasız)
bun run tauri android build --debug --target x86_64 --apk    # emülatör için debug APK
bun run tauri android dev                                    # bağlı cihaz/emülatörde geliştirme
```
> Debug APK: `src-tauri/gen/android/app/build/outputs/apk/universal/debug/`. Yükleme: `adb install -r <apk>`.

7. **Rust testleri (isteğe bağlı):**
```bash
cd src-tauri
cargo test
```
> Ağ testleri gerçek ağ üzerinde çalışır; çevrimdışıyken tanılama testleri "Başarısız" döner, birim testleri yine geçer.

---
