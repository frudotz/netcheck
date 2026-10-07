// Bağlantı Skoru — temel tanılama sinyallerinden basit, deterministik bir 0–100 değerlendirme.
// Profesyonel bir ağ kalitesi ölçümü değildir.
import type { DiagnosticKind, DiagnosticTest } from "../types/netcheck";

const WEIGHTS: Record<DiagnosticKind, number> = {
  internet: 35,
  dns: 20,
  gateway: 15,
  cloudflare: 10,
  google: 10,
};

/** 1.1.1.1 / 8.8.8.8 başarılı ping ortalamasına göre en fazla 10 puan. */
function latencyBonus(tests: DiagnosticTest[]): number {
  const samples = tests
    .filter((t) => (t.id === "cloudflare" || t.id === "google") && t.status === "success" && t.latencyMs !== undefined)
    .map((t) => t.latencyMs as number);
  if (samples.length === 0) return 0;
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (avg < 50) return 10;
  if (avg < 100) return 7;
  if (avg < 200) return 4;
  return 1;
}

export function computeScore(tests: DiagnosticTest[]): number {
  const base = tests.reduce((sum, t) => sum + (t.status === "success" ? WEIGHTS[t.id] : 0), 0);
  return Math.min(100, base + latencyBonus(tests));
}

export type ScoreLevel = "iyi" | "orta" | "zayif";

export function scoreLevel(score: number): ScoreLevel {
  if (score >= 80) return "iyi";
  if (score >= 50) return "orta";
  return "zayif";
}

export const scoreLevelLabel: Record<ScoreLevel, string> = {
  iyi: "İyi",
  orta: "Orta",
  zayif: "Zayıf",
};

export const SCORE_NOTE = "Temel bağlantı ve tanılama sonuçlarına göre hesaplanan basit bir değerlendirmedir.";
