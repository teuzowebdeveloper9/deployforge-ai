"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest, DeployForgeApp, EnvVariable } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

export function AppOverviewClient({ appId }: { appId: string }) {
  const [app, setApp] = useState<DeployForgeApp | null>(null);
  const [envs, setEnvs] = useState<EnvVariable[]>([]);
  const [key, setKey] = useState("");
  const [environment, setEnvironment] = useState("development");
  const [isRequired, setIsRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [appData, envData] = await Promise.all([
      apiRequest<DeployForgeApp>(`/apps/${appId}`),
      apiRequest<EnvVariable[]>(`/apps/${appId}/envs`)
    ]);
    setApp(appData);
    setEnvs(envData);
  }, [appId]);

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function submitEnv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await apiRequest<EnvVariable>(`/apps/${appId}/envs`, {
        method: "POST",
        body: JSON.stringify({ key, environment, isRequired })
      });
      setKey("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save env metadata");
    }
  }

  if (error) return <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>;
  if (!app) return <p className="text-sm text-slate-600">Loading app...</p>;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-md border border-line bg-white p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{app.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{app.description ?? "No description"}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-medium">App ID</dt>
            <dd className="break-all text-slate-600">{app.id}</dd>
          </div>
          <div>
            <dt className="font-medium">Owner</dt>
            <dd className="text-slate-600">{app.userId}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-md border border-line bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Environment metadata</h2>
        <form onSubmit={submitEnv} className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <input
            value={key}
            onChange={(event) => setKey(event.target.value.toUpperCase())}
            className="rounded-md border border-line px-3 py-2 text-sm"
            placeholder="API_TOKEN"
            required
          />
          <select
            value={environment}
            onChange={(event) => setEnvironment(event.target.value)}
            className="rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} />
            Required
          </label>
          <button className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">Save</button>
        </form>
        <div className="overflow-hidden rounded-md border border-line">
          <div className="grid grid-cols-[1fr_1fr_1.4fr_90px] gap-2 bg-panel px-3 py-2 text-xs font-medium">
            <span>Environment</span>
            <span>Key</span>
            <span>Secret reference</span>
            <span>Required</span>
          </div>
          {envs.map((env) => (
            <div key={env.id} className="grid grid-cols-[1fr_1fr_1.4fr_90px] gap-2 border-t border-line px-3 py-2 text-xs">
              <span>{env.environment}</span>
              <span className="font-medium">{env.key}</span>
              <span className="truncate text-slate-600">{env.secretReference}</span>
              <span>{env.isRequired ? "yes" : "no"}</span>
            </div>
          ))}
          {envs.length === 0 ? <p className="px-3 py-6 text-sm text-slate-600">No env metadata yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
