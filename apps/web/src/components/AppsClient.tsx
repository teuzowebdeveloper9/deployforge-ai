"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, DeployForgeApp } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

export function AppsClient() {
  const [apps, setApps] = useState<DeployForgeApp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<DeployForgeApp[]>("/apps")
      .then(setApps)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-600">Loading applications...</p>;
  if (error) return <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>;

  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      <div className="grid grid-cols-[1.4fr_1fr_120px] gap-3 border-b border-line bg-panel px-4 py-3 text-sm font-medium">
        <span>Application</span>
        <span>Updated</span>
        <span>Status</span>
      </div>
      {apps.length === 0 ? (
        <div className="px-4 py-8 text-sm text-slate-600">No applications yet.</div>
      ) : (
        apps.map((app) => (
          <Link
            key={app.id}
            href={`/apps/${app.id}`}
            className="grid grid-cols-[1.4fr_1fr_120px] gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-panel"
          >
            <span>
              <span className="block font-medium">{app.name}</span>
              <span className="block text-slate-600">{app.description ?? "No description"}</span>
            </span>
            <span className="text-slate-600">{new Date(app.updatedAt).toLocaleString()}</span>
            <span>
              <StatusBadge status={app.status} />
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
