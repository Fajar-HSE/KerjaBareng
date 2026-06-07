"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Bell,
  Users,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Nav Items ────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tugas", href: "/tasks", icon: CheckSquare },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Notifikasi", href: "/notifications", icon: Bell },
  { label: "Laporan", href: "/analytics", icon: BarChart2 },
];

const ADMIN_ITEMS = [
  { label: "Tim", href: "/admin/team", icon: Users },
  { label: "Pengaturan", href: "/admin/settings", icon: Settings },
];

/* ─── NavItem Component ─────────────────────────────────────── */
function NavItem({
  item,
  collapsed,
  active,
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
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        "group",
        active
          ? "bg-[#1a5f7a] text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
      )}
    >
      {/* Active indicator bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />
      )}

      <Icon
        size={18}
        className={cn(
          "shrink-0 transition-colors",
          active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
        )}
      />

      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
    </Link>
  );
}

/* ─── Sidebar Component ─────────────────────────────────────── */
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-[#0f172a] border-r border-slate-800",
        "transition-[width] duration-250 ease-smooth",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          "flex items-center h-[60px] px-4 border-b border-slate-800 shrink-0",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1a5f7a] shrink-0">
          <Briefcase size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white tracking-tight truncate">
              KerjaBareng
            </span>
            <span className="text-xs text-slate-500 truncate">Tim Task App</span>
          </div>
        )}
      </div>

      {/* ── Nav Main ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}

        {/* Divider */}
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
      </nav>

      {/* ── User Profile ── */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#1a5f7a] flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-white">AD</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-slate-200 truncate">Admin User</span>
              <span className="text-xs text-slate-500 truncate">admin@kerjabareng.com</span>
            </div>
          </div>
        </div>
      )}

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
