import { TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const TONE_ICON_BG = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
  slate: "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300",
  red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
};
const SPARK_STROKE = { blue: "#2a78d6", emerald: "#1baf7a", amber: "#eda100", slate: "#64748b", red: "#e34948" };

/**
 * The four large "Top Summary" KPI cards — current value, month-over-month
 * delta, a tiny trend sparkline (last N months, no axes/tooltip — a glance,
 * not a chart to read), and an icon. Deliberately bigger and fewer than the
 * old small-card row, per the "this is a workspace, not a dashboard" brief.
 */
export default function KpiCard({ label, value, deltaPct, sparkline, icon: Icon, tone = "blue", subtext }) {
  const dataKey = "value";
  const sparkData = sparkline.map((v) => ({ [dataKey]: v }));
  const hasDelta = deltaPct !== null && deltaPct !== undefined;
  const up = hasDelta && deltaPct >= 0;

  return (
    <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONE_ICON_BG[tone] || TONE_ICON_BG.blue}`}>
          {Icon && <Icon size={20} />}
        </span>
        {hasDelta && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
              up
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300"
                : "bg-red-50 text-red-500 dark:bg-red-900/20"
            }`}
          >
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(deltaPct).toFixed(0)}%
          </span>
        )}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-800 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtext || (hasDelta ? "vs. last month" : "No prior month to compare")}</p>

      {sparkData.length > 1 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`kpiSpark-${label.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SPARK_STROKE[tone]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={SPARK_STROKE[tone]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={SPARK_STROKE[tone]}
                strokeWidth={1.75}
                fill={`url(#kpiSpark-${label.replace(/\s+/g, "")})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
