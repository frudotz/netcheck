// Tanılama çalıştırıcısı — paylaşılan durum (store). Sayfalar arası geçişte sonuçlar korunur.
import type { DiagnosticKind, DiagnosticTest } from "../types/netcheck";
import { NativeUnavailableError, runDiagnostic } from "./native";
import { diagnosticName, diagnosticTargetHint, errorMessage, outcomeMessage } from "./labels";

export const DIAGNOSTIC_KINDS: DiagnosticKind[] = ["gateway", "cloudflare", "google", "dns", "internet"];

function initialTests(): DiagnosticTest[] {
  return DIAGNOSTIC_KINDS.map((id) => ({
    id,
    name: diagnosticName[id],
    target: diagnosticTargetHint[id],
    status: "pending",
  }));
}

class Diagnostics {
  tests = $state<DiagnosticTest[]>(initialTests());
  running = $state(false);
  error = $state("");

  passed = $derived(this.tests.filter((t) => t.status === "success").length);
  completed = $derived(this.tests.filter((t) => t.status !== "pending" && t.status !== "running").length);

  async start() {
    if (this.running) return;
    this.running = true;
    this.error = "";
    this.tests = initialTests().map((t) => ({ ...t, status: "running" }));
    try {
      // Testler bağımsızdır; paralel çalıştırmak çevrimdışı durumda bekleme süresini kısaltır.
      await Promise.all(DIAGNOSTIC_KINDS.map((kind, index) => this.runOne(kind, index)));
    } catch (e) {
      this.error = errorMessage(e, "Tanılama çalıştırılamadı. Lütfen tekrar deneyin.");
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
        message: outcomeMessage(kind, outcome),
      };
    } catch (e) {
      if (e instanceof NativeUnavailableError) throw e;
      this.tests[index] = { ...this.tests[index], status: "failed", message: "Test tamamlanamadı." };
    }
  }
}

export const diagnostics = new Diagnostics();
