import { AgentStep } from "@/lib/api";

const stepTone: Record<AgentStep["status"], string> = {
  pending: "border-white/10 bg-white/[0.035] text-slate-500",
  running: "border-cyan-200/25 bg-cyan-300/[0.08] text-cyan-100",
  done: "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100",
  failed: "border-rose-300/25 bg-rose-500/[0.10] text-rose-100"
};

const stepIcon: Record<AgentStep["status"], string> = {
  pending: "○",
  running: "◌",
  done: "✓",
  failed: "!"
};

export function AgentStepTimeline({ steps, compact = false }: { steps: AgentStep[]; compact?: boolean }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-black/24 p-4 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Agent Activity</div>
          <div className="text-xs text-slate-500">structured live execution inside this conversation</div>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">{steps.length} steps</span>
      </div>
      <div className={compact ? "grid gap-2 md:grid-cols-2" : "space-y-2"}>
        {steps.map((step) => (
          <div key={step.id} className={`rounded-2xl border px-3 py-3 ${stepTone[step.status]}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`grid h-7 w-7 place-items-center rounded-xl border border-white/10 ${step.status === "running" ? "animate-pulse bg-cyan-300/15" : "bg-white/[0.04]"}`}>
                  {stepIcon[step.status]}
                </span>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              <span className="text-[11px] uppercase tracking-[0.14em]">{step.status.replace("_", " ")}</span>
            </div>
            {step.description ? <p className="mt-2 pl-5 text-xs leading-5 opacity-75">{step.description}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
