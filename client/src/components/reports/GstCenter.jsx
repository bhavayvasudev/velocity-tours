import { TrendingUp, TrendingDown, Scale, Percent, Info, Clock } from "lucide-react";
import StatWidget from "../ui/StatWidget";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

/**
 * GST Center — output/input/CGST/SGST/net payable in one place, plus the
 * next filing deadline. Deliberately doesn't invent a "filed / pending"
 * ledger — this app has no record of what's actually been filed with the
 * GST portal, so showing one would be a fabricated status. What's shown is
 * only what's derivable from real records: Output GST is the estimated
 * 18%-inclusive liability on client invoices; Input GST is whatever was
 * actually recorded on each vendor bill. Export lives on the one
 * "Export Monthly Workbook" button for the whole Reports page, not here.
 */
export default function GstCenter({ gst, gstDays, gstDueDate, periodLabel }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>Output GST is estimated from the 18% GST already assumed inclusive in invoice amounts (9% CGST + 9% SGST) for {periodLabel}. Input GST is the actual GST recorded on each vendor bill. Confirm with your CA before filing.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
        <StatWidget title="Output GST" value={formatMoney(gst.output)} subtext="Collected on client revenue" icon={TrendingUp} tone="blue" />
        <StatWidget title="Input GST" value={formatMoney(gst.input)} subtext="Paid on vendor bills" icon={TrendingDown} tone="orange" />
        <StatWidget title="Net CGST" value={formatMoney(gst.outputCgst - gst.inputCgst)} subtext="Output CGST minus input CGST" icon={Scale} tone="slate" />
        <StatWidget title="Net SGST" value={formatMoney(gst.outputSgst - gst.inputSgst)} subtext="Output SGST minus input SGST" icon={Scale} tone="slate" />
        <StatWidget
          title="Net GST Payable"
          value={formatMoney(gst.payable)}
          subtext={gst.credit > 0 ? `${formatMoney(gst.credit)} input credit carried forward` : "Output minus input"}
          icon={Percent}
          tone={gst.payable > 0 ? "red" : "emerald"}
        />
      </div>

      <div className="flex items-center gap-3 rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${gstDays <= 3 ? "bg-red-50 text-red-600 dark:bg-red-900/20" : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"}`}>
          <Clock size={20} />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">
            {gstDays <= 0 ? "GST filing is overdue" : `Filing due in ${gstDays} day${gstDays === 1 ? "" : "s"}`}
          </p>
          <p className="text-xs text-slate-400">GSTR-3B due {gstDueDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
