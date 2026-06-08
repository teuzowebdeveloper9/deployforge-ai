import { RunCiCdUseCase } from "../src/modules/cicd/application/use-cases/run-cicd.use-case";

describe("RunCiCdUseCase", () => {
  const user = { id: "user-1", email: "user@example.com", name: "User" };
  const version = {
    id: "version-1",
    appId: "app-1",
    versionNumber: 3,
    storagePath: "users/user-1/apps/app-1/versions/version-1/source.tar.gz",
    checksum: "abc",
    status: "CREATED",
    qualityScore: null,
    createdAt: new Date(),
    createdBy: "user-1"
  };
  const build = {
    id: "build-1",
    appId: "app-1",
    versionId: "version-1",
    status: "PASSED",
    type: "CI_CD",
    logsPath: "logs.txt",
    reportPath: "report.json",
    startedAt: new Date(),
    finishedAt: new Date()
  };

  function subject(overrides?: {
    quality?: { status: "PASSED" | "FAILED"; qualityScore: number; logs: string };
    repair?: unknown;
  }) {
    const versions = {
      getAppOwner: jest.fn().mockResolvedValue({ appId: "app-1", userId: "user-1" }),
      listByApp: jest.fn().mockResolvedValue([version]),
      findById: jest.fn().mockResolvedValue(version)
    };
    const qualityGate = {
      execute: jest.fn().mockResolvedValue({
        build,
        quality: {
          status: overrides?.quality?.status ?? "PASSED",
          qualityScore: overrides?.quality?.qualityScore ?? 100
        },
        logs: overrides?.quality?.logs ?? "all checks passed"
      })
    };
    const storage = {
      getObject: jest.fn().mockResolvedValue(Buffer.from("<html></html>"))
    };
    const sendAgentMessage = {
      execute: jest.fn().mockResolvedValue(
        overrides?.repair ?? {
          runId: "run-1",
          version: { ...version, id: "version-2", versionNumber: 4 },
          quality: {
            build: { ...build, id: "build-2" },
            quality: { status: "PASSED", qualityScore: 100 }
          },
          files: [],
          previewUrl: "/apps/app-1/preview",
          message: {
            mode: "generate-app",
            response: "Fixed",
            provider: "local-fallback",
            model: "none"
          }
        }
      )
    };

    return {
      versions,
      storage,
      qualityGate,
      sendAgentMessage,
      useCase: new RunCiCdUseCase(versions as any, storage as any, qualityGate as any, sendAgentMessage as any)
    };
  }

  it("runs the selected snapshot through CI/CD and skips auto-fix when it passes", async () => {
    const { useCase, qualityGate, sendAgentMessage } = subject();

    const result = await useCase.execute(user, "app-1", {});

    expect(qualityGate.execute).toHaveBeenCalledWith(user, "app-1", "version-1", { buildType: "CI_CD" });
    expect(sendAgentMessage.execute).not.toHaveBeenCalled();
    expect(result.status).toBe("PASSED");
    expect(result.autoFix).toEqual({ attempted: false, reason: "CI/CD passed." });
  });

  it("asks the agent to create a repair version after a failed CI/CD run", async () => {
    const { useCase, sendAgentMessage } = subject({
      quality: { status: "FAILED", qualityScore: 50, logs: "npm test failed" }
    });

    const result = await useCase.execute(user, "app-1", { autoFix: true });

    expect(sendAgentMessage.execute).toHaveBeenCalledWith(
      user,
      "app-1",
      expect.objectContaining({
        message: expect.stringContaining("CI/CD failed for snapshot v3")
      })
    );
    expect(sendAgentMessage.execute).toHaveBeenCalledWith(
      user,
      "app-1",
      expect.objectContaining({
        message: expect.stringContaining("npm test failed")
      })
    );
    expect(result.status).toBe("PASSED_AFTER_FIX");
    expect(result.autoFix.attempted).toBe(true);
  });
});
