"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Drawer from "@/components/ui/Drawer";
import {
  Calendar, User, Tag, Clock, CheckCircle2,
  AlertTriangle, Circle, Send,
  ChevronDown, Edit2, Trash2, Loader2,
  X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
type Status   = "pending" | "in_progress" | "done" | "overdue";
type Priority = "high" | "medium" | "low";

export interface Task {
  id:              number;
  rawId?:          string; // UUID dari API
  title:           string;
  description:     string;
  assignee:        string;
  assigneeInitial: string;
  assigneeId?:     string;
  status:          Status;
  priority:        Priority;
  deadline:        string;
  targetType:      "daily" | "weekly";
  tags:            string[];
}

interface ProgressItem {
  id:           string;
  progressNote: string | null;
  isChecklist:  boolean;
  createdAt:    string;
  user:         { id: string; fullName: string; avatarUrl: string | null };
}

interface TaskDetailDrawerProps {
  task:       Task | null;
  onClose:    () => void;
  onUpdated?: () => void; // callback untuk refresh list
}

/* ─── Config ─────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<Status, {
  label: string; icon: React.ElementType; badgeCls: string; iconCls: string; menuCls: string;
}> = {
  pending:     { label: "Pending",     icon: Circle,        badgeCls: "badge badge-pending",  iconCls: "text-amber-500",  menuCls: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
  in_progress: { label: "In Progress", icon: Clock,         badgeCls: "badge badge-progress", iconCls: "text-blue-500",   menuCls: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
  done:        { label: "Selesai",     icon: CheckCircle2,  badgeCls: "badge badge-done",     iconCls: "text-emerald-500",menuCls: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" },
  overdue:     { label: "Overdue",     icon: AlertTriangle, badgeCls: "badge badge-overdue",  iconCls: "text-red-500",    menuCls: "text-red-600 bg-red-50 hover:bg-red-100" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string }> = {
  high:   { label: "Tinggi", cls: "bg-red-100 text-red-700" },
  medium: { label: "Sedang", cls: "bg-amber-100 text-amber-700" },
  low:    { label: "Rendah", cls: "bg-slate-100 text-slate-600" },
};

/* ─── Helper ─────────────────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function getInitial(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/* ─── Status Dropdown ────────────────────────────────────────── */
function StatusDropdown({
  status, taskId, isOwnerOrAdmin, onStatusChange,
}: {
  status: Status;
  taskId: string;
  isOwnerOrAdmin: boolean;
  onStatusChange: (s: Status) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const s = STATUS_CONFIG[status];
  const StatusIcon = s.icon;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function changeStatus(next: Status) {
    if (next === status) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: next }),
      });
      if (res.ok) onStatusChange(next);
      else console.error("[STATUS UPDATE]", await res.json());
    } catch (err) {
      console.error("[STATUS UPDATE]", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => isOwnerOrAdmin && setOpen((v) => !v)}
        disabled={loading || !isOwnerOrAdmin}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors",
          s.badgeCls, "border-transparent",
          isOwnerOrAdmin ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-80"
        )}
      >
        {loading
          ? <Loader2 size={12} className="animate-spin" />
          : <StatusIcon size={12} className={s.iconCls} />
        }
        {s.label}
        {isOwnerOrAdmin && <ChevronDown size={11} />}
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-30 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm">
          {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => changeStatus(key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 transition-colors",
                  key === status ? cfg.menuCls + " font-semibold" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon size={13} className={cfg.iconCls} />
                {cfg.label}
                {key === status && <Check size={12} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Add Progress Form ──────────────────────────────────────── */
function AddProgressForm({
  taskId,
  onAdded,
}: {
  taskId: string;
  onAdded: (item: ProgressItem) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [note, setNote]       = useState("");
  const [markDone, setMarkDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) { setError("Catatan progress wajib diisi."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/progress`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          progressNote: note.trim(),
          isChecklist:  markDone,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal menyimpan."); return; }
      onAdded(data);
      setNote("");
      setMarkDone(false);
      setOpen(false);
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-[#1a5f7a] hover:text-[#1a5f7a] transition-colors"
      >
        + Tambah Update Progress
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#1a5f7a]/30 bg-[#f0f9ff] p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1a5f7a]">Update Progress</span>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X size={14} />
        </button>
      </div>

      <textarea
        placeholder="Deskripsikan progress yang sudah dikerjakan..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none outline-none focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 bg-white transition-all"
        autoFocus
      />

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
        </p>
      )}

      {/* Mark as done toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div
          onClick={() => setMarkDone((v) => !v)}
          className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
            markDone ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
          )}
        >
          {markDone && <Check size={10} className="text-white" />}
        </div>
        <span className="text-xs text-slate-600">Tandai tugas sebagai <strong>Selesai</strong></span>
      </label>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-secondary h-8 px-3 text-xs rounded-lg"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading || !note.trim()}
          className="btn btn-primary h-8 px-3 text-xs rounded-lg disabled:opacity-50 gap-1.5"
        >
          {loading ? <><Loader2 size={12} className="animate-spin" />Menyimpan...</> : "Simpan"}
        </button>
      </div>
    </form>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function TaskDetailDrawer({ task, onClose, onUpdated }: TaskDetailDrawerProps) {
  const { data: session } = useSession();

  const [activeTab, setActiveTab]   = useState<"progress" | "comments">("progress");
  const [currentStatus, setCurrentStatus] = useState<Status>(task?.status ?? "pending");
  const [progresses, setProgresses] = useState<ProgressItem[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [comment, setComment]       = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // Sinkronkan status saat task berubah
  useEffect(() => {
    if (task) setCurrentStatus(task.status);
  }, [task]);

  // Fetch progresses dari API saat task dibuka
  useEffect(() => {
    if (!task?.rawId) return;
    setLoadingProgress(true);
    fetch(`/api/tasks/${task.rawId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.progresses) setProgresses(data.progresses);
      })
      .catch(console.error)
      .finally(() => setLoadingProgress(false));
  }, [task?.rawId]);

  if (!task) return <Drawer open={false} onClose={onClose}>{null}</Drawer>;

  const isAdmin       = session?.user?.role === "admin";
  const isOwner       = session?.user?.id === task.assigneeId;
  const isOwnerOrAdmin = isAdmin || isOwner;

  const p = PRIORITY_CONFIG[task.priority];

  function handleStatusChange(newStatus: Status) {
    setCurrentStatus(newStatus);
    onUpdated?.();
  }

  function handleProgressAdded(item: ProgressItem) {
    setProgresses((prev) => [item, ...prev]);
    // Jika isChecklist → status jadi done
    if (item.isChecklist) {
      setCurrentStatus("done");
      onUpdated?.();
    }
  }

  async function handleSendComment() {
    if (!comment.trim() || !task.rawId) return;
    setSendingComment(true);
    // Komentar dikirim sebagai progress note (tanpa isChecklist)
    try {
      const res = await fetch(`/api/tasks/${task.rawId}/progress`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ progressNote: comment.trim(), isChecklist: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setProgresses((prev) => [data, ...prev]);
        setComment("");
        setActiveTab("progress"); // komentar masuk ke tab progress
      }
    } catch (err) {
      console.error("[SEND COMMENT]", err);
    } finally {
      setSendingComment(false);
    }
  }

  return (
    <Drawer open={!!task} onClose={onClose} title="Detail Tugas">
      <div className="flex flex-col h-full">

        {/* ── Header ── */}
        <div className="px-6 pt-2 pb-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-base font-semibold text-slate-900 leading-snug flex-1">
              {task.title}
            </h1>
            {isAdmin && (
              <div className="flex items-center gap-1 shrink-0">
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={async () => {
                    if (!task.rawId || !confirm("Hapus tugas ini?")) return;
                    const res = await fetch(`/api/tasks/${task.rawId}`, { method: "DELETE" });
                    if (res.ok) { onUpdated?.(); onClose(); }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Status + Priority + Target */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <StatusDropdown
              status={currentStatus}
              taskId={task.rawId ?? ""}
              isOwnerOrAdmin={isOwnerOrAdmin}
              onStatusChange={handleStatusChange}
            />
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", p.cls)}>
              {p.label}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
              {task.targetType === "daily" ? "Harian" : "Mingguan"}
            </span>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <User size={13} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Assignee</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-4 h-4 rounded-full bg-[#1a5f7a] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">{task.assigneeInitial}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-700">{task.assignee}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Calendar size={13} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Deadline</p>
                <p className={cn(
                  "text-xs font-medium mt-0.5 font-mono",
                  currentStatus === "overdue" ? "text-red-500" : "text-slate-700"
                )}>
                  {new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {task.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e8f4f8] text-[#1a5f7a]">
                  <Tag size={9} />{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-100 shrink-0 px-6">
          {(["progress", "comments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab
                  ? "border-[#1a5f7a] text-[#1a5f7a]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === "progress" ? (
                <span className="flex items-center gap-1.5">
                  Progress
                  {progresses.length > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {progresses.length}
                    </span>
                  )}
                </span>
              ) : "Komentar"}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "progress" ? (
            <div className="flex flex-col gap-4">
              {/* Add progress — hanya untuk owner atau admin */}
              {isOwnerOrAdmin && task.rawId && (
                <AddProgressForm
                  taskId={task.rawId}
                  onAdded={handleProgressAdded}
                />
              )}

              {/* Progress list */}
              {loadingProgress ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Memuat progress...</span>
                </div>
              ) : progresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">Belum ada update progress.</p>
                  {isOwnerOrAdmin && (
                    <p className="text-xs text-slate-400 mt-1">Klik tombol di atas untuk menambahkan.</p>
                  )}
                </div>
              ) : (
                progresses.map((prog) => (
                  <div key={prog.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-white">
                        {getInitial(prog.user.fullName)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700">{prog.user.fullName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{timeAgo(prog.createdAt)}</span>
                        {prog.isChecklist && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 size={9} /> Selesai
                          </span>
                        )}
                      </div>
                      {prog.progressNote && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                          {prog.progressNote}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Komentar tab — gunakan textarea kirim via progress API */
            <div className="flex flex-col gap-4">
              {loadingProgress ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              ) : progresses.filter((p) => !p.isChecklist).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">Belum ada komentar.</p>
                </div>
              ) : (
                progresses.filter((p) => !p.isChecklist).map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-slate-600">
                        {getInitial(c.user.fullName)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700">{c.user.fullName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.progressNote}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Comment Input ── */}
        {activeTab === "comments" && isOwnerOrAdmin && (
          <div className="px-6 py-4 border-t border-slate-100 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                placeholder="Tulis komentar..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none outline-none focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all"
              />
              <button
                onClick={handleSendComment}
                disabled={!comment.trim() || sendingComment}
                className="btn btn-primary h-9 w-9 p-0 rounded-lg disabled:opacity-40"
                aria-label="Kirim komentar"
              >
                {sendingComment
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Send size={14} />
                }
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Enter untuk kirim · Shift+Enter baris baru</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}
