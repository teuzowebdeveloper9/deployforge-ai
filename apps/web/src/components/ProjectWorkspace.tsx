"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentStep, API_URL, CiCdRunResponse, runCiCdPipeline, sendAgentMessage } from "@/lib/api";
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
      title: "CI/CD handoff",
      description: "Lint, typecheck, tests and build run in runner-service after a snapshot exists.",
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

function formatCiCdSummary(response: CiCdRunResponse) {
  const lines = [
    `CI/CD ${response.status}.`,
    `Initial runner build ${response.ci.build.id} finished with ${response.ci.quality.status} (${response.ci.quality.qualityScore}/100).`
  ];

  if (response.autoFix.attempted) {
    if (response.autoFix.error) {
      lines.push(`AI auto-fix was attempted but failed: ${response.autoFix.error}`);
    } else {
      const fixStatus = response.autoFix.quality?.quality.status ?? "finished";
      const fixScore = response.autoFix.quality?.quality.qualityScore ?? "n/a";
      lines.push(`AI auto-fix created ${response.autoFix.version ? `v${response.autoFix.version.versionNumber}` : "a repair version"} and its CI checks finished with ${fixStatus} (${fixScore}/100).`);
    }
  } else {
    lines.push(response.autoFix.reason ?? "AI auto-fix was not needed.");
  }

  if (response.ci.logsExcerpt) {
    lines.push("", "Runner logs excerpt:", response.ci.logsExcerpt.slice(0, 1200));
  }

  return lines.join("\n");
}

export function ProjectWorkspace({ appId }: { appId: string }) {
  const { app, refresh: refreshApp } = useApp(appId);
  const { messages, setMessages, loading: messagesLoading, refresh: refreshMessages } = useAgentMessages(appId);
  const { steps, setSteps, refresh: refreshSteps } = useAgentSteps(appId);
  const { preview, setPreview, refresh: refreshPreview } = usePreview(appId);
  const [sending, setSending] = useState(false);
  const [ciCdRunning, setCiCdRunning] = useState(false);
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
      setPreview({
        appId,
        status: "ready",
        url: response.previewUrl ? `${API_URL}${response.previewUrl}` : undefined
      });
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

  async function runCiCd() {
    setCiCdRunning(true);
    setPreview((current) => ({ ...current, appId, status: current.url ? "ready" : "loading" }));
    setMessages((current) => [
      ...current,
      {
        id: `local-cicd-start-${Date.now()}`,
        appId,
        role: "system",
        type: "status",
        content: "CI/CD run requested. The API is calling runner-service now; if the run fails, the agent will attempt one repair version.",
        createdAt: new Date().toISOString()
      }
    ]);

    try {
      const response = await runCiCdPipeline(appId, { autoFix: true });
      setMessages((current) => [
        ...current,
        {
          id: `local-cicd-result-${Date.now()}`,
          appId,
          role: "system",
          type: "report",
          content: formatCiCdSummary(response),
          createdAt: new Date().toISOString()
        }
      ]);
      await Promise.all([refreshMessages(), refreshSteps(), refreshApp(), refreshPreview()]);
      setPreview({
        appId,
        status: response.autoFix.previewUrl || response.previewUrl ? "ready" : "empty",
        url: response.autoFix.previewUrl || response.previewUrl ? `${API_URL}${response.autoFix.previewUrl ?? response.previewUrl}` : undefined
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "CI/CD run failed";
      setPreview({ appId, status: "failed", error: errorMessage });
      setMessages((current) => [
        ...current,
        {
          id: `local-cicd-error-${Date.now()}`,
          appId,
          role: "system",
          type: "status",
          content: `CI/CD request failed before completion: ${errorMessage}`,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setCiCdRunning(false);
    }
  }

  return (
    <div>
      <ProjectHeader app={app} onRunCiCd={runCiCd} ciCdRunning={ciCdRunning} />
      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)]">
        <AgentChat messages={messages} steps={steps} loading={messagesLoading} sending={sending} onSend={send} />
        <PreviewPanel preview={preview} onRefresh={refreshPreview} />
      </div>
    </div>
  );
}
