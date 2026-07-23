import EmptyState from "../ui/EmptyState";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

/**
 * Condensed ranked list — Overview's quick preview of top customers/vendors,
 * with a "View all" hand-off into the Revenue/Expenses tab's full
 * leaderboard table rather than duplicating that table twice.
 */
export default function TopList({ icon: Icon, iconTone = "text-slate-400", title, items, valueTone = "text-slate-600 dark:text-slate-300", emptyIcon, emptyTitle, onItemClick, onViewAll, viewAllLabel = "View all" }) {
  return (
    <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
          {Icon && <Icon size={16} className={iconTone} />} {title}
        </h3>
        {onViewAll && items.length > 0 && (
          <button onClick={onViewAll} className="text-xs font-semibold text-blue-600 hover:underline">
            {viewAllLabel}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} />
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => (
            <button
              key={item.name}
              onClick={() => onItemClick?.(item)}
              className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  {i + 1}
                </span>
                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
              </span>
              <span className={`shrink-0 text-sm font-bold ${valueTone}`}>{formatMoney(item.value)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
