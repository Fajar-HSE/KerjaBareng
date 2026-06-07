"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full bg-white rounded-xl shadow-xl",
          "flex flex-col max-h-[90vh]",
          sizeMap[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <div>
              <h2 id="modal-title" className="heading-3">{title}</h2>
              {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors -mt-0.5 -mr-1 p-1 rounded-lg hover:bg-slate-100"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
