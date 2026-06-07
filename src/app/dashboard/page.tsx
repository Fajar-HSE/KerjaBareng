import AppShell from "@/components/layout/AppShell";
import {
  CheckSquare,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: React.ElementType;
  color: "primary" | "amber" | "green" | "red";
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
            <ArrowUpRight size={13} />
            {delta}
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

/* ─── Task Row ──────────────────────────────────────────────── */
const MOCK_TASKS = [
  { id: 1, title: "Finalisasi desain landing page", assignee: "Budi S.", status: "in_progress", deadline: "Hari ini, 17:00", priority: "high" },
  { id: 2, title: "Review PR authentication module", assignee: "Citra A.", status: "pending", deadline: "Besok, 09:00", priority: "medium" },
  { id: 3, title: "Update dokumentasi API v2", assignee: "Deni R.", status: "done", deadline: "Selesai", priority: "low" },
  { id: 4, title: "Testing fitur upload bukti", assignee: "Eka M.", status: "overdue", deadline: "Kemarin", priority: "high" },
  { id: 5, title: "Setup cron deadline checker", assignee: "Fajar L.", status: "in_progress", deadline: "Besok, 15:00", priority: "medium" },
];

const statusLabel: Record<string, { label: string; cls: string }> = {
  pending:     { label: "Pending",     cls: "badge badge-pending" },
  in_progress: { label: "In Progress", cls: "badge badge-progress" },
  done:        { label: "Selesai",     cls: "badge badge-done" },
  overdue:     { label: "Overdue",     cls: "badge badge-overdue" },
};

function TaskTable() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="heading-3">Tugas Aktif</h2>
        <button className="btn btn-secondary text-sm h-8 px-3 rounded-lg">Lihat Semua</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tugas</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Assignee</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deadline</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_TASKS.map((task) => {
              const s = statusLabel[task.status];
              return (
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
                          {task.assignee.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-slate-600">{task.assignee}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "font-mono text-xs",
                      task.status === "overdue" ? "text-red-600" : "text-slate-500"
                    )}>
                      {task.deadline}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={s.cls}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Activity Feed ─────────────────────────────────────────── */
const ACTIVITIES = [
  { user: "Budi S.", action: "menyelesaikan", target: "Setup Redis worker", time: "5m lalu", type: "done" },
  { user: "Citra A.", action: "menambah progress", target: "Desain UI dashboard", time: "22m lalu", type: "progress" },
  { user: "Deni R.", action: "membuat tugas baru", target: "Testing API endpoint", time: "1j lalu", type: "create" },
  { user: "Eka M.", action: "melewati deadline", target: "Laporan mingguan", time: "2j lalu", type: "overdue" },
];

const activityDot: Record<string, string> = {
  done: "bg-emerald-500",
  progress: "bg-[#1a5f7a]",
  create: "bg-amber-500",
  overdue: "bg-red-500",
};

function ActivityFeed() {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <h2 className="heading-3">Aktivitas Terkini</h2>
      <div className="flex flex-col gap-4">
        {ACTIVITIES.map((a, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn("w-2 h-2 rounded-full mt-1.5", activityDot[a.type])} />
              {i < ACTIVITIES.length - 1 && (
                <div className="w-px flex-1 bg-slate-100" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 pb-2">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{a.user}</span>{" "}
                <span className="text-slate-500">{a.action}</span>{" "}
                <span className="font-medium text-[#1a5f7a]">{a.target}</span>
              </p>
              <span className="text-xs text-slate-400 font-mono">{a.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Ringkasan aktivitas tim hari ini"
    >
      <div className="flex flex-col gap-6 max-w-7xl">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tugas"       value={24}  delta="+3"  icon={CheckSquare}   color="primary" />
          <StatCard label="In Progress"       value={8}               icon={Clock}         color="amber"   />
          <StatCard label="Selesai Hari Ini"  value={5}   delta="+2"  icon={TrendingUp}    color="green"   />
          <StatCard label="Overdue"           value={3}               icon={AlertTriangle} color="red"     />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TaskTable />
          </div>
          <div>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
