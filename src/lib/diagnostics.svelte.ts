// Tanılama çalıştırıcısı — paylaşılan durum (store). Sayfalar arası geçişte sonuçlar korunur.
import type { DiagnosticKind, DiagnosticReport, DiagnosticTest, EkranHatasi } from "./types";
import {
  destekleniyorMu,
  generateReportId,
  getNetworkSnapshot,
  hasNative,
  NativeUnavailableError,
  runDiagnostic,
} from "./native";
import { diagnosticName, diagnosticTargetHint, outcomeMessage } from "./labels";
import { computeScore } from "./score";
import { reports } from "./reports.svelte";

export const DIAGNOSTIC_KINDS: DiagnosticKind[] = ["gateway", "cloudflare", "google", "dns", "internet"];
/** ICMP ile çalışan testler; ping yöntemi olmayan bir derlemede hiç çalıştırılmaz ve gösterilmez. */
const PING_KINDS: DiagnosticKind[] = ["gateway", "cloudflare", "google"];

function initialTests(kinds: DiagnosticKind[] = DIAGNOSTIC_KINDS): DiagnosticTest[] {
  return kinds.map((id) => ({
    id,
    name: diagnosticName[id],
    target: diagnosticTargetHint[id],
    status: "pending",
  }));
}

/** Bu ortamda çalıştırılacak testler (Görev 15 platform kuralı; docs/platform-destegi.md). */
async function supportedKinds(): Promise<DiagnosticKind[]> {
  if (!hasNative() || (await destekleniyorMu("ping"))) return DIAGNOSTIC_KINDS;
  return DIAGNOSTIC_KINDS.filter((k) => !PING_KINDS.includes(k));
}

class Diagnostics {
  tests = $state<DiagnosticTest[]>(initialTests());
  running = $state(false);
  /** Son çalıştırmanın hatası; metni ekran seçili dilde gösterir. */
  hata = $state<EkranHatasi | null>(null);
  /** Son çalıştırmada oluşturulan rapor (yeni çalıştırma başlayınca sıfırlanır). */
  report = $state<DiagnosticReport | null>(null);

  passed = $derived(this.tests.filter((t) => t.status === "success").length);
  completed = $derived(this.tests.filter((t) => t.status !== "pending" && t.status !== "running").length);

  async start() {
    if (this.running) return;
    this.running = true;
    this.hata = null;
    this.report = null;
    try {
      const kinds = await supportedKinds();
      this.tests = initialTests(kinds).map((t) => ({ ...t, status: "running" }));
      // Testler bağımsızdır; paralel çalıştırmak çevrimdışı durumda bekleme süresini kısaltır.
      const [network] = await Promise.all([
        getNetworkSnapshot(),
        Promise.all(kinds.map((kind, index) => this.runOne(kind, index))),
      ]);
      const id = await generateReportId();
      const tests = $state.snapshot(this.tests);
      const passed = tests.filter((t) => t.status === "success").length;
      const report: DiagnosticReport = {
        id,
        createdAt: new Date().toISOString(),
        score: computeScore(tests),
        passed,
        failed: tests.length - passed,
        network,
        tests,
      };
      reports.add(report);
      this.report = report;
    } catch (e) {
      this.hata = e instanceof NativeUnavailableError ? "yalniz-uygulamada" : "alinamadi";
      this.tests = initialTests();
    } finally {
      this.running = false;
    }
  }

  private async runOne(kind: DiagnosticKind, index: number) {
    try {
      const outcome = await runDiagnostic(kind);
      this.tests[index] = {
        id: kind,
        name: diagnosticName[kind],
        target: outcome.target ?? this.tests[index].target,
        status: outcome.status,
        latencyMs: outcome.latencyMs,
        code: outcome.code,
        detail: outcome.detail,
        message: outcomeMessage(kind, outcome),
      };
    } catch (e) {
      if (e instanceof NativeUnavailableError) throw e;
      // Tipli komut hatası (CommandFailure) ya da IPC hatası: test başarısız, rapor yine oluşur.
      this.tests[index] = { ...this.tests[index], status: "failed", message: "Test tamamlanamadı." };
    }
  }
}

export const diagnostics = new Diagnostics();
