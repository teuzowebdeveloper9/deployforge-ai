import Link from "next/link";
import { GitBranch, PlayCircle, Settings } from "lucide-react";
import { AppProject } from "@/lib/api";

const statusLabels: Record<AppProject["status"], string> = {
  draft: "Draft",
  planning: "Planning",
  generating: "Generating",
  quality_gate: "Running CI/CD",
  building_preview: "Building preview",
  ready: "Ready",
  failed: "Failed"
};

export function ProjectHeader({
  app,
  onRunCiCd,
  ciCdRunning
}: {
  app: AppProject | null;
  onRunCiCd?: () => void;
  ciCdRunning?: boolean;
}) {
  return (
    <header className="mb-4 rounded-[28px] border border-white/10 bg-white/[0.055] px-5 py-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
              {app ? statusLabels[app.status] : "Loading"}
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">{app?.currentVersion ?? "no version yet"}</span>
          </div>
          <h1 className="truncate text-2xl font-semibold text-white md:text-3xl">{app?.name ?? "Project workspace"}</h1>
          {app?.description ? <p className="mt-1 max-w-3xl truncate text-sm text-slate-400">{app.description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRunCiCd}
            disabled={!onRunCiCd || ciCdRunning}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-sm font-semibold text-cyan-50 hover:bg-cyan-200/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlayCircle className="h-4 w-4" />
            {ciCdRunning ? "Running CI/CD" : "Run CI/CD"}
          </button>
          <Link href={`/apps/${app?.id}/versions`} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">
            <GitBranch className="h-4 w-4" />
            New Version
          </Link>
          <Link href={`/apps/${app?.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>
    </header>
  );
}
