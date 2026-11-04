/** Tek bir iznin anlık durumu (Rust PermissionSnapshot ile birebir). */
export interface IzinDurumu {
  id: string;
  title: string;
  status: "granted" | "denied" | "prompt" | "unsupported" | "unknown";
  can_request: boolean;
  notes: string;
}
