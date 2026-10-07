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

6. **Rust testleri (isteğe bağlı):**
```bash
cd src-tauri
cargo test
```
> Ağ testleri gerçek ağ üzerinde çalışır; çevrimdışıyken tanılama testleri "Başarısız" döner, birim testleri yine geçer.

---
