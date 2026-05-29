"use client";

import { AgentMessage, AgentStep } from "@/lib/api";
import { AgentMessageBubble } from "./AgentMessageBubble";
import { AgentStepTimeline } from "./AgentStepTimeline";
import { CommandInput } from "./CommandInput";

export function AgentChat({
  messages,
  steps,
  loading,
  sending,
  onSend
}: {
  messages: AgentMessage[];
  steps: AgentStep[];
  loading?: boolean;
  sending?: boolean;
  onSend: (content: string) => Promise<void>;
}) {
  return (
    <section className="flex min-h-[calc(100vh-150px)] flex-col rounded-[26px] border border-white/10 bg-[#080b17]/72 shadow-2xl shadow-black/30 backdrop-blur-xl xl:max-h-[calc(100vh-150px)]">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-sm font-semibold text-white">Project Chat</div>
        <div className="text-xs text-slate-500">Continue this app. Prompts here do not create a new project.</div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        {loading ? <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">Loading conversation...</div> : null}
        {!loading && messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-slate-400">
            This project has no chat history yet. Ask the agent to improve, refactor or continue the app.
          </div>
        ) : null}
        {messages.map((message) => (
          <AgentMessageBubble key={message.id} message={message} />
        ))}
        {steps.length > 0 ? (
          <div className="flex justify-start">
            <div className="w-full max-w-[920px]">
              <AgentStepTimeline steps={steps} compact />
            </div>
          </div>
        ) : null}
        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-[22px] border border-cyan-200/20 bg-cyan-300/[0.08] px-4 py-3 text-sm text-cyan-100">
              ◌ The agent is reading context and preparing the next response...
            </div>
          </div>
        ) : null}
      </div>
      <div className="border-t border-white/10 p-4">
        <CommandInput placeholder="Ask the agent to change, improve or continue this app..." cta="Send" loading={sending} onSubmit={onSend} />
      </div>
    </section>
  );
}
