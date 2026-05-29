import { Controller, Param, Post } from "@nestjs/common";
import { RequestQualityGateUseCase } from "../../application/use-cases/request-quality-gate.use-case";

@Controller("apps/:appId/versions/:versionId/quality-gate")
export class QualityController {
  constructor(private readonly requestQualityGate: RequestQualityGateUseCase) {}

  @Post()
  run(@Param("appId") appId: string, @Param("versionId") versionId: string) {
    return this.requestQualityGate.execute(appId, versionId);
  }
}
