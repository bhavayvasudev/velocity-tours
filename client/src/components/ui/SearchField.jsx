import { Search } from "lucide-react";

/**
 * Shared search input — a soft, full-pill field with a leading icon,
 * replacing the raw `<input>` every list page (Bookings/Vendors/Payments/
 * Expenses/Cash) used to hand-roll with its own ad-hoc slate classes.
 */
export default function SearchField({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)] py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition-shadow duration-150 placeholder:text-[var(--color-text-muted)] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:text-white"
      />
    </div>
  );
}
