"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle2, XCircle, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls = cn(
  "w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-sm outline-none",
  "bg-white text-slate-800 placeholder:text-slate-400",
  "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all"
);

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-[#1a5f7a]", "bg-emerald-500"];
  return { score, label: labels[score], color: colors[score] };
}

/* ─── Inner content (needs Suspense for useSearchParams) ─────── */
function ResetContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  type PageState = "validating" | "valid" | "invalid" | "success";
  const [pageState, setPageState] = useState<PageState>("validating");

  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [showPw,   setShowPw]     = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");

  const strength = getStrength(password);
  const pwMatch  = password === confirm && confirm.length > 0;

  /* Validate token on mount */
  useEffect(() => {
    if (!token) { setPageState("invalid"); return; }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setPageState(d.valid ? "valid" : "invalid"))
      .catch(() => setPageState("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwMatch) { setError("Konfirmasi password tidak cocok."); return; }
    if (password.length < 8) { setError("Password minimal 8 karakter."); return; }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
      } else {
        setPageState("success");
        /* Auto redirect ke login setelah 3 detik */
        setTimeout(() => router.push("/login?verified=success"), 3000);
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Loading state ── */
  if (pageState === "validating") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#1a5f7a] border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500">Memvalidasi link...</p>
      </div>
    );
  }

  /* ── Invalid token ── */
  if (pageState === "invalid") {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle size={32} className="text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Link Tidak Valid</p>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Link reset password tidak ditemukan atau sudah kadaluarsa (1 jam).
          </p>
        </div>
        <Link href="/forgot-password" className="btn btn-primary h-10 px-6 rounded-lg text-sm">
          Minta Link Baru
        </Link>
      </div>
    );
  }

  /* ── Success ── */
  if (pageState === "success") {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Password Berhasil Diubah!</p>
          <p className="text-sm text-slate-500 mt-1">
            Kamu akan diarahkan ke halaman login dalam 3 detik...
          </p>
        </div>
        <Link href="/login" className="btn btn-primary h-10 px-6 rounded-lg text-sm">
          Login Sekarang
        </Link>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Password baru */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          Password Baru
        </label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPw ? "text" : "password"}
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
            tabIndex={-1}
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* Strength */}
        {password.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all",
                    i <= strength.score ? strength.color : "bg-slate-200"
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-500 shrink-0">{strength.label}</span>
          </div>
        )}
      </div>

      {/* Konfirmasi */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700" htmlFor="confirm">
          Konfirmasi Password
        </label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="confirm"
            type={showConf ? "text" : "password"}
            placeholder="Ulangi password baru"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className={cn(
              inputCls,
              confirm.length > 0 && (pwMatch
                ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10"
                : "border-red-300 focus:border-red-400 focus:ring-red-400/10")
            )}
          />
          <button
            type="button"
            onClick={() => setShowConf((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showConf ? "Sembunyikan password" : "Tampilkan password"}
            tabIndex={-1}
          >
            {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {confirm.length > 0 && !pwMatch && (
          <p className="text-xs text-red-500 mt-0.5">Password tidak cocok.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !password || !pwMatch}
        className="btn btn-primary w-full h-10 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" />Menyimpan...</>
          : "Simpan Password Baru"
        }
      </button>
    </form>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
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
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Buat Password Baru</h1>
          <p className="text-sm text-slate-500 mt-1">Masukkan password baru untuk akunmu</p>
        </div>

        <div className="card p-6">
          <Suspense fallback={
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 rounded-full border-4 border-[#1a5f7a] border-t-transparent animate-spin" />
            </div>
          }>
            <ResetContent />
          </Suspense>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mt-6 transition-colors"
        >
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}
