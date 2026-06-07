"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Briefcase, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Error alert */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

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
                <button
                  type="button"
                  className="text-xs text-[#1a5f7a] hover:underline"
                  tabIndex={-1}
                >
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
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Akun dibuat oleh admin.{" "}
          <span className="text-[#1a5f7a]">Hubungi administrator</span>{" "}
          jika belum punya akses.
        </p>
      </div>
    </div>
  );
}
