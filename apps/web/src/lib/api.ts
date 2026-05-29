const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface DeployForgeApp {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: string;
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

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}
