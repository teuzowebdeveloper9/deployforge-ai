export function GlowBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050712]">
      <div className="absolute left-[-12%] top-[-18%] h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[110px]" />
      <div className="absolute right-[-10%] top-[6%] h-[520px] w-[520px] rounded-full bg-violet-500/16 blur-[130px]" />
      <div className="absolute bottom-[-18%] left-[30%] h-[480px] w-[480px] rounded-full bg-blue-500/12 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_34%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:auto,42px_42px,42px_42px]" />
    </div>
  );
}
