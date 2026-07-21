import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

/**
 * Floating "New Entry" speed dial — the single quick-entry surface for
 * every write action that isn't "New Booking" (that one lives in the nav
 * pill itself, since it's the most common). One tap away from anywhere in
 * the app instead of requiring a page visit first.
 * `actions`: [{ key, icon, label, onSelect }]
 */
export default function SpeedDial({ actions }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && setOpen(false);
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const handleSelect = (action) => {
    setOpen(false);
    action.onSelect?.();
  };

  return (
    <div ref={rootRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 md:bottom-8 md:right-8">
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Quick actions"
            className="flex flex-col items-end gap-2"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: { transition: { staggerChildren: 0.045, staggerDirection: -1 } },
              closed: { transition: { staggerChildren: 0.03, staggerDirection: 1 } },
            }}
          >
            {actions.map((action) => (
              <motion.button
                key={action.key}
                role="menuitem"
                onClick={() => handleSelect(action)}
                variants={{
                  closed: { opacity: 0, y: 10, scale: 0.9 },
                  open: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                className="flex items-center gap-3 whitespace-nowrap rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)] py-2 pl-2 pr-4 text-left shadow-[var(--shadow-soft-lg)] transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <action.icon size={16} />
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        aria-expanded={open}
        aria-label={open ? "Close quick actions" : "New entry"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.45)] transition-shadow hover:shadow-[0_10px_24px_-6px_rgba(37,99,235,0.55)] hover:bg-blue-700"
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex"
        >
          <Plus size={26} />
        </motion.span>
      </motion.button>
    </div>
  );
}
