"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "motion/react";
import { spring } from "@/components/motion/springs";
import { cn } from "@/lib/utils";

/** Apple-style alert for genuinely destructive, irreversible actions only. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = true,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
          <m.div
            className="absolute inset-0 bg-black/35 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <m.div
            className="glass-strong relative w-full max-w-[300px] overflow-hidden rounded-[14px] text-center shadow-[var(--shadow-lg)]"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={spring.ui}
          >
            <div className="px-5 pt-5 pb-4">
              <h2 id="confirm-title" className="text-[1.0625rem] font-semibold">
                {title}
              </h2>
              {body && <p className="mt-1 text-[0.8125rem] text-fg-muted">{body}</p>}
            </div>
            <div className="grid grid-cols-2 border-t border-line">
              <button ref={cancelRef} type="button" onClick={onCancel} className="h-11 border-r border-line text-[1.0625rem] text-link hover:bg-bg-muted">
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={cn("h-11 text-[1.0625rem] font-semibold hover:bg-bg-muted disabled:opacity-50", destructive ? "text-danger" : "text-link")}
              >
                {confirmLabel}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
