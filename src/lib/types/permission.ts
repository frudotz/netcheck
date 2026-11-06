// İzin envanteri: Rust `get_permission_inventory` yanıtı (statik; sistemden okunmaz, diyalog açmaz).
// Kaynak: src-tauri/src/platform/permissions.rs · Belge: docs/izinler.md · Ekran: /izinler
import type { Feature } from "./command";
import type { OsName } from "./platform";

/** İznin sözlük anahtarı; ad ve gerekçe `sozluk.ts` `izinMetni` ile seçili dilde çizilir. */
export type PermissionId =
  | "internet" // ağ erişimi
  | "network-state" // Android ConnectivityManager
  | "wifi-state" // Android, istenmez (bağlantı hızı gösterilmez)
  | "local-network" // iOS, cihazda doğrulanmadı
  | "external-link" // Tauri opener yetkisi
  | "notifications"
  | "location"
  | "camera"
  | "microphone";

/** İşletim sistemi izni ya da Tauri capability yetkisi. */
export type PermissionKind = "os" | "tauri";

/** İznin bu derleme hedefindeki durumu; canlı sistem durumu değildir. */
export type PermissionStatus =
  | "declared" // manifest / Info.plist / capability dosyasında bildirildi, kurulum anında verilir
  | "not-needed" // bu platformda izin kavramı yok
  | "not-requested" // bilinçli olarak istenmiyor
  | "unverified"; // gerekip gerekmediği cihazda doğrulanmadı

/** Tek bir izin kaydı (Rust `PermissionEntry` ile birebir, camelCase). */
export interface PermissionEntry {
  // Zorunlu (bütün alanlar zorunludur)
  /** Sözlük anahtarı. */
  id: PermissionId;
  /** İzin türü. */
  kind: PermissionKind;
  /** Derleme hedefi. */
  os: OsName;
  /** Platformun teknik kimliği (manifest izni, Info.plist anahtarı, capability adı); yoksa `null`. */
  technicalId: string | null;
  /** Temel işlev bu izin olmadan çalışmaz. */
  required: boolean;
  /** Çalışma zamanında sistem diyaloğu gösterilir mi; NetCheck'te her zaman `false`. */
  runtimePrompt: boolean;
  /** Durum. */
  status: PermissionStatus;
  /** Etkilenen özellikler; boşsa yetenek kullanılmıyor. */
  features: Feature[];
}
