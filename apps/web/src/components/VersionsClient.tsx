"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, AppVersion } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

export function VersionsClient({ appId }: { appId: string }) {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setVersions(await apiRequest<AppVersion[]>(`/apps/${appId}/versions`));
  }, [appId]);

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function createVersion() {
    setSaving(true);
    setError(null);
    try {
      await apiRequest<AppVersion>(`/apps/${appId}/versions`, {
        method: "POST",
        body: JSON.stringify({ createdBy: "dev-user" })
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create version");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Snapshots</h1>
          <p className="mt-1 text-sm text-muted">Create a version before running gates or rollback workflows.</p>
        </div>
        <button
          onClick={createVersion}
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentDark disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create snapshot"}
        </button>
      </div>
      {error ? <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      <div className="overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-[90px_120px_100px_1fr] gap-3 bg-panel px-3 py-2 text-sm font-semibold text-ink">
          <span>Version</span>
          <span>Status</span>
          <span>Score</span>
          <span>Checksum</span>
        </div>
        {versions.map((version) => (
          <div key={version.id} className="grid grid-cols-[90px_120px_100px_1fr] gap-3 border-t border-line px-3 py-3 text-sm">
            <span>v{version.versionNumber}</span>
            <span>
              <StatusBadge status={version.status} />
            </span>
            <span>{version.qualityScore ?? "-"}</span>
            <span className="truncate text-muted">{version.checksum}</span>
          </div>
        ))}
        {versions.length === 0 ? (
          <div className="bg-panel px-4 py-8 text-sm text-muted">
            No snapshots yet. Click create snapshot to start the version history.
          </div>
        ) : null}
      </div>
    </section>
  );
}
