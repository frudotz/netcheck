// Kullanıcıya görünen Türkçe metinler — kod tanımlayıcıları İngilizce kalır.
import type { ConnectionType } from "../types/netcheck";
import { NativeUnavailableError } from "./native";

export const UNAVAILABLE = "Kullanılamıyor";
export const NOT_FOUND = "Bulunamadı";

export const connectionTypeLabel: Record<ConnectionType, string> = {
  ethernet: "Ethernet (kablolu)",
  wifi: "Wi-Fi (kablosuz)",
  unknown: "Bilinmiyor",
};

export const DESKTOP_ONLY =
  "Ağ bilgileri yalnızca NetCheck masaüstü uygulamasında alınabilir. Tarayıcı önizlemesinde gerçek ağ verisine erişilemez.";

/** Ham Rust/IPC hatasını kullanıcıya göstermeden anlaşılır bir mesaja çevirir. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof NativeUnavailableError) return DESKTOP_ONLY;
  return fallback;
}
