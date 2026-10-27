// Rapor: beş testin ve ağ durumunun tek kayıtta birleşmesi. Cihazda `localStorage` içinde saklanır.
import type { DiagnosticTest } from "./diagnostic";
import type { NetworkSnapshot } from "./network";

/** Bağlantı Skoru seviyesi (src/lib/score.ts eşikleri: 80 ve 50). */
export type ScoreLevel = "iyi" | "orta" | "zayif";

/** Tamamlanmış bir tanılama raporu. */
export interface DiagnosticReport {
  // Zorunlu (bütün alanlar zorunludur)
  /** Rust `generate_report_id`: NCHK-YYYY-XXXXXXXX. */
  id: string;
  /** Oluşturulma zamanı, ISO 8601 (UTC). */
  createdAt: string;
  /** 0–100 Bağlantı Skoru (src/lib/score.ts). */
  score: number;
  /** Başarılı test sayısı. */
  passed: number;
  /** Başarısız ya da kullanılamayan test sayısı. */
  failed: number;
  /** Rapor anındaki ağ durumu. */
  network: NetworkSnapshot;
  /** Beş testin sonucu. */
  tests: DiagnosticTest[];
}
