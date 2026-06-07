"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import { useApi } from "@/hooks/useApi";
import {
  User, Mail, Building2, Shield, Eye, EyeOff,
  Save, Loader2, CheckCircle2, AlertCircle,
  Camera, Lock, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
interface Profile {
  id:        string;
  fullName:  string;
  email:     string;
  role:      "admin" | "user";
  division:  string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/* ─── Shared input style ─────────────────────────────────────── */
const inputCls = cn(
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none",
  "bg-white text-slate-800 placeholder:text-slate-400",
  "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all",
  "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
);

/* ─── Password strength ─────────────────────────────────────── */
function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Lemah",  "Cukup",  "Kuat",    "Sangat Kuat"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-[#1a5f7a]", "bg-emerald-500"];
  return { score, label: labels[score], color: colors[score] };
}

/* ─── Avatar ─────────────────────────────────────────────────── */
function Avatar({ name, url, size = "lg" }: { name: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  const initial = name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const sizeMap = { sm: "w-10 h-10 text-sm", md: "w-14 h-14 text-base", lg: "w-20 h-20 text-xl" };

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className={cn("rounded-full object-cover", sizeMap[size])} />
    );
  }

  return (
    <div className={cn("rounded-full bg-[#1a5f7a] flex items-center justify-center font-bold text-white shrink-0", sizeMap[size])}>
      {initial}
    </div>
  );
}

/* ─── Alert ─────────────────────────────────────────────────── */
function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm",
      type === "success"
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : "bg-red-50 border-red-200 text-red-600"
    )}>
      {type === "success" ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
      {message}
    </div>
  );
}

/* ─── Info Section ───────────────────────────────────────────── */
function ProfileInfoSection({ profile, onUpdated }: { profile: Profile; onUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [alert,   setAlert]   = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [form, setForm] = useState({
    fullName: profile.fullName,
    division: profile.division ?? "",
  });

  useEffect(() => {
    setForm({ fullName: profile.fullName, division: profile.division ?? "" });
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fullName: form.fullName, division: form.division }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", msg: data.error ?? "Gagal menyimpan." });
      } else {
        setAlert({ type: "success", msg: "Profil berhasil diperbarui." });
        onUpdated();
        setTimeout(() => setAlert(null), 3000);
      }
    } catch {
      setAlert({ type: "error", msg: "Tidak dapat terhubung ke server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">Informasi Profil</h3>
        <p className="text-xs text-slate-500 mt-0.5">Nama dan divisi yang ditampilkan ke anggota lain.</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
        {alert && <Alert type={alert.type} message={alert.msg} />}

        {/* Nama */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
            Nama Lengkap
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
              className={cn(inputCls, "pl-9")}
            />
          </div>
        </div>

        {/* Email — read only */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={profile.email}
              disabled
              className={cn(inputCls, "pl-9")}
            />
          </div>
          <p className="text-xs text-slate-400">Email tidak dapat diubah.</p>
        </div>

        {/* Divisi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="division">
            Divisi
          </label>
          <div className="relative">
            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="division"
              type="text"
              placeholder="Contoh: Engineering, Design, QA"
              value={form.division}
              onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
              className={cn(inputCls, "pl-9")}
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary h-9 px-5 text-sm rounded-lg disabled:opacity-60 gap-1.5"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</> : <><Save size={14} />Simpan</>}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Password Section ───────────────────────────────────────── */
function ChangePasswordSection() {
  const [loading, setLoading]     = useState(false);
  const [alert,   setAlert]       = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showCurr, setShowCurr]   = useState(false);
  const [showNew,  setShowNew]    = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [form, setForm] = useState({ current: "", newPw: "", confirm: "" });

  const strength = getStrength(form.newPw);
  const pwMatch  = form.newPw === form.confirm && form.confirm.length > 0;

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    if (!pwMatch) { setAlert({ type: "error", msg: "Konfirmasi password tidak cocok." }); return; }
    if (form.newPw.length < 8) { setAlert({ type: "error", msg: "Password baru minimal 8 karakter." }); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: form.current, newPassword: form.newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", msg: data.error ?? "Gagal mengubah password." });
      } else {
        setAlert({ type: "success", msg: "Password berhasil diubah." });
        setForm({ current: "", newPw: "", confirm: "" });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch {
      setAlert({ type: "error", msg: "Tidak dapat terhubung ke server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">Ubah Password</h3>
        <p className="text-xs text-slate-500 mt-0.5">Gunakan password yang kuat dan unik.</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
        {alert && <Alert type={alert.type} message={alert.msg} />}

        {/* Current */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="currentPw">Password Saat Ini</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="currentPw"
              type={showCurr ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.current}
              onChange={(e) => set("current", e.target.value)}
              required
              className={cn(inputCls, "pl-9 pr-10")}
            />
            <button type="button" onClick={() => setShowCurr((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showCurr ? "Sembunyikan" : "Tampilkan"} tabIndex={-1}>
              {showCurr ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* New */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="newPw">Password Baru</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="newPw"
              type={showNew ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              value={form.newPw}
              onChange={(e) => set("newPw", e.target.value)}
              required
              className={cn(inputCls, "pl-9 pr-10")}
            />
            <button type="button" onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showNew ? "Sembunyikan" : "Tampilkan"} tabIndex={-1}>
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {form.newPw.length > 0 && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-1 flex-1">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all",
                    i <= strength.score ? strength.color : "bg-slate-200")} />
                ))}
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">{strength.label}</span>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="confirmPw">Konfirmasi Password Baru</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="confirmPw"
              type={showConf ? "text" : "password"}
              placeholder="Ulangi password baru"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
              required
              className={cn(inputCls, "pl-9 pr-10",
                form.confirm.length > 0 && (pwMatch
                  ? "border-emerald-400 focus:border-emerald-500"
                  : "border-red-300 focus:border-red-400")
              )}
            />
            <button type="button" onClick={() => setShowConf((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showConf ? "Sembunyikan" : "Tampilkan"} tabIndex={-1}>
              {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {form.confirm.length > 0 && !pwMatch && (
            <p className="text-xs text-red-500">Password tidak cocok.</p>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading || !form.current || !form.newPw || !pwMatch}
            className="btn btn-primary h-9 px-5 text-sm rounded-lg disabled:opacity-60 gap-1.5"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</> : <><Lock size={14} />Ubah Password</>}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Account Info Card ──────────────────────────────────────── */
function AccountInfoCard({ profile }: { profile: Profile }) {
  const roleLabel = profile.role === "admin" ? "Admin" : "Member";
  const roleColor = profile.role === "admin"
    ? "bg-amber-100 text-amber-700"
    : "bg-[#e8f4f8] text-[#1a5f7a]";

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100">
        <div className="relative">
          <Avatar name={profile.fullName} url={profile.avatarUrl} size="lg" />
          <button
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-slate-500 hover:text-[#1a5f7a] transition-colors"
            title="Ubah foto (coming soon)"
            type="button"
          >
            <Camera size={13} />
          </button>
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-900">{profile.fullName}</p>
          <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
        </div>
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", roleColor)}>
          {roleLabel}
        </span>
      </div>

      {/* Meta info */}
      <div className="flex flex-col gap-3">
        {[
          { icon: Mail,      label: "Email",    value: profile.email },
          { icon: Building2, label: "Divisi",   value: profile.division ?? "—" },
          { icon: Shield,    label: "Role",      value: roleLabel },
          { icon: Calendar,  label: "Bergabung", value: new Date(profile.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Icon size={13} className="text-slate-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm text-slate-700 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: profile, loading, error, refetch } = useApi<Profile>("/api/profile");

  if (loading) {
    return (
      <AppShell title="Profil" subtitle="Kelola informasi akunmu">
        <div className="flex gap-6 max-w-3xl">
          <div className="w-64 shrink-0">
            <div className="card p-5 flex flex-col items-center gap-3">
              <div className="animate-pulse w-20 h-20 rounded-full bg-slate-200" />
              <div className="animate-pulse h-4 w-32 rounded bg-slate-200" />
              <div className="animate-pulse h-3 w-24 rounded bg-slate-200" />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="card p-6 flex flex-col gap-4">
              {[1,2,3].map((i) => <div key={i} className="animate-pulse h-10 rounded-lg bg-slate-200" />)}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell title="Profil" subtitle="Kelola informasi akunmu">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 max-w-lg">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{error ?? "Gagal memuat profil."}</span>
          <button onClick={refetch} className="font-medium hover:underline">Coba Lagi</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Profil"
      subtitle={`Kelola informasi akun ${session?.user?.name?.split(" ")[0] ?? ""}`}
    >
      <div className="flex flex-col lg:flex-row gap-6 max-w-3xl">
        {/* Left — account card */}
        <div className="w-full lg:w-64 shrink-0">
          <AccountInfoCard profile={profile} />
        </div>

        {/* Right — forms */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <ProfileInfoSection profile={profile} onUpdated={refetch} />
          <ChangePasswordSection />
        </div>
      </div>
    </AppShell>
  );
}
