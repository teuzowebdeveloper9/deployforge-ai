"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

  const latestApp = useMemo(() => {
    return [...apps].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;
  }, [apps]);

  if (loading) return <p className="text-sm text-muted">Loading applications...</p>;
  if (error) return <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">{apps.length} active workspace{apps.length === 1 ? "" : "s"}</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Build, version and inspect apps</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Start with an application, then create snapshots, run CI/CD and ask the architecture agent.
            </p>
          </div>
          <Link href="/apps/new" className="w-fit rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentDark">
            Create app
          </Link>
        </div>
      </section>

      {apps.length === 0 ? (
        <section className="rounded-lg border border-dashed border-line bg-surface px-5 py-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-ink">No apps yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Create the first app workspace. Env metadata is optional and can be added later.
          </p>
          <Link
            href="/apps/new"
            className="mt-5 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accentDark"
          >
            Create app
          </Link>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Application workspaces</h2>
              {latestApp ? <p className="mt-1 text-xs text-muted">Latest update: {latestApp.name}</p> : null}
            </div>
          </div>
          <div className="divide-y divide-line">
            {apps.map((app) => (
              <Link key={app.id} href={`/apps/${app.id}`} className="block px-4 py-4 hover:bg-panel">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-ink">{app.name}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">{app.description ?? "No description yet"}</p>
                  </div>
                  <div className="text-sm text-muted">{new Date(app.updatedAt).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
