"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiRequest, DeployForgeApp } from "@/lib/api";

export function CreateAppForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const app = await apiRequest<DeployForgeApp>("/apps", {
        method: "POST",
        body: JSON.stringify({ name, description })
      });
      router.push(`/apps/${app.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl rounded-lg border border-line bg-surface p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-ink">Create an app workspace</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Start with the product name. Snapshots, gates, agent prompts and runtime variables come after this step.
        </p>
      </div>

      <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="name">
        App name
      </label>
      <input
        id="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="mb-4 h-11 w-full rounded-md border border-line px-3 text-sm outline-none focus:border-accent"
        required
        minLength={2}
        placeholder="Billing Platform"
      />

      <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="description">
        Description
      </label>
      <textarea
        id="description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="mb-4 min-h-28 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        placeholder="What this app should do, who uses it and what stack it may need."
      />

      {error ? <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentDark disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create workspace"}
        </button>
        <span className="text-sm text-muted">No API token or env metadata needed here.</span>
      </div>
    </form>
  );
}
