"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AgentMessage,
  AgentStep,
  apiRequest,
  AppProject,
  AppVersion,
  authHeaders,
  Build,
  DeployForgeApp,
  PreviewState,
  toProject,
  API_URL
} from "./api";

export function useApps() {
  const [apps, setApps] = useState<AppProject[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiRequest<DeployForgeApp[]>("/apps");
      setApps(list.map((app) => toProject(app)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  return { apps, loading, refresh };
}

export function useApp(appId: string) {
  const [app, setApp] = useState<AppProject | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [project, versions, builds] = await Promise.all([
        apiRequest<DeployForgeApp>(`/apps/${appId}`),
        apiRequest<AppVersion[]>(`/apps/${appId}/versions`),
        apiRequest<Build[]>(`/apps/${appId}/builds`)
      ]);
      setApp(toProject(project, versions, builds));
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  return { app, loading, refresh };
}

export function useAgentMessages(appId: string) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setMessages(await apiRequest<AgentMessage[]>(`/apps/${appId}/messages`));
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  return { messages, setMessages, loading, refresh };
}

export function useAgentSteps(appId: string) {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await apiRequest<AgentStep[]>(`/apps/${appId}/steps`);
      setSteps(next.sort((a, b) => a.order - b.order));
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  return { steps, setSteps, loading, refresh };
}

export function usePreview(appId: string) {
  const [preview, setPreview] = useState<PreviewState>({ appId, status: "empty" });

  const refresh = useCallback(async () => {
    setPreview((current) => ({ ...current, status: current.status === "ready" ? "ready" : "loading" }));
    try {
      const response = await fetch(`${API_URL}/apps/${appId}/preview`, {
        method: "GET",
        headers: await authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) {
        setPreview({ appId, status: "empty" });
        return;
      }
      setPreview({ appId, status: "ready", url: `${API_URL}/apps/${appId}/preview` });
    } catch (err) {
      setPreview({ appId, status: "failed", error: err instanceof Error ? err.message : "Preview unavailable" });
    }
  }, [appId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { preview, setPreview, refresh };
}
