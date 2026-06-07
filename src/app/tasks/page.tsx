"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import TaskDetailDrawer from "@/components/tasks/TaskDetailDrawer";
import {
  Plus, Filter, Search, ChevronDown,
  Clock, CheckCircle2, AlertTriangle, Circle,
  MoreHorizontal, Calendar, Tag, LayoutList, LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
type Status   = "pending" | "in_progress" | "done" | "overdue";
type Priority = "high" | "medium" | "low";

export interface Task {
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

/* ─── Mock Data ─────────────────────────────────────────────── */
const MOCK_TASKS: Task[] = [
  { id: 1, title: "Finalisasi desain landing page",       description: "Revisi sesuai feedback klien, update warna dan typography", assignee: "Budi S.",   assigneeInitial: "BS", status: "in_progress", priority: "high",   deadline: "2026-06-07", targetType: "daily",  tags: ["design", "frontend"] },
  { id: 2, title: "Review PR authentication module",      description: "Code review untuk PR #42, pastikan security best practice",  assignee: "Citra A.",  assigneeInitial: "CA", status: "pending",     priority: "high",   deadline: "2026-06-08", targetType: "daily",  tags: ["backend", "auth"] },
  { id: 3, title: "Update dokumentasi API v2",            description: "Tambahkan endpoint baru dan update contoh request/response", assignee: "Deni R.",   assigneeInitial: "DR", status: "done",        priority: "medium", deadline: "2026-06-06", targetType: "daily",  tags: ["docs"] },
  { id: 4, title: "Testing fitur upload bukti",           description: "Uji coba upload berbagai format file, pastikan validasi OK",  assignee: "Eka M.",    assigneeInitial: "EM", status: "overdue",     priority: "high",   deadline: "2026-06-05", targetType: "daily",  tags: ["testing", "upload"] },
  { id: 5, title: "Setup cron deadline checker",          description: "Konfigurasi cron job untuk cek task overdue setiap jam",     assignee: "Fajar L.",  assigneeInitial: "FL", status: "in_progress", priority: "medium", deadline: "2026-06-08", targetType: "daily",  tags: ["backend", "infra"] },
  { id: 6, title: "Laporan mingguan divisi produk",       description: "Kompilasi progress minggu ini dan rencana minggu depan",      assignee: "Gina S.",   assigneeInitial: "GS", status: "pending",     priority: "low",    deadline: "2026-06-09", targetType: "weekly", tags: ["laporan"] },
  { id: 7, title: "Optimasi query dashboard analytics",  description: "Query saat ini lambat >2s, perlu index dan optimasi JOIN",   assignee: "Hendra K.", assigneeInitial: "HK", status: "pending",     priority: "medium", deadline: "2026-06-10", targetType: "daily",  tags: ["backend", "db"] },
  { id: 8, title: "Deploy ke staging environment",       description: "Deploy versi 1.2.0 ke server staging untuk QA testing",      assignee: "Irma W.",   assigneeInitial: "IW", status: "done",        priority: "high",   deadline: "2026-06-06", targetType: "daily",  tags: ["devops"] },
];

/* ─── Config ─────────────────────────────────────────────────── */
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

const STATUS_TABS: { key: Status | "all"; label: string }[] = [
  { key: "all",         label: "Semua" },
  { key: "pending",     label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "done",        label: "Selesai" },
  { key: "overdue",     label: "Overdue" },
];

/* ─── Task Card (Grid) ──────────────────────────────────────── */
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const s = STATUS_CONFIG[task.status];
  const p = PRIORITY_CONFIG[task.priority];
  const StatusIcon = s.icon;
  const isDone = task.status === "done";

  return (
    <div
      onClick={onClick}
      className={cn("card p-4 card-hover flex flex-col gap-3 cursor-pointer", isDone && "opacity-70")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon size={15} className={cn("shrink-0 mt-0.5", s.iconCls)} />
          <h3 className={cn("text-sm font-medium text-slate-800 leading-snug", isDone && "line-through text-slate-400")}>
            {task.title}
          </h3>
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 mt-0.5"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{task.description}</p>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
              <Tag size={9} />{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#1a5f7a] flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">{task.assigneeInitial}</span>
          </div>
          <span className="text-xs text-slate-500">{task.assignee}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", p.cls)}>{p.label}</span>
          <span className={cn("flex items-center gap-1 text-[11px] font-mono", task.status === "overdue" ? "text-red-500" : "text-slate-400")}>
            <Calendar size={10} />
            {new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Task Row (Table) ──────────────────────────────────────── */
function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const s = STATUS_CONFIG[task.status];
  const p = PRIORITY_CONFIG[task.priority];
  const isDone    = task.status === "done";
  const isOverdue = task.status === "overdue";

  return (
    <tr
      onClick={onClick}
      className="hover:bg-slate-50 transition-colors group cursor-pointer"
    >
      <td className="px-5 py-3.5">
        <span className={cn("text-sm font-medium text-slate-800", isDone && "line-through text-slate-400")}>
          {task.title}
        </span>
        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{task.description}</p>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-white">{task.assigneeInitial}</span>
          </div>
          <span className="text-sm text-slate-600">{task.assignee}</span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", p.cls)}>{p.label}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className={cn("font-mono text-xs", isOverdue ? "text-red-500" : "text-slate-500")}>
          {new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className={s.badgeCls}>{s.label}</span>
      </td>
      <td className="px-4 py-3.5">
        <button
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-all"
        >
          <MoreHorizontal size={16} />
        </button>
      </td>
    </tr>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function TasksPage() {
  const [activeTab, setActiveTab]       = useState<Status | "all">("all");
  const [search, setSearch]             = useState("");
  const [viewMode, setViewMode]         = useState<"table" | "grid">("table");
  const [createOpen, setCreateOpen]     = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: session } = useSession();
  const isAdmin   = session?.user?.role === "admin";
  const userId    = session?.user?.id   ?? "";
  const userName  = session?.user?.name ?? "User";
  const userInitial = userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  /* User hanya lihat tugas miliknya, admin lihat semua */
  const visibleTasks = isAdmin
    ? MOCK_TASKS
    : MOCK_TASKS.filter((t) => t.assignee === userName || t.id % 2 === 1); // simulasi filter by userId

  const filtered = visibleTasks.filter((t) => {
    const matchTab    = activeTab === "all" || t.status === activeTab;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
                        t.assignee.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts: Record<string, number> = {
    all:         visibleTasks.length,
    pending:     visibleTasks.filter(t => t.status === "pending").length,
    in_progress: visibleTasks.filter(t => t.status === "in_progress").length,
    done:        visibleTasks.filter(t => t.status === "done").length,
    overdue:     visibleTasks.filter(t => t.status === "overdue").length,
  };

  return (
    <>
      <AppShell
        title="Tugas"
        subtitle={isAdmin ? "Kelola dan pantau semua tugas tim" : "Tugas yang ditugaskan kepadamu"}
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="btn btn-primary gap-1.5 h-9 px-3 text-sm rounded-lg"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Buat Tugas</span>
          </button>
        }
      >
        <div className="flex flex-col gap-5 max-w-7xl">
          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status tabs */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 overflow-x-auto">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0",
                    activeTab === tab.key
                      ? "bg-[#1a5f7a] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "text-[11px] font-mono px-1.5 py-0.5 rounded-full",
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {counts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm w-48">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari tugas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <button className="btn btn-secondary h-9 px-3 text-sm gap-1.5 rounded-lg">
                <Filter size={14} />
                Filter
                <ChevronDown size={12} />
              </button>

              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode("table")}
                  className={cn("px-2.5 py-2 transition-colors", viewMode === "table" ? "bg-[#1a5f7a] text-white" : "text-slate-500 hover:bg-slate-50")}
                  title="Tampilan tabel"
                >
                  <LayoutList size={15} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn("px-2.5 py-2 transition-colors", viewMode === "grid" ? "bg-[#1a5f7a] text-white" : "text-slate-500 hover:bg-slate-50")}
                  title="Tampilan grid"
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <CheckCircle2 size={22} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Tidak ada tugas ditemukan</p>
              <p className="text-xs text-slate-400">Coba ubah filter atau buat tugas baru</p>
              <button onClick={() => setCreateOpen(true)} className="btn btn-primary text-sm h-9 px-4 rounded-lg mt-1">
                <Plus size={14} /> Buat Tugas
              </button>
            </div>
          ) : viewMode === "table" ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tugas</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Assignee</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prioritas</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deadline</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((task) => (
                      <TaskRow key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-400 font-mono">
                  Menampilkan {filtered.length} dari {MOCK_TASKS.length} tugas
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
              ))}
            </div>
          )}
        </div>
      </AppShell>

      {/* Modals & Drawers */}
      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {/* TODO: refresh data */}}
        role={isAdmin ? "admin" : "user"}
        currentUser={
          !isAdmin
            ? { id: userId, name: userName, initial: userInitial }
            : undefined
        }
      />
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
