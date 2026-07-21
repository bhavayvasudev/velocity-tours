import { ResponsiveContainer } from "recharts";
import EmptyState from "./EmptyState";

export default function ChartCard({
  title,
  subtitle,
  height = 280,
  actions,
  children,
  empty = false,
  emptyIcon,
  emptyTitle = "Nothing to chart yet",
  emptyDescription,
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-subtle)] shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {empty ? (
        <div style={{ height: Math.max(height, 220) }} className="flex items-center justify-center overflow-hidden">
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
