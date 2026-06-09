"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import Modal from "@/components/ui/Modal";
import {
  UserPlus, Search, MoreHorizontal, Shield,
  User, Mail, Phone, Building2, Flame,
  CheckCircle2, Clock, AlertTriangle,
  Edit2, Trash2, Key, UserX, UserCheck,
  Loader2, ChevronDown, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type Role   = "admin" | "user";

interface MemberStats {
  done:    number;
  pending: number;
  overdue: number;
  streak:  number;
}

interface Member {
  id:            string;
  fullName:      string;
  email:         string;
  division?:     string;
  role:          Role;
  emailVerified: boolean;
  avatarInitial: string;
  createdAt:     string;
  status:        "active" | "inactive";
  stats:         MemberStats;
  lastActive:    string;
  phone?:        string;
}


const DIVISIONS = ["Engineering", "Design", "Backend", "Frontend", "QA", "DevOps", "Product", "Marketing"];

/* ═══════════════════════════════════════════════════════════════
   INVITE MODAL
═══════════════════════════════════════════════════════════════ */
const inputCls = cn(
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none",
  "bg-white text-slate-800 placeholder:text-slate-400",
  "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all"
);

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading]   = useState(false);
  const [emails, setEmails]     = useState<string[]>([]);
  const [input, setInput]       = useState("");
  const [role, setRole]         = useState<Role>("user");
  const [division, setDivision] = useState("");
  const [result, setResult]     = useState<{ success: boolean; message: string } | null>(null);

  function addEmail() {
    const trimmed = input.trim();
    if (trimmed && !emails.includes(trimmed) && trimmed.includes("@")) {
      setEmails((prev) => [...prev, trimmed]);
      setInput("");
    }
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (emails.length === 0) return;
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch("/api/admin/invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ emails, role, division: division || undefined }),
      });
      const data = await res.json();
      setResult({ success: res.ok, message: data.message ?? data.error ?? "Terjadi kesalahan." });
      if (res.ok) {
        setEmails([]);
        setInput("");
        setTimeout(() => { setResult(null); onClose(); }, 2500);
      }
    } catch {
      setResult({ success: false, message: "Gagal terhubung ke server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Undang Anggota Baru" description="Kirim undangan via email ke anggota tim" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Email input + chip */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Email <span className="text-red-500">*</span>
          </label>

          {/* Chips */}
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {emails.map((e) => (
                <span key={e} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f4f8] text-[#1a5f7a] text-xs font-medium">
                  {e}
                  <button type="button" onClick={() => removeEmail(e)} className="hover:text-red-500">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="nama@perusahaan.com"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEmail(); } }}
              className={cn(inputCls, "flex-1")}
            />
            <button type="button" onClick={addEmail} className="btn btn-secondary h-10 px-3 text-sm rounded-lg shrink-0">
              Tambah
            </button>
          </div>
          <p className="text-xs text-slate-400">Tekan Enter atau koma untuk menambah lebih dari satu email</p>
        </div>

        {/* Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Role</label>
          <div className="grid grid-cols-2 gap-2">
            {(["user", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                  role === r
                    ? "border-[#1a5f7a] bg-[#e8f4f8]"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  role === r ? "bg-[#1a5f7a]" : "bg-slate-100"
                )}>
                  {r === "admin" ? (
                    <Shield size={15} className={role === r ? "text-white" : "text-slate-500"} />
                  ) : (
                    <User size={15} className={role === r ? "text-white" : "text-slate-500"} />
                  )}
                </div>
                <div>
                  <p className={cn("text-sm font-medium capitalize", role === r ? "text-[#1a5f7a]" : "text-slate-700")}>
                    {r === "admin" ? "Admin" : "Member"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {r === "admin" ? "Akses penuh" : "Akses terbatas"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Division */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Divisi</label>
          <select value={division} onChange={(e) => setDivision(e.target.value)} className={inputCls}>
            <option value="">Pilih divisi...</option>
            {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Result feedback */}
        {result && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm",
            result.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
          )}>
            {result.success
              ? <CheckCircle2 size={14} className="shrink-0" />
              : <AlertTriangle size={14} className="shrink-0" />
            }
            {result.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn btn-secondary h-9 px-4 text-sm rounded-lg">Batal</button>
          <button
            type="submit"
            disabled={loading || emails.length === 0}
            className="btn btn-primary h-9 px-4 text-sm rounded-lg disabled:opacity-50"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Mengirim...</> : `Kirim Undangan${emails.length > 1 ? ` (${emails.length})` : ""}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDIT MEMBER MODAL
═══════════════════════════════════════════════════════════════ */
function EditMemberModal({
  member,
  onClose,
  onUpdated,
}: {
  member: Member | null;
  onClose: () => void;
  onUpdated: (m: Member) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm] = useState({
    fullName: member?.fullName ?? "",
    division: member?.division ?? "",
    role:     member?.role     ?? "user" as Role,
  });

  if (!member) return null;

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${member!.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          fullName: form.fullName,
          role:     form.role,
          division: form.division || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan.");
        return;
      }
      /* Merge data yg diperbarui ke local state */
      onUpdated({
        ...member!,
        fullName:      data.fullName,
        role:          data.role,
        division:      data.division ?? undefined,
        avatarInitial: data.fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
      });
      onClose();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!member} onClose={onClose} title="Edit Anggota" description={`Edit data untuk ${member.fullName}`} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
          <input type="text" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input type="email" value={member.email} disabled className={cn(inputCls, "opacity-60 cursor-not-allowed")} />
          <p className="text-xs text-slate-400">Email tidak dapat diubah.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Divisi</label>
          <select value={form.division} onChange={(e) => set("division", e.target.value)} className={inputCls}>
            <option value="">Pilih divisi...</option>
            {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {/* Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Role</label>
          <div className="grid grid-cols-2 gap-2">
            {(["user", "admin"] as const).map((r) => (
              <button
                key={r} type="button" onClick={() => set("role", r)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all",
                  form.role === r ? "border-[#1a5f7a] bg-[#e8f4f8] text-[#1a5f7a] font-medium" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {r === "admin" ? <Shield size={14} /> : <User size={14} />}
                {r === "admin" ? "Admin" : "Member"}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle size={11} /> {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn btn-secondary h-9 px-4 text-sm rounded-lg">Batal</button>
          <button type="submit" disabled={loading} className="btn btn-primary h-9 px-4 text-sm rounded-lg disabled:opacity-50">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER CARD
═══════════════════════════════════════════════════════════════ */
function MemberCard({
  member,
  onEdit,
  onToggleStatus,
  onDelete,
  onResetPw,
}: {
  member: Member;
  onEdit: (m: Member) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onResetPw: (m: Member) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = member.status === "active";
  const total    = member.stats.done + member.stats.pending + member.stats.overdue;
  const rate     = total > 0 ? Math.round((member.stats.done / total) * 100) : 0;

  return (
    <div className={cn("card p-5 flex flex-col gap-4 card-hover", !isActive && "opacity-60")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center font-semibold text-white text-sm",
              member.role === "admin" ? "bg-amber-500" : "bg-[#1a5f7a]"
            )}>
              {member.avatarInitial}
            </div>
            {isActive && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-slate-900 truncate">{member.fullName}</p>
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                member.role === "admin"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              )}>
                {member.role === "admin" ? "Admin" : "Member"}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{member.email}</p>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-200 rounded-lg shadow-card-hover py-1 text-sm">
                <button onClick={() => { onEdit(member); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50">
                  <Edit2 size={13} /> Edit Data
                </button>
                <button onClick={() => { onResetPw(member); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50">
                  <Key size={13} /> Reset Password
                </button>
                <button onClick={() => { onToggleStatus(member.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50">
                  {isActive ? <><UserX size={13} /> Nonaktifkan</> : <><UserCheck size={13} /> Aktifkan</>}
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { onDelete(member.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-red-500 hover:bg-red-50">
                  <Trash2 size={13} /> Hapus Anggota
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {member.division && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Building2 size={11} className="text-slate-400 shrink-0" />
            {member.division}
          </div>
        )}
        {member.phone && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Phone size={11} className="text-slate-400 shrink-0" />
            {member.phone}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-slate-500">
          <Mail size={11} className="text-slate-400 shrink-0" />
          <span className="truncate">{member.email}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock size={11} className="shrink-0" />
          {member.lastActive}
        </div>
      </div>

      {/* Stats mini bar */}
      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Completion rate</span>
          <span className={cn(
            "font-mono font-semibold",
            rate >= 85 ? "text-emerald-600" : rate >= 70 ? "text-amber-600" : "text-red-500"
          )}>
            {rate}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              rate >= 85 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-red-400"
            )}
            style={{ width: `${rate}%` }}
          />
        </div>

        {/* Stat chips */}
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={10} />{member.stats.done} selesai
          </span>
          <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <Clock size={10} />{member.stats.pending} pending
          </span>
          {member.stats.overdue > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} />{member.stats.overdue} overdue
            </span>
          )}
          {member.stats.streak > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 ml-auto">
              <Flame size={10} />{member.stats.streak}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER TABLE ROW
═══════════════════════════════════════════════════════════════ */
function MemberRow({
  member,
  onEdit,
  onToggleStatus,
  onDelete,
  onResetPw,
}: {
  member: Member;
  onEdit: (m: Member) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onResetPw: (m: Member) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = member.status === "active";
  const total    = member.stats.done + member.stats.pending + member.stats.overdue;
  const rate     = total > 0 ? Math.round((member.stats.done / total) * 100) : 0;

  return (
    <tr className={cn("hover:bg-slate-50 transition-colors group", !isActive && "opacity-60")}>
      {/* Member */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white",
              member.role === "admin" ? "bg-amber-500" : "bg-[#1a5f7a]"
            )}>
              {member.avatarInitial}
            </div>
            {isActive && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{member.fullName}</p>
            <p className="text-xs text-slate-400">{member.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3.5">
        <span className={cn(
          "text-xs font-semibold px-2 py-0.5 rounded-full",
          member.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
        )}>
          {member.role === "admin" ? "Admin" : "Member"}
        </span>
      </td>

      {/* Division */}
      <td className="px-4 py-3.5 text-sm text-slate-600">{member.division ?? "—"}</td>

      {/* Completion */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", rate >= 85 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-red-400")}
              style={{ width: `${rate}%` }}
            />
          </div>
          <span className={cn(
            "font-mono text-xs font-semibold",
            rate >= 85 ? "text-emerald-600" : rate >= 70 ? "text-amber-600" : "text-red-500"
          )}>
            {rate}%
          </span>
        </div>
      </td>

      {/* Streak */}
      <td className="px-4 py-3.5">
        <span className="flex items-center gap-1 text-sm text-amber-600 font-mono font-medium">
          <Flame size={13} className="text-amber-500" />{member.stats.streak}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <span className={cn(
          "flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-0.5 rounded-full",
          isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-slate-400")} />
          {isActive ? "Aktif" : "Nonaktif"}
        </span>
      </td>

      {/* Last active */}
      <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">{member.lastActive}</td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-200 rounded-lg shadow-card-hover py-1 text-sm">
                <button onClick={() => { onEdit(member); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50">
                  <Edit2 size={13} /> Edit Data
                </button>
                <button onClick={() => { onResetPw(member); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50">
                  <Key size={13} /> Reset Password
                </button>
                <button onClick={() => { onToggleStatus(member.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50">
                  {isActive ? <><UserX size={13} /> Nonaktifkan</> : <><UserCheck size={13} /> Aktifkan</>}
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { onDelete(member.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-red-500 hover:bg-red-50">
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONFIRM DELETE MODAL
═══════════════════════════════════════════════════════════════ */
function ConfirmDeleteModal({ member, onConfirm, onClose }: {
  member: Member | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!member) return null;

  async function handleConfirm() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    onConfirm();
    onClose();
  }

  return (
    <Modal open={!!member} onClose={onClose} title="Hapus Anggota" size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
          <div className="w-10 h-10 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{member.avatarInitial}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{member.fullName}</p>
            <p className="text-xs text-slate-500">{member.email}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Akun <span className="font-semibold">{member.fullName}</span> akan dihapus secara permanen.
          Semua data tugas dan riwayat tetap tersimpan, namun akun tidak bisa diakses lagi.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="btn btn-secondary h-9 px-4 text-sm rounded-lg">Batal</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="btn h-9 px-4 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Menghapus...</> : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function TeamPage() {
  const [members, setMembers]       = useState<Member[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [divFilter, setDivFilter]   = useState("all");
  const [viewMode, setViewMode]     = useState<"grid" | "table">("table");

  const [inviteOpen, setInviteOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [resetTarget, setResetTarget]   = useState<Member | null>(null);

  /* ── Fetch dari API ── */
  function fetchMembers() {
    setLoading(true);
    setFetchError("");
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMembers(data.map((u) => ({
            ...u,
            avatarInitial: (u.fullName || "").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
            status:     u.status     ?? "active",
            stats:      u.stats      ?? { done: 0, pending: 0, overdue: 0, streak: 0 },
            lastActive: u.lastActive ?? "—",
          })));
        } else {
          setFetchError(data.error ?? "Gagal memuat data anggota.");
        }
      })
      .catch(() => setFetchError("Gagal terhubung ke server."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchMembers(); }, []);

  /* ── Filter ── */
  const allDivisions = Array.from(new Set(members.map((m) => m.division).filter(Boolean))) as string[];

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.division ?? "").toLowerCase().includes(q);
    const matchRole   = roleFilter === "all" || m.role === roleFilter;
    const matchDiv    = divFilter  === "all" || m.division === divFilter;
    return matchSearch && matchRole && matchDiv;
  });

  /* ── Handlers ── */
  async function deleteMember(id: string) {
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } else {
      const data = await res.json();
      alert(data.error ?? "Gagal menghapus anggota.");
    }
  }

  function updateMember(updated: Member) {
    setMembers((prev) => prev.map((m) => m.id === updated.id ? updated : m));
  }

  async function toggleStatus(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const newIsActive = member.status !== "active";
    const res = await fetch(`/api/admin/users?id=${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: newIsActive }),
    });
    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) => m.id === id ? { ...m, status: newIsActive ? "active" : "inactive" } : m)
      );
    } else {
      const data = await res.json();
      alert(data.error ?? "Gagal mengubah status anggota.");
    }
  }

  async function sendResetPassword(member: Member) {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: member.email }),
      });
      const data = await res.json();
      alert(res.ok
        ? `Link reset password telah dikirim ke ${member.email}.`
        : (data.error ?? "Gagal mengirim link reset password.")
      );
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  }

  /* ── Summary stats ── */
  const totalAdmin    = members.filter((m) => m.role === "admin").length;
  const totalVerified = members.filter((m) => m.emailVerified).length;

  return (
    <>
      <AppShell
        title="Tim"
        subtitle="Kelola anggota dan akses tim"
        action={
          <button onClick={() => setInviteOpen(true)} className="btn btn-primary gap-1.5 h-9 px-3 text-sm rounded-lg">
            <UserPlus size={16} />
            <span className="hidden sm:inline">Undang Anggota</span>
          </button>
        }
      >
        <div className="flex flex-col gap-5 max-w-7xl">

          {/* ── Error / Loading ── */}
          {fetchError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              <AlertTriangle size={15} className="shrink-0" />
              <span className="flex-1">{fetchError}</span>
              <button onClick={fetchMembers} className="font-medium hover:underline">Coba Lagi</button>
            </div>
          )}

          {/* ── Summary bar ── */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Anggota", value: members.length, icon: User,      color: "text-[#1a5f7a] bg-[#e8f4f8]" },
              { label: "Terverifikasi", value: totalVerified,  icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
              { label: "Admin",         value: totalAdmin,     icon: Shield,    color: "text-amber-600 bg-amber-50" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card px-5 py-4 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color.split(" ")[1])}>
                  <Icon size={18} className={color.split(" ")[0]} />
                </div>
                <div>
                  <p className="mono-stat text-2xl font-semibold">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm flex-1 max-w-72">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari nama, email, divisi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Role filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as "all" | Role)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#1a5f7a] cursor-pointer"
                >
                  <option value="all">Semua Role</option>
                  <option value="admin">Admin</option>
                  <option value="user">Member</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Division filter */}
              <div className="relative">
                <select
                  value={divFilter}
                  onChange={(e) => setDivFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#1a5f7a] cursor-pointer"
                >
                  <option value="all">Semua Divisi</option>
                  {allDivisions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* View toggle */}
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white ml-auto sm:ml-0">
                {(["table", "grid"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={cn("px-3 py-2 text-xs transition-colors", viewMode === v ? "bg-[#1a5f7a] text-white" : "text-slate-500 hover:bg-slate-50")}
                  >
                    {v === "table" ? "Tabel" : "Kartu"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="card flex items-center justify-center py-20 gap-2 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Memuat data anggota...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <User size={22} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Tidak ada anggota ditemukan</p>
              <p className="text-xs text-slate-400">Coba ubah filter pencarian</p>
            </div>
          ) : viewMode === "table" ? (
            /* Table */
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                      {["Anggota", "Role", "Divisi", "Completion", "Streak", "Status", "Terakhir Aktif", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide first:px-5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((m) => (
                      <MemberRow
                        key={m.id} member={m}
                        onEdit={setEditTarget}
                        onToggleStatus={toggleStatus}
                        onDelete={(id) => setDeleteTarget(members.find((x) => x.id === id) ?? null)}
                        onResetPw={setResetTarget}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-400 font-mono">
                  Menampilkan {filtered.length} dari {members.length} anggota
                </p>
              </div>
            </div>
          ) : (
            /* Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <MemberCard
                  key={m.id} member={m}
                  onEdit={setEditTarget}
                  onToggleStatus={toggleStatus}
                  onDelete={(id) => setDeleteTarget(members.find((x) => x.id === id) ?? null)}
                  onResetPw={setResetTarget}
                />
              ))}
            </div>
          )}
        </div>
      </AppShell>

      {/* Modals */}
      <InviteModal open={inviteOpen} onClose={() => { setInviteOpen(false); fetchMembers(); }} />
      <EditMemberModal member={editTarget} onClose={() => setEditTarget(null)} onUpdated={updateMember} />
      <ConfirmDeleteModal
        member={deleteTarget}
        onConfirm={() => deleteTarget && deleteMember(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
      {/* Reset password confirmation */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Link reset password akan dikirim ke{" "}
            <span className="font-semibold text-slate-800">{resetTarget?.email}</span>.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setResetTarget(null)} className="btn btn-secondary h-9 px-4 text-sm rounded-lg">Batal</button>
            <button
              onClick={async () => {
                if (resetTarget) await sendResetPassword(resetTarget);
                setResetTarget(null);
              }}
              className="btn btn-primary h-9 px-4 text-sm rounded-lg"
            >
              Kirim Link Reset
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
