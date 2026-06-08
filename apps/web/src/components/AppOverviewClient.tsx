"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PlayCircle } from "lucide-react";
import { apiRequest, AppVersion, Build, DeployForgeApp, EnvVariable, runCiCdPipeline } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

export function AppOverviewClient({ appId }: { appId: string }) {
  const [app, setApp] = useState<DeployForgeApp | null>(null);
  const [envs, setEnvs] = useState<EnvVariable[]>([]);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [key, setKey] = useState("");
  const [environment, setEnvironment] = useState("development");
  const [isRequired, setIsRequired] = useState(false);
  const [showEnvForm, setShowEnvForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [runningCiCd, setRunningCiCd] = useState(false);

  const load = useCallback(async () => {
    const [appData, envData, versionData, buildData] = await Promise.all([
      apiRequest<DeployForgeApp>(`/apps/${appId}`),
      apiRequest<EnvVariable[]>(`/apps/${appId}/envs`),
      apiRequest<AppVersion[]>(`/apps/${appId}/versions`),
      apiRequest<Build[]>(`/apps/${appId}/builds`)
    ]);
    setApp(appData);
    setEnvs(envData);
    setVersions(versionData);
    setBuilds(buildData);
  }, [appId]);

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [load]);

  const latestVersion = useMemo(() => {
    return [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0] ?? null;
  }, [versions]);

  const latestBuild = useMemo(() => {
    return [...builds].sort((a, b) => {
      const left = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const right = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return right - left;
    })[0] ?? null;
  }, [builds]);

  async function createSnapshot() {
    setCreatingSnapshot(true);
    setError(null);
    setNotice(null);
    try {
      const version = await apiRequest<AppVersion>(`/apps/${appId}/versions`, {
        method: "POST",
        body: JSON.stringify({ createdBy: "dev-user" })
      });
      setNotice(`Snapshot v${version.versionNumber} created.`);
      await load();
      return version;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create snapshot");
      return null;
    } finally {
      setCreatingSnapshot(false);
    }
  }

  async function runCiCd() {
    setRunningCiCd(true);
    setError(null);
    setNotice(null);
    try {
      let version: AppVersion | null = latestVersion;
      if (!version) {
        version = await createSnapshot();
      }
      if (!version) return;

      const result = await runCiCdPipeline(appId, { versionId: version.id, autoFix: true });
      const fix = result.autoFix.error
        ? ` AI auto-fix failed: ${result.autoFix.error}`
        : result.autoFix.attempted
          ? " AI created a repair version after the first failure."
          : "";
      setNotice(`CI/CD ${result.status}. Initial score: ${result.ci.quality.qualityScore}/100.${fix}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run CI/CD");
    } finally {
      setRunningCiCd(false);
    }
  }

  async function submitEnv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const normalizedKey = key.trim().toUpperCase();
    if (!normalizedKey) return;

    try {
      await apiRequest<EnvVariable>(`/apps/${appId}/envs`, {
        method: "POST",
        body: JSON.stringify({ key: normalizedKey, environment, isRequired })
      });
      setKey("");
      setIsRequired(false);
      setNotice(`${normalizedKey} metadata added. Secret values stay outside DeployForge.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save env metadata");
    }
  }

  if (error && !app) return <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>;
  if (!app) return <p className="text-sm text-muted">Loading workspace...</p>;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={app.status} />
              <span className="rounded-full bg-panel px-2.5 py-1 text-xs font-medium text-muted">dev workspace</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-ink">{app.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {app.description ?? "No description yet. You can still create snapshots, run CI/CD and ask the agent."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={createSnapshot}
              disabled={creatingSnapshot || runningCiCd}
              className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-panel disabled:opacity-60"
            >
              {creatingSnapshot ? "Creating..." : "Create snapshot"}
            </button>
            <button
              type="button"
              onClick={runCiCd}
              disabled={creatingSnapshot || runningCiCd}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentDark disabled:opacity-60"
            >
              <PlayCircle className="h-4 w-4" />
              {runningCiCd ? "Running CI/CD..." : "Run CI/CD"}
            </button>
            <Link
              href={`/apps/${appId}/agent`}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
            >
              Ask AI
            </Link>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        {notice ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p> : null}

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="Versions" value={String(versions.length)} detail={latestVersion ? `latest v${latestVersion.versionNumber}` : "none yet"} />
          <Metric label="CI/CD" value={latestBuild?.status ?? "Not run"} detail={latestBuild?.finishedAt ? new Date(latestBuild.finishedAt).toLocaleString() : "runner ready"} />
          <Metric label="Env metadata" value={String(envs.length)} detail={envs.length ? "configured references" : "optional"} />
          <Metric label="Storage" value="Local" detail="snapshot archive path" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Next actions</h2>
              <p className="mt-1 text-sm text-muted">Start from the app workspace instead of wiring config first.</p>
            </div>
          </div>

          <div className="grid gap-2">
            <ActionRow
              title="Create a source snapshot"
              description="Stores a local archive, manifest and checksum for this app."
              action="Create"
              onClick={createSnapshot}
              disabled={creatingSnapshot || runningCiCd}
            />
            <ActionRow
              title="Run CI/CD with AI repair"
              description="Uses the latest snapshot, runs runner-service, then asks the agent to repair failed checks."
              action="Run"
              onClick={runCiCd}
              disabled={creatingSnapshot || runningCiCd}
            />
            <Link
              href={`/apps/${appId}/agent`}
              className="flex items-center justify-between rounded-md border border-line px-4 py-3 text-sm hover:bg-panel"
            >
              <span>
                <span className="block font-semibold text-ink">Ask the architecture agent</span>
                <span className="mt-1 block text-muted">Send a prompt to Mistral through the agent-service.</span>
              </span>
              <span className="font-semibold text-accent">Open</span>
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Runtime variables</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Optional metadata only. Do not put real secret values here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEnvForm((value) => !value)}
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-panel"
            >
              {showEnvForm ? "Close" : "Add optional env"}
            </button>
          </div>

          {showEnvForm ? (
            <form onSubmit={submitEnv} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                <label className="grid gap-1 text-sm font-medium text-ink">
                  Key
                  <input
                    value={key}
                    onChange={(event) => setKey(event.target.value.toUpperCase())}
                    className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-accent"
                    placeholder="DATABASE_URL"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-ink">
                  Environment
                  <select
                    value={environment}
                    onChange={(event) => setEnvironment(event.target.value)}
                    className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-accent"
                  >
                    <option value="development">development</option>
                    <option value="staging">staging</option>
                    <option value="production">production</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={isRequired} onChange={(event) => setIsRequired(event.target.checked)} />
                Mark as required for generated apps
              </label>
              <button className="w-fit rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentDark">
                Save metadata
              </button>
            </form>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-md border border-line">
            {envs.length === 0 ? (
              <div className="bg-panel px-4 py-7 text-sm text-muted">
                No runtime variables configured. This app can still be versioned, checked and discussed with the agent.
              </div>
            ) : (
              <div className="divide-y divide-line">
                {envs.map((env) => (
                  <div key={env.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[120px_1fr_80px]">
                    <span className="text-muted">{env.environment}</span>
                    <span>
                      <span className="block font-semibold text-ink">{env.key}</span>
                      <span className="block truncate text-xs text-muted">{env.secretReference}</span>
                    </span>
                    <span className="text-muted">{env.isRequired ? "required" : "optional"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-line bg-panel px-4 py-3">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
      <p className="mt-1 truncate text-xs text-muted">{detail}</p>
    </div>
  );
}

function ActionRow({
  title,
  description,
  action,
  onClick,
  disabled
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between rounded-md border border-line px-4 py-3 text-left text-sm hover:bg-panel disabled:opacity-60"
    >
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-muted">{description}</span>
      </span>
      <span className="font-semibold text-accent">{action}</span>
    </button>
  );
}
