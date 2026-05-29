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

export function AgentClient({ appId }: { appId: string }) {
  const [message, setMessage] = useState("Planeje uma API NestJS com quality gate e storage seguro.");
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
    <section className="rounded-md border border-line bg-white p-5">
      <h1 className="text-xl font-semibold">Agent messages</h1>
      <p className="mt-1 text-sm text-slate-600">The agent plans and analyzes. It does not edit files directly.</p>
      <form onSubmit={submit} className="mt-4">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-36 w-full rounded-md border border-line px-3 py-2 text-sm"
          required
          minLength={2}
        />
        <button
          disabled={loading}
          className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send prompt"}
        </button>
      </form>
      {error ? <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {response ? (
        <div className="mt-5 rounded-md border border-line bg-panel p-4">
          <div className="mb-3 text-xs text-slate-600">
            Run {response.runId} · {response.message.provider} · {response.message.model}
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-6">{response.message.response}</pre>
        </div>
      ) : null}
    </section>
  );
}
