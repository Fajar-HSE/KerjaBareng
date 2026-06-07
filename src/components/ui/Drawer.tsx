"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOverlayBehavior } from "@/hooks/useOverlayBehavior";

interface DrawerProps {
  open:     boolean;
  onClose:  () => void;
  title?:   string;
  children: React.ReactNode;
  width?:   string;
}

export default function Drawer({
  open, onClose, title, children, width = "w-[480px]",
}: DrawerProps) {
  useOverlayBehavior(open, onClose);

  const titleId = "drawer-title";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px]",
          "transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 bg-white shadow-2xl",
          "flex flex-col transition-transform duration-250 max-w-full",
          width,
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          {title && (
            <h2 id={titleId} className="heading-3">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Tutup panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
