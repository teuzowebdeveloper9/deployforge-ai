"use client";

import { useState } from "react";
import { PreviewState } from "@/lib/api";

export function PreviewPanel({ preview, onRefresh }: { preview: PreviewState; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasPreviewUrl = Boolean(preview.url);

  function renderPreviewSurface(expandedView = false) {
    if (preview.status === "ready" && preview.url) {
      return (
        <iframe
          title={expandedView ? "Expanded generated app preview" : "Generated app preview"}
          src={preview.url}
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          className={`${expandedView ? "h-full rounded-none border-0" : "h-full min-h-[calc(100vh-236px)] rounded-[22px] border border-white/10 shadow-2xl shadow-black/40"} w-full bg-white`}
        />
      );
    }

    if (preview.status === "ready") {
      return (
        <div className="m-auto max-w-md text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl border border-emerald-300/20 bg-emerald-300/10 text-2xl text-emerald-100">
            OK
          </div>
          <h3 className="text-lg font-semibold text-white">Preview workspace is ready.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The chat run finished and this panel is reserved for the generated app. A real iframe URL will replace this placeholder as soon as a build artifact exists.
          </p>
        </div>
      );
    }

    return (
      <div className="m-auto max-w-sm text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-white/[0.055] text-2xl">
          {preview.status === "failed" ? "!" : preview.status === "loading" ? "..." : ">"}
        </div>
        <h3 className="text-lg font-semibold text-white">
          {preview.status === "loading" ? "Building preview..." : preview.status === "failed" ? "Preview failed" : "Preview is not ready yet."}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {preview.status === "loading"
            ? "Running the agent workflow and preparing the preview handoff."
            : preview.status === "failed"
              ? preview.error ?? "Ask the agent to inspect the build and fix the preview."
              : "The agent will load it here after the first build finishes."}
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="flex min-h-[calc(100vh-150px)] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#080b17]/78 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-white">Live Preview</div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${hasPreviewUrl ? "bg-emerald-300/10 text-emerald-100" : "bg-amber-300/10 text-amber-100"}`}>
                {hasPreviewUrl ? "URL ready" : "URL pending"}
              </span>
            </div>
            <div className="mt-1 max-w-[min(760px,70vw)] truncate text-xs text-slate-500">{preview.url ?? "The preview panel is ready. A real URL appears here after the generated artifact exists."}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={onRefresh} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.06]">
              Refresh
            </button>
            <button onClick={() => setExpanded(true)} className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-xs font-semibold text-cyan-50 hover:bg-cyan-200/15">
              Expand
            </button>
            {preview.url ? (
              <a href={preview.url} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_24px_rgba(255,255,255,0.16)] hover:bg-cyan-50">
                Open
              </a>
            ) : (
              <button
                onClick={() => setExpanded(true)}
                title="A real preview URL is not available yet. This opens the preview workspace."
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_24px_rgba(255,255,255,0.16)] hover:bg-cyan-50"
              >
                Open
              </button>
            )}
          </div>
        </div>

        <div className="grid flex-1 place-items-stretch bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_40%),#050712] p-3">
          {renderPreviewSurface()}
        </div>
      </section>

      {expanded ? (
        <div className="fixed inset-0 z-50 bg-black/82 p-4 backdrop-blur-xl">
          <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#070915] shadow-2xl shadow-black">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-white">Expanded Preview</div>
                <div className="text-xs text-slate-500">{preview.url ?? "Preview placeholder"}</div>
              </div>
              <button onClick={() => setExpanded(false)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.06]">
                Close
              </button>
            </div>
            <div className="grid flex-1 place-items-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_42%),#050712]">
              {renderPreviewSurface(true)}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
