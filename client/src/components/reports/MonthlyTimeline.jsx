import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Clicking a month drives every other section on the page (via Reports.jsx's
 * shared filter state) instead of just decorating an otherwise-empty chart
 * slot. Bar height is each month's revenue relative to the year's busiest
 * month — a shape to skim, not a chart to read precisely. The year here is
 * this widget's own nav, independent of the global period filter, so
 * browsing years doesn't require first switching the Period filter away
 * from "Lifetime".
 */
export default function MonthlyTimeline({ months, year, selectedIndex, onSelect, onYearChange }) {
  const maxRevenue = Math.max(1, ...months.map((m) => m.revenue));

  return (
    <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Monthly Timeline</h3>
          <p className="text-xs text-slate-400">Click a month to filter every report below</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIndex !== null && (
            <button
              onClick={() => onSelect(null)}
              className="rounded-full border border-[var(--color-border-subtle)] px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              Clear
            </button>
          )}
          <div className="flex items-center gap-1 rounded-full border border-[var(--color-border-subtle)] px-1 py-1">
            <button onClick={() => onYearChange(-1)} aria-label="Previous year" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40">
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[3ch] text-center text-xs font-bold text-slate-700 dark:text-slate-200">{year}</span>
            <button onClick={() => onYearChange(1)} aria-label="Next year" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {months.map((m) => {
          const active = selectedIndex === m.index;
          const barHeight = Math.max(4, Math.round((m.revenue / maxRevenue) * 44));
          return (
            <button
              key={m.index}
              onClick={() => onSelect(active ? null : m.index)}
              className={`flex min-w-[52px] flex-1 flex-col items-center gap-2 rounded-2xl px-2 py-3 transition-colors ${
                active ? "bg-blue-600 text-white" : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
              }`}
            >
              <div className="flex h-11 w-full items-end justify-center">
                <div
                  className={`w-2.5 rounded-full ${
                    active ? "bg-white" : m.revenue > 0 ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                  style={{ height: barHeight }}
                />
              </div>
              <span className={`text-xs font-bold ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
