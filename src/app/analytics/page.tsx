"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import {
  CheckCircle2, Clock, AlertTriangle,
  Flame, Award, Target,
  ChevronDown,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════ */

/* Heatmap — 15 minggu × 7 hari, value 0–4 */
function generateHeatmap() {
  const weeks: number[][] = [];
  for (let w = 0; w < 15; w++) {
    const days: number[] = [];
    for (let d = 0; d < 7; d++) {
      const rand = Math.random();
      days.push(rand < 0.25 ? 0 : rand < 0.5 ? 1 : rand < 0.75 ? 2 : rand < 0.9 ? 3 : 4);
    }
    weeks.push(days);
  }
  return weeks;
}
const HEATMAP_DATA = generateHeatmap();

const MONTH_LABELS = ["Feb", "Mar", "Apr", "Mei", "Jun"];

/* Completion trend — 8 minggu terakhir */
const WEEKLY_TREND = [
  { week: "W1", done: 8,  total: 12, overdue: 2 },
  { week: "W2", done: 11, total: 14, overdue: 1 },
  { week: "W3", done: 7,  total: 10, overdue: 3 },
  { week: "W4", done: 14, total: 16, overdue: 0 },
  { week: "W5", done: 10, total: 13, overdue: 2 },
  { week: "W6", done: 13, total: 15, overdue: 1 },
  { week: "W7", done: 9,  total: 11, overdue: 2 },
  { week: "W8", done: 15, total: 17, overdue: 0 },
];

/* Leaderboard */
const LEADERBOARD = [
  { rank: 1, name: "Budi Santoso",   initial: "BS", done: 42, streak: 14, rate: 95 },
  { rank: 2, name: "Citra Ayu",      initial: "CA", done: 38, streak: 11, rate: 90 },
  { rank: 3, name: "Deni Ramadhan",  initial: "DR", done: 35, streak: 9,  rate: 88 },
  { rank: 4, name: "Eka Mulyani",    initial: "EM", done: 29, streak: 6,  rate: 78 },
  { rank: 5, name: "Fajar Laksono",  initial: "FL", done: 27, streak: 8,  rate: 82 },
  { rank: 6, name: "Gina Safitri",   initial: "GS", done: 24, streak: 4,  rate: 71 },
];

/* Per-member breakdown */
const MEMBER_STATS: Record<string, { done: number; pending: number; overdue: number; streak: number; bestStreak: number; avgDays: number }> = {
  BS: { done: 42, pending: 3,  overdue: 1, streak: 14, bestStreak: 21, avgDays: 1.2 },
  CA: { done: 38, pending: 5,  overdue: 2, streak: 11, bestStreak: 15, avgDays: 1.5 },
  DR: { done: 35, pending: 2,  overdue: 1, streak: 9,  bestStreak: 12, avgDays: 1.8 },
  EM: { done: 29, pending: 6,  overdue: 4, streak: 6,  bestStreak: 10, avgDays: 2.1 },
  FL: { done: 27, pending: 4,  overdue: 2, streak: 8,  bestStreak: 11, avgDays: 1.9 },
  GS: { done: 24, pending: 7,  overdue: 3, streak: 4,  bestStreak: 8,  avgDays: 2.4 },
};

/* ═══════════════════════════════════════════════════════════════
   HEATMAP COMPONENT
═══════════════════════════════════════════════════════════════ */
const heatColor = [
  "bg-slate-100",
  "bg-[#b3ddeb]",
  "bg-[#7fc4d8]",
  "bg-[#1a5f7a]",
  "bg-[#0e4a60]",
];

function ActivityHeatmap() {
  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="heading-3">Aktivitas Harian</h2>
          <p className="text-xs text-slate-500 mt-0.5">Jumlah tugas diselesaikan per hari</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Sedikit</span>
          {heatColor.map((c, i) => (
            <div key={i} className={cn("w-3 h-3 rounded-sm", c)} />
          ))}
          <span>Banyak</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] pt-5">
            {dayLabels.map((d) => (
              <div key={d} className="h-3 flex items-center">
                <span className="text-[10px] text-slate-400 w-7 text-right font-mono">{d}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex flex-col gap-1">
            {/* Month labels */}
            <div className="flex gap-[3px] mb-1">
              {HEATMAP_DATA.map((_, wi) => (
                <div key={wi} className="w-3 text-[10px] text-slate-400 font-mono text-center">
                  {wi % 3 === 0 ? MONTH_LABELS[Math.floor(wi / 3)] : ""}
                </div>
              ))}
            </div>

            {/* Cells — transposed: days as rows, weeks as cols */}
            {Array.from({ length: 7 }).map((_, di) => (
              <div key={di} className="flex gap-[3px]">
                {HEATMAP_DATA.map((week, wi) => (
                  <div
                    key={wi}
                    title={`${week[di]} tugas`}
                    className={cn(
                      "w-3 h-3 rounded-sm transition-transform hover:scale-125 cursor-default",
                      heatColor[week[di]]
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STREAK CARD
═══════════════════════════════════════════════════════════════ */
function StreakCard({ streak, bestStreak }: { streak: number; bestStreak: number }) {
  const progress = Math.min((streak / bestStreak) * 100, 100);

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="heading-3">Streak</h2>
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
          <Flame size={18} className="text-amber-500" />
        </div>
      </div>

      {/* Current streak */}
      <div className="flex items-end gap-2">
        <span className="font-mono text-5xl font-bold text-slate-900 leading-none">{streak}</span>
        <div className="flex flex-col mb-1">
          <span className="text-sm font-medium text-slate-600">hari berturut</span>
          <span className="text-xs text-slate-400">streak aktif</span>
        </div>
      </div>

      {/* Progress bar menuju best streak */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Menuju rekor terbaik</span>
          <span className="font-mono">{streak} / {bestStreak}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Best streak badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
        <Award size={14} className="text-amber-500 shrink-0" />
        <span className="text-xs text-amber-700">
          Rekor terbaik: <span className="font-semibold">{bestStreak} hari</span>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PERSONAL STAT CARDS
═══════════════════════════════════════════════════════════════ */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color: "primary" | "green" | "amber" | "red";
}

const colorMap = {
  primary: { bg: "bg-[#e8f4f8]", text: "text-[#1a5f7a]", ring: "ring-[#1a5f7a]/10" },
  green:   { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-500/10" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   ring: "ring-amber-500/10" },
  red:     { bg: "bg-red-50",     text: "text-red-600",     ring: "ring-red-500/10" },
};

function StatCard({ label, value, icon: Icon, trend, trendLabel, color }: StatCardProps) {
  const c = colorMap[color];
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-slate-400";

  return (
    <div className="card p-5 flex flex-col gap-3 card-hover">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center ring-1", c.bg, c.ring)}>
          <Icon size={18} className={c.text} />
        </div>
        {trend && trendLabel && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
            <TrendIcon size={13} />
            {trendLabel}
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

/* ═══════════════════════════════════════════════════════════════
   WEEKLY BAR CHART
═══════════════════════════════════════════════════════════════ */
function WeeklyChart() {
  const maxTotal = Math.max(...WEEKLY_TREND.map(w => w.total));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="heading-3">Tren Penyelesaian</h2>
          <p className="text-xs text-slate-500 mt-0.5">8 minggu terakhir</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1a5f7a]" />
            Selesai
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
            Total
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-300" />
            Overdue
          </span>
        </div>
      </div>

      <div className="flex items-end gap-3 h-40">
        {WEEKLY_TREND.map((w) => {
          const doneH    = Math.round((w.done / maxTotal) * 140);
          const totalH   = Math.round((w.total / maxTotal) * 140);
          const overdueH = Math.round((w.overdue / maxTotal) * 140);
          const rate     = Math.round((w.done / w.total) * 100);

          return (
            <div key={w.week} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-14 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                {w.done}/{w.total} selesai · {w.overdue} overdue
              </div>

              {/* Bars */}
              <div className="relative flex items-end justify-center w-full gap-0.5" style={{ height: 140 }}>
                {/* Total bar (background) */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-slate-100 rounded-t-md transition-all"
                  style={{ height: totalH }}
                />
                {/* Done bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-[#1a5f7a] rounded-t-md transition-all opacity-90"
                  style={{ height: doneH }}
                />
                {/* Overdue indicator */}
                {w.overdue > 0 && (
                  <div
                    className="absolute bottom-0 w-1 right-1 bg-red-400 rounded-t transition-all"
                    style={{ height: overdueH }}
                  />
                )}
                {/* Rate badge on hover */}
                <span className="absolute -top-5 text-[10px] font-mono font-semibold text-[#1a5f7a] opacity-0 group-hover:opacity-100 transition-opacity">
                  {rate}%
                </span>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">{w.week}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPLETION RATE DONUT (pure CSS)
═══════════════════════════════════════════════════════════════ */
function CompletionDonut({ rate, label }: { rate: number; label: string }) {
  const circumference = 2 * Math.PI * 36;
  const dash = (rate / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke="#1a5f7a" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-bold text-slate-900">{rate}%</span>
        </div>
      </div>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEADERBOARD (admin only)
═══════════════════════════════════════════════════════════════ */
const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-400 text-white",
  2: "bg-slate-300 text-slate-700",
  3: "bg-amber-700/70 text-white",
};

function Leaderboard({ selectedMember, onSelect }: {
  selectedMember: string | null;
  onSelect: (initial: string) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="heading-3">Leaderboard Tim</h2>
        <span className="text-xs text-slate-400 font-mono">30 hari terakhir</span>
      </div>
      <div className="divide-y divide-slate-100">
        {LEADERBOARD.map((m) => (
          <button
            key={m.rank}
            onClick={() => onSelect(m.initial)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors",
              selectedMember === m.initial
                ? "bg-[#e8f4f8]"
                : "hover:bg-slate-50"
            )}
          >
            {/* Rank */}
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
              RANK_STYLES[m.rank] ?? "bg-slate-100 text-slate-500"
            )}>
              {m.rank}
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">{m.initial}</span>
            </div>

            {/* Name + streak */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame size={10} className="text-amber-500" />
                <span className="text-[11px] text-slate-400">{m.streak} hari streak</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-slate-800">{m.done}</p>
                <p className="text-[10px] text-slate-400">selesai</p>
              </div>
              <div className="text-right w-12">
                <p className={cn(
                  "font-mono text-sm font-semibold",
                  m.rate >= 90 ? "text-emerald-600" : m.rate >= 75 ? "text-amber-600" : "text-red-500"
                )}>
                  {m.rate}%
                </p>
                <p className="text-[10px] text-slate-400">rate</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER DETAIL PANEL
═══════════════════════════════════════════════════════════════ */
function MemberDetail({ initial }: { initial: string }) {
  const member = LEADERBOARD.find(m => m.initial === initial);
  const stats  = MEMBER_STATS[initial];
  if (!member || !stats) return null;

  const total      = stats.done + stats.pending + stats.overdue;
  const doneRate   = Math.round((stats.done / total) * 100);
  const overdueRate = Math.round((stats.overdue / total) * 100);

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-white">{member.initial}</span>
        </div>
        <div>
          <p className="font-semibold text-slate-900">{member.name}</p>
          <p className="text-xs text-slate-500">Rank #{member.rank} tim</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-mono text-xl font-bold text-[#1a5f7a]">{member.rate}%</p>
          <p className="text-[10px] text-slate-400">completion rate</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Selesai",  value: stats.done,    color: "text-emerald-600" },
          { label: "Pending",  value: stats.pending, color: "text-amber-600" },
          { label: "Overdue",  value: stats.overdue, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center p-2.5 rounded-lg bg-slate-50">
            <p className={cn("font-mono text-lg font-bold", color)}>{value}</p>
            <p className="text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Donuts */}
      <div className="flex items-center justify-around py-2">
        <CompletionDonut rate={doneRate}    label="Selesai" />
        <CompletionDonut rate={100 - overdueRate} label="On-time" />
      </div>

      {/* Streak info */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-amber-500" />
          <span className="text-sm font-medium text-amber-700">Streak aktif</span>
        </div>
        <span className="font-mono font-bold text-amber-700">{stats.streak} hari</span>
      </div>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
        <span className="text-sm text-slate-600">Rekor terbaik</span>
        <span className="font-mono font-semibold text-slate-700">{stats.bestStreak} hari</span>
      </div>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
        <span className="text-sm text-slate-600">Rata-rata waktu selesai</span>
        <span className="font-mono font-semibold text-slate-700">{stats.avgDays} hari</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [period, setPeriod]           = useState<"7d" | "30d" | "90d">("30d");
  const [selectedMember, setSelectedMember] = useState<string | null>("BS");

  /* Personal stats (untuk user biasa) */
  const userName = session?.user?.name || "Budi Santoso";
  const myInitial = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2) || "BS";
  
  const myStats   = MEMBER_STATS[myInitial] || { done: 0, pending: 0, overdue: 0, streak: 0, bestStreak: 0, avgDays: 0 };
  const myMember  = LEADERBOARD.find(m => m.initial === myInitial) || { rank: 0, name: userName, initial: myInitial, done: 0, streak: 0, rate: 0 };

  return (
    <AppShell
      title="Laporan"
      subtitle={isAdmin ? "Analitik performa seluruh tim" : "Performa & pencapaian kamu"}
    >
      <div className="flex flex-col gap-6 max-w-7xl">

        {/* ── Period selector ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  period === p
                    ? "bg-[#1a5f7a] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {{ "7d": "7 Hari", "30d": "30 Hari", "90d": "90 Hari" }[p]}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                const rows = [
                  ["Nama", "Tugas Selesai", "Streak", "Completion Rate"],
                  ...LEADERBOARD.map(m => [m.name, m.done, m.streak, `${m.rate}%`]),
                ];
                const csv = rows.map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `laporan-${period}.csv`; a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn btn-secondary h-9 px-3 text-sm gap-1.5 rounded-lg"
            >
              <ChevronDown size={14} />
              Export CSV
            </button>
          )}
        </div>

        {/* ── Admin view ── */}
        {isAdmin ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Diselesaikan" value={195}  icon={CheckCircle2} color="green"   trend="up"      trendLabel="+12%" />
              <StatCard label="Rata-rata Streak"    value="8.4" icon={Flame}        color="amber"   trend="up"      trendLabel="+2"   />
              <StatCard label="Completion Rate"     value="84%" icon={Target}       color="primary" trend="neutral" trendLabel="stabil" />
              <StatCard label="Overdue Rate"        value="13%" icon={AlertTriangle} color="red"    trend="down"    trendLabel="-3%"  />
            </div>

            {/* Heatmap */}
            <ActivityHeatmap />

            {/* Chart + Member detail */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 flex flex-col gap-6">
                <WeeklyChart />
              </div>
              <div className="flex flex-col gap-4">
                {selectedMember && <MemberDetail initial={selectedMember} />}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <Leaderboard selectedMember={selectedMember} onSelect={setSelectedMember} />
              </div>
              <div className="card p-5 flex flex-col gap-4">
                <h2 className="heading-3">Distribusi Tim</h2>
                <div className="flex items-center justify-around py-4">
                  <CompletionDonut rate={84} label="Completion" />
                  <CompletionDonut rate={87} label="On-time" />
                  <CompletionDonut rate={73} label="Kualitas" />
                </div>
                <div className="flex flex-col gap-2 mt-1">
                  {[
                    { label: "Sangat Aktif (≥10/minggu)", count: 2, pct: 33, color: "bg-[#1a5f7a]" },
                    { label: "Aktif (5–9/minggu)",         count: 3, pct: 50, color: "bg-[#7fc4d8]" },
                    { label: "Perlu Perhatian (<5)",        count: 1, pct: 17, color: "bg-amber-400" },
                  ].map(({ label, count, pct, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">{label}</span>
                          <span className="font-mono text-slate-500">{count} orang</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full">
                          <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── User view ── */
          <>
            {/* Personal stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Tugas Selesai"   value={myStats.done}    icon={CheckCircle2} color="green"   trend="up" trendLabel="+5" />
              <StatCard label="Streak Aktif"    value={`${myStats.streak}🔥`} icon={Flame}  color="amber" />
              <StatCard label="Completion Rate" value={`${myMember?.rate ?? 0}%`} icon={Target}   color="primary" trend="up" trendLabel="+3%" />
              <StatCard label="Avg. Waktu"      value={`${myStats.avgDays}h`} icon={Clock}   color="primary" />
            </div>

            {/* Heatmap personal */}
            <ActivityHeatmap />

            {/* Streak + Weekly side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <StreakCard streak={myStats.streak} bestStreak={myStats.bestStreak} />
              <div className="lg:col-span-2">
                <WeeklyChart />
              </div>
            </div>

            {/* Personal detail card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MemberDetail initial={myInitial} />

              {/* Achievement badges */}
              <div className="card p-5 flex flex-col gap-4">
                <h2 className="heading-3">Pencapaian</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "🔥", title: "Hot Streak",   desc: "14 hari berturut",  earned: true },
                    { icon: "⚡", title: "Speed Runner",  desc: "5 tugas dalam 1 hari", earned: true },
                    { icon: "🎯", title: "On Target",     desc: "100% on-time minggu ini", earned: true },
                    { icon: "💎", title: "Perfectionist", desc: "30 hari tanpa overdue", earned: false },
                    { icon: "🚀", title: "Overachiever",  desc: "2x target mingguan", earned: false },
                    { icon: "👑", title: "Team Leader",   desc: "Rank #1 selama sebulan", earned: false },
                  ].map((badge) => (
                    <div
                      key={badge.title}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        badge.earned
                          ? "border-[#1a5f7a]/20 bg-[#e8f4f8]"
                          : "border-slate-100 bg-slate-50 opacity-50"
                      )}
                    >
                      <span className="text-2xl shrink-0">{badge.icon}</span>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-semibold truncate", badge.earned ? "text-[#1a5f7a]" : "text-slate-400")}>
                          {badge.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
