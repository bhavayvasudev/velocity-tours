import { Filter } from "lucide-react";

/**
 * Shared filter-pill wrapper — a soft token-driven surface (not the
 * hardcoded `bg-slate-100 dark:bg-slate-800/50` div every list page used to
 * repeat) that houses a label plus one or more `ui/Select` filters.
 */
export default function FilterBar({ icon: Icon = Filter, label, children, className = "" }) {
  return (
    <div
      className={`flex w-fit flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] p-2 ${className}`}
    >
      <div className="flex items-center gap-1.5 px-2 text-sm font-semibold text-[var(--color-text-muted)]">
        <Icon size={15} />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
