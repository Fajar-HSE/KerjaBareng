"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, CheckSquare, MessageSquare,
  Bell, Users, BarChart2, Settings,
  ChevronLeft, ChevronRight, Briefcase, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

/* ─── Nav Items ─────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard",  href: "/dashboard",     icon: LayoutDashboard },
  { label: "Tugas",      href: "/tasks",          icon: CheckSquare },
  { label: "Chat",       href: "/chat",           icon: MessageSquare },
  { label: "Notifikasi", href: "/notifications",  icon: Bell },
  { label: "Laporan",    href: "/analytics",      icon: BarChart2 },
];

const ADMIN_ITEMS = [
  { label: "Tim",         href: "/admin/team",     icon: Users },
  { label: "Pengaturan",  href: "/admin/settings", icon: Settings },
];

/* ─── NavItem ────────────────────────────────────────────────── */
function NavItem({
  item, collapsed, active,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
        active
          ? "bg-[#1a5f7a] text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />
      )}
      <Icon size={18} className={cn(
        "shrink-0 transition-colors",
        active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
      )} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname   = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "admin";
  const userName  = session?.user?.name  ?? "User";
  const userEmail = session?.user?.email ?? "";
  const userInitial = userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className={cn(
      "relative flex flex-col h-screen bg-[#0f172a] border-r border-slate-800",
      "transition-[width] duration-250 ease-smooth",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* ── Logo ── */}
      <div className={cn(
        "flex items-center h-[60px] px-4 border-b border-slate-800 shrink-0",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1a5f7a] shrink-0">
          <Briefcase size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white tracking-tight truncate">KerjaBareng</span>
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 self-start",
              isAdmin ? "bg-amber-500/20 text-amber-400" : "bg-[#1a5f7a]/40 text-slate-400"
            )}>
              {isAdmin ? "Admin" : "Member"}
            </span>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}

        {/* Admin section — only if admin */}
        {isAdmin && (
          <>
            <div className="my-3 border-t border-slate-800" />
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Admin
              </p>
            )}
            {ADMIN_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── User Profile ── */}
      <div className={cn(
        "px-3 py-3 border-t border-slate-800 shrink-0",
        collapsed ? "flex justify-center" : ""
      )}>
        {collapsed ? (
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: isAdmin ? "#d97706" : "#1a5f7a" }}
            title={`${userName} — Lihat profil`}
          >
            <span className="text-xs font-semibold text-white">{userInitial}</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
            <Link
              href="/profile"
              className="flex items-center gap-2 flex-1 min-w-0"
              title="Lihat profil"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: isAdmin ? "#d97706" : "#1a5f7a" }}
              >
                <span className="text-xs font-semibold text-white">{userInitial}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-200 truncate">{userName}</span>
                <span className="text-xs text-slate-500 truncate">{userEmail}</span>
              </div>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
              title="Keluar"
              aria-label="Logout"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          "absolute -right-3 top-[72px] z-10",
          "w-6 h-6 rounded-full bg-slate-700 border border-slate-600",
          "flex items-center justify-center",
          "text-slate-400 hover:text-white hover:bg-slate-600",
          "transition-all duration-150 shadow-md"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
