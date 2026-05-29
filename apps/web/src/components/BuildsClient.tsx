"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, AppVersion, Build } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

export function BuildsClient({ appId }: { appId: string }) {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [error, setError] = useState<string | null>(null);
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

  async function runQualityGate() {
    if (!selectedVersion) return;
    setRunning(true);
    setError(null);
    try {
      await apiRequest(`/apps/${appId}/versions/${selectedVersion}/quality-gate`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run quality gate");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="rounded-md border border-line bg-white p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Builds and quality gates</h1>
          <p className="mt-1 text-sm text-slate-600">Quality gates are executed by runner-service, not by the API.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedVersion}
            onChange={(event) => setSelectedVersion(event.target.value)}
            className="rounded-md border border-line px-3 py-2 text-sm"
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.versionNumber}
              </option>
            ))}
          </select>
          <button
            onClick={runQualityGate}
            disabled={!selectedVersion || running}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {running ? "Running..." : "Run quality gate"}
          </button>
        </div>
      </div>
      {error ? <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      <div className="overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-[1fr_140px_140px_1.2fr] gap-3 bg-panel px-3 py-2 text-sm font-medium">
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
            <span className="truncate text-slate-600">{build.reportPath ?? "-"}</span>
          </div>
        ))}
        {builds.length === 0 ? <p className="px-3 py-6 text-sm text-slate-600">No builds yet.</p> : null}
      </div>
    </section>
  );
}
