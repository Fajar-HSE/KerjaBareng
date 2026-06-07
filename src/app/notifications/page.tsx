"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Bell, CheckSquare, MessageSquare, AlertTriangle,
  Check, Trash2, BellOff, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
type NotifType = "deadline" | "mention" | "assignment";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  taskTitle?: string;
}

/* ─── Mock Data ─────────────────────────────────────────────── */
const MOCK_NOTIFS: Notification[] = [
  { id: "1",  type: "deadline",   title: "Deadline Terlewat",        message: "Tugas 'Testing fitur upload bukti' telah melewati deadline.",                  time: "5 menit lalu",  isRead: false, taskTitle: "Testing fitur upload bukti" },
  { id: "2",  type: "assignment", title: "Tugas Baru Ditugaskan",    message: "Admin menugaskan kamu untuk 'Review PR authentication module'.",               time: "1 jam lalu",    isRead: false, taskTitle: "Review PR authentication module" },
  { id: "3",  type: "mention",    title: "Kamu Disebutkan",          message: "Citra A. menyebut kamu di komentar tugas 'Finalisasi desain landing page'.",   time: "2 jam lalu",    isRead: false, taskTitle: "Finalisasi desain landing page" },
  { id: "4",  type: "deadline",   title: "Deadline Mendekati",       message: "Tugas 'Setup cron deadline checker' deadline besok jam 15:00.",               time: "3 jam lalu",    isRead: true,  taskTitle: "Setup cron deadline checker" },
  { id: "5",  type: "assignment", title: "Status Tugas Diperbarui",  message: "Budi S. mengubah status 'Finalisasi desain landing page' menjadi In Progress.", time: "5 jam lalu",    isRead: true,  taskTitle: "Finalisasi desain landing page" },
  { id: "6",  type: "mention",    title: "Kamu Disebutkan",          message: "Fajar L. menyebut kamu di chat tugas 'Setup cron deadline checker'.",          time: "Kemarin",       isRead: true,  taskTitle: "Setup cron deadline checker" },
  { id: "7",  type: "deadline",   title: "Laporan Deadline Harian",  message: "3 tugas overdue hari ini: Testing fitur upload, Review PR, Update docs.",     time: "Kemarin",       isRead: true },
  { id: "8",  type: "assignment", title: "Tugas Selesai",            message: "Deni R. menandai 'Update dokumentasi API v2' sebagai selesai.",               time: "2 hari lalu",   isRead: true,  taskTitle: "Update dokumentasi API v2" },
];

/* ─── Notif Config ──────────────────────────────────────────── */
const NOTIF_CONFIG: Record<NotifType, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  deadline:   { icon: AlertTriangle, iconBg: "bg-red-100",   iconColor: "text-red-600" },
  mention:    { icon: MessageSquare, iconBg: "bg-blue-100",  iconColor: "text-blue-600" },
  assignment: { icon: CheckSquare,   iconBg: "bg-[#e8f4f8]", iconColor: "text-[#1a5f7a]" },
};

const FILTER_TABS: { key: "all" | NotifType; label: string }[] = [
  { key: "all",        label: "Semua" },
  { key: "deadline",   label: "Deadline" },
  { key: "assignment", label: "Tugas" },
  { key: "mention",    label: "Mention" },
];

/* ─── Notification Item ─────────────────────────────────────── */
function NotifItem({
  notif,
  onRead,
  onDelete,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const c = NOTIF_CONFIG[notif.type];
  const Icon = c.icon;

  return (
    <div className={cn(
      "flex items-start gap-4 px-5 py-4 border-b border-slate-100 last:border-0 transition-colors group",
      !notif.isRead ? "bg-[#f0f8fb]" : "hover:bg-slate-50"
    )}>
      {/* Icon */}
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", c.iconBg)}>
        <Icon size={16} className={c.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className={cn("text-sm font-medium text-slate-800", !notif.isRead && "font-semibold")}>
              {notif.title}
            </p>
            {!notif.isRead && (
              <span className="w-2 h-2 rounded-full bg-[#1a5f7a] shrink-0" />
            )}
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
              title="Hapus notifikasi"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
        {notif.taskTitle && (
          <p className="text-xs text-[#1a5f7a] mt-1 font-medium truncate">
            📋 {notif.taskTitle}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1.5">
          <Clock size={10} className="text-slate-400" />
          <span className="text-[11px] text-slate-400 font-mono">{notif.time}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const [notifs, setNotifs]   = useState<Notification[]>(MOCK_NOTIFS);
  const [filter, setFilter]   = useState<"all" | NotifType>("all");

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const filtered = notifs.filter((n) =>
    filter === "all" ? true : n.type === filter
  );

  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function deleteNotif(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <AppShell
      title="Notifikasi"
      subtitle={unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
    >
      <div className="max-w-2xl flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          {/* Filter tabs */}
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

          {/* Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="btn btn-secondary h-8 px-3 text-xs gap-1.5 rounded-lg"
              >
                <Check size={13} />
                Tandai Semua
              </button>
            )}
          </div>
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <BellOff size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Tidak ada notifikasi</p>
            <p className="text-xs text-slate-400">Semua notifikasi sudah bersih</p>
          </div>
        ) : (
          <div className="card overflow-hidden divide-y divide-slate-100">
            {/* Header */}
            <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Bell size={13} />
                {filter === "all" ? "Semua Notifikasi" : FILTER_TABS.find(t => t.key === filter)?.label}
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
