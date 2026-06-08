import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { SendAgentMessageUseCase } from "../../../agents/application/use-cases/send-agent-message.use-case";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { RequestQualityGateUseCase } from "../../../quality/application/use-cases/request-quality-gate.use-case";
import { STORAGE_PORT, StoragePort } from "../../../storage/application/ports/storage.port";
import { VERSIONS_REPOSITORY, VersionsRepository } from "../../../versions/domain/repositories/versions.repository";
import { RunCiCdDto } from "../dtos/run-cicd.dto";

type CiCdStageStatus = "pending" | "running" | "passed" | "failed" | "skipped";

interface CiCdStage {
  id: string;
  label: string;
  status: CiCdStageStatus;
  detail?: string;
}

@Injectable()
export class RunCiCdUseCase {
  constructor(
    @Inject(VERSIONS_REPOSITORY) private readonly versions: VersionsRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly qualityGate: RequestQualityGateUseCase,
    private readonly sendAgentMessage: SendAgentMessageUseCase
  ) {}

  async execute(user: AuthenticatedUser, appId: string, dto: RunCiCdDto = {}) {
    const owner = await this.versions.getAppOwner(appId);
    if (!owner || owner.userId !== user.id) throw new NotFoundException("App not found");

    const version = dto.versionId
      ? await this.versions.findById(appId, dto.versionId)
      : (await this.versions.listByApp(appId))[0];

    if (!version) {
      throw new BadRequestException("Create or generate a version before running CI/CD");
    }

    const autoFix = dto.autoFix !== false;
    const stages = this.initialStages(version.versionNumber);
    const ci = await this.qualityGate.execute(user, appId, version.id, { buildType: "CI_CD" });
    const ciPassed = ci.quality.status === "PASSED";
    const logsExcerpt = ci.logs.slice(0, 6000);
    const previewUrl = await this.currentPreviewUrl(owner.userId, appId);

    if (ciPassed) {
      return {
        status: "PASSED",
        version,
        ci: this.qualitySummary(ci, logsExcerpt),
        previewUrl,
        autoFix: { attempted: false, reason: "CI/CD passed." },
        stages: this.finishStages(stages, {
          ci: "passed",
          preview: previewUrl ? "passed" : "skipped",
          autoFix: "skipped"
        })
      };
    }

    if (!autoFix) {
      return {
        status: "FAILED",
        version,
        ci: this.qualitySummary(ci, logsExcerpt),
        autoFix: { attempted: false, reason: "Auto-fix disabled." },
        stages: this.finishStages(stages, {
          ci: "failed",
          preview: "skipped",
          autoFix: "skipped"
        })
      };
    }

    const repairPrompt = this.repairPrompt({
      versionNumber: version.versionNumber,
      status: ci.quality.status,
      qualityScore: ci.quality.qualityScore,
      logsExcerpt
    });

    let repair: Awaited<ReturnType<SendAgentMessageUseCase["execute"]>>;
    try {
      repair = await this.sendAgentMessage.execute(user, appId, { message: repairPrompt });
    } catch (error) {
      return {
        status: "FAILED_AFTER_FIX",
        version,
        ci: this.qualitySummary(ci, logsExcerpt),
        autoFix: {
          attempted: true,
          error: error instanceof Error ? error.message : "AI auto-fix failed"
        },
        stages: this.finishStages(stages, {
          ci: "failed",
          preview: "failed",
          autoFix: "failed"
        })
      };
    }
    const repairedStatus = repair.quality?.quality.status === "PASSED" ? "PASSED_AFTER_FIX" : "FAILED_AFTER_FIX";

    return {
      status: repairedStatus,
      version,
      ci: this.qualitySummary(ci, logsExcerpt),
      autoFix: {
        attempted: true,
        runId: repair.runId,
        version: repair.version,
        quality: repair.quality,
        files: repair.files,
        previewUrl: repair.previewUrl,
        message: repair.message
      },
      stages: this.finishStages(stages, {
        ci: "failed",
        preview: repairedStatus === "PASSED_AFTER_FIX" ? "passed" : "failed",
        autoFix: repairedStatus === "PASSED_AFTER_FIX" ? "passed" : "failed"
      })
    };
  }

  private initialStages(versionNumber: number): CiCdStage[] {
    return [
      {
        id: "version",
        label: `Select snapshot v${versionNumber}`,
        status: "passed",
        detail: "Using a stored version snapshot, not a fake UI-only job."
      },
      {
        id: "ci",
        label: "Run CI checks",
        status: "running",
        detail: "runner-service executes install, lint, typecheck, test and build when available."
      },
      {
        id: "autofix",
        label: "AI failure repair",
        status: "pending",
        detail: "Only starts after a real CI/CD failure."
      },
      {
        id: "preview",
        label: "Preview release candidate",
        status: "pending",
        detail: "Preview is kept only after the generated artifact exists."
      }
    ];
  }

  private finishStages(
    stages: CiCdStage[],
    result: { ci: CiCdStageStatus; autoFix: CiCdStageStatus; preview: CiCdStageStatus }
  ): CiCdStage[] {
    return stages.map((stage) => {
      if (stage.id === "ci") return { ...stage, status: result.ci };
      if (stage.id === "autofix") return { ...stage, status: result.autoFix };
      if (stage.id === "preview") return { ...stage, status: result.preview };
      return stage;
    });
  }

  private qualitySummary(
    result: Awaited<ReturnType<RequestQualityGateUseCase["execute"]>>,
    logsExcerpt: string
  ) {
    return {
      build: result.build,
      quality: result.quality,
      logsExcerpt
    };
  }

  private repairPrompt(input: {
    versionNumber: number;
    status: string;
    qualityScore: number;
    logsExcerpt: string;
  }): string {
    return [
      `CI/CD failed for snapshot v${input.versionNumber}.`,
      `Status: ${input.status}. Quality score: ${input.qualityScore}/100.`,
      "",
      "Fix the generated app by returning a complete runnable replacement file set.",
      "Keep preview/index.html as the actual application, preserve the app direction, and do not add external dependencies unless the quality scripts still pass locally.",
      "",
      "Runner logs excerpt:",
      input.logsExcerpt || "No runner logs were captured."
    ].join("\n");
  }

  private async currentPreviewUrl(userId: string, appId: string): Promise<string | undefined> {
    try {
      await this.storage.getObject(`users/${userId}/apps/${appId}/preview/index.html`);
      return `/apps/${appId}/preview`;
    } catch {
      return undefined;
    }
  }
}
