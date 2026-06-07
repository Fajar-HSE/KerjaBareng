"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useApi } from "@/hooks/useApi";
import { NotifItemSkeleton } from "@/components/ui/Skeleton";
import {
  Bell, CheckSquare, MessageSquare, AlertTriangle,
  Check, Trash2, BellOff, Clock, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
type NotifType = "deadline" | "mention" | "assignment";

interface Notification {
  id:        string;
  type:      NotifType;
  title:     string;
  message:   string;
  createdAt: string;
  isRead:    boolean;
}

interface NotifResponse {
  notifications: Notification[];
  unreadCount:   number;
}

/* ─── Config ─────────────────────────────────────────────────── */
const NOTIF_CONFIG: Record<NotifType, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  deadline:   { icon: AlertTriangle, iconBg: "bg-red-100",   iconColor: "text-red-600"     },
  mention:    { icon: MessageSquare, iconBg: "bg-blue-100",  iconColor: "text-blue-600"    },
  assignment: { icon: CheckSquare,   iconBg: "bg-[#e8f4f8]", iconColor: "text-[#1a5f7a]"  },
};

const FILTER_TABS: { key: "all" | NotifType; label: string }[] = [
  { key: "all",        label: "Semua"    },
  { key: "deadline",   label: "Deadline" },
  { key: "assignment", label: "Tugas"    },
  { key: "mention",    label: "Mention"  },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "baru saja";
  if (m < 60)  return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

/* ─── Notification Item ─────────────────────────────────────── */
function NotifItem({
  notif,
  onRead,
  onDelete,
}: {
  notif: Notification;
  onRead:   (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const c    = NOTIF_CONFIG[notif.type] ?? NOTIF_CONFIG.assignment;
  const Icon = c.icon;

  return (
    <div className={cn(
      "flex items-start gap-4 px-5 py-4 border-b border-slate-100 last:border-0 transition-colors group",
      !notif.isRead ? "bg-[#f0f8fb]" : "hover:bg-slate-50"
    )}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", c.iconBg)}>
        <Icon size={16} className={c.iconColor} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className={cn("text-sm text-slate-800", !notif.isRead && "font-semibold")}>
              {notif.title}
            </p>
            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-[#1a5f7a] shrink-0" />}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {!notif.isRead && (
              <button
                onClick={() => onRead(notif.id)}
                className="p-1 rounded text-slate-400 hover:text-[#1a5f7a] hover:bg-[#e8f4f8] transition-colors"
                title="Tandai sudah dibaca"
              >
                <Check size={13} />
              </button>
            )}
            <button
              onClick={() => onDelete(notif.id)}
              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Hapus"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Clock size={10} className="text-slate-400" />
          <span className="text-[11px] text-slate-400 font-mono">{timeAgo(notif.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | NotifType>("all");

  const { data, loading, error, refetch } = useApi<NotifResponse>("/api/notifications");

  /* Local state untuk optimistic updates */
  const [localNotifs, setLocalNotifs] = useState<Notification[] | null>(null);
  const notifs = localNotifs ?? data?.notifications ?? [];

  /* Sync dari API saat data berubah */
  if (data?.notifications && !localNotifs) {
    setLocalNotifs(data.notifications);
  }

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const filtered = notifs.filter((n) => filter === "all" || n.type === filter);

  /* ── Handlers ── */
  async function markRead(id: string) {
    setLocalNotifs((prev) => prev?.map((n) => n.id === id ? { ...n, isRead: true } : n) ?? null);
    await fetch("/api/notifications", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setLocalNotifs((prev) => prev?.map((n) => ({ ...n, isRead: true })) ?? null);
    await fetch("/api/notifications", { method: "PATCH" });
  }

  async function deleteNotif(id: string) {
    setLocalNotifs((prev) => prev?.filter((n) => n.id !== id) ?? null);
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
  }

  return (
    <AppShell
      title="Notifikasi"
      subtitle={unreadCount > 0
        ? `${unreadCount} notifikasi belum dibaca`
        : "Semua notifikasi sudah dibaca"
      }
    >
      <div className="max-w-2xl flex flex-col gap-4">
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {FILTER_TABS.map((tab) => {
              const count = tab.key === "all"
                ? notifs.length
                : notifs.filter((n) => n.type === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
                    filter === tab.key
                      ? "bg-[#1a5f7a] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "text-[11px] font-mono px-1 py-0.5 rounded-full",
                    filter === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn btn-secondary h-8 px-3 text-xs gap-1.5 rounded-lg">
                <Check size={12} /> Tandai Semua
              </button>
            )}
            <button onClick={refetch} className="btn btn-secondary h-8 px-3 text-xs rounded-lg" title="Refresh">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="card overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => <NotifItemSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <BellOff size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Tidak ada notifikasi</p>
            <p className="text-xs text-slate-400">Semua notifikasi sudah bersih</p>
          </div>
        ) : (
          <div className="card overflow-hidden divide-y divide-slate-100">
            <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Bell size={13} />
                {filter === "all" ? "Semua Notifikasi" : FILTER_TABS.find((t) => t.key === filter)?.label}
              </p>
              <p className="text-xs text-slate-400 font-mono">{filtered.length} total</p>
            </div>
            {filtered.map((notif) => (
              <NotifItem
                key={notif.id}
                notif={notif}
                onRead={markRead}
                onDelete={deleteNotif}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
