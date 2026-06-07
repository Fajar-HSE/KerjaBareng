"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, Briefcase, Loader2,
  AlertCircle, CheckCircle2, User, Mail, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Password strength ─────────────────────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;

  if (score <= 1) return { score, label: "Lemah",   color: "bg-red-400" };
  if (score === 2) return { score, label: "Cukup",   color: "bg-amber-400" };
  if (score === 3) return { score, label: "Kuat",    color: "bg-[#1a5f7a]" };
  return           { score, label: "Sangat Kuat", color: "bg-emerald-500" };
}

/* ─── Input field ────────────────────────────────────────────── */
const inputCls = cn(
  "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-all",
  "bg-white text-slate-800 placeholder:text-slate-400",
  "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 border-slate-200"
);

/* ─── Page ──────────────────────────────────────────────────── */
export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [showPw,    setShowPw]    = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  const strength = getStrength(form.password);
  const pwMatch  = form.password === form.confirm && form.confirm.length > 0;

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pwMatch) { setError("Konfirmasi password tidak cocok."); return; }
    if (form.password.length < 8) { setError("Password minimal 8 karakter."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          fullName: form.fullName,
          email:    form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan. Coba lagi.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Cek email kamu!</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Link verifikasi sudah dikirim ke{" "}
              <span className="font-semibold text-slate-700">{form.email}</span>.
              <br />Klik link tersebut untuk mengaktifkan akunmu.
            </p>
          </div>
          <div className="card p-4 w-full text-left">
            <p className="text-xs text-slate-500 leading-relaxed">
              📧 Tidak dapat email? Cek folder <strong>Spam</strong> atau{" "}
              <button
                onClick={() => { setSuccess(false); setForm({ fullName: "", email: "", password: "", confirm: "" }); }}
                className="text-[#1a5f7a] hover:underline"
              >
                daftar ulang
              </button>{" "}
              dengan email yang benar.
            </p>
          </div>
          <Link href="/login" className="text-sm text-[#1a5f7a] hover:underline">
            Kembali ke halaman login →
          </Link>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Buat Akun</h1>
          <p className="text-sm text-slate-500 mt-1">Bergabung dengan tim di KerjaBareng</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Nama lengkap kamu"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  className={cn(inputCls, "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength indicator */}
              {form.password.length > 0 && (
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

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="confirm">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm"
                  type={showConf ? "text" : "password"}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                  required
                  className={cn(
                    inputCls, "pr-10",
                    form.confirm.length > 0 && (pwMatch
                      ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10"
                      : "border-red-300 focus:border-red-400 focus:ring-red-400/10")
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConf((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.confirm.length > 0 && !pwMatch && (
                <p className="text-xs text-red-500 mt-0.5">Password tidak cocok.</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !form.fullName || !form.email || !form.password || !pwMatch}
              className="btn btn-primary w-full h-10 mt-1 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Mendaftar...</>
                : "Daftar Sekarang"
              }
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[#1a5f7a] font-medium hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
