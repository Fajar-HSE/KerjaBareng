"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls = cn(
  "w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none",
  "bg-white text-slate-800 placeholder:text-slate-400",
  "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all"
);

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setError(data.error ?? "Terlalu banyak percobaan. Coba lagi nanti.");
      } else if (!res.ok) {
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
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Lupa Password?</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Masukkan email akunmu dan kami kirimkan link reset.
          </p>
        </div>

        {success ? (
          /* ── Success state ── */
          <div className="card p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Cek email kamu!</p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Jika email <span className="font-medium text-slate-700">{email}</span> terdaftar,
                link reset password sudah dikirim. Link berlaku <strong>1 jam</strong>.
              </p>
            </div>
            <div className="w-full pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Tidak dapat email? Cek folder <strong>Spam</strong> atau{" "}
                <button
                  onClick={() => { setSuccess(false); setEmail(""); }}
                  className="text-[#1a5f7a] hover:underline"
                >
                  coba lagi
                </button>.
              </p>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn btn-primary w-full h-10 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" />Mengirim...</>
                  : "Kirim Link Reset"
                }
              </button>
            </form>
          </div>
        )}

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mt-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}
