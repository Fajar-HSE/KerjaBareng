"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { Loader2, User, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  /** "admin" bisa assign ke siapapun, "user" hanya ke diri sendiri */
  role?: "admin" | "user";
  /** Data user yang sedang login (untuk mode user) */
  currentUser?: { id: string; name: string; initial: string };
}

interface DbUser {
  id: string;
  fullName: string;
}

function getInitial(name: string) {
  return (name || "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const inputCls = cn(
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none",
  "bg-white text-slate-800 placeholder:text-slate-400",
  "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all"
);

const EMPTY_FORM = {
  title: "",
  description: "",
  assignedToId: "",
  deadline: "",
  targetType: "daily",
  priority: "medium",
  tags: "",
};

export default function CreateTaskModal({
  open,
  onClose,
  onCreated,
  role = "admin",
  currentUser,
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [members, setMembers] = useState<DbUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (open && role === "admin") {
      setLoadingMembers(true);
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMembers(data);
          }
        })
        .catch((err) => console.error("Gagal memuat user:", err))
        .finally(() => setLoadingMembers(false));
    }
  }, [open, role]);

  const isUser     = role === "user";
  const selfId     = currentUser?.id ?? "";

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const [submitError, setSubmitError] = useState("");

  function handleClose() {
    setForm({ ...EMPTY_FORM });
    setSubmitError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");

    try {
      const payload = {
        title:        form.title.trim(),
        description:  form.description.trim() || undefined,
        assignedToId: isUser ? selfId : form.assignedToId,
        deadline:     form.deadline,
        targetType:   form.targetType,
        priority:     form.priority,
        tags:         form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch("/api/tasks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Gagal membuat tugas. Coba lagi.");
      } else {
        setForm({ ...EMPTY_FORM });
        setSubmitError("");
        onCreated?.();
        handleClose();
      }
    } catch {
      setSubmitError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = form.title && form.deadline && (isUser ? !!selfId : !!form.assignedToId);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Buat Tugas Baru"
      description={
        isUser
          ? "Buat tugas untuk dirimu sendiri"
          : "Isi detail tugas dan assign ke anggota tim"
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* ── Info banner untuk user ── */}
        {isUser && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#e8f4f8] border border-[#1a5f7a]/20 text-sm text-[#1a5f7a]">
            <Lock size={14} className="shrink-0" />
            <span>Tugas akan otomatis ditugaskan ke kamu.</span>
          </div>
        )}

        {/* ── Title ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Judul Tugas <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: Finalisasi desain halaman utama"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            className={inputCls}
          />
        </div>

        {/* ── Description ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Deskripsi</label>
          <textarea
            placeholder="Jelaskan detail tugas, konteks, dan ekspektasi hasil..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className={cn(inputCls, "resize-none")}
          />
        </div>

        {/* ── Assignee ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Assign ke <span className="text-red-500">*</span>
          </label>

          {isUser ? (
            /* User mode — tampilkan diri sendiri, locked */
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg border",
              "bg-slate-50 border-slate-200 cursor-not-allowed"
            )}>
              <div className="w-8 h-8 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {currentUser?.initial ?? "ME"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {currentUser?.name ?? "Kamu"}
                </p>
                <p className="text-xs text-slate-400">Tugas untuk diri sendiri</p>
              </div>
              <User size={15} className="text-slate-400 shrink-0" />
            </div>
          ) : (
            /* Admin mode — pilih dari semua anggota */
            <div className="flex flex-wrap gap-2">
              {loadingMembers ? (
                <div className="flex items-center gap-1.5 py-1 text-slate-400 text-xs">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memuat anggota tim...</span>
                </div>
              ) : members.length === 0 ? (
                <p className="text-xs text-slate-400">Tidak ada anggota tim ditemukan.</p>
              ) : (
                members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => set("assignedToId", m.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all",
                      form.assignedToId === m.id
                        ? "border-[#1a5f7a] bg-[#e8f4f8] text-[#1a5f7a] font-medium"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                      form.assignedToId === m.id ? "bg-[#1a5f7a] text-white" : "bg-slate-200 text-slate-600"
                    )}>
                      {getInitial(m.fullName)}
                    </div>
                    {m.fullName.split(" ")[0]}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Deadline + Target Type ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
              required
              min={new Date().toISOString().split("T")[0]}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Tipe Target</label>
            <select
              value={form.targetType}
              onChange={(e) => set("targetType", e.target.value)}
              className={inputCls}
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
            </select>
          </div>
        </div>

        {/* ── Priority ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Prioritas</label>
          <div className="flex gap-2">
            {[
              { value: "high",   label: "Tinggi", normal: "border-red-200 bg-red-50 text-red-600",      active: "border-red-500 bg-red-100 text-red-700 font-semibold" },
              { value: "medium", label: "Sedang", normal: "border-amber-200 bg-amber-50 text-amber-600", active: "border-amber-500 bg-amber-100 text-amber-700 font-semibold" },
              { value: "low",    label: "Rendah", normal: "border-slate-200 bg-slate-50 text-slate-500", active: "border-slate-400 bg-slate-100 text-slate-700 font-semibold" },
            ].map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set("priority", p.value)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-sm transition-all",
                  form.priority === p.value ? p.active : p.normal
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tags ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Tags{" "}
            <span className="text-xs text-slate-400 font-normal">(pisahkan dengan koma)</span>
          </label>
          <input
            type="text"
            placeholder="design, frontend, urgent"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* ── Error ── */}
        {submitError && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            <AlertTriangle size={14} className="shrink-0" />
            {submitError}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary h-9 px-4 text-sm rounded-lg"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="btn btn-primary h-9 px-4 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
              : "Buat Tugas"
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}
