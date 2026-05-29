import { Injectable } from "@nestjs/common";
import { loadConfig } from "../../../shared/config/app.config";
import { redactSecrets } from "../../../shared/logger/safe-log";
import { QualityGateResult } from "../application/dtos/quality-gate.dto";

interface RunnerResponse {
  status: string;
  quality_score: number;
  logs: string;
  report: Record<string, unknown>;
}

@Injectable()
export class RunnerClient {
  private readonly baseUrl = loadConfig().runnerServiceUrl;

  async runQualityGate(input: {
    appId: string;
    versionId: string;
    buildId: string;
    sourcePath: string;
  }): Promise<QualityGateResult> {
    const response = await fetch(`${this.baseUrl}/run-quality-gate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: input.appId,
        version_id: input.versionId,
        build_id: input.buildId,
        source_path: input.sourcePath
      }),
      signal: AbortSignal.timeout(180_000)
    });

    if (!response.ok) {
      const text = redactSecrets(await response.text());
      return {
        status: "FAILED",
        qualityScore: 0,
        logs: `runner-service returned ${response.status}: ${text}`,
        report: { error: "runner_service_failed", statusCode: response.status }
      };
    }

    const payload = (await response.json()) as RunnerResponse;
    const passed = payload.status.toLowerCase() === "passed";
    return {
      status: passed ? "PASSED" : "FAILED",
      qualityScore: payload.quality_score,
      logs: redactSecrets(payload.logs ?? ""),
      report: payload.report ?? {}
    };
  }
}
