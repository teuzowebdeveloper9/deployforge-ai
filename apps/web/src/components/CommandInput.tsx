"use client";

import { FormEvent, useState } from "react";

export function CommandInput({
  initialValue = "",
  placeholder,
  cta = "Send",
  loading,
  onSubmit
}: {
  initialValue?: string;
  placeholder: string;
  cta?: string;
  loading?: boolean;
  onSubmit: (value: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState(initialValue);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = value.trim();
    if (!content || loading) return;
    await onSubmit(content);
    setValue("");
  }

  return (
    <form onSubmit={submit} className="rounded-[24px] border border-white/12 bg-black/28 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="min-h-[96px] w-full resize-y rounded-[18px] border border-white/10 bg-white/[0.055] px-4 py-4 text-[15px] leading-6 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/[0.075]"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-1 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full border border-white/10 px-2 py-1">context aware</span>
          <span className="rounded-full border border-white/10 px-2 py-1">CI/CD checked</span>
        </div>
        <button
          disabled={loading || !value.trim()}
          className="rounded-2xl bg-gradient-to-r from-cyan-200 via-blue-200 to-violet-200 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_32px_rgba(125,211,252,0.22)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Working..." : cta}
        </button>
      </div>
    </form>
  );
}
