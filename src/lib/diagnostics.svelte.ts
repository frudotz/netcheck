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
import { diagnosticName, diagnosticTargetHint, failureMessage, outcomeMessage } from "./labels";
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

/**
 * Bu ortamda çalıştırılacak testler (Görev 15 platform kuralı; docs/platform-destegi.md).
 * Platform bilgisi alınamazsa testler yine çalıştırılır: ping desteği bilinmiyor diye
 * hiçbir testi çalıştırmamak, ekranı gereksiz yere hata haline düşürürdü.
 */
async function supportedKinds(): Promise<DiagnosticKind[]> {
  if (!hasNative()) return DIAGNOSTIC_KINDS;
  try {
    if (await destekleniyorMu("ping")) return DIAGNOSTIC_KINDS;
    return DIAGNOSTIC_KINDS.filter((k) => !PING_KINDS.includes(k));
  } catch {
    return DIAGNOSTIC_KINDS;
  }
}

class Diagnostics {
  tests = $state<DiagnosticTest[]>(initialTests());
  running = $state(false);
  /** Son çalıştırmanın hatası; metni ekran seçili dilde gösterir. */
  hata = $state<EkranHatasi | null>(null);
  /** Son çalıştırmada oluşturulan rapor (yeni çalıştırma başlayınca sıfırlanır). */
  report = $state<DiagnosticReport | null>(null);
  /** Son bilinen test kümesi; hata sonrası liste buna döner (ping'siz derlemede ping satırları geri gelmez). */
  private kinds: DiagnosticKind[] = DIAGNOSTIC_KINDS;

  passed = $derived(this.tests.filter((t) => t.status === "success").length);
  completed = $derived(this.tests.filter((t) => t.status !== "pending" && t.status !== "running").length);

  async start() {
    if (this.running) return;
    this.running = true;
    this.hata = null;
    this.report = null;
    // Önceki sonuçlar beklemeden silinir; platform sorgusu sürerken eski "Başarılı" satırları görünmesin.
    this.tests = initialTests(this.kinds).map((t) => ({ ...t, status: "running" }));
    try {
      this.kinds = await supportedKinds();
      this.tests = initialTests(this.kinds).map((t) => ({ ...t, status: "running" }));
      // Testler bağımsızdır; paralel çalıştırmak çevrimdışı durumda bekleme süresini kısaltır.
      const [network] = await Promise.all([
        getNetworkSnapshot(),
        Promise.all(this.kinds.map((kind, index) => this.runOne(kind, index))),
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
      this.tests = initialTests(this.kinds);
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
      // Kod yazılır ki mesaj seçili dilde üretilsin (önceden yalnız Türkçe metin kalıyordu).
      this.tests[index] = {
        ...this.tests[index],
        status: "failed",
        code: "command_failed",
        message: failureMessage("command_failed"),
      };
    }
  }
}

export const diagnostics = new Diagnostics();
