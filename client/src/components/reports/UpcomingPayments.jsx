import { Users, Building2, Percent, FileText } from "lucide-react";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

function DueColumn({ icon: Icon, tone, title, rows, emptyText }) {
  const toneClasses = {
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
  };
  return (
    <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <Icon size={15} />
        </span>
        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h4>
      </div>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <button
              key={r.key}
              onClick={r.onClick}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              <span className="min-w-0 truncate text-xs font-medium text-slate-600 dark:text-slate-300">{r.label}</span>
              {r.value !== undefined && <span className="shrink-0 text-xs font-bold text-slate-800 dark:text-white">{r.value}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Section 11 of the brief — actionable due lists instead of one more chart.
 * All four columns share one visual language so "what needs to happen
 * next" reads as a single answer, not four different widgets.
 */
export default function UpcomingPayments({ pendingCustomers, pendingVendors, needsInvoice, gstDays, gstDueDate, onCustomerClick, onVendorClick, onInvoiceClick, onGstClick }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <DueColumn
        icon={Users}
        tone="amber"
        title="Customer Payments Due"
        emptyText="No customers owe money."
        rows={pendingCustomers.slice(0, 6).map((b) => ({
          key: b._id,
          label: b.clientName,
          value: formatMoney(b.pending),
          onClick: () => onCustomerClick(b),
        }))}
      />
      <DueColumn
        icon={Building2}
        tone="amber"
        title="Vendor Payments Due"
        emptyText="No outstanding vendor bills."
        rows={pendingVendors.slice(0, 6).map((e) => ({
          key: e._id,
          label: e.vendorName,
          value: formatMoney(e.pending),
          onClick: () => onVendorClick(e),
        }))}
      />
      <DueColumn
        icon={Percent}
        tone={gstDays <= 3 ? "red" : "blue"}
        title="GST Deadline"
        emptyText="No filing due."
        rows={[
          {
            key: "gst",
            label: gstDays <= 0 ? "Filing overdue" : `Due in ${gstDays} day${gstDays === 1 ? "" : "s"}`,
            value: gstDueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            onClick: onGstClick,
          },
        ]}
      />
      <DueColumn
        icon={FileText}
        tone="blue"
        title="Invoice Due"
        emptyText="Every recent paid booking has an invoice."
        rows={needsInvoice.slice(0, 6).map((b) => ({
          key: b._id,
          label: b.clientName,
          value: new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          onClick: () => onInvoiceClick(b),
        }))}
      />
    </div>
  );
}
