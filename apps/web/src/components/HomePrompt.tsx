"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProjectDraft } from "@/lib/api";
import { CommandInput } from "./CommandInput";

const suggestions = [
  "Create a SaaS dashboard for clinic scheduling",
  "Build a landing page with auth and admin panel",
  "Create a microservices architecture for an AI support platform",
  "Generate a Next.js + NestJS app with PostgreSQL"
];

export function HomePrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(value: string) {
    setLoading(true);
    setError(null);
    try {
      const app = await createProjectDraft(value);
      sessionStorage.setItem(`deployforge-initial-prompt:${app.id}`, value);
      router.push(`/apps/${app.id}/agent?start=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative grid min-h-[calc(100vh-32px)] place-items-center overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.035] px-5 py-16 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
      <div className="absolute right-10 top-12 hidden rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-100 md:block">
        local-first · agent-ready · versioned
      </div>

      <div className="w-full max-w-4xl">
        <div className="mb-8 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-cyan-100">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.85)]" />
            AI DevOps workspace
          </div>
          <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-normal text-white md:text-7xl">
            Build, evolve and ship apps with an AI DevOps agent.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Describe your product idea. DeployForge will plan, version, validate and prepare a preview of your application.
          </p>
        </div>

        <CommandInput
          key={prompt}
          initialValue={prompt}
          placeholder="Paste a product idea, backlog, architecture notes, or a full app prompt..."
          cta="Generate app"
          loading={loading}
          onSubmit={generate}
        />

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setPrompt(suggestion)}
              className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left text-sm text-slate-300 hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/[0.075] hover:text-white"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.07] p-4 text-sm text-cyan-50">
            Creating project context. The live agent work will continue in the project workspace.
          </div>
        ) : null}
        {error ? <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
      </div>
    </section>
  );
}
