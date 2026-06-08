"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";

interface AgentMessageResponse {
  runId: string;
  message: {
    mode: string;
    response: string;
    provider: string;
    model: string;
  };
}

const promptExamples = [
  "Plan a NestJS billing API with versioned CI/CD checks.",
  "Review this microservice boundary and point out risks.",
  "Suggest a local-first deployment plan with MinIO and Redis."
];

export function AgentClient({ appId }: { appId: string }) {
  const [message, setMessage] = useState("Plan a pragmatic MVP architecture for this application.");
  const [response, setResponse] = useState<AgentMessageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<AgentMessageResponse>(`/apps/${appId}/agent/messages`, {
        method: "POST",
        body: JSON.stringify({ message })
      });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-accent">Mistral agent</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Ask for a technical plan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          The agent explains architecture, risk and next steps. File changes still go through controlled services.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-md border border-line bg-panel p-3">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-40 w-full resize-y rounded-md border border-line bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-accent"
          required
          minLength={2}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {promptExamples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setMessage(example)}
                className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
              >
                {example}
              </button>
            ))}
          </div>
          <button
            disabled={loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentDark disabled:opacity-60"
          >
            {loading ? "Thinking..." : "Send prompt"}
          </button>
        </div>
      </form>

      {error ? <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {response ? (
        <div className="mt-5 rounded-md border border-line bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted">
            <span>Run {response.runId}</span>
            <span>{response.message.provider}</span>
            <span>{response.message.model}</span>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-ink">{response.message.response}</pre>
        </div>
      ) : null}
    </section>
  );
}
