"use client";

import { useState } from "react";
import Drawer from "@/components/ui/Drawer";
import {
  Calendar, User, Tag, Clock, CheckCircle2,
  AlertTriangle, Circle, Paperclip, Send,
  ChevronDown, Edit2, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Status   = "pending" | "in_progress" | "done" | "overdue";
type Priority = "high" | "medium" | "low";

interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  assigneeInitial: string;
  status: Status;
  priority: Priority;
  deadline: string;
  targetType: "daily" | "weekly";
  tags: string[];
}

interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
}

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; badgeCls: string; iconCls: string }> = {
  pending:     { label: "Pending",     icon: Circle,        badgeCls: "badge badge-pending",  iconCls: "text-amber-500" },
  in_progress: { label: "In Progress", icon: Clock,         badgeCls: "badge badge-progress", iconCls: "text-blue-500" },
  done:        { label: "Selesai",     icon: CheckCircle2,  badgeCls: "badge badge-done",     iconCls: "text-emerald-500" },
  overdue:     { label: "Overdue",     icon: AlertTriangle, badgeCls: "badge badge-overdue",  iconCls: "text-red-500" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string }> = {
  high:   { label: "Tinggi", cls: "bg-red-100 text-red-700" },
  medium: { label: "Sedang", cls: "bg-amber-100 text-amber-700" },
  low:    { label: "Rendah", cls: "bg-slate-100 text-slate-600" },
};

const MOCK_PROGRESS = [
  { id: 1, user: "Budi S.", initial: "BS", note: "Sudah selesaikan wireframe, lanjut ke mockup high-fidelity.", time: "Hari ini, 14:30", hasAttachment: false },
  { id: 2, user: "Budi S.", initial: "BS", note: "Mockup selesai, upload ke Figma. Menunggu review dari PM.", time: "Hari ini, 16:00", hasAttachment: true },
];

const MOCK_COMMENTS = [
  { id: 1, user: "Citra A.", initial: "CA", text: "Tolong perhatikan konsistensi warna di section hero ya.", time: "1j lalu" },
  { id: 2, user: "Admin",    initial: "AD", text: "Oke, deadline diperpanjang sampai besok jam 17.00.", time: "30m lalu" },
];

export default function TaskDetailDrawer({ task, onClose }: TaskDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"progress" | "comments">("progress");
  const [comment, setComment] = useState("");

  if (!task) return <Drawer open={false} onClose={onClose}>{null}</Drawer>;

  const s = STATUS_CONFIG[task.status];
  const p = PRIORITY_CONFIG[task.priority];
  const StatusIcon = s.icon;

  return (
    <Drawer open={!!task} onClose={onClose} title="Detail Tugas">
      <div className="flex flex-col h-full">
        {/* ── Task Header ── */}
        <div className="px-6 pt-2 pb-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-base font-semibold text-slate-900 leading-snug flex-1">
              {task.title}
            </h1>
            <div className="flex items-center gap-1 shrink-0">
              <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <Edit2 size={14} />
              </button>
              <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Status + Priority */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <button className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors", s.badgeCls, "border-transparent")}>
              <StatusIcon size={12} className={s.iconCls} />
              {s.label}
              <ChevronDown size={11} />
            </button>
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", p.cls)}>
              {p.label}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
              {task.targetType === "daily" ? "Harian" : "Mingguan"}
            </span>
          </div>

          {/* Meta grid */}
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
                  task.status === "overdue" ? "text-red-500" : "text-slate-700"
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
                  <Tag size={9} />
                  {tag}
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
              {tab === "progress" ? "Progress" : "Komentar"}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "progress" ? (
            <div className="flex flex-col gap-4">
              {/* Add progress button */}
              <button className="w-full py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-[#1a5f7a] hover:text-[#1a5f7a] transition-colors">
                + Tambah Update Progress
              </button>

              {MOCK_PROGRESS.map((prog) => (
                <div key={prog.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-white">{prog.initial}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">{prog.user}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{prog.time}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {prog.note}
                    </div>
                    {prog.hasAttachment && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-[#1a5f7a]">
                        <Paperclip size={11} />
                        mockup-v2.fig
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {MOCK_COMMENTS.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-slate-600">{c.initial}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">{c.user}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{c.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Comment Input ── */}
        {activeTab === "comments" && (
          <div className="px-6 py-4 border-t border-slate-100 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                placeholder="Tulis komentar..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none outline-none focus:border-[#1a5f7a] focus:ring-2 focus:ring-[#1a5f7a]/10 transition-all"
              />
              <button
                disabled={!comment.trim()}
                className="btn btn-primary h-9 w-9 p-0 rounded-lg disabled:opacity-40"
                aria-label="Kirim komentar"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
