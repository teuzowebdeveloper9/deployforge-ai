"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentStep, apiRequest, AppVersion, Build, sendAgentMessage } from "@/lib/api";
import { useAgentMessages, useAgentSteps, useApp, usePreview } from "@/lib/hooks";
import { AgentChat } from "./AgentChat";
import { PreviewPanel } from "./PreviewPanel";
import { ProjectHeader } from "./ProjectHeader";

function buildLiveSteps(appId: string, phase: "thinking" | "working" | "done" | "failed"): AgentStep[] {
  const statusFor = (order: number): AgentStep["status"] => {
    if (phase === "failed") return order <= 2 ? "done" : "failed";
    if (phase === "done") return "done";
    if (phase === "thinking") return order === 1 ? "running" : "pending";
    return order <= 2 ? "done" : order === 3 ? "running" : "pending";
  };

  return [
    {
      id: "understanding",
      appId,
      title: "Understanding prompt",
      description: "Reading the request and attaching it to this project context.",
      status: statusFor(1),
      order: 1
    },
    {
      id: "planning",
      appId,
      title: "Planning implementation",
      description: "Choosing the smallest safe implementation path before touching generated files.",
      status: statusFor(2),
      order: 2
    },
    {
      id: "coding",
      appId,
      title: "Preparing code changes",
      description: "Structuring the work as a versioned app update instead of a one-off chat answer.",
      status: statusFor(3),
      order: 3
    },
    {
      id: "quality",
      appId,
      title: "Quality gate handoff",
      description: "Lint, typecheck, tests and build are queued for the runner when a snapshot exists.",
      status: statusFor(4),
      order: 4
    },
    {
      id: "preview",
      appId,
      title: "Preview handoff",
      description: "The preview panel stays available while the build artifact is prepared.",
      status: statusFor(5),
      order: 5
    }
  ];
}

export function ProjectWorkspace({ appId }: { appId: string }) {
  const { app, refresh: refreshApp } = useApp(appId);
  const { messages, setMessages, loading: messagesLoading, refresh: refreshMessages } = useAgentMessages(appId);
  const { steps, setSteps, refresh: refreshSteps } = useAgentSteps(appId);
  const { preview, setPreview, refresh: refreshPreview } = usePreview(appId);
  const [sending, setSending] = useState(false);
  const initialPromptSent = useRef(false);

  const send = useCallback(async (content: string) => {
    setSending(true);
    setPreview((current) => ({ ...current, appId, status: current.status === "ready" && current.url ? "ready" : "loading" }));
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        appId,
        role: "user",
        type: "message",
        content,
        createdAt: new Date().toISOString()
      },
      {
        id: `local-system-${Date.now()}`,
        appId,
        role: "system",
        type: "status",
        content: "Live agent run started in this project. Future prompts here continue this app context.",
        createdAt: new Date().toISOString()
      }
    ]);
    setSteps(buildLiveSteps(appId, "working"));

    try {
      const response = await sendAgentMessage(appId, content);
      setMessages((current) => [
        ...current,
        {
          id: `agent-${response.runId}`,
          appId,
          role: "agent",
          type: "report",
          content: response.message.response,
          createdAt: new Date().toISOString()
        }
      ]);
      await Promise.all([refreshMessages(), refreshSteps(), refreshApp(), refreshPreview()]);
      setSteps(buildLiveSteps(appId, "done"));
      setPreview((current) => (current.status === "ready" && current.url ? current : { appId, status: "ready" }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Agent run failed";
      setSteps(buildLiveSteps(appId, "failed"));
      setPreview({ appId, status: "failed", error: errorMessage });
      setMessages((current) => [
        ...current,
        {
          id: `local-error-${Date.now()}`,
          appId,
          role: "system",
          type: "status",
          content: `Agent run failed: ${errorMessage}`,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setSending(false);
    }
  }, [appId, refreshApp, refreshMessages, refreshPreview, refreshSteps, setMessages, setPreview, setSteps]);

  useEffect(() => {
    if (initialPromptSent.current || messagesLoading) return;
    const storageKey = `deployforge-initial-prompt:${appId}`;
    const initialPrompt = sessionStorage.getItem(storageKey);
    if (!initialPrompt) return;

    initialPromptSent.current = true;
    sessionStorage.removeItem(storageKey);
    setSteps(buildLiveSteps(appId, "thinking"));
    void send(initialPrompt).catch(() => undefined);
  }, [appId, messagesLoading, send, setSteps]);

  async function runQualityGate() {
    const versions = await apiRequest<AppVersion[]>(`/apps/${appId}/versions`);
    const latest = versions[0];
    if (!latest) return;
    setPreview({ appId, status: "loading" });
    await apiRequest<{ build?: Build; quality?: { status: string; qualityScore: number } }>(`/apps/${appId}/versions/${latest.id}/quality-gate`, {
      method: "POST"
    });
    await Promise.all([refreshSteps(), refreshApp(), refreshPreview()]);
  }

  return (
    <div>
      <ProjectHeader app={app} onRunQuality={runQualityGate} />
      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)]">
        <AgentChat messages={messages} steps={steps} loading={messagesLoading} sending={sending} onSend={send} />
        <PreviewPanel preview={preview} onRefresh={refreshPreview} />
      </div>
    </div>
  );
}
