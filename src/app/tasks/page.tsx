"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import TaskDetailDrawer from "@/components/tasks/TaskDetailDrawer";
import { useApi } from "@/hooks/useApi";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import {
  Plus, Search, Clock, CheckCircle2, AlertTriangle,
  Circle, MoreHorizontal, Calendar, Tag,
  LayoutList, LayoutGrid, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── API Types ─────────────────────────────────────────────── */
type Status   = "pending" | "in_progress" | "done" | "overdue";

interface ApiTask {
  id:          string;
  title:       string;
  description: string | null;
  status:      Status;
  deadline:    string;
  targetType:  "daily" | "weekly";
  assignedTo:  { id: string; fullName: string; avatarUrl: string | null };
  assignedBy:  { id: string; fullName: string };
  _count:      { progresses: number };
}

interface TasksResponse {
  tasks: ApiTask[];
  meta:  { total: number; page: number; limit: number; pages: number };
}

/* ─── UI Task type (untuk drawer) ───────────────────────────── */
export interface Task {
  id:             number;
  title:          string;
  description:    string;
  assignee:       string;
  assigneeInitial: string;
  status:         Status;
  priority:       "high" | "medium" | "low";
  deadline:       string;
  targetType:     "daily" | "weekly";
  tags:           string[];
}

function apiTaskToUiTask(t: ApiTask): Task {
  return {
    id:              parseInt(t.id.replace(/-/g, "").slice(0, 8), 16) || 0,
    title:           t.title,
    description:     t.description ?? "",
    assignee:        t.assignedTo.fullName,
    assigneeInitial: t.assignedTo.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    status:          t.status,
    priority:        "medium",
    deadline:        t.deadline,
    targetType:      t.targetType,
    tags:            [],
  };
}

/* ─── Config ─────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; badgeCls: string; iconCls: string }> = {
  pending:     { label: "Pending",     icon: Circle,        badgeCls: "badge badge-pending",  iconCls: "text-amber-500" },
  in_progress: { label: "In Progress", icon: Clock,         badgeCls: "badge badge-progress", iconCls: "text-blue-500" },
  done:        { label: "Selesai",     icon: CheckCircle2,  badgeCls: "badge badge-done",     iconCls: "text-emerald-500" },
  overdue:     { label: "Overdue",     icon: AlertTriangle, badgeCls: "badge badge-overdue",  iconCls: "text-red-500" },
};

const STATUS_TABS: { key: Status | "all"; label: string }[] = [
  { key: "all",         label: "Semua" },
  { key: "pending",     label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "done",        label: "Selesai" },
  { key: "overdue",     label: "Overdue" },
];

/* ─── Task Card ─────────────────────────────────────────────── */
function TaskCard({ task, onClick }: { task: ApiTask; onClick: () => void }) {
  const s    = STATUS_CONFIG[task.status];
  const Icon = s.icon;
  const isDone = task.status === "done";
  const initial = task.assignedTo.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div onClick={onClick} className={cn("card p-4 card-hover flex flex-col gap-3 cursor-pointer", isDone && "opacity-70")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={15} className={cn("shrink-0 mt-0.5", s.iconCls)} />
          <h3 className={cn("text-sm font-medium text-slate-800 leading-snug", isDone && "line-through text-slate-400")}>
            {task.title}
          </h3>
        </div>
        <button onClick={(e) => e.stopPropagation()} className="text-slate-400 hover:text-slate-600 shrink-0 mt-0.5">
          <MoreHorizontal size={15} />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {task._count.progresses > 0 && (
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
            <Tag size={9} />{task._count.progresses} progress
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#1a5f7a] flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">{initial}</span>
          </div>
          <span className="text-xs text-slate-500">{task.assignedTo.fullName}</span>
        </div>
        <span className={cn("flex items-center gap-1 text-[11px] font-mono", task.status === "overdue" ? "text-red-500" : "text-slate-400")}>
          <Calendar size={10} />
          {new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
        </span>
      </div>
    </div>
  );
}

/* ─── Task Row ───────────────────────────────────────────────── */
function TaskRow({ task, onClick }: { task: ApiTask; onClick: () => void }) {
  const s       = STATUS_CONFIG[task.status];
  const isDone  = task.status === "done";
  const isOverdue = task.status === "overdue";
  const initial = task.assignedTo.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <tr onClick={onClick} className="hover:bg-slate-50 transition-colors group cursor-pointer">
      <td className="px-5 py-3.5">
        <span className={cn("text-sm font-medium text-slate-800", isDone && "line-through text-slate-400")}>
          {task.title}
        </span>
        {task.description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{task.description}</p>
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-white">{initial}</span>
          </div>
          <span className="text-sm text-slate-600">{task.assignedTo.fullName}</span>
        </div>
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
  const { data: session } = useSession();
  const isAdmin   = session?.user?.role === "admin";
  const userId    = session?.user?.id   ?? "";
  const userName  = session?.user?.name ?? "User";
  const userInitial = userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const [activeTab, setActiveTab]       = useState<Status | "all">("all");
  const [search, setSearch]             = useState("");
  const [viewMode, setViewMode]         = useState<"table" | "grid">("table");
  const [createOpen, setCreateOpen]     = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  /* Build API URL */
  const apiUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("status", activeTab);
    if (search.trim())       params.set("search", search.trim());
    return `/api/tasks?${params.toString()}`;
  }, [activeTab, search]);

  const { data, loading, error, refetch } = useApi<TasksResponse>(apiUrl());
  const tasks = data?.tasks ?? [];
  const total = data?.meta.total ?? 0;

  /* Count per status for tabs */
  const counts: Record<string, number> = {
    all:         total,
    pending:     tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done:        tasks.filter((t) => t.status === "done").length,
    overdue:     tasks.filter((t) => t.status === "overdue").length,
  };

  return (
    <>
      <AppShell
        title="Tugas"
        subtitle={isAdmin ? "Kelola dan pantau semua tugas tim" : "Tugas yang ditugaskan kepadamu"}
        action={
          <button onClick={() => setCreateOpen(true)} className="btn btn-primary gap-1.5 h-9 px-3 text-sm rounded-lg">
            <Plus size={16} />
            <span className="hidden sm:inline">Buat Tugas</span>
          </button>
        }
      >
        <div className="flex flex-col gap-5 max-w-7xl">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              <AlertTriangle size={15} className="shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={refetch} className="flex items-center gap-1.5 font-medium hover:underline">
                <RefreshCw size={13} /> Coba Lagi
              </button>
            </div>
          )}

          {/* Toolbar */}
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
                  {!loading && (
                    <span className={cn(
                      "text-[11px] font-mono px-1.5 py-0.5 rounded-full",
                      activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      {counts[tab.key] ?? 0}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Controls */}
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
              <button onClick={refetch} className="btn btn-secondary h-9 px-3 text-sm gap-1.5 rounded-lg" title="Refresh">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button onClick={() => setViewMode("table")} className={cn("px-2.5 py-2 transition-colors", viewMode === "table" ? "bg-[#1a5f7a] text-white" : "text-slate-500 hover:bg-slate-50")}>
                  <LayoutList size={15} />
                </button>
                <button onClick={() => setViewMode("grid")} className={cn("px-2.5 py-2 transition-colors", viewMode === "grid" ? "bg-[#1a5f7a] text-white" : "text-slate-500 hover:bg-slate-50")}>
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {!loading && !error && tasks.length === 0 ? (
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
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deadline</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                      : tasks.map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onClick={() => setSelectedTask(apiTaskToUiTask(task))}
                          />
                        ))
                    }
                  </tbody>
                </table>
              </div>
              {!loading && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
                  <p className="text-xs text-slate-400 font-mono">
                    Menampilkan {tasks.length} dari {total} tugas
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card p-4 flex flex-col gap-3">
                      <div className="animate-pulse bg-slate-200 h-4 rounded w-3/4" />
                      <div className="animate-pulse bg-slate-200 h-3 rounded w-full" />
                      <div className="animate-pulse bg-slate-200 h-3 rounded w-1/2" />
                    </div>
                  ))
                : tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(apiTaskToUiTask(task))}
                    />
                  ))
              }
            </div>
          )}
        </div>
      </AppShell>

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
        role={isAdmin ? "admin" : "user"}
        currentUser={!isAdmin ? { id: userId, name: userName, initial: userInitial } : undefined}
      />
      <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
    </>
  );
}
