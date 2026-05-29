"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { apiRequest, API_URL, GenerateAppResponse } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

const examples = [
  "Create a CRM with customers, pipeline dashboard and notes.",
  "Build a SaaS billing dashboard with plans, invoices and payment status.",
  "Create an internal support tool with tickets, priority queues and analytics."
];

export function BuilderClient() {
  const [prompt, setPrompt] = useState(examples[0]);
  const [result, setResult] = useState<GenerateAppResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isFallbackAgent = result ? result.agent.provider !== "mistral" : false;

  const previewUrl = useMemo(() => {
    if (!result?.previewUrl) return "";
    return `${API_URL}${result.previewUrl}`;
  }, [result]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const generated = await apiRequest<GenerateAppResponse>("/apps/generate", {
        method: "POST",
        body: JSON.stringify({ prompt })
      });
      setResult(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-112px)] gap-5 xl:grid-cols-[440px_1fr]">
      <section className="flex flex-col rounded-lg border border-line bg-surface shadow-sm">
        <div className="border-b border-line p-5">
          <p className="text-sm font-semibold text-accent">AI app builder</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">What do you want to build?</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Prompt in. DeployForge creates an app workspace, generates files, snapshots the source, runs the gate and opens a preview.
          </p>
        </div>

        <form onSubmit={submit} className="border-b border-line p-4">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-44 w-full resize-y rounded-md border border-line bg-panel px-3 py-3 text-sm leading-6 outline-none focus:border-accent"
            required
            minLength={4}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="rounded-md border border-line px-3 py-1.5 text-left text-xs font-medium text-muted hover:bg-panel hover:text-ink"
              >
                {example}
              </button>
            ))}
          </div>
          <button
            disabled={loading}
            className="mt-4 w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accentDark disabled:opacity-60"
          >
            {loading ? "Generating app..." : "Generate app"}
          </button>
        </form>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {error ? <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

          {loading ? (
            <div className="space-y-3">
              {["Planning with agent-service", "Generating files", "Creating snapshot", "Running quality gate", "Preparing preview"].map(
                (item) => (
                  <div key={item} className="rounded-md border border-line bg-panel px-3 py-3 text-sm text-muted">
                    {item}...
                  </div>
                )
              )}
            </div>
          ) : null}

          {result ? (
            <div className="space-y-4">
              {isFallbackAgent ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <div className="font-semibold">Mistral is not connected in this container.</div>
                  <p className="mt-1 leading-5">
                    The app was generated with the local fallback. Set `MISTRAL_API_KEY` in the shell that starts Docker Compose and recreate `agent-service`.
                  </p>
                </div>
              ) : null}

              <div className="rounded-md border border-line bg-panel p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-ink">{result.app.name}</h2>
                    <p className="mt-1 text-xs text-muted">
                      v{result.version.versionNumber} generated and checked · agent: {result.agent.provider}
                    </p>
                  </div>
                  <StatusBadge status={result.quality.quality.status} />
                </div>
                <Link
                  href={`/apps/${result.app.id}`}
                  className="mt-3 inline-flex rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-panel"
                >
                  Open workspace
                </Link>
              </div>

              <div className="space-y-2">
                {result.timeline.map((item) => (
                  <div key={item.label} className="rounded-md border border-line px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-ink">{item.label}</span>
                      <span className="text-xs text-muted">{item.score ? `${item.score}/100` : item.provider ?? item.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <details className="rounded-md border border-line bg-white p-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink">Generated files</summary>
                <div className="mt-3 divide-y divide-line">
                  {result.files.map((file) => (
                    <div key={file.path} className="py-2 text-sm">
                      <div className="font-semibold text-ink">{file.path}</div>
                      <div className="text-xs text-muted">{file.language} · {file.preview}</div>
                    </div>
                  ))}
                </div>
              </details>

              <details className="rounded-md border border-line bg-white p-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink">Agent plan</summary>
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-panel p-3 text-xs leading-5 text-muted">
                  {result.agent.response}
                </pre>
              </details>
            </div>
          ) : null}
        </div>
      </section>

      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Live preview</p>
            <p className="text-xs text-muted">{previewUrl || "Generate an app to start the preview."}</p>
          </div>
          {previewUrl ? (
            <a href={previewUrl} target="_blank" rel="noreferrer" className="rounded-md border border-line px-3 py-2 text-xs font-semibold hover:bg-panel">
              Open
            </a>
          ) : null}
        </div>

        <div className="grid flex-1 place-items-center bg-panel p-4">
          {result ? (
            <iframe title="Generated app preview" srcDoc={result.previewHtml} className="h-full min-h-[560px] w-full rounded-md border border-line bg-white" />
          ) : (
            <div className="max-w-md text-center">
              <p className="text-lg font-semibold text-ink">No preview yet</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                The generated app will render here after the snapshot and quality gate finish.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
