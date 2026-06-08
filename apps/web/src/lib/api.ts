import { clearAuthSession, ensureAuthSession } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface DeployForgeApp {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = "draft" | "planning" | "generating" | "quality_gate" | "building_preview" | "ready" | "failed";

export interface AppProject {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  currentVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppVersion {
  id: string;
  appId: string;
  versionNumber: number;
  storagePath: string;
  checksum: string;
  status: string;
  qualityScore: number | null;
  createdAt: string;
  createdBy: string;
}

export interface Build {
  id: string;
  appId: string;
  versionId: string | null;
  status: string;
  type: string;
  logsPath: string | null;
  reportPath: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface EnvVariable {
  id: string;
  appId: string;
  environment: string;
  key: string;
  secretReference: string;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFileSummary {
  path: string;
  language: string;
  preview: string;
}

export interface GenerationTimelineItem {
  label: string;
  status: string;
  provider?: string;
  count?: number;
  score?: number;
}

export interface AgentMessage {
  id: string;
  appId: string;
  role: "user" | "agent" | "system";
  type: "message" | "status" | "report" | "step";
  content: string;
  createdAt: string;
}

export interface AgentStep {
  id: string;
  appId: string;
  title: string;
  description?: string;
  status: "pending" | "running" | "done" | "failed";
  order: number;
}

export interface PreviewState {
  appId: string;
  status: "empty" | "loading" | "ready" | "failed";
  url?: string;
  error?: string;
}

export interface GenerateAppResponse {
  app: DeployForgeApp;
  version: AppVersion;
  quality: {
    build: Build;
    quality: {
      status: string;
      qualityScore: number;
    };
  };
  agent: {
    mode: string;
    response: string;
    provider: string;
    model: string;
  };
  files: GeneratedFileSummary[];
  previewHtml: string;
  previewUrl: string;
  timeline: GenerationTimelineItem[];
}

export interface AgentMessageResponse {
  runId: string;
  message: {
    mode: string;
    response: string;
    provider: string;
    model: string;
  };
  version?: AppVersion;
  quality?: {
    build: Build;
    quality: {
      status: string;
      qualityScore: number;
    };
  };
  files?: GeneratedFileSummary[];
  previewUrl?: string;
}

export interface CiCdStage {
  id: string;
  label: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  detail?: string;
}

export interface CiCdRunResponse {
  status: "PASSED" | "FAILED" | "PASSED_AFTER_FIX" | "FAILED_AFTER_FIX";
  version: AppVersion;
  ci: {
    build: Build;
    quality: {
      status: string;
      qualityScore: number;
    };
    logsExcerpt: string;
  };
  previewUrl?: string;
  autoFix: {
    attempted: boolean;
    reason?: string;
    error?: string;
    runId?: string;
    version?: AppVersion;
    quality?: {
      build: Build;
      quality: {
        status: string;
        qualityScore: number;
      };
    };
    files?: GeneratedFileSummary[];
    previewUrl?: string;
    message?: {
      mode: string;
      response: string;
      provider: string;
      model: string;
    };
  };
  stages: CiCdStage[];
}

export async function authHeaders(): Promise<Record<string, string>> {
  const session = await ensureAuthSession();
  return session ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const session = await ensureAuthSession();
  if (session) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      clearAuthSession();
      if (typeof window !== "undefined") {
        const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
        window.location.assign(`/login?next=${next}`);
      }
    }
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export function toProject(app: DeployForgeApp, versions?: AppVersion[], builds?: Build[]): AppProject {
  const latestVersion = versions?.[0];
  const latestBuild = builds?.[0];
  const status: ProjectStatus =
    latestBuild?.status === "RUNNING"
      ? "quality_gate"
      : latestBuild?.status === "FAILED"
        ? "failed"
        : latestBuild?.status === "PASSED"
          ? "ready"
          : latestVersion
            ? "building_preview"
            : app.status?.toLowerCase() === "active"
              ? "draft"
              : "draft";

  return {
    id: app.id,
    name: app.name,
    description: app.description ?? undefined,
    status,
    currentVersion: latestVersion ? `v${latestVersion.versionNumber}` : undefined,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt
  };
}

export async function createAppFromPrompt(prompt: string) {
  return apiRequest<GenerateAppResponse>("/apps/generate", {
    method: "POST",
    body: JSON.stringify({ prompt })
  });
}

export async function createProjectDraft(prompt: string) {
  const name = prompt
    .replace(/^(create|build|generate|crie|criar|gere|gera)\s+(an?|um|uma)?\s*/i, "")
    .split(/\s+/)
    .slice(0, 5)
    .join(" ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .slice(0, 72) || "Generated App";

  return apiRequest<DeployForgeApp>("/apps", {
    method: "POST",
    body: JSON.stringify({ name, description: prompt.slice(0, 500) })
  });
}

export async function sendAgentMessage(appId: string, content: string) {
  return apiRequest<AgentMessageResponse>(`/apps/${appId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message: content })
  });
}

export async function runCiCdPipeline(appId: string, input?: { versionId?: string; autoFix?: boolean }) {
  return apiRequest<CiCdRunResponse>(`/apps/${appId}/ci-cd`, {
    method: "POST",
    body: JSON.stringify({
      versionId: input?.versionId,
      autoFix: input?.autoFix ?? true
    })
  });
}
