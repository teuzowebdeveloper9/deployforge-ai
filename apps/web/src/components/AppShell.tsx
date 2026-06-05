"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { verifyAuthSession } from "@/lib/auth";
import { AppSidebar } from "./AppSidebar";
import { GlowBackground } from "./GlowBackground";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const isPublicRoute = pathname === "/login";

  useEffect(() => {
    const saved = window.localStorage.getItem("deployforge-sidebar-open");
    if (saved === "true") setSidebarOpen(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("deployforge-sidebar-open", String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    if (isPublicRoute) {
      setCheckingAuth(false);
      setAuthorized(false);
      return;
    }

    setCheckingAuth(true);
    verifyAuthSession()
      .then((session) => {
        if (!session) {
          const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
          router.replace(`/login?next=${next}`);
          return;
        }
        setAuthorized(true);
      })
      .finally(() => setCheckingAuth(false));
  }, [isPublicRoute, pathname, router]);

  useEffect(() => {
    if (!sidebarOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (checkingAuth || !authorized) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden text-slate-100">
        <GlowBackground />
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 text-sm text-slate-300 shadow-2xl shadow-black/30 backdrop-blur-xl">
          Checking session...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-100">
      <GlowBackground />
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className={`fixed left-4 top-4 z-40 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#080b17]/82 px-3 py-2 text-sm font-semibold text-white shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/[0.08] ${
          sidebarOpen ? "pointer-events-none -translate-x-3 opacity-0" : "translate-x-0 opacity-100"
        }`}
        aria-label="Open sidebar"
      >
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-400 text-xs font-black text-[#06111f]">
          DF
        </span>
        <span className="hidden sm:inline">Menu</span>
      </button>

      <div
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-[#02040d]/58 transition duration-300 ${
          sidebarOpen ? "pointer-events-auto opacity-100 backdrop-blur-md" : "pointer-events-none opacity-0 backdrop-blur-0"
        }`}
      />

      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main
        className={`min-h-screen px-3 py-3 transition duration-300 xl:px-4 xl:py-4 ${
          sidebarOpen ? "scale-[0.992] blur-[1.5px]" : "scale-100 blur-0"
        }`}
      >
        <div className="mx-auto max-w-[1920px]">{children}</div>
      </main>
    </div>
  );
}
