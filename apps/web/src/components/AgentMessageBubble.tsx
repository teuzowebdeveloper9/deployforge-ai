import { AgentMessage } from "@/lib/api";
import { AgentReportCard } from "./AgentReportCard";
import { MarkdownRenderer } from "./MarkdownRenderer";

export function AgentMessageBubble({ message }: { message: AgentMessage }) {
  if (message.type === "report") return <AgentReportCard title="Agent Report" content={message.content} />;

  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const label = isUser ? "You" : isSystem ? "System" : "DeployForge Agent";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`w-full max-w-[min(860px,92%)] rounded-[22px] border px-4 py-3 text-sm leading-6 shadow-lg ${
          isUser
            ? "border-cyan-200/20 bg-cyan-200/12 text-cyan-50 shadow-cyan-950/10"
            : isSystem
              ? "border-amber-200/20 bg-amber-200/[0.075] text-amber-50 shadow-black/20"
              : "border-white/10 bg-white/[0.065] text-slate-200 shadow-black/20"
        }`}
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
        <MarkdownRenderer content={message.content} />
      </div>
    </div>
  );
}
