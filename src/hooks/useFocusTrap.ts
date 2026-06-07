import { useEffect, useRef } from "react";

/**
 * Focus trap untuk modal / drawer.
 *
 * Behaviour:
 * - Saat overlay buka: fokus pindah ke elemen pertama yang focusable di dalam container
 * - Tab: siklus hanya di dalam container (bukan keluar ke background)
 * - Shift+Tab: siklus mundur
 * - Saat overlay tutup: fokus dikembalikan ke elemen yang aktif sebelum overlay dibuka
 *
 * WCAG 2.1 SC 2.1.2 (No Keyboard Trap) — focus boleh keluar via Escape
 * yang sudah ditangani oleh useOverlayBehavior.
 */

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "details > summary",
].join(", ");

export function useFocusTrap(open: boolean) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    /* Simpan elemen yang sedang aktif sebelum overlay dibuka */
    previousFocus.current = document.activeElement;

    /* Pindahkan fokus ke elemen pertama yang focusable di dalam container */
    const container = containerRef.current;
    if (!container) return;

    const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    const first = focusable[0];
    if (first) {
      /* requestAnimationFrame memastikan DOM sudah fully rendered */
      const raf = requestAnimationFrame(() => first.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [open]);

  /* Kembalikan fokus ke elemen sebelumnya saat overlay tutup */
  useEffect(() => {
    if (open) return;
    const el = previousFocus.current;
    if (el && el instanceof HTMLElement) {
      const raf = requestAnimationFrame(() => el.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [open]);

  /* Tab handler — tahan fokus di dalam container */
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => !el.closest("[aria-hidden='true']"));

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        /* Shift+Tab: jika fokus di elemen pertama → loncat ke terakhir */
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        /* Tab: jika fokus di elemen terakhir → loncat ke pertama */
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return containerRef;
}
