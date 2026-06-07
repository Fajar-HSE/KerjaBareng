"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const MEMBERS = [
  { id: "1", name: "Budi Santoso",   initial: "BS" },
  { id: "2", name: "Citra Ayu",      initial: "CA" },
  { id: "3", name: "Deni Ramadhan",  initial: "DR" },
  { id: "4", name: "Eka Mulyani",    initial: "EM" },
  { id: "5", name: "Fajar Laksono",  initial: "FL" },
  { id: "6", name: "Gina Safitri",   initial: "GS" },
];

const inputCls = cn(
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none",
  "bg-white text-slate-800 placeholder:text-slate-400",
  "focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all"
);

export default function CreateTaskModal({ open, onClose, onCreated }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedToId: "",
    deadline: "",
    targetType: "daily",
    priority: "medium",
    tags: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: POST /api/tasks
    await new Promise((r) => setTimeout(r, 800)); // simulasi
    setLoading(false);
    setForm({ title: "", description: "", assignedToId: "", deadline: "", targetType: "daily", priority: "medium", tags: "" });
    onCreated?.();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Tugas Baru"
      description="Isi detail tugas dan assign ke anggota tim"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
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

        {/* Description */}
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

        {/* Assignee */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Assign ke <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.map((m) => (
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
                  {m.initial}
                </div>
                {m.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Row: Deadline + Target Type */}
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

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Prioritas</label>
          <div className="flex gap-2">
            {[
              { value: "high",   label: "Tinggi", cls: "border-red-300 bg-red-50 text-red-700",     activeCls: "border-red-500 bg-red-100" },
              { value: "medium", label: "Sedang", cls: "border-amber-300 bg-amber-50 text-amber-700", activeCls: "border-amber-500 bg-amber-100" },
              { value: "low",    label: "Rendah", cls: "border-slate-200 bg-slate-50 text-slate-600", activeCls: "border-slate-400 bg-slate-100" },
            ].map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set("priority", p.value)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                  form.priority === p.value ? p.activeCls : p.cls
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Tags <span className="text-xs text-slate-400 font-normal">(pisahkan dengan koma)</span>
          </label>
          <input
            type="text"
            placeholder="design, frontend, urgent"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
          <button type="button" onClick={onClose} className="btn btn-secondary h-9 px-4 text-sm rounded-lg">
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !form.title || !form.assignedToId || !form.deadline}
            className="btn btn-primary h-9 px-4 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
            ) : (
              "Buat Tugas"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
