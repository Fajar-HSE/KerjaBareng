"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Briefcase, Loader2, AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Alert variants ─────────────────────────────────────────── */
type AlertType = "error" | "warning" | "info";

function Alert({ type, message }: { type: AlertType; message: string }) {
  const styles: Record<AlertType, { bg: string; border: string; text: string; icon: React.ElementType }> = {
    error:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-600",    icon: AlertCircle },
    warning: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  icon: ShieldAlert },
    info:    { bg: "bg-[#e8f4f8]", border: "border-[#1a5f7a]/20", text: "text-[#1a5f7a]", icon: CheckCircle2 },
  };
  const s = styles[type];
  const Icon = s.icon;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm", s.bg, s.border, s.text)}>
      <Icon size={15} className="shrink-0" />
      {message}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [alert,    setAlert]    = useState<{ type: AlertType; message: string } | null>(null);

  /* Baca query params dari middleware */
  useEffect(() => {
    const err      = searchParams.get("error");
    const callbackUrl = searchParams.get("callbackUrl");

    if (err === "unauthorized") {
      setAlert({ type: "warning", message: "Kamu tidak punya akses ke halaman tersebut." });
    } else if (err === "SessionRequired" || (callbackUrl && !err)) {
      setAlert({ type: "info", message: "Silakan login terlebih dahulu." });
    }

    const verified = searchParams.get("verified");
    if (verified === "success") {
      setAlert({ type: "info", message: "Email berhasil diverifikasi! Silakan login." });
    }
  }, [searchParams]);

  /* callbackUrl: kembalikan ke halaman yang dituju setelah login */
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAlert(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email atau password salah.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#1a5f7a]/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#d97706]/5" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1a5f7a] flex items-center justify-center shadow-lg mb-4">
            <Briefcase size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">KerjaBareng</h1>
          <p className="text-sm text-slate-500 mt-1">Masuk ke akun tim kamu</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            {/* Alert dari middleware (unauthorized / session required) */}
            {alert && <Alert type={alert.type} message={alert.message} />}

            {/* Error dari credentials */}
            {error && <Alert type="error" message={error} />}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  "px-3 py-2.5 rounded-lg border text-sm outline-none transition-all",
                  "bg-white text-slate-800 placeholder:text-slate-400",
                  "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10",
                  "border-slate-200"
                )}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <button type="button" className="text-xs text-[#1a5f7a] hover:underline" tabIndex={-1}>
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(
                    "w-full px-3 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-all",
                    "bg-white text-slate-800 placeholder:text-slate-400",
                    "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10",
                    "border-slate-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "btn btn-primary w-full h-10 mt-1 rounded-lg text-sm font-medium",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {loading ? <><Loader2 size={15} className="animate-spin" />Masuk...</> : "Masuk"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[#1a5f7a] font-medium hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
