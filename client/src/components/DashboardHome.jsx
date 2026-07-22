import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Building2,
  Percent,
  FileText,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import BookingsLoader from "./BookingsLoader";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { taxComponents, daysUntilGstDue } from "../lib/gst";
import { buildTrendData, monthlyComparison } from "../lib/analytics";
import { deriveStatus } from "../lib/status";
import ChartCard from "./ui/ChartCard";
import EmptyState from "./ui/EmptyState";
import { StatusBadge } from "./ui/Badge";

const API_URL = `${BASE_API_URL}/api`;

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const startOfDay = (d) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };

function relativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Small, deliberately narrow tone vocabulary — color only ever signals
// money-in (emerald), needs-attention (amber), overdue (red) or plain
// information (blue). Nothing decorative.
const TONE_CHIP = {
  neutral: "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
  red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
};
const TONE_TEXT = {
  neutral: "text-slate-800 dark:text-white",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-500",
  blue: "text-blue-600 dark:text-blue-400",
};
const TONE_DOT = {
  neutral: "bg-slate-300",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
};

function HeroStat({ label, value, tone = "neutral" }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-slate-50/70 px-4 py-3 dark:bg-slate-800/40">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${TONE_TEXT[tone]}`}>{value}</p>
    </div>
  );
}

function TaskRow({ icon: Icon, text, tone, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_CHIP[tone]}`}>
        <Icon size={15} />
      </span>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{text}</span>
    </button>
  );
}

function HealthRow({ icon: Icon, label, value, status, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-1 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            <Icon size={15} />
          </span>
          <span className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-sm font-bold text-slate-800 dark:text-white">{value}</span>
          <span className="flex items-center gap-1.5">
            <span className={`text-[11px] font-semibold ${TONE_TEXT[status.tone]}`}>{status.word}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[status.tone]}`} />
          </span>
        </span>
      </span>
      <p className="pl-[42px] text-[11px] text-slate-400">{description}</p>
    </button>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const [allBookings, setAllBookings] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [cashSummary, setCashSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setIsLoading(false); return; }
      try {
        const headers = authHeaders();
        const [bookingsRes, expensesRes] = await Promise.all([
          fetch(`${API_URL}/bookings`, { headers }),
          fetch(`${API_URL}/expenses`, { headers }),
        ]);
        if (bookingsRes.ok && expensesRes.ok) {
          setAllBookings(await bookingsRes.json());
          setAllExpenses(await expensesRes.json());
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/cash/summary`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setCashSummary(data))
      .catch(() => {});
  }, []);

  const bookingById = useMemo(() => new Map(allBookings.map((b) => [b._id, b])), [allBookings]);

  // Last 6 calendar months with any activity, revenue + expenses per month —
  // backs both chart cards below.
  const trendData = useMemo(() => buildTrendData(allBookings, allExpenses, { monthsBack: 6 }), [allBookings, allExpenses]);

  const now = new Date();
  const today = startOfDay(now);
  const { thisMonth, revenueDeltaPct } = useMemo(() => monthlyComparison(trendData), [trendData]);

  // Revenue attributed to today — same booking-date-as-transaction-date
  // convention the Recent Payments feed already uses below.
  const revenueToday = useMemo(
    () => allBookings.filter((b) => startOfDay(b.date).getTime() === today.getTime()).reduce((sum, b) => sum + (b.clientPaidAmount || 0), 0),
    [allBookings]
  );

  const upcomingCount = useMemo(
    () => allBookings.filter((b) => startOfDay(b.date) >= today).length,
    [allBookings]
  );

  // Recent Payments — a merged, dated feed of money in (client payments
  // received) and money out (vendor bills paid), mirroring a real
  // transactions list instead of two separate silos.
  const recentPayments = useMemo(() => {
    const inflows = allBookings
      .filter((b) => (b.clientPaidAmount || 0) > 0)
      .map((b) => ({
        id: `b-${b._id}`,
        kind: "in",
        name: b.clientName,
        method: b.paymentMode || "—",
        status: deriveStatus(b.totalClientPayment, b.clientPaidAmount),
        amount: b.clientPaidAmount,
        date: new Date(b.date),
        onClick: () => navigate(`/app/bookings/${b._id}`),
      }));
    const outflows = allExpenses
      .filter((e) => (e.paidAmount || 0) > 0)
      .map((e) => ({
        id: `e-${e._id}`,
        kind: "out",
        name: e.vendorName,
        method: bookingById.get(e.bookingId)?.name || "Vendor bill",
        status: deriveStatus(e.amount, e.paidAmount),
        amount: e.paidAmount,
        date: new Date(e.date),
        onClick: () => navigate(`/app/expenses`),
      }));

    return [...inflows, ...outflows].sort((a, b) => b.date - a.date).slice(0, 5);
  }, [allBookings, allExpenses, bookingById, navigate]);

  const pendingCustomers = useMemo(
    () => allBookings
      .map((b) => ({ b, pending: Math.max((b.totalClientPayment || 0) - (b.clientPaidAmount || 0), 0) }))
      .filter((r) => r.pending > 0)
      .sort((a, b) => b.pending - a.pending),
    [allBookings]
  );
  const pendingVendors = useMemo(
    () => allExpenses
      .map((e) => ({ e, pending: Math.max((e.amount || 0) - (e.paidAmount || 0), 0) }))
      .filter((r) => r.pending > 0)
      .sort((a, b) => b.pending - a.pending),
    [allExpenses]
  );
  const pendingCustomerTotal = useMemo(() => pendingCustomers.reduce((sum, r) => sum + r.pending, 0), [pendingCustomers]);
  const pendingVendorTotal = useMemo(() => pendingVendors.reduce((sum, r) => sum + r.pending, 0), [pendingVendors]);

  const gstThisMonth = useMemo(() => {
    const output = taxComponents(thisMonth.revenue).totalTax;
    const input = taxComponents(thisMonth.expenses).totalTax;
    return output - input;
  }, [thisMonth]);
  const gstDays = daysUntilGstDue(now);

  // Today's Tasks — everything a business owner needs to act on, derived
  // straight from real records (no invented due dates). Most urgent first,
  // capped so the list stays a glance, not a chore.
  const todaysTasks = useMemo(() => {
    const tasks = [];

    if (pendingCustomers.length > 0) {
      const top = pendingCustomers[0];
      const more = pendingCustomers.length - 1;
      tasks.push({
        id: "collect",
        icon: Users,
        tone: "amber",
        text: `Collect ${formatMoney(top.pending)} from ${top.b.clientName}${more > 0 ? ` (+${more} more)` : ""}`,
        onClick: () => navigate(`/app/bookings/${top.b._id}`),
      });
    }

    if (pendingVendors.length > 0) {
      const top = pendingVendors[0];
      const more = pendingVendors.length - 1;
      tasks.push({
        id: "pay-vendor",
        icon: Building2,
        tone: "amber",
        text: `Pay ${formatMoney(top.pending)} to ${top.e.vendorName}${more > 0 ? ` (+${more} more)` : ""}`,
        onClick: () => navigate("/app/expenses"),
      });
    }

    if (gstDays <= 10) {
      tasks.push({
        id: "gst",
        icon: Percent,
        tone: gstDays <= 3 ? "red" : "amber",
        text: gstDays <= 0 ? "GST filing is overdue" : `GST filing due in ${gstDays} day${gstDays === 1 ? "" : "s"}`,
        onClick: () => navigate("/app/gst"),
      });
    }

    const needsInvoice = allBookings.filter(
      (b) => !b.invoiceNumber && (b.clientPaidAmount || 0) > 0 && (now - new Date(b.date)) <= 30 * 86400000
    );
    if (needsInvoice.length > 0) {
      tasks.push({
        id: "invoices",
        icon: FileText,
        tone: "blue",
        text: `${needsInvoice.length} booking${needsInvoice.length === 1 ? "" : "s"} need${needsInvoice.length === 1 ? "s" : ""} invoices`,
        onClick: () => navigate("/app/bookings"),
      });
    }

    const departuresToday = allBookings.filter((b) => startOfDay(b.date).getTime() === today.getTime());
    if (departuresToday.length > 0) {
      tasks.push({
        id: "departures",
        icon: Plane,
        tone: "blue",
        text: `${departuresToday.length} departure${departuresToday.length === 1 ? "" : "s"} today`,
        onClick: () => navigate("/app/bookings"),
      });
    }

    const order = { red: 0, amber: 1, blue: 2 };
    return tasks.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 5);
  }, [pendingCustomers, pendingVendors, gstDays, allBookings, navigate]);

  if (isLoading) return <BookingsLoader message="Loading your business overview..." />;

  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";
  const greetingEmoji = greetingHour < 12 ? "☀️" : greetingHour < 17 ? "🌤️" : "🌙";

  const heroStats = [
    { label: "Revenue Today", value: formatMoney(revenueToday) },
    { label: "Revenue This Month", value: formatMoney(thisMonth.revenue) },
    { label: "Pending Collections", value: formatMoney(pendingCustomerTotal), tone: pendingCustomerTotal > 0 ? "amber" : "neutral" },
    { label: "Pending Vendor Payments", value: formatMoney(pendingVendorTotal), tone: pendingVendorTotal > 0 ? "amber" : "neutral" },
    { label: "Cash Available", value: cashSummary ? formatMoney(cashSummary.netCashInHand) : "—", tone: cashSummary && cashSummary.netCashInHand < 0 ? "red" : "neutral" },
    { label: "Upcoming Trips", value: String(upcomingCount) },
  ];

  const cashStatus = !cashSummary
    ? { word: "—", tone: "neutral" }
    : cashSummary.netCashInHand >= 0
    ? { word: "Healthy", tone: "emerald" }
    : { word: "Low", tone: "red" };
  const cashDesc = !cashSummary
    ? "Loading cash position..."
    : cashSummary.netCashInHand >= 0
    ? "Enough liquidity for current operations"
    : "Cash balance is negative — review pending deposits";

  const custStatus = pendingCustomerTotal > 0 ? { word: "Attention", tone: "amber" } : { word: "Clear", tone: "emerald" };
  const custDesc = pendingCustomerTotal > 0
    ? `${pendingCustomers.length} customer${pendingCustomers.length === 1 ? "" : "s"} owe money`
    : "All customers paid up";

  const vendorStatus = pendingVendorTotal > 0 ? { word: "Attention", tone: "amber" } : { word: "Clear", tone: "emerald" };
  const vendorDesc = pendingVendorTotal > 0
    ? `${pendingVendors.length} vendor bill${pendingVendors.length === 1 ? "" : "s"} outstanding`
    : "No outstanding vendor bills";

  const gstDesc = gstDays <= 15 ? `Filing due in ${gstDays} day${gstDays === 1 ? "" : "s"}` : "Estimated liability for this month";

  return (
    <div className="space-y-8 p-6 pb-16 md:p-10 xl:px-14">
      {/* HERO — the whole business at a glance in under 5 seconds. */}
      <div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {greeting} <span aria-hidden="true">{greetingEmoji}</span>
          </h1>
          <p className="text-sm text-slate-400">
            {now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="mt-4 border-t border-[var(--color-border-subtle)]" />

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {heroStats.map((stat) => (
            <HeroStat key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* ROW 1 — Revenue + Today's Tasks (left) · Cash Flow (middle) · Recent Payments (right) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* LEFT: Revenue This Month + Today's Tasks */}
        <div className="space-y-6">
          <div className="rounded-[28px] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue This Month</p>
            <div className="mt-2 flex items-end gap-3">
              <h2 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-white">{formatMoney(thisMonth.revenue)}</h2>
              {revenueDeltaPct !== null && (
                <span
                  className={`mb-1 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                    revenueDeltaPct >= 0
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "bg-red-50 text-red-500 dark:bg-red-900/20"
                  }`}
                >
                  {revenueDeltaPct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {Math.abs(revenueDeltaPct).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {revenueDeltaPct !== null ? "Compared to last month" : "No data from last month yet"}
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => navigate("/app/payments", { state: { openRecord: true } })}
                className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-slate-50 py-3 transition-colors hover:bg-slate-100 dark:bg-slate-700/40 dark:hover:bg-slate-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <ArrowDownLeft size={18} />
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Receive Payment</span>
              </button>
            </div>
          </div>

          <div className="rounded-[28px] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <h3 className="mb-1 text-sm font-bold text-slate-800 dark:text-white">Today's Tasks</h3>
            <p className="mb-3 text-xs text-slate-400">What needs your attention</p>

            {todaysTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-8 text-center">
                <p className="text-2xl">🎉</p>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Everything looks good today.</p>
                <p className="text-xs text-slate-400">No urgent actions.</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {todaysTasks.map((task) => (
                  <TaskRow key={task.id} icon={task.icon} text={task.text} tone={task.tone} onClick={task.onClick} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: Cash Flow */}
        <div className="rounded-[28px] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Cash Flow</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-700/60 dark:text-slate-300">
              This month
            </span>
          </div>
          <p className={`text-2xl font-bold ${thisMonth.net >= 0 ? "text-slate-800 dark:text-white" : "text-red-500"}`}>
            {formatMoney(thisMonth.net)}
          </p>
          <p className="mb-2 text-xs text-slate-400">Revenue minus vendor cost</p>

          {trendData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No activity yet" description="Add a booking to see cash flow trends." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="cashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#475569" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#475569" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Area type="monotone" dataKey="net" name="Net Cash Flow" stroke="#475569" strokeWidth={1.5} fill="url(#cashFlowGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* RIGHT: Recent Payments */}
        <div className="rounded-[28px] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Payments</h3>
            <button onClick={() => navigate("/app/payments")} className="text-xs font-semibold text-blue-600 hover:underline">
              See All
            </button>
          </div>

          {recentPayments.length === 0 ? (
            <EmptyState icon={Wallet} title="No payments yet" description="Payments in and out will show up here." />
          ) : (
            <div className="space-y-1.5">
              {recentPayments.map((tx) => (
                <button
                  key={tx.id}
                  onClick={tx.onClick}
                  className="flex w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        tx.kind === "in" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-slate-200/70 text-slate-500 dark:bg-slate-700"
                      }`}
                    >
                      {tx.kind === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{tx.name}</p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-slate-400">
                        <span className="truncate">{tx.method}</span>
                        <span>·</span>
                        <span className="shrink-0">{relativeTime(tx.date)}</span>
                      </p>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`text-sm font-bold ${tx.kind === "in" ? "text-emerald-600" : "text-slate-500"}`}>
                      {tx.kind === "in" ? "+" : "-"}{formatMoney(tx.amount)}
                    </span>
                    <StatusBadge status={tx.status} className="!text-[10px]" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ROW 2 — Revenue vs Expenses (large) · Business Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue vs. Expenses"
            subtitle="Last 6 months with activity"
            height={300}
            empty={trendData.length === 0}
            emptyIcon={TrendingUp}
            emptyDescription="Add a booking to see revenue and expenses trend."
          >
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => formatMoney(v)} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#dashRevGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f97316" fill="none" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ChartCard>
        </div>

        <div className="rounded-[28px] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <h3 className="mb-1 text-sm font-bold text-slate-800 dark:text-white">Business Health</h3>
          <p className="mb-3 text-xs text-slate-400">Tap any line for the full picture</p>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            <HealthRow
              icon={Wallet}
              label="Cash Position"
              value={cashSummary ? formatMoney(cashSummary.netCashInHand) : "—"}
              status={cashStatus}
              description={cashDesc}
              onClick={() => navigate("/app/cash")}
            />
            <HealthRow
              icon={Users}
              label="Pending Customer Payments"
              value={formatMoney(pendingCustomerTotal)}
              status={custStatus}
              description={custDesc}
              onClick={() => navigate("/app/payments")}
            />
            <HealthRow
              icon={Building2}
              label="Pending Vendor Payments"
              value={formatMoney(pendingVendorTotal)}
              status={vendorStatus}
              description={vendorDesc}
              onClick={() => navigate("/app/expenses")}
            />
            <HealthRow
              icon={Percent}
              label="Est. GST Payable (month)"
              value={formatMoney(gstThisMonth)}
              status={{ word: "Info", tone: "blue" }}
              description={gstDesc}
              onClick={() => navigate("/app/gst")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
