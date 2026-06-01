import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";

@Injectable()
export class PrismaAgentConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(appId: string, role: "user" | "assistant", content: string) {
    return this.prisma.agentMessage.create({ data: { appId, role, content } });
  }

  async listMessages(appId: string) {
    return this.prisma.agentMessage.findMany({
      where: { appId },
      orderBy: { createdAt: "asc" }
    });
  }

  async startRun(appId: string, prompt: string) {
    return this.prisma.agentRun.create({
      data: {
        appId,
        prompt,
        status: "RUNNING"
      }
    });
  }

  async listSteps(appId: string) {
    const [app, latestRun, latestVersion, latestBuild] = await Promise.all([
      this.prisma.app.findUnique({ where: { id: appId }, select: { id: true } }),
      this.prisma.agentRun.findFirst({ where: { appId }, orderBy: { startedAt: "desc" } }),
      this.prisma.appVersion.findFirst({ where: { appId }, orderBy: { versionNumber: "desc" } }),
      this.prisma.build.findFirst({ where: { appId }, orderBy: { startedAt: "desc" } })
    ]);

    if (!app) return null;

    const runStatus = latestRun?.status === "RUNNING" ? "running" : latestRun ? "done" : "pending";
    const versionStatus = latestVersion ? "done" : runStatus === "running" ? "pending" : "pending";
    const qualityStatus = latestBuild
      ? latestBuild.status === "RUNNING"
        ? "running"
        : latestBuild.status === "PASSED"
          ? "done"
          : "failed"
      : latestVersion
        ? "pending"
        : "pending";
    const previewStatus = latestBuild?.status === "PASSED" ? "done" : qualityStatus === "failed" ? "failed" : "pending";

    return [
      {
        id: "understanding",
        appId,
        title: "Understanding project context",
        description: "Reading the app identity, prompt history and current workspace state.",
        status: "done",
        order: 1
      },
      {
        id: "planning",
        appId,
        title: "Generating app update",
        description: "Asking the agent-service for a runnable file payload for this project.",
        status: runStatus,
        order: 2
      },
      {
        id: "snapshot",
        appId,
        title: "Creating version snapshot",
        description: latestVersion ? `Current version v${latestVersion.versionNumber} is stored.` : "Waiting for generated files.",
        status: versionStatus,
        order: 3
      },
      {
        id: "quality",
        appId,
        title: "Running quality gate",
        description: latestBuild ? `Latest build status: ${latestBuild.status}.` : "Lint, typecheck, tests and build will run after a snapshot.",
        status: qualityStatus,
        order: 4
      },
      {
        id: "preview",
        appId,
        title: "Preparing preview",
        description: previewStatus === "done" ? "Preview is ready to open." : "Preview will load after quality checks finish.",
        status: previewStatus,
        order: 5
      }
    ];
  }

  async finishRun(runId: string, status: string, response: string) {
    return this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        status,
        response,
        finishedAt: new Date()
      }
    });
  }
}
