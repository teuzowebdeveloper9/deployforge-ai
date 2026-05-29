import { MarkdownRenderer } from "./MarkdownRenderer";

export function AgentReportCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[24px] border border-cyan-200/16 bg-gradient-to-br from-cyan-300/[0.09] to-violet-300/[0.06] p-4 shadow-xl shadow-black/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-slate-500">structured agent output</div>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-100">planned</span>
      </div>
      <MarkdownRenderer content={content} />
    </div>
  );
}
