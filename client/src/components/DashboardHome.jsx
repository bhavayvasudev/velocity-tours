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
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import BookingsLoader from "./BookingsLoader";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { taxComponents } from "../lib/gst";
import { buildTrendData, monthlyComparison } from "../lib/analytics";
import ChartCard from "./ui/ChartCard";
import EmptyState from "./ui/EmptyState";

const API_URL = `${BASE_API_URL}/api`;

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const startOfDay = (d) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };

function HealthRow({ icon: Icon, label, value, dot, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
          <Icon size={15} />
        </span>
        <span className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-bold text-slate-800 dark:text-white">{value}</span>
        <span className={`h-2 w-2 rounded-full ${dot}`} />
      </span>
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
  const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const { thisMonth, prevMonth, revenueDeltaPct } = useMemo(() => monthlyComparison(trendData), [trendData]);

  // Upcoming trips — bookings dated today or later, soonest first.
  const upcomingTrips = useMemo(() => {
    const today = startOfDay(now);
    return allBookings
      .filter((b) => startOfDay(b.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 2);
  }, [allBookings]);

  // Recent Payments — a merged, dated feed of money in (client payments
  // received) and money out (vendor bills paid), mirroring a real
  // transactions list instead of two separate silos.
  const recentPayments = useMemo(() => {
    const inflows = allBookings
      .filter((b) => (b.clientPaidAmount || 0) > 0)
      .map((b) => ({ id: `b-${b._id}`, kind: "in", name: b.clientName, sub: b.name, amount: b.clientPaidAmount, date: new Date(b.date), onClick: () => navigate(`/app/bookings/${b._id}`) }));
    const outflows = allExpenses
      .filter((e) => (e.paidAmount || 0) > 0)
      .map((e) => ({ id: `e-${e._id}`, kind: "out", name: e.vendorName, sub: bookingById.get(e.bookingId)?.name || "Vendor bill", amount: e.paidAmount, date: new Date(e.date), onClick: () => navigate(`/app/expenses`) }));

    return [...inflows, ...outflows].sort((a, b) => b.date - a.date).slice(0, 6);
  }, [allBookings, allExpenses, bookingById, navigate]);

  const pendingCustomerTotal = useMemo(
    () => allBookings.reduce((sum, b) => sum + Math.max((b.totalClientPayment || 0) - (b.clientPaidAmount || 0), 0), 0),
    [allBookings]
  );
  const pendingVendorTotal = useMemo(
    () => allExpenses.reduce((sum, e) => sum + Math.max((e.amount || 0) - (e.paidAmount || 0), 0), 0),
    [allExpenses]
  );

  const gstThisMonth = useMemo(() => {
    const output = taxComponents(thisMonth.revenue).totalTax;
    const input = taxComponents(thisMonth.expenses).totalTax;
    return output - input;
  }, [thisMonth]);

  if (isLoading) return <BookingsLoader message="Loading your business overview..." />;

  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 p-6 pb-28 md:p-10 xl:px-14">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{greeting}.</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })} · here's how the business looks right now.
        </p>
      </div>

      {/* ROW 1 — Revenue + Business Overview (left) · Cash Flow (middle) · Recent Payments (right) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* LEFT: Revenue This Month + Business Overview */}
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue This Month</p>
            <div className="mt-2 flex items-end gap-3">
              <h2 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-white">{formatMoney(thisMonth.revenue)}</h2>
              {revenueDeltaPct !== null && (
                <span className={`mb-1 flex items-center gap-0.5 text-xs font-bold ${revenueDeltaPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {revenueDeltaPct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {Math.abs(revenueDeltaPct).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">vs {formatMoney(prevMonth.revenue)} last month</p>

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

          <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Business Overview</h3>
              <span className="text-xs text-slate-400">Upcoming trips</span>
            </div>

            {upcomingTrips.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-4 dark:border-slate-700">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700">
                  <Plane size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No upcoming trips</p>
                  <p className="text-xs text-slate-400">New bookings dated today or later will show up here.</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {upcomingTrips.map((trip, i) => (
                  <button
                    key={trip._id}
                    onClick={() => navigate(`/app/bookings/${trip._id}`)}
                    className={`relative flex h-32 w-44 shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-4 text-left shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] ${
                      i === 0 ? "bg-gradient-to-br from-blue-600 to-indigo-600" : "bg-gradient-to-br from-slate-700 to-slate-900"
                    }`}
                  >
                    <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full border border-white/10" />
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-white/10" />
                    <Plane className="text-white/80" size={20} />
                    <div className="relative">
                      <p className="truncate text-sm font-bold text-white">{trip.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-white/70">{trip.clientName}</p>
                      <p className="mt-1 text-[11px] font-medium text-white/60">
                        {new Date(trip.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: Cash Flow */}
        <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-tint-blue)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Cash Flow</h3>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800/50 dark:text-slate-300">
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
              <BarChart data={trendData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.15)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="net" name="Net Cash Flow" radius={[6, 6, 6, 6]}>
                  {trendData.map((entry) => (
                    <Cell key={entry.key} fill={entry.key === thisMonthKey ? "#2563eb" : entry.net >= 0 ? "#93c5fd" : "#fca5a5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* RIGHT: Recent Payments */}
        <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-tint-mint)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Payments</h3>
            <button onClick={() => navigate("/app/payments")} className="text-xs font-semibold text-blue-600 hover:underline">
              See All
            </button>
          </div>

          {recentPayments.length === 0 ? (
            <EmptyState icon={Wallet} title="No payments yet" description="Payments in and out will show up here." />
          ) : (
            <div className="space-y-1">
              {recentPayments.map((tx) => (
                <button
                  key={tx.id}
                  onClick={tx.onClick}
                  className="flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/60 dark:hover:bg-slate-800/40"
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
                      <p className="truncate text-xs text-slate-400">{tx.sub}</p>
                    </span>
                  </span>
                  <span className={`shrink-0 text-sm font-bold ${tx.kind === "in" ? "text-emerald-600" : "text-slate-500"}`}>
                    {tx.kind === "in" ? "+" : "-"}{formatMoney(tx.amount)}
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

        <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <h3 className="mb-1 text-sm font-bold text-slate-800 dark:text-white">Business Health</h3>
          <p className="mb-3 text-xs text-slate-400">Tap any line for the full picture</p>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            <HealthRow
              icon={Wallet}
              label="Cash Position"
              value={cashSummary ? formatMoney(cashSummary.netCashInHand) : "—"}
              dot={!cashSummary ? "bg-slate-300" : cashSummary.netCashInHand >= 0 ? "bg-emerald-500" : "bg-red-500"}
              onClick={() => navigate("/app/cash")}
            />
            <HealthRow
              icon={Users}
              label="Pending Customer Payments"
              value={formatMoney(pendingCustomerTotal)}
              dot={pendingCustomerTotal > 0 ? "bg-amber-500" : "bg-emerald-500"}
              onClick={() => navigate("/app/payments")}
            />
            <HealthRow
              icon={Building2}
              label="Pending Vendor Payments"
              value={formatMoney(pendingVendorTotal)}
              dot={pendingVendorTotal > 0 ? "bg-amber-500" : "bg-emerald-500"}
              onClick={() => navigate("/app/expenses")}
            />
            <HealthRow
              icon={Percent}
              label="Est. GST Payable (month)"
              value={formatMoney(gstThisMonth)}
              dot="bg-blue-500"
              onClick={() => navigate("/app/gst")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
