import type { DiagnosticTest, ScoreRule, ScoreLevel } from "./types";

// Skor kuralı düzenleyicisinin önizlemesi için ayarlanabilir hesap. Uygulamanın kullandığı sabit
// kural src/lib/score.ts'tedir; panel bir kural yayınlayabildiğinde ikisi tek kaynakta birleşmelidir.
export function computeScore(tests: DiagnosticTest[], rule: ScoreRule): number {
  const base = tests.reduce((s, t) => s + (t.status === "success" ? (rule.weights[t.id] ?? 0) : 0), 0);
  const samples = tests
    .filter(t => (t.id === "cloudflare" || t.id === "google") && t.status === "success" && t.latencyMs !== undefined)
    .map(t => t.latencyMs as number);
  let bonus = 0;
  if (samples.length) {
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const band = rule.latencyBands.find(b => b.maxMs !== null && avg < (b.maxMs as number));
    bonus = band ? band.bonus : (rule.latencyBands[rule.latencyBands.length - 1]?.bonus ?? 0);
  }
  return Math.min(100, Math.max(0, base + bonus));
}

export function scoreLevel(score: number, rule: ScoreRule): ScoreLevel {
  return score >= rule.levels.iyi ? "iyi" : score >= rule.levels.orta ? "orta" : "zayif";
}

export const isReportId = (s: string): boolean => /^NCHK-\d{4}-[0-9A-F]{8}$/.test(s);
