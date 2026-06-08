"use client";

import { useCallback, useEffect, useState } from "react";
import { PlayCircle, Wand2 } from "lucide-react";
import { apiRequest, AppVersion, Build, runCiCdPipeline } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

export function BuildsClient({ appId }: { appId: string }) {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    const [versionData, buildData] = await Promise.all([
      apiRequest<AppVersion[]>(`/apps/${appId}/versions`),
      apiRequest<Build[]>(`/apps/${appId}/builds`)
    ]);
    setVersions(versionData);
    setBuilds(buildData);
    if (!selectedVersion && versionData[0]) setSelectedVersion(versionData[0].id);
  }, [appId, selectedVersion]);

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      load().catch((err: Error) => setError(err.message));
    }, 5000);
    return () => window.clearInterval(interval);
  }, [load]);

  async function runCiCd() {
    if (!selectedVersion) return;
    setRunning(true);
    setError(null);
    setNotice(null);
    try {
      const result = await runCiCdPipeline(appId, { versionId: selectedVersion, autoFix: true });
      const fix = result.autoFix.error
        ? ` AI auto-fix failed: ${result.autoFix.error}`
        : result.autoFix.attempted
          ? " AI auto-fix was triggered after the first failure."
          : "";
      setNotice(`CI/CD ${result.status}. Initial score: ${result.ci.quality.qualityScore}/100.${fix}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run CI/CD");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">CI/CD pipeline</h1>
          <p className="mt-1 text-sm text-muted">Run the selected snapshot through runner-service. Failed runs trigger one AI repair attempt.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedVersion}
            onChange={(event) => setSelectedVersion(event.target.value)}
            className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.versionNumber}
              </option>
            ))}
          </select>
          <button
            onClick={runCiCd}
            disabled={!selectedVersion || running}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentDark disabled:opacity-60"
          >
            {running ? <Wand2 className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            {running ? "Running CI/CD..." : "Run CI/CD"}
          </button>
        </div>
      </div>
      {error ? <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {notice ? <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p> : null}
      <div className="overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-[1fr_140px_140px_1.2fr] gap-3 bg-panel px-3 py-2 text-sm font-semibold text-ink">
          <span>Build</span>
          <span>Status</span>
          <span>Type</span>
          <span>Report</span>
        </div>
        {builds.map((build) => (
          <div key={build.id} className="grid grid-cols-[1fr_140px_140px_1.2fr] gap-3 border-t border-line px-3 py-3 text-sm">
            <span className="truncate">{build.id}</span>
            <span>
              <StatusBadge status={build.status} />
            </span>
            <span>{build.type}</span>
            <span className="truncate text-muted">{build.reportPath ?? "-"}</span>
          </div>
        ))}
        {builds.length === 0 ? (
          <div className="bg-panel px-4 py-8 text-sm text-muted">
            No pipeline runs have executed yet. Create a snapshot, then run CI/CD.
          </div>
        ) : null}
      </div>
    </section>
  );
}
