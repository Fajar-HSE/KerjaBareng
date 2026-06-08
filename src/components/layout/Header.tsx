"use client";

import { useState } from "react";
import { Bell, Search, Plus, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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

/* ─── User Avatar ────────────────────────────────────────────── */
function UserAvatar() {
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);

  const userName    = session?.user?.name  ?? "User";
  const userEmail   = session?.user?.email ?? "";
  const isAdmin     = session?.user?.role  === "admin";
  const userInitial = userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatarColor = isAdmin ? "#d97706" : "#1a5f7a";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-1 hover:opacity-80 transition-opacity"
        aria-label="Menu pengguna"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          <span className="text-xs font-semibold text-white">{userInitial}</span>
        </div>
        <div className="hidden sm:flex flex-col items-start leading-none max-w-[120px]">
          <span className="text-xs font-medium text-slate-700 truncate w-full">{userName}</span>
          <span className={cn(
            "text-[10px] font-medium mt-0.5",
            isAdmin ? "text-amber-500" : "text-slate-400"
          )}>
            {isAdmin ? "Admin" : "Member"}
          </span>
        </div>
        <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-30 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm">
            {/* User info */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: avatarColor }}
                >
                  <span className="text-xs font-bold text-white">{userInitial}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                </div>
              </div>
              <span className={cn(
                "inline-flex items-center mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                isAdmin
                  ? "bg-amber-100 text-amber-700"
                  : "bg-[#e8f4f8] text-[#1a5f7a]"
              )}>
                {isAdmin ? "● Admin" : "● Member"}
              </span>
            </div>

            {/* Menu items */}
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Profil Saya
            </Link>
            {isAdmin && (
              <Link
                href="/admin/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Pengaturan
              </Link>
            )}
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={async () => {
                setOpen(false);
                const { signOut } = await import("next-auth/react");
                signOut({ callbackUrl: "/login" });
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              Keluar
            </button>
          </div>
        </>
      )}
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

        <UserAvatar />
      </div>
    </header>
  );
}
