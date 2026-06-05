"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, register, verifyAuthSession } from "@/lib/auth";

type AuthMode = "login" | "register";
type FocusedField = "name" | "organization" | "email" | "password" | null;

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const robotMood = useMemo(() => {
    if (loading || checkingSession) return "thinking";
    if (focusedField === "password" && !passwordVisible) return "hiding";
    if (focusedField === "password" && passwordVisible) return "peeking";
    if (focusedField === "email") return "tracking";
    if (focusedField === "name" || focusedField === "organization") return "curious";
    if (error) return "alert";
    return "idle";
  }, [checkingSession, error, focusedField, loading, passwordVisible]);

  useEffect(() => {
    verifyAuthSession()
      .then((session) => {
        if (session) router.replace(nextPath);
      })
      .finally(() => setCheckingSession(false));
  }, [nextPath, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          name: name.trim() || undefined,
          organizationName: organizationName.trim() || undefined
        });
      }
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-stage relative grid min-h-screen place-items-center overflow-hidden px-4 py-8 text-slate-100">
      <div className="auth-grid" />
      <div className="auth-noise" />

      <div className="relative grid w-full max-w-[1080px] gap-5 lg:grid-cols-[minmax(360px,0.92fr)_minmax(380px,1fr)]">
        <div className="auth-robot-panel min-h-[440px] overflow-hidden rounded-lg border border-white/10 bg-[#080d19]/86 p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl sm:p-8 lg:min-h-[650px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#dcff68] text-sm font-black text-[#07101c] shadow-[0_12px_42px_rgba(220,255,104,0.2)]">
                DF
              </span>
              <span className="text-sm font-semibold text-white">DeployForge AI</span>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-[#3cffb5] shadow-[0_0_20px_rgba(60,255,181,0.8)]" />
          </div>

          <div className="auth-robot-canvas flex min-h-[340px] items-center justify-center py-6 sm:min-h-[430px] lg:min-h-[520px]">
            <RobotMascot mood={robotMood} />
          </div>

          <div className="robot-status-rail" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#f7f8ef] p-4 text-[#07101c] shadow-2xl shadow-black/30 sm:p-6 lg:p-8">
          <div className="auth-form-shell mx-auto flex min-h-[620px] max-w-[460px] flex-col justify-center">
            <div className="mb-7">
              <p className="text-sm font-bold text-[#3552ff]">Acesso</p>
              <h1 className="mt-2 text-[2.45rem] font-black leading-[1.02] text-[#07101c] sm:text-[3.1rem]">
                Entre na sua conta.
              </h1>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-[22px] border border-[#101828]/10 bg-[#e9ecdf] p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-[18px] px-3 py-2.5 text-sm font-bold ${
                  mode === "login" ? "bg-[#07101c] text-white shadow-lg shadow-[#07101c]/15" : "text-[#637083] hover:bg-white/50"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-[18px] px-3 py-2.5 text-sm font-bold ${
                  mode === "register" ? "bg-[#07101c] text-white shadow-lg shadow-[#07101c]/15" : "text-[#637083] hover:bg-white/50"
                }`}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" ? (
                <>
                  <label className="block">
                    <span className="text-sm font-bold text-[#5c6677]">Nome</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      className="mt-2 w-full rounded-[20px] border border-[#101828]/10 bg-white px-4 py-3.5 text-base text-[#07101c] shadow-[0_12px_30px_rgba(7,16,28,0.06)] outline-none focus:border-[#3552ff]/60 focus:shadow-[0_0_0_4px_rgba(53,82,255,0.12)]"
                      maxLength={120}
                      placeholder="Seu nome"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-[#5c6677]">Organizacao</span>
                    <input
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                      onFocus={() => setFocusedField("organization")}
                      onBlur={() => setFocusedField(null)}
                      className="mt-2 w-full rounded-[20px] border border-[#101828]/10 bg-white px-4 py-3.5 text-base text-[#07101c] shadow-[0_12px_30px_rgba(7,16,28,0.06)] outline-none focus:border-[#3552ff]/60 focus:shadow-[0_0_0_4px_rgba(53,82,255,0.12)]"
                      maxLength={120}
                      placeholder="Time ou empresa"
                    />
                  </label>
                </>
              ) : null}

              <label className="block">
                <span className="text-sm font-bold text-[#5c6677]">E-mail</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="mt-2 w-full rounded-[20px] border border-[#101828]/10 bg-white px-4 py-3.5 text-base text-[#07101c] shadow-[0_12px_30px_rgba(7,16,28,0.06)] outline-none focus:border-[#3552ff]/60 focus:shadow-[0_0_0_4px_rgba(53,82,255,0.12)]"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#5c6677]">Senha</span>
                <div className="mt-2 flex rounded-[20px] border border-[#101828]/10 bg-white shadow-[0_12px_30px_rgba(7,16,28,0.06)] focus-within:border-[#3552ff]/60 focus-within:shadow-[0_0_0_4px_rgba(53,82,255,0.12)]">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="min-w-0 flex-1 rounded-l-[20px] bg-transparent px-4 py-3.5 text-base text-[#07101c] outline-none"
                    type={passwordVisible ? "text" : "password"}
                    required
                    minLength={mode === "register" ? 12 : 1}
                    maxLength={128}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    placeholder={mode === "register" ? "Minimo de 12 caracteres" : "Sua senha"}
                  />
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setPasswordVisible((current) => !current);
                      setFocusedField("password");
                    }}
                    className="grid w-[74px] place-items-center rounded-r-[20px] text-[#3552ff] hover:bg-[#eef1ff] focus:outline-none focus:ring-4 focus:ring-[#3552ff]/15"
                    aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={passwordVisible}
                  >
                    {passwordVisible ? <EyeOff aria-hidden="true" size={22} strokeWidth={2.4} /> : <Eye aria-hidden="true" size={22} strokeWidth={2.4} />}
                    <span className="sr-only">{passwordVisible ? "Ocultar" : "Mostrar"}</span>
                  </button>
                </div>
                <div className="mt-2 text-right text-xs font-bold text-[#637083]">
                  {passwordVisible ? "Hide" : "Ver senha"}
                </div>
              </label>

              <button
                type="submit"
                disabled={loading || checkingSession}
                className="mt-2 w-full rounded-[22px] bg-[#07101c] px-4 py-4 text-base font-black text-white shadow-[0_18px_44px_rgba(7,16,28,0.22)] hover:-translate-y-0.5 hover:bg-[#152336] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading || checkingSession ? "Verificando..." : mode === "login" ? "Entrar agora" : "Criar e entrar"}
              </button>

              {error ? (
                <div className="rounded-[20px] border border-[#ff4d6a]/25 bg-[#ff4d6a]/10 p-4 text-sm leading-6 text-[#a51532]">
                  {error}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function RobotMascot({ mood }: { mood: string }) {
  const isHiding = mood === "hiding";
  const isPeeking = mood === "peeking";
  const isTracking = mood === "tracking";
  const isCurious = mood === "curious";
  const isAlert = mood === "alert";
  const isThinking = mood === "thinking";
  const isStudying = mood === "idle";

  return (
    <div className={`robot-wrap ${isThinking ? "robot-thinking" : ""} ${isStudying ? "robot-studying" : ""}`} aria-hidden="true">
      <div className="robot-antenna">
        <span />
      </div>
      <div className="robot-study-book">
        <span />
        <span />
        <span />
      </div>
      <div className="robot-head">
        <div className="robot-ear robot-ear-left" />
        <div className="robot-ear robot-ear-right" />
        <div className="robot-brow" />
        <div className={`robot-eyes ${isTracking ? "robot-eyes-track" : ""} ${isCurious ? "robot-eyes-curious" : ""}`}>
          <span className={`robot-eye ${isHiding ? "robot-eye-closed" : ""} ${isPeeking ? "robot-eye-peek" : ""}`}>
            <span />
          </span>
          <span className={`robot-eye ${isHiding || isPeeking ? "robot-eye-closed" : ""}`}>
            <span />
          </span>
        </div>
        <div className="robot-cheeks">
          <span />
          <span />
        </div>
        <div className={`robot-mouth ${isAlert ? "robot-mouth-alert" : ""} ${isPeeking ? "robot-mouth-smile" : ""}`} />
        <div className={`robot-hand robot-hand-left ${isHiding ? "robot-hand-cover" : isPeeking ? "robot-hand-peek" : ""}`} />
        <div className={`robot-hand robot-hand-right ${isHiding ? "robot-hand-cover" : isPeeking ? "robot-hand-peek" : ""}`} />
      </div>
      <div className="robot-shadow" />
    </div>
  );
}
