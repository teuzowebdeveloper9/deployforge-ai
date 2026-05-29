import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeployForge AI",
  description: "AI-first application governance platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
              <Link href="/apps" className="flex items-center gap-3 text-lg font-semibold tracking-normal text-ink">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-sm font-bold text-white">DF</span>
                <span>DeployForge AI</span>
              </Link>
              <nav className="flex items-center gap-2 text-sm">
                <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href="/">
                  Builder
                </Link>
                <Link className="rounded-md px-3 py-2 font-medium text-muted hover:bg-panel hover:text-ink" href="/apps">
                  Apps
                </Link>
                <Link className="rounded-md bg-accent px-3 py-2 font-semibold text-white hover:bg-accentDark" href="/">
                  Generate
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
