import { ArrowDownLeft, ArrowUpRight, ArrowRight, ArrowDown, Building2 } from "lucide-react";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

function FlowNode({ icon: Icon, label, value, tone }) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
    slate: "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
  };
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-5 text-center">
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${toneClasses[tone]}`}>
        <Icon size={20} />
      </span>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-800 dark:text-white">{formatMoney(value)}</p>
    </div>
  );
}

/**
 * "Money In → Business → Money Out" as an actual flow, not a third line
 * chart — a proportional bar underneath makes the in/out gap visible at a
 * glance, and the center node carries the net result.
 */
export default function CashFlowDiagram({ moneyIn, moneyOut }) {
  const net = moneyIn - moneyOut;
  const total = Math.max(moneyIn, moneyOut, 1);

  return (
    <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <h3 className="mb-1 text-sm font-bold text-slate-800 dark:text-white">Cash Flow</h3>
      <p className="mb-4 text-xs text-slate-400">Money in, through the business, and out</p>

      <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
        <FlowNode icon={ArrowDownLeft} label="Money In" value={moneyIn} tone="emerald" />
        <ArrowRight size={18} className="hidden shrink-0 text-slate-300 md:block" />
        <ArrowDown size={18} className="shrink-0 text-slate-300 md:hidden" />

        <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 px-4 py-5 text-center dark:border-blue-900/40">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
            <Building2 size={20} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Net Cash Flow</p>
          <p className={`text-lg font-bold ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
            {net >= 0 ? "+" : ""}
            {formatMoney(net)}
          </p>
        </div>

        <ArrowRight size={18} className="hidden shrink-0 text-slate-300 md:block" />
        <ArrowDown size={18} className="shrink-0 text-slate-300 md:hidden" />
        <FlowNode icon={ArrowUpRight} label="Money Out" value={moneyOut} tone="slate" />
      </div>

      <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full bg-emerald-500" style={{ width: `${(moneyIn / total) * 100}%` }} />
        <div className="h-full bg-slate-400" style={{ width: `${(moneyOut / total) * 100}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
        <span>In {formatMoney(moneyIn)}</span>
        <span>Out {formatMoney(moneyOut)}</span>
      </div>
    </div>
  );
}
