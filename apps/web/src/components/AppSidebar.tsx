"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppProject } from "@/lib/api";
import { logout } from "@/lib/auth";
import { useApps } from "@/lib/hooks";

const navItems = [
  { href: "/apps", label: "Apps", icon: "⌘" },
  { href: "/apps", label: "History", icon: "◷" },
  { href: "/apps/new", label: "Settings", icon: "⚙" }
];

const statusTone: Record<AppProject["status"], string> = {
  draft: "bg-slate-400",
  planning: "bg-blue-400",
  generating: "bg-cyan-300",
  quality_gate: "bg-amber-300",
  building_preview: "bg-violet-300",
  ready: "bg-emerald-300",
  failed: "bg-rose-400"
};

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { apps, loading } = useApps();

  async function signOut() {
    await logout();
    onClose();
    router.replace("/login");
  }

  return (
    <aside
      aria-hidden={!open}
      className={`fixed inset-y-3 left-3 z-50 flex w-[min(342px,calc(100vw-24px))] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#070915]/88 px-3 py-4 shadow-2xl shadow-black/50 backdrop-blur-2xl transition duration-300 ease-out ${
        open ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0"
      }`}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/55 to-transparent" />
      <div className="mb-4 flex items-center gap-2">
        <Link href="/" onClick={onClose} className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-3 hover:bg-white/[0.075]">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-400 text-sm font-black text-[#06111f] shadow-lg shadow-cyan-500/20">
            DF
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">DeployForge AI</span>
            <span className="block truncate text-xs text-slate-400">AI DevOps agent</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] text-lg text-slate-300 transition hover:rotate-90 hover:bg-white/[0.075] hover:text-white"
          aria-label="Close sidebar"
        >
          x
        </button>
      </div>

      <Link
        href="/"
        onClick={onClose}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_34px_rgba(56,189,248,0.18)] hover:-translate-y-0.5 hover:bg-cyan-50"
      >
        <span>✦</span>
        New App
      </Link>

      <nav className="mt-5 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
              pathname === item.href ? "bg-white/[0.09] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-xs">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex items-center justify-between px-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <span>Projects</span>
        <span>{loading ? "..." : apps.length}</span>
      </div>

      <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-auto pr-1">
        {apps.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs leading-5 text-slate-500">
            No project yet. Start with a prompt.
          </div>
        ) : null}
        {apps.map((app) => {
          const active = pathname?.includes(app.id);
          return (
            <Link
              key={app.id}
              href={`/apps/${app.id}/agent`}
              onClick={onClose}
              className={`block rounded-2xl border px-3 py-3 ${
                active
                  ? "border-cyan-300/30 bg-cyan-300/[0.08] text-white shadow-[0_0_28px_rgba(34,211,238,0.08)]"
                  : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.045]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusTone[app.status]}`} />
                <span className="min-w-0 truncate text-sm font-medium">{app.name}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="capitalize">{app.status.replace("_", " ")}</span>
                <span>{app.currentVersion ?? "draft"}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-xs font-bold text-cyan-200">DEV</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white">Dev mode</div>
            <div className="text-xs text-slate-500">Local agent workspace</div>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.075] hover:text-white"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
