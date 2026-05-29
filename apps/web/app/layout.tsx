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
          <header className="border-b border-line bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
              <Link href="/apps" className="text-lg font-semibold tracking-normal text-ink">
                DeployForge AI
              </Link>
              <nav className="flex items-center gap-2 text-sm">
                <Link className="rounded-md px-3 py-2 hover:bg-panel" href="/apps">
                  Apps
                </Link>
                <Link className="rounded-md bg-accent px-3 py-2 text-white hover:bg-teal-800" href="/apps/new">
                  New App
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
