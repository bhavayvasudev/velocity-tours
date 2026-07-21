import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, Building2, Wallet, Receipt, Percent, Trophy, Users, TrendingUp, UserCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { taxComponents } from "../lib/gst";
import { exportLedger, exportWorkbook } from "../lib/excelExport";
import { buildTrendData, topByClient, topByVendor, categoryBreakdown, paymentMethodBreakdown, monthlyComparison } from "../lib/analytics";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import ChartCard from "./ui/ChartCard";
import EmptyState from "./ui/EmptyState";
import BookingsLoader from "./BookingsLoader";

const API_URL = `${BASE_API_URL}/api`;

// Validated categorical palette (fixed hue order — see the dataviz skill's
// reference palette). Slots are assigned in order, never cycled per-value.
const CATEGORY_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7", "#008300", "#e34948"];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

function ExportTile({ icon: Icon, label, description, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-soft-lg)] disabled:opacity-60"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-white">{label}</p>
        <p className="truncate text-xs text-slate-400">{description}</p>
      </span>
    </button>
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const [allBookings, setAllBookings] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [bookingsRes, expensesRes] = await Promise.all([
          fetch(`${API_URL}/bookings`, { headers: authHeaders() }),
          fetch(`${API_URL}/expenses`, { headers: authHeaders() }),
        ]);
        if (bookingsRes.ok) setAllBookings(await bookingsRes.json());
        if (expensesRes.ok) setAllExpenses(await expensesRes.json());
      } catch (err) {
        console.error("Error loading report data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const bookingById = useMemo(() => new Map(allBookings.map((b) => [b._id, b])), [allBookings]);

  // 12-month P&L trend — Reports gets more history than the dashboard's
  // quick 6-month glance since this page is where someone sits down to
  // actually review the numbers.
  const trendData = useMemo(
    () => buildTrendData(allBookings, allExpenses, { monthsBack: 12, labelFormat: { month: "short", year: "2-digit" } }),
    [allBookings, allExpenses]
  );

  const topClients = useMemo(() => topByClient(allBookings), [allBookings]);
  const topVendors = useMemo(() => topByVendor(allExpenses), [allExpenses]);
  const categoryData = useMemo(() => categoryBreakdown(allBookings), [allBookings]);
  const paymentMethodData = useMemo(() => paymentMethodBreakdown(allBookings), [allBookings]);
  const comparison = useMemo(() => monthlyComparison(trendData), [trendData]);
  const comparisonChartData = useMemo(() => [
    { metric: "Revenue", "This Month": comparison.thisMonth.revenue, "Last Month": comparison.prevMonth.revenue },
    { metric: "Expenses", "This Month": comparison.thisMonth.expenses, "Last Month": comparison.prevMonth.expenses },
    { metric: "Profit", "This Month": comparison.thisMonth.profit, "Last Month": comparison.prevMonth.profit },
  ], [comparison]);

  const exportPayments = async () => {
    setExporting("payments");
    exportLedger("Payments_Report.xlsx", {
      sheetName: "Payments",
      title: "Velocity Tours — Payments Report",
      columns: [
        { key: "invoiceNumber", header: "Invoice No", value: (b) => b.invoiceNumber || "" },
        { key: "date", header: "Date", value: (b) => new Date(b.date).toLocaleDateString("en-IN") },
        { key: "name", header: "Trip" },
        { key: "clientName", header: "Client" },
        { key: "totalClientPayment", header: "Total", align: "right", currency: true },
        { key: "clientPaidAmount", header: "Received", align: "right", currency: true },
        { key: "pending", header: "Pending", align: "right", currency: true, pendingHighlight: true, value: (b) => (b.totalClientPayment || 0) - (b.clientPaidAmount || 0) },
        { key: "paymentStatus", header: "Status", value: (b) => b.paymentStatus || "" },
      ],
      rows: allBookings,
      totalsColumns: ["totalClientPayment", "clientPaidAmount", "pending"],
    });
    setExporting("");
  };

  const exportExpenses = async () => {
    setExporting("expenses");
    exportLedger("Expenses_Report.xlsx", {
      sheetName: "Expenses",
      title: "Velocity Tours — Expenses Report",
      columns: [
        { key: "vendorName", header: "Vendor" },
        { key: "billNumber", header: "Bill No", value: (e) => e.billNumber || "" },
        { key: "trip", header: "Trip", value: (e) => bookingById.get(e.bookingId)?.name || "" },
        { key: "date", header: "Date", value: (e) => new Date(e.billDate || e.date).toLocaleDateString("en-IN") },
        { key: "amount", header: "Amount", align: "right", currency: true },
        { key: "paidAmount", header: "Paid", align: "right", currency: true },
        { key: "pending", header: "Pending", align: "right", currency: true, pendingHighlight: true, value: (e) => (e.amount || 0) - (e.paidAmount || 0) },
        { key: "paymentStatus", header: "Status", value: (e) => e.paymentStatus || "" },
      ],
      rows: allExpenses,
      totalsColumns: ["amount", "paidAmount", "pending"],
    });
    setExporting("");
  };

  const exportCustomerLedger = async () => {
    setExporting("customers");
    try {
      const res = await fetch(`${API_URL}/customers`, { headers: authHeaders() });
      const customers = res.ok ? await res.json() : [];
      exportLedger("Customer_Ledger.xlsx", {
        sheetName: "Customer Ledger",
        title: "Velocity Tours — Customer Ledger",
        columns: [
          { key: "name", header: "Customer" },
          { key: "bookingCount", header: "Bookings", align: "right" },
          { key: "totalBilled", header: "Total Billed", align: "right", currency: true },
          { key: "totalPaid", header: "Total Paid", align: "right", currency: true },
          { key: "totalPending", header: "Outstanding", align: "right", currency: true, pendingHighlight: true },
        ],
        rows: customers,
        totalsColumns: ["totalBilled", "totalPaid", "totalPending"],
      });
    } finally {
      setExporting("");
    }
  };

  const exportVendorLedger = async () => {
    setExporting("vendors");
    try {
      const res = await fetch(`${API_URL}/vendors`, { headers: authHeaders() });
      const vendors = res.ok ? await res.json() : [];
      exportLedger("Vendor_Ledger.xlsx", {
        sheetName: "Vendor Ledger",
        title: "Velocity Tours — Vendor Ledger",
        columns: [
          { key: "name", header: "Vendor" },
          { key: "billCount", header: "Bills", align: "right" },
          { key: "totalBilled", header: "Total Billed", align: "right", currency: true },
          { key: "totalPaid", header: "Total Paid", align: "right", currency: true },
          { key: "totalPending", header: "Pending", align: "right", currency: true, pendingHighlight: true },
        ],
        rows: vendors,
        totalsColumns: ["totalBilled", "totalPaid", "totalPending"],
      });
    } finally {
      setExporting("");
    }
  };

  const exportCashLedger = async () => {
    setExporting("cash");
    try {
      const res = await fetch(`${API_URL}/cash`, { headers: authHeaders() });
      const entries = res.ok ? await res.json() : [];
      let balance = 0;
      const rows = [...entries]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((e) => {
          balance += e.type === "received" ? e.amount : -e.amount;
          return { ...e, runningBalance: balance };
        });
      exportLedger("Cash_Ledger.xlsx", {
        sheetName: "Cash Ledger",
        title: "Velocity Tours — Cash Ledger",
        columns: [
          { key: "date", header: "Date", value: (e) => new Date(e.date).toLocaleDateString("en-IN") },
          { key: "type", header: "Type" },
          { key: "amount", header: "Amount", align: "right", currency: true },
          { key: "party", header: "Party", value: (e) => (e.type === "received" ? e.receivedFrom : e.depositedTo) || "" },
          { key: "runningBalance", header: "Balance", align: "right", currency: true },
        ],
        rows,
        totalsColumns: ["amount"],
      });
    } finally {
      setExporting("");
    }
  };

  const exportGst = async () => {
    setExporting("gst");
    const outputRows = allBookings.map((b) => ({ ...b, tax: taxComponents(b.totalClientPayment) }));
    exportWorkbook("GST_Summary.xlsx", [
      {
        sheetName: "Output GST",
        title: "Velocity Tours — Output GST",
        columns: [
          { key: "clientName", header: "Client" },
          { key: "name", header: "Trip" },
          { key: "date", header: "Date", value: (r) => new Date(r.date).toLocaleDateString("en-IN") },
          { key: "base", header: "Taxable Value", align: "right", currency: true, value: (r) => r.tax.base },
          { key: "cgst", header: "CGST (9%)", align: "right", currency: true, value: (r) => r.tax.cgst },
          { key: "sgst", header: "SGST (9%)", align: "right", currency: true, value: (r) => r.tax.sgst },
          { key: "total", header: "Total", align: "right", currency: true, value: (r) => r.totalClientPayment },
        ],
        rows: outputRows,
        totalsColumns: ["base", "cgst", "sgst", "total"],
      },
      {
        type: "message",
        sheetName: "Input GST",
        title: "Velocity Tours — Input GST",
        message: "Input GST (on vendor bills) is coming soon — not yet implemented.",
      },
    ]);
    setExporting("");
  };

  if (loading) return <BookingsLoader message="Building reports..." />;

  return (
    <div className="p-6 md:p-10 xl:px-14 space-y-8 pb-24">
      <PageHeader title="Reports" subtitle="Trends across every trip, vendor and client — plus one-click exports." />

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">Export Center</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <ExportTile icon={FileSpreadsheet} label="Payments" description="Client payment ledger" onClick={exportPayments} loading={exporting === "payments"} />
          <ExportTile icon={UserCircle} label="Customer Ledger" description="Per-customer running balance" onClick={exportCustomerLedger} loading={exporting === "customers"} />
          <ExportTile icon={Receipt} label="Expenses" description="Vendor bill ledger" onClick={exportExpenses} loading={exporting === "expenses"} />
          <ExportTile icon={Building2} label="Vendors" description="Per-vendor totals" onClick={exportVendorLedger} loading={exporting === "vendors"} />
          <ExportTile icon={Wallet} label="Cash Ledger" description="Received / deposited / withdrawn" onClick={exportCashLedger} loading={exporting === "cash"} />
          <ExportTile icon={Percent} label="GST Summary" description="Output vs input GST" onClick={exportGst} loading={exporting === "gst"} />
        </div>
      </div>

      <ChartCard
        title="Profit & Loss Trend"
        subtitle="Last 12 months with activity"
        height={300}
        empty={trendData.length === 0}
        emptyIcon={TrendingUp}
        emptyDescription="Add a booking and a vendor bill to see trends here."
      >
        <AreaChart data={trendData}>
          <defs>
            <linearGradient id="reportRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="reportProfitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
          <Tooltip formatter={(v) => formatMoney(v)} />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#reportRevGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f97316" fill="none" strokeWidth={2} strokeDasharray="4 4" />
          <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" fill="url(#reportProfitGrad)" strokeWidth={2} />
        </AreaChart>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="This Month vs. Last Month"
          subtitle="Revenue, expenses and profit"
          height={260}
          empty={comparison.thisMonth.revenue === 0 && comparison.prevMonth.revenue === 0}
          emptyIcon={TrendingUp}
          emptyDescription="Comparisons appear once you have bookings in two different months."
        >
          <BarChart data={comparisonChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
            <XAxis dataKey="metric" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip formatter={(v) => formatMoney(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Last Month" fill="#c3c2b7" radius={[6, 6, 0, 0]} />
            <Bar dataKey="This Month" fill={CATEGORY_COLORS[0]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Booking Categories"
          subtitle="Revenue by trip type"
          height={260}
          empty={categoryData.length === 0}
          emptyIcon={Percent}
          emptyDescription="Add a booking to see the category split."
        >
          <PieChart>
            <Tooltip formatter={(v) => formatMoney(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Pie data={categoryData} dataKey="revenue" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {categoryData.map((entry, i) => (
                <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard
          title="Payment Methods"
          subtitle="Revenue by how it was received"
          height={260}
          empty={paymentMethodData.length === 0}
          emptyIcon={Wallet}
          emptyDescription="Add a booking's payment mode to see the split."
        >
          <PieChart>
            <Tooltip formatter={(v) => formatMoney(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Pie data={paymentMethodData} dataKey="revenue" nameKey="method" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {paymentMethodData.map((entry, i) => (
                <Cell key={entry.method} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
            <Trophy size={16} className="text-amber-500" /> Top Clients by Revenue
          </h3>
          {topClients.length === 0 ? (
            <EmptyState icon={Users} title="No bookings yet" />
          ) : (
            <div className="space-y-1">
              {topClients.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => navigate(`/app/customers/${encodeURIComponent(c.name)}`)}
                  className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{c.name}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(c.revenue)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
            <Building2 size={16} className="text-blue-500" /> Top Vendors by Spend
          </h3>
          {topVendors.length === 0 ? (
            <EmptyState icon={Building2} title="No vendor bills yet" />
          ) : (
            <div className="space-y-1">
              {topVendors.map((v, i) => (
                <div key={v.name} className="flex items-center justify-between rounded-xl p-2.5">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{v.name}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-slate-600 dark:text-slate-300">{formatMoney(v.spend)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
