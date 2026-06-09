"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Settings, Mail, Shield, Bell, Database,
  Eye, EyeOff, Save, Loader2, CheckCircle2,
  AlertTriangle, Info, RefreshCw, Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
interface SettingSection {
  id:    string;
  label: string;
  icon:  React.ElementType;
}

const SECTIONS: SettingSection[] = [
  { id: "general",  label: "General",    icon: Settings },
  { id: "smtp",     label: "Email SMTP", icon: Mail     },
  { id: "security", label: "Keamanan",   icon: Shield   },
  { id: "notif",    label: "Notifikasi", icon: Bell     },
  { id: "system",   label: "Sistem",     icon: Server   },
];

/* ═══════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
═══════════════════════════════════════════════════════════════ */
const inputCls = cn(
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none",
  "bg-white text-slate-800 placeholder:text-slate-400",
  "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all",
  "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
);

function FieldGroup({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SectionCard({
  title, description, children,
}: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Toggle({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative shrink-0 w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a5f7a]/30",
          checked ? "bg-[#1a5f7a]" : "bg-slate-200"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      {saved && (
        <span className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle2 size={14} /> Tersimpan
        </span>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary h-9 px-5 text-sm rounded-lg disabled:opacity-60"
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</>
          : <><Save size={14} />Simpan</>
        }
      </button>
    </div>
  );
}

/* ─── API Routes ─────────────────────────────────────────────── */
export async function GET() {
  // Route yang akan ditambahkan: /api/admin/settings
  // Untuk sekarang return default values
}

/* ═══════════════════════════════════════════════════════════════
   SECTIONS
═══════════════════════════════════════════════════════════════ */

/* ── General ── */
function GeneralSection() {
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [form, setForm] = useState({
    appName:      "KerjaBareng",
    appUrl:       "https://yourdomain.com",
    timezone:     "Asia/Jakarta",
    language:     "id",
    dateFormat:   "DD/MM/YYYY",
    allowRegister: true,
  });

  function set(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "general", ...form }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { /* silent */ } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SectionCard title="Informasi Aplikasi">
        <FieldGroup label="Nama Aplikasi">
          <input type="text" value={form.appName} onChange={(e) => set("appName", e.target.value)} className={inputCls} />
        </FieldGroup>
        <FieldGroup label="URL Aplikasi" hint="URL yang digunakan untuk link di email (verifikasi, reset password)">
          <input type="url" value={form.appUrl} onChange={(e) => set("appUrl", e.target.value)} className={inputCls} />
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Lokalisasi">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Timezone">
            <select value={form.timezone} onChange={(e) => set("timezone", e.target.value)} className={inputCls}>
              <option value="Asia/Jakarta">WIB (UTC+7)</option>
              <option value="Asia/Makassar">WITA (UTC+8)</option>
              <option value="Asia/Jayapura">WIT (UTC+9)</option>
              <option value="UTC">UTC</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Bahasa">
            <select value={form.language} onChange={(e) => set("language", e.target.value)} className={inputCls}>
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Format Tanggal">
            <select value={form.dateFormat} onChange={(e) => set("dateFormat", e.target.value)} className={inputCls}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </FieldGroup>
        </div>
      </SectionCard>

      <SectionCard title="Registrasi">
        <Toggle
          checked={form.allowRegister}
          onChange={(v) => set("allowRegister", v)}
          label="Izinkan Pendaftaran Mandiri"
          hint="Jika dinonaktifkan, hanya admin yang bisa menambah anggota baru via undangan."
        />
      </SectionCard>

      <SaveButton loading={loading} saved={saved} />
    </form>
  );
}

/* ── SMTP ── */
function SmtpSection() {
  const [loading,   setLoading]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [testing,   setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [showPass,  setShowPass]  = useState(false);

  const [form, setForm] = useState({
    host:     "smtp.gmail.com",
    port:     "587",
    user:     "",
    pass:     "",
    fromName: "KerjaBareng",
    secure:   false,
  });

  function set(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "smtp", ...form }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { /* silent */ } finally { setLoading(false); }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: form.host, port: Number(form.port), user: form.user, pass: form.pass, fromName: form.fromName, secure: form.secure }),
      });
      setTestResult(res.ok ? "success" : "error");
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-[#e8f4f8] border border-[#1a5f7a]/20 text-sm text-[#1a5f7a]">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>Konfigurasi ini digunakan untuk kirim email verifikasi, reset password, dan notifikasi deadline.</span>
      </div>

      <SectionCard title="Konfigurasi Server">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <FieldGroup label="SMTP Host">
              <input type="text" placeholder="smtp.gmail.com" value={form.host} onChange={(e) => set("host", e.target.value)} className={inputCls} />
            </FieldGroup>
          </div>
          <FieldGroup label="Port">
            <input type="number" placeholder="587" value={form.port} onChange={(e) => set("port", e.target.value)} className={inputCls} />
          </FieldGroup>
        </div>
        <Toggle
          checked={form.secure}
          onChange={(v) => set("secure", v)}
          label="SSL/TLS (port 465)"
          hint="Aktifkan jika menggunakan port 465. Untuk port 587, gunakan STARTTLS (nonaktif)."
        />
      </SectionCard>

      <SectionCard title="Kredensial">
        <FieldGroup label="Email Pengirim">
          <input type="email" placeholder="noreply@perusahaan.com" value={form.user} onChange={(e) => set("user", e.target.value)} className={inputCls} />
        </FieldGroup>
        <FieldGroup label="Password / App Password" hint="Untuk Gmail, gunakan App Password (bukan password akun).">
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••••••"
              value={form.pass}
              onChange={(e) => set("pass", e.target.value)}
              className={cn(inputCls, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPass ? "Sembunyikan" : "Tampilkan"}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </FieldGroup>
        <FieldGroup label="Nama Pengirim">
          <input type="text" placeholder="KerjaBareng" value={form.fromName} onChange={(e) => set("fromName", e.target.value)} className={inputCls} />
        </FieldGroup>
      </SectionCard>

      {/* Test result */}
      {testResult && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm",
          testResult === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50 border-red-200 text-red-600"
        )}>
          {testResult === "success"
            ? <><CheckCircle2 size={14} /> Email test berhasil dikirim ke {form.user}</>
            : <><AlertTriangle size={14} /> Gagal terhubung. Cek host, port, dan kredensial.</>
          }
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !form.user}
          className="btn btn-secondary h-9 px-4 text-sm rounded-lg disabled:opacity-50 gap-1.5"
        >
          {testing
            ? <><Loader2 size={14} className="animate-spin" />Mengirim test...</>
            : <><Mail size={14} />Kirim Email Test</>
          }
        </button>
        <SaveButton loading={loading} saved={saved} />
      </div>
    </form>
  );
}

/* ── Security ── */
function SecuritySection() {
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [form, setForm] = useState({
    sessionMaxAge:     "7",
    maxLoginAttempts:  "5",
    lockoutDuration:   "15",
    requireVerification: true,
    twoFactorEnabled:  false,
    passwordMinLength: "8",
    passwordRequireUpper: true,
    passwordRequireNumber: true,
  });

  function set(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "security", ...form }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { /* silent */ } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SectionCard title="Sesi & Login">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Durasi Sesi (hari)" hint="User otomatis logout setelah periode ini.">
            <input type="number" min="1" max="30" value={form.sessionMaxAge} onChange={(e) => set("sessionMaxAge", e.target.value)} className={inputCls} />
          </FieldGroup>
          <FieldGroup label="Maks. Percobaan Login" hint="Akun dikunci setelah sejumlah percobaan gagal.">
            <input type="number" min="3" max="20" value={form.maxLoginAttempts} onChange={(e) => set("maxLoginAttempts", e.target.value)} className={inputCls} />
          </FieldGroup>
          <FieldGroup label="Durasi Lockout (menit)" hint="Lama akun dikunci setelah melebihi percobaan.">
            <input type="number" min="5" max="60" value={form.lockoutDuration} onChange={(e) => set("lockoutDuration", e.target.value)} className={inputCls} />
          </FieldGroup>
        </div>
        <Toggle
          checked={form.requireVerification}
          onChange={(v) => set("requireVerification", v)}
          label="Wajib Verifikasi Email"
          hint="User tidak bisa login sebelum memverifikasi email."
        />
        <Toggle
          checked={form.twoFactorEnabled}
          onChange={(v) => set("twoFactorEnabled", v)}
          label="Two-Factor Authentication (2FA)"
          hint="Aktifkan 2FA via email OTP. (Coming soon)"
        />
      </SectionCard>

      <SectionCard title="Kebijakan Password">
        <FieldGroup label="Panjang Minimum">
          <input type="number" min="6" max="32" value={form.passwordMinLength} onChange={(e) => set("passwordMinLength", e.target.value)} className={inputCls} />
        </FieldGroup>
        <Toggle
          checked={form.passwordRequireUpper}
          onChange={(v) => set("passwordRequireUpper", v)}
          label="Wajib Huruf Kapital"
          hint="Password harus mengandung setidaknya satu huruf besar."
        />
        <Toggle
          checked={form.passwordRequireNumber}
          onChange={(v) => set("passwordRequireNumber", v)}
          label="Wajib Angka"
          hint="Password harus mengandung setidaknya satu angka."
        />
      </SectionCard>

      <SaveButton loading={loading} saved={saved} />
    </form>
  );
}

/* ── Notifications ── */
function NotifSection() {
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [form, setForm] = useState({
    deadlineReminderHours: "24",
    deadlineReminderEnabled: true,
    overdueNotifEnabled: true,
    assignmentNotifEnabled: true,
    mentionNotifEnabled: true,
    dailyDigest: false,
    dailyDigestTime: "08:00",
  });

  function set(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "notifications", ...form }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { /* silent */ } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SectionCard title="Reminder Deadline" description="Notifikasi email otomatis sebelum deadline tugas.">
        <Toggle
          checked={form.deadlineReminderEnabled}
          onChange={(v) => set("deadlineReminderEnabled", v)}
          label="Aktifkan Reminder Deadline"
          hint="Kirim email reminder ke assignee sebelum deadline."
        />
        <FieldGroup label="Reminder H-? (jam)" hint="Berapa jam sebelum deadline reminder dikirim.">
          <input
            type="number" min="1" max="168"
            value={form.deadlineReminderHours}
            onChange={(e) => set("deadlineReminderHours", e.target.value)}
            disabled={!form.deadlineReminderEnabled}
            className={inputCls}
          />
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Jenis Notifikasi">
        <Toggle checked={form.overdueNotifEnabled}    onChange={(v) => set("overdueNotifEnabled", v)}    label="Notifikasi Overdue"    hint="Kirim notifikasi ketika tugas melewati deadline." />
        <Toggle checked={form.assignmentNotifEnabled} onChange={(v) => set("assignmentNotifEnabled", v)} label="Notifikasi Assignment"  hint="Kirim notifikasi ketika tugas baru ditugaskan." />
        <Toggle checked={form.mentionNotifEnabled}    onChange={(v) => set("mentionNotifEnabled", v)}    label="Notifikasi Mention"     hint="Kirim notifikasi ketika user disebut di komentar." />
      </SectionCard>

      <SectionCard title="Daily Digest">
        <Toggle
          checked={form.dailyDigest}
          onChange={(v) => set("dailyDigest", v)}
          label="Daily Digest Email"
          hint="Kirim ringkasan tugas harian setiap pagi."
        />
        <FieldGroup label="Waktu Pengiriman">
          <input
            type="time"
            value={form.dailyDigestTime}
            onChange={(e) => set("dailyDigestTime", e.target.value)}
            disabled={!form.dailyDigest}
            className={inputCls}
          />
        </FieldGroup>
      </SectionCard>

      <SaveButton loading={loading} saved={saved} />
    </form>
  );
}

/* ── System ── */
function SystemSection() {
  const [clearing, setClearing]     = useState(false);
  const [clearDone, setClearDone]   = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const sysInfo = {
    version:    "1.0.0",
    nextjs:     "14.2.35",
    supabase:   "2.x (REST API)",
    node:       process.env.NODE_ENV === "production" ? "production" : "development",
    database:   "Supabase PostgreSQL",
    buildDate:  new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  };

  async function clearCache() {
    setClearing(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "clear-cache" }),
      });
      setClearDone(true);
      setTimeout(() => setClearDone(false), 3000);
    } catch { /* silent */ } finally { setClearing(false); }
  }

  async function handleResetData() {
    if (!confirmReset) { setConfirmReset(true); return; }
    setResetting(true);
    setConfirmReset(false);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "reset-data" }),
      });
      alert("Data berhasil direset.");
    } catch {
      alert("Gagal mereset data.");
    } finally { setResetting(false); }
  }

  function handleDownloadBackup() {
    // Trigger download SQL dump via API
    window.open("/api/admin/backup", "_blank");
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Informasi Sistem">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries({
            "Versi App":    sysInfo.version,
            "Next.js":      sysInfo.nextjs,
            "Supabase":     sysInfo.supabase,
            "Environment":  sysInfo.node,
            "Database":     sysInfo.database,
            "Build Date":   sysInfo.buildDate,
          }).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{k}</span>
              <span className="text-sm font-mono text-slate-700">{v}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Database" description="Operasi maintenance database.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Backup Database</p>
            <p className="text-xs text-slate-400 mt-0.5">Download backup database saat ini dalam format SQL.</p>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="btn btn-secondary h-9 px-4 text-sm rounded-lg gap-1.5"
          >
            <Database size={14} /> Download Backup
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Clear Cache</p>
            <p className="text-xs text-slate-400 mt-0.5">Bersihkan cache aplikasi. Tidak mempengaruhi data.</p>
          </div>
          <button
            onClick={clearCache}
            disabled={clearing}
            className="btn btn-secondary h-9 px-4 text-sm rounded-lg gap-1.5 disabled:opacity-50"
          >
            {clearing
              ? <><Loader2 size={14} className="animate-spin" />Membersihkan...</>
              : clearDone
                ? <><CheckCircle2 size={14} className="text-emerald-600" />Selesai</>
                : <><RefreshCw size={14} />Clear Cache</>
            }
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Zona Bahaya">
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>Tindakan di bawah ini tidak dapat dibatalkan. Lakukan dengan hati-hati.</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Reset Semua Data</p>
            <p className="text-xs text-slate-400 mt-0.5">Hapus semua tugas, progress, dan notifikasi. Akun tetap ada.</p>
          </div>
          <button
            onClick={handleResetData}
            disabled={resetting}
            className={cn(
              "btn h-9 px-4 text-sm rounded-lg gap-1.5 transition-all disabled:opacity-50",
              confirmReset
                ? "bg-red-600 text-white hover:bg-red-700 border border-red-700"
                : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            )}
          >
            {resetting
              ? <><Loader2 size={14} className="animate-spin" />Mereset...</>
              : confirmReset
                ? <><AlertTriangle size={14} />Konfirmasi Reset</>
                : <><AlertTriangle size={14} />Reset Data</>
            }
          </button>
        </div>
        {confirmReset && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            <span>Klik sekali lagi untuk konfirmasi. Tindakan tidak dapat dibatalkan.</span>
            <button onClick={() => setConfirmReset(false)} className="ml-3 underline text-red-500 hover:text-red-700">Batal</button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");

  const CONTENT: Record<string, React.ReactNode> = {
    general:  <GeneralSection />,
    smtp:     <SmtpSection />,
    security: <SecuritySection />,
    notif:    <NotifSection />,
    system:   <SystemSection />,
  };

  return (
    <AppShell title="Pengaturan" subtitle="Konfigurasi aplikasi KerjaBareng">
      <div className="flex gap-6 max-w-5xl">
        {/* ── Sidebar nav ── */}
        <div className="w-48 shrink-0">
          <nav className="card overflow-hidden">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-slate-100 last:border-0",
                    active
                      ? "bg-[#e8f4f8] text-[#1a5f7a] font-medium border-l-2 border-l-[#1a5f7a]"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon size={15} className={active ? "text-[#1a5f7a]" : "text-slate-400"} />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">
          {CONTENT[activeSection]}
        </div>
      </div>
    </AppShell>
  );
}
