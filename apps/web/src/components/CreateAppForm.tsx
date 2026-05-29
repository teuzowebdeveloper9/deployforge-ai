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
    <form onSubmit={submit} className="max-w-xl rounded-md border border-line bg-white p-5">
      <label className="mb-2 block text-sm font-medium" htmlFor="name">
        Name
      </label>
      <input
        id="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="mb-4 w-full rounded-md border border-line px-3 py-2"
        required
        minLength={2}
      />
      <label className="mb-2 block text-sm font-medium" htmlFor="description">
        Description
      </label>
      <textarea
        id="description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="mb-4 min-h-28 w-full rounded-md border border-line px-3 py-2"
      />
      {error ? <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      <button disabled={saving} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
        {saving ? "Creating..." : "Create application"}
      </button>
    </form>
  );
}
