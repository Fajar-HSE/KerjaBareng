"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Briefcase } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const success = searchParams.get("success");
  const error   = searchParams.get("error");
  const token   = searchParams.get("token");

  const isProcessing = !!(token && !success && !error);

  /* Trigger API verify — dalam useEffect, bukan render body */
  useEffect(() => {
    if (isProcessing && token) {
      router.replace(
        `/api/auth/verify-email?token=${encodeURIComponent(token)}`
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  type State = "success" | "expired" | "invalid" | "server" | "pending";

  let state: State = "pending";
  if (success)              state = "success";
  else if (error === "expired") state = "expired";
  else if (error === "server")  state = "server";
  else if (error)           state = "invalid";
  else if (isProcessing)    state = "pending";

  const CONFIG: Record<State, {
    icon: React.ReactNode;
    bg: string;
    title: string;
    message: string;
    action: React.ReactNode | null;
  }> = {
    success: {
      icon:    <CheckCircle2 size={40} className="text-emerald-600" />,
      bg:      "bg-emerald-100",
      title:   "Email Terverifikasi!",
      message: "Akunmu sudah aktif. Kamu bisa login sekarang.",
      action:  (
        <Link href="/login" className="btn btn-primary h-10 px-6 rounded-lg text-sm">
          Masuk Sekarang
        </Link>
      ),
    },
    expired: {
      icon:    <Clock size={40} className="text-amber-600" />,
      bg:      "bg-amber-100",
      title:   "Link Kadaluarsa",
      message: "Link verifikasi sudah tidak berlaku (24 jam). Daftar ulang untuk mendapatkan link baru.",
      action:  (
        <Link href="/register" className="btn btn-primary h-10 px-6 rounded-lg text-sm">
          Daftar Ulang
        </Link>
      ),
    },
    invalid: {
      icon:    <XCircle size={40} className="text-red-500" />,
      bg:      "bg-red-100",
      title:   "Link Tidak Valid",
      message: "Link verifikasi tidak ditemukan atau sudah digunakan.",
      action:  (
        <Link href="/register" className="btn btn-primary h-10 px-6 rounded-lg text-sm">
          Daftar Ulang
        </Link>
      ),
    },
    server: {
      icon:    <XCircle size={40} className="text-red-500" />,
      bg:      "bg-red-100",
      title:   "Terjadi Kesalahan",
      message: "Ada masalah di server. Coba lagi nanti atau hubungi admin.",
      action:  (
        <Link href="/login" className="btn btn-secondary h-10 px-6 rounded-lg text-sm">
          Kembali ke Login
        </Link>
      ),
    },
    pending: {
      icon:    <div className="w-10 h-10 rounded-full border-4 border-[#1a5f7a] border-t-transparent animate-spin" />,
      bg:      "bg-[#e8f4f8]",
      title:   "Memverifikasi...",
      message: "Mohon tunggu, sedang memproses verifikasi email kamu.",
      action:  null,
    },
  };

  const c = CONFIG[state];

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className={`w-20 h-20 rounded-full ${c.bg} flex items-center justify-center`}>
        {c.icon}
      </div>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{c.title}</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs">{c.message}</p>
      </div>
      {c.action && <div className="mt-2">{c.action}</div>}
      {state !== "pending" && (
        <Link href="/login" className="text-xs text-slate-400 hover:text-slate-600 hover:underline mt-1">
          Kembali ke halaman login
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#1a5f7a]/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#d97706]/5" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1a5f7a] flex items-center justify-center shadow-lg mb-4">
            <Briefcase size={22} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900">KerjaBareng</span>
        </div>

        <div className="card p-8">
          <Suspense fallback={
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-[#1a5f7a] border-t-transparent animate-spin" />
              <p className="text-sm text-slate-500">Memuat...</p>
            </div>
          }>
            <VerifyContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
