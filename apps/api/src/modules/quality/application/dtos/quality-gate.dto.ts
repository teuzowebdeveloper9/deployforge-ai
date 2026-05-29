export interface QualityGateResult {
  status: "PASSED" | "FAILED";
  qualityScore: number;
  logs: string;
  report: Record<string, unknown>;
}
