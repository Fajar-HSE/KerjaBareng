"use client";

import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import { useApi } from "@/hooks/useApi";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import {
  CheckSquare, Clock, TrendingUp, AlertTriangle,
  ArrowUpRight, MoreHorizontal, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
interface DashboardData {
  stats: {
    total:      number;
    pending:    number;
    inProgress: number;
    overdue:    number;
    doneToday:  number;
  };
  recentTasks: {
    id:          string;
    title:       string;
    status:      string;
    deadline:    string;
    updatedAt:   string;
    assignedTo:  { id: string; fullName: string; avatarUrl: string | null };
  }[];
  teamMembers: { id: string; fullName: string; avatarUrl: string | null; division: string | null }[];
}

const STATUS_BADGE: Record<string, string> = {
  pending:     "badge badge-pending",
  in_progress: "badge badge-progress",
  done:        "badge badge-done",
  overdue:     "badge badge-overdue",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Pending",
  in_progress: "In Progress",
  done:        "Selesai",
  overdue:     "Overdue",
};

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({
  label, value, delta, icon: Icon, color,
}: {
  label: string; value: number | string; delta?: string;
  icon: React.ElementType; color: "primary" | "amber" | "green" | "red";
}) {
  const colorMap = {
    primary: { bg: "bg-[#e8f4f8]", text: "text-[#1a5f7a]", ring: "ring-[#1a5f7a]/10" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-600",  ring: "ring-amber-500/10" },
    green:   { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-500/10" },
    red:     { bg: "bg-red-50",     text: "text-red-600",    ring: "ring-red-500/10" },
  };
  const c = colorMap[color];

  return (
    <div className="card p-5 flex flex-col gap-3 card-hover">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center ring-1", c.bg, c.ring)}>
          <Icon size={18} className={c.text} />
        </div>
        {delta && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight size={13} />{delta}
          </span>
        )}
      </div>
      <div>
        <p className="mono-stat text-2xl font-semibold">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ─── Error banner ──────────────────────────────────────────── */
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
      <AlertTriangle size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onRetry} className="flex items-center gap-1.5 font-medium hover:underline">
        <RefreshCw size={13} /> Coba Lagi
      </button>
    </div>
  );
}

/* ─── Task Table ────────────────────────────────────────────── */
function RecentTaskTable({ tasks }: { tasks: DashboardData["recentTasks"] }) {
  if (tasks.length === 0) {
    return (
      <div className="card px-5 py-12 flex flex-col items-center gap-2 text-center">
        <CheckSquare size={28} className="text-slate-300" />
        <p className="text-sm text-slate-500">Belum ada tugas.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="heading-3">Tugas Terbaru</h2>
        <a href="/tasks" className="btn btn-secondary text-sm h-8 px-3 rounded-lg">
          Lihat Semua
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              {["Tugas", "Assignee", "Deadline", "Status", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide first:px-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className={cn(
                    "font-medium text-slate-800",
                    task.status === "done" && "line-through text-slate-400"
                  )}>
                    {task.title}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-white">
                        {task.assignedTo.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-slate-600">{task.assignedTo.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    "font-mono text-xs",
                    task.status === "overdue" ? "text-red-600" : "text-slate-500"
                  )}>
                    {new Date(task.deadline).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short",
                    })}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={STATUS_BADGE[task.status] ?? "badge"}>
                    {STATUS_LABEL[task.status] ?? task.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Activity Feed (dari recentTasks sebagai aktivitas) ─────── */
function ActivityFeed({ tasks }: { tasks: DashboardData["recentTasks"] }) {
  const dotColor: Record<string, string> = {
    done:        "bg-emerald-500",
    in_progress: "bg-[#1a5f7a]",
    pending:     "bg-amber-500",
    overdue:     "bg-red-500",
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60)   return `${m}m lalu`;
    const h = Math.floor(m / 60);
    if (h < 24)   return `${h}j lalu`;
    return `${Math.floor(h / 24)}h lalu`;
  };

  return (
    <div className="card p-5 flex flex-col gap-4">
      <h2 className="heading-3">Aktivitas Terkini</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">Belum ada aktivitas.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.slice(0, 5).map((task, i) => (
            <div key={task.id} className="flex gap-3">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={cn("w-2 h-2 rounded-full mt-1.5", dotColor[task.status] ?? "bg-slate-300")} />
                {i < 4 && <div className="w-px flex-1 bg-slate-100" />}
              </div>
              <div className="flex flex-col gap-0.5 pb-2">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">{task.assignedTo.fullName}</span>{" "}
                  <span className="text-slate-500">
                    {task.status === "done" ? "menyelesaikan" : "mengupdate"}
                  </span>{" "}
                  <span className="font-medium text-[#1a5f7a]">{task.title}</span>
                </p>
                <span className="text-xs text-slate-400 font-mono">{timeAgo(task.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin  = session?.user?.role === "admin";
  const userName = session?.user?.name ?? "Tim";

  const { data, loading, error, refetch } = useApi<DashboardData>("/api/dashboard");

  return (
    <AppShell
      title="Dashboard"
      subtitle={isAdmin
        ? "Ringkasan aktivitas tim hari ini"
        : `Selamat datang, ${userName.split(" ")[0]} 👋`
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl">

        {/* Error */}
        {error && <ErrorBanner message={error} onRetry={refetch} />}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard label="Total Tugas"      value={data?.stats.total      ?? 0} icon={CheckSquare}   color="primary" />
              <StatCard label="In Progress"      value={data?.stats.inProgress ?? 0} icon={Clock}         color="amber"   />
              <StatCard label="Selesai Hari Ini" value={data?.stats.doneToday  ?? 0} icon={TrendingUp}    color="green"   delta={data?.stats.doneToday ? `+${data.stats.doneToday}` : undefined} />
              <StatCard label="Overdue"          value={data?.stats.overdue    ?? 0} icon={AlertTriangle} color="red"     />
            </>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            {loading
              ? <div className="card p-5 flex flex-col gap-3">{Array.from({length:5}).map((_,i)=>(
                  <div key={i} className="flex gap-3 items-center">
                    <div className="animate-pulse bg-slate-200 h-4 rounded flex-1" />
                    <div className="animate-pulse bg-slate-200 h-4 rounded w-20" />
                    <div className="animate-pulse bg-slate-200 h-4 rounded w-16" />
                  </div>
                ))}</div>
              : <RecentTaskTable tasks={data?.recentTasks ?? []} />
            }
          </div>
          <div>
            {loading
              ? <div className="card p-5 flex flex-col gap-4">
                  {Array.from({length:4}).map((_,i)=>(
                    <div key={i} className="flex gap-3">
                      <div className="animate-pulse bg-slate-200 w-2 h-2 rounded-full mt-1.5 shrink-0" />
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="animate-pulse bg-slate-200 h-3 rounded w-3/4" />
                        <div className="animate-pulse bg-slate-200 h-3 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              : <ActivityFeed tasks={data?.recentTasks ?? []} />
            }
          </div>
        </div>
      </div>
    </AppShell>
  );
}
