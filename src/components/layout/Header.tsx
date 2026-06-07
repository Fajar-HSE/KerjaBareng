"use client";

import { useState } from "react";
import { Bell, Search, Plus, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ─── Notification dot ──────────────────────────────────────── */
function NotifBell() {
  return (
    <Link href="/notifications" className="relative btn btn-ghost p-2 rounded-lg" aria-label="Notifikasi">
      <Bell size={18} />
      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 border-2 border-white" />
    </Link>
  );
}

/* ─── Search Bar ────────────────────────────────────────────── */
function SearchBar() {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-150",
        "bg-[#f8fafc] w-64",
        focused
          ? "border-[#1a5f7a] ring-2 ring-[#1a5f7a]/10"
          : "border-[#e2e8f0] hover:border-slate-300"
      )}
    >
      <Search size={15} className="text-slate-400 shrink-0" />
      <input
        type="text"
        placeholder="Cari tugas, anggota..."
        className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
        ⌘K
      </kbd>
    </div>
  );
}

/* ─── Page Title (slot) ─────────────────────────────────────── */
export interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title = "Dashboard", subtitle, action }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between",
        "h-[60px] px-6 bg-white border-b border-[#e2e8f0]",
        "shrink-0"
      )}
      style={{ boxShadow: "0 1px 0 0 #e2e8f0" }}
    >
      {/* Left: page title */}
      <div className="flex flex-col min-w-0">
        <h1 className="text-[1.0625rem] font-semibold text-slate-900 tracking-tight leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <SearchBar />

        <NotifBell />

        {/* Optional action slot */}
        {action ?? (
          <button className="btn btn-primary gap-1.5 h-9 px-3 text-sm rounded-lg">
            <Plus size={16} />
            <span className="hidden sm:inline">Buat Tugas</span>
          </button>
        )}

        {/* User avatar shortcut */}
        <button className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
          <div className="w-8 h-8 rounded-full bg-[#1a5f7a] flex items-center justify-center">
            <span className="text-xs font-semibold text-white">AD</span>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
}
