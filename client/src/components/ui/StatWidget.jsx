import { motion } from "framer-motion";

/**
 * Soft pastel icon-chip tones — deliberately narrow to the app's semantic
 * vocabulary (neutral fact / info / success / warning / danger) instead of
 * a decorative rainbow, so color on a stat card always means something.
 */
const TONES = {
  slate: "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  orange: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
  red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
};

/**
 * Same visual contract as the old inline StatCard in DashboardHome.jsx,
 * promoted to a shared primitive so Vendors/Cash summaries render the same
 * way instead of re-implementing this card.
 */
export default function StatWidget({ title, value, subtext, icon: Icon, tone = "slate" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-soft-lg)]"
    >
      <div className="mb-4 flex items-start justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONES[tone] || TONES.slate}`}>
          {Icon && <Icon size={20} />}
        </span>
      </div>
      <h3 className="text-xs font-medium text-[var(--color-text-muted)]">{title}</h3>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-800 dark:text-white">{value}</p>
      {subtext && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{subtext}</p>}
    </motion.div>
  );
}
