import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutGrid,
  TrendingUp,
  Receipt,
  Percent,
  Wallet,
  Download,
  Loader2,
  Building2,
  Users,
  Trophy,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import {
  buildTrendData,
  topByClient,
  topByVendor,
  categoryBreakdown,
  categorizeBooking,
  paymentMethodBreakdown,
  monthlyComparison,
} from "../lib/analytics";
import {
  cumulativeOutstandingTrend,
  categoryProfitBreakdown,
  categoryExpenseBreakdown,
  monthlyCollectionsTrend,
  collectionRateDelta,
  buildInsights,
  upcomingPayments,
  gstCenterData,
} from "../lib/reportInsights";
import { exportMonthlyWorkbook } from "../lib/reportExports";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import ChartCard from "./ui/ChartCard";
import DataTable from "./ui/DataTable";
import BookingsLoader from "./BookingsLoader";
import KpiCard from "./reports/KpiCard";
import MonthlyTimeline from "./reports/MonthlyTimeline";
import CashFlowDiagram from "./reports/CashFlowDiagram";
import TopList from "./reports/TopList";
import GstCenter from "./reports/GstCenter";
import UpcomingPayments from "./reports/UpcomingPayments";
import InsightsPanel from "./reports/InsightsPanel";
import ReportFilterBar from "./reports/ReportFilterBar";

const API_URL = `${BASE_API_URL}/api`;

// Validated categorical palette (fixed hue order — see the dataviz skill's
// reference palette). Slots are assigned in order, never cycled per-value.
const CATEGORY_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7", "#008300", "#e34948"];

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "revenue", label: "Revenue", icon: TrendingUp },
  { key: "expenses", label: "Expenses", icon: Receipt },
  { key: "gst", label: "GST", icon: Percent },
  { key: "payments", label: "Payments", icon: Wallet },
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function Reports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => setSearchParams(tab === "overview" ? {} : { tab });

  const [allBookings, setAllBookings] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [secondaryLoading, setSecondaryLoading] = useState(true);
  const [isExportingWorkbook, setIsExportingWorkbook] = useState(false);

  const now = useMemo(() => new Date(), []);
  const [filters, setFilters] = useState({
    periodType: "all",
    year: now.getFullYear(),
    month: now.getMonth(),
    quarter: "Q1",
    bookingType: "all",
    customer: "all",
    vendor: "all",
    paymentMode: "all",
  });
  const [timelineYear, setTimelineYear] = useState(now.getFullYear());

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

  useEffect(() => {
    const load = async () => {
      try {
        setSecondaryLoading(true);
        const [customersRes, vendorsRes] = await Promise.all([
          fetch(`${API_URL}/customers`, { headers: authHeaders() }),
          fetch(`${API_URL}/vendors`, { headers: authHeaders() }),
        ]);
        if (customersRes.ok) setCustomers(await customersRes.json());
        if (vendorsRes.ok) setVendors(await vendorsRes.json());
      } catch (err) {
        console.error("Error loading customer/vendor totals:", err);
      } finally {
        setSecondaryLoading(false);
      }
    };
    load();
  }, []);

  const bookingById = useMemo(() => new Map(allBookings.map((b) => [b._id, b])), [allBookings]);

  // --- Global filter bar — booking type / customer / vendor / payment mode
  // apply everywhere; the period (date/month/year) only applies to flow
  // metrics (revenue, expenses, GST). "Outstanding" and "due" lists are
  // balances as of right now, so they deliberately ignore the period filter
  // the same way the Dashboard's pending totals always mean "right now". ---
  const nonTimeBookings = useMemo(
    () =>
      allBookings.filter((b) => {
        if (filters.bookingType !== "all" && categorizeBooking(b.name) !== filters.bookingType) return false;
        if (filters.customer !== "all" && b.clientName !== filters.customer) return false;
        if (filters.paymentMode !== "all" && ((b.paymentMode || "").trim() || "Unspecified") !== filters.paymentMode) return false;
        return true;
      }),
    [allBookings, filters.bookingType, filters.customer, filters.paymentMode]
  );

  const nonTimeExpenses = useMemo(
    () =>
      allExpenses.filter((e) => {
        const booking = bookingById.get(e.bookingId);
        if (filters.vendor !== "all" && e.vendorName !== filters.vendor) return false;
        if (filters.bookingType !== "all" && categorizeBooking(booking?.name) !== filters.bookingType) return false;
        if (filters.customer !== "all" && booking?.clientName !== filters.customer) return false;
        return true;
      }),
    [allExpenses, bookingById, filters.vendor, filters.bookingType, filters.customer]
  );

  const inPeriod = (dateStr) => {
    if (filters.periodType === "all") return true;
    const d = new Date(dateStr);
    const m = d.getMonth();
    const y = d.getFullYear();
    if (filters.periodType === "monthly") return m === Number(filters.month) && y === Number(filters.year);
    if (filters.periodType === "yearly") {
      const fyStart = new Date(filters.year, 3, 1);
      const fyEnd = new Date(Number(filters.year) + 1, 2, 31);
      return d >= fyStart && d <= fyEnd;
    }
    if (filters.periodType === "quarterly") {
      const ranges = { Q1: [3, 5], Q2: [6, 8], Q3: [9, 11], Q4: [0, 2] };
      const [start, end] = ranges[filters.quarter];
      const fy = filters.quarter === "Q4" ? Number(filters.year) + 1 : Number(filters.year);
      return m >= start && m <= end && y === fy;
    }
    return true;
  };

  const filteredBookings = useMemo(() => nonTimeBookings.filter((b) => inPeriod(b.date)), [nonTimeBookings, filters.periodType, filters.year, filters.month, filters.quarter]);
  const filteredExpenses = useMemo(
    () =>
      nonTimeExpenses.filter((e) => {
        const booking = bookingById.get(e.bookingId);
        return inPeriod(booking ? booking.date : e.billDate || e.date);
      }),
    [nonTimeExpenses, bookingById, filters.periodType, filters.year, filters.month, filters.quarter]
  );

  const periodLabel = useMemo(() => {
    if (filters.periodType === "monthly") return `${new Date(filters.year, filters.month).toLocaleString("default", { month: "long" })} ${filters.year}`;
    if (filters.periodType === "quarterly") return `${filters.quarter}, FY ${filters.year}-${filters.year + 1}`;
    if (filters.periodType === "yearly") return `FY ${filters.year}-${filters.year + 1}`;
    return "Lifetime";
  }, [filters.periodType, filters.year, filters.month, filters.quarter]);

  // --- Trend / comparison — anchored to the real current month by default,
  // but re-anchored to whichever month the Monthly Timeline has selected so
  // "clicking a month instantly updates every report" holds for the KPI
  // cards too. ---
  const trendData = useMemo(() => buildTrendData(nonTimeBookings, nonTimeExpenses, { monthsBack: 12 }), [nonTimeBookings, nonTimeExpenses]);
  const comparison = useMemo(() => {
    const anchor = filters.periodType === "monthly" ? new Date(filters.year, filters.month, 1) : now;
    return monthlyComparison(trendData, anchor);
  }, [trendData, filters.periodType, filters.year, filters.month, now]);

  const outstandingTrend = useMemo(() => cumulativeOutstandingTrend(nonTimeBookings, { monthsBack: 12 }), [nonTimeBookings]);
  const outstandingNow = outstandingTrend[outstandingTrend.length - 1]?.pending ?? 0;
  const outstandingPrev = outstandingTrend[outstandingTrend.length - 2]?.pending ?? null;
  const outstandingDeltaPct = outstandingPrev ? ((outstandingNow - outstandingPrev) / outstandingPrev) * 100 : null;

  const topClients = useMemo(() => topByClient(filteredBookings, 8), [filteredBookings]);
  const topVendors = useMemo(() => topByVendor(filteredExpenses, 8), [filteredExpenses]);
  const categoryData = useMemo(() => categoryBreakdown(filteredBookings), [filteredBookings]);
  const paymentMethodData = useMemo(() => paymentMethodBreakdown(filteredBookings), [filteredBookings]);
  const categoryProfit = useMemo(() => categoryProfitBreakdown(filteredBookings, filteredExpenses), [filteredBookings, filteredExpenses]);
  const categoryExpense = useMemo(() => categoryExpenseBreakdown(filteredBookings, filteredExpenses), [filteredBookings, filteredExpenses]);
  const collectionsTrend = useMemo(() => monthlyCollectionsTrend(nonTimeBookings, { monthsBack: 12 }), [nonTimeBookings]);
  const collectionRate = useMemo(() => collectionRateDelta(nonTimeBookings), [nonTimeBookings]);
  const gst = useMemo(() => gstCenterData(filteredBookings, filteredExpenses), [filteredBookings, filteredExpenses]);
  const upcoming = useMemo(() => upcomingPayments(nonTimeBookings, nonTimeExpenses), [nonTimeBookings, nonTimeExpenses]);

  const insights = useMemo(() => {
    const list = buildInsights({ comparison, categoryProfit, categoryExpense, topClients, topVendors });
    if (collectionRate) {
      const up = collectionRate.deltaPts >= 0;
      list.splice(1, 0, {
        tone: up ? "emerald" : "amber",
        text: `Customer collections ${up ? "improved" : "slipped"} ${Math.abs(collectionRate.deltaPts).toFixed(0)} points this month.`,
      });
    }
    return list;
  }, [comparison, categoryProfit, categoryExpense, topClients, topVendors, collectionRate]);

  const aiPrompts = useMemo(
    () => [
      {
        label: "Explain this month's business.",
        context: `Revenue: ${formatMoney(comparison.thisMonth.revenue)}. Expenses: ${formatMoney(comparison.thisMonth.expenses)}. Net profit: ${formatMoney(comparison.thisMonth.profit)}. Top customer: ${topClients[0]?.name || "none"}. Top vendor: ${topVendors[0]?.name || "none"}.`,
      },
      {
        label: "Why did profit decrease?",
        context: `Revenue: ${formatMoney(comparison.thisMonth.revenue)} (${comparison.revenueDeltaPct !== null ? comparison.revenueDeltaPct.toFixed(0) + "% vs last month" : "no prior month"}). Expenses: ${formatMoney(comparison.thisMonth.expenses)} (${comparison.expensesDeltaPct !== null ? comparison.expensesDeltaPct.toFixed(0) + "% vs last month" : "no prior month"}). Largest expense category: ${categoryExpense[0]?.category || "n/a"} at ${formatMoney(categoryExpense[0]?.total || 0)}.`,
      },
      {
        label: "Which customers are paying late?",
        context: upcoming.pendingCustomers.length > 0
          ? `Customers with outstanding balances: ${upcoming.pendingCustomers.slice(0, 5).map((c) => `${c.clientName} owes ${formatMoney(c.pending)}`).join("; ")}.`
          : "No customers currently owe money.",
      },
      {
        label: "Where can I save money?",
        context: categoryExpense.length > 0
          ? `Vendor spend by category: ${categoryExpense.map((c) => `${c.category} ${formatMoney(c.total)}`).join(", ")}. Top vendor: ${topVendors[0]?.name || "none"} at ${formatMoney(topVendors[0]?.spend || 0)}.`
          : "No vendor bills recorded yet.",
      },
    ],
    [comparison, topClients, topVendors, categoryExpense, upcoming]
  );

  const askAi = (item) => {
    window.dispatchEvent(new CustomEvent("velocity:ask-ai", { detail: { prompt: `${item.label} Here is the real data from the Reports page: ${item.context}` } }));
  };

  const moneyIn = useMemo(() => filteredBookings.reduce((sum, b) => sum + (b.clientPaidAmount || 0), 0), [filteredBookings]);
  const moneyOut = useMemo(() => filteredExpenses.reduce((sum, e) => sum + (e.paidAmount || 0), 0), [filteredExpenses]);

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return Array.from({ length: 5 }, (_, i) => y - 2 + i);
  }, [now]);
  const customerOptions = useMemo(
    () => Array.from(new Set(allBookings.map((b) => b.clientName))).sort().map((n) => ({ value: n, label: n })),
    [allBookings]
  );
  const vendorOptions = useMemo(
    () => Array.from(new Set(allExpenses.map((e) => e.vendorName))).sort().map((n) => ({ value: n, label: n })),
    [allExpenses]
  );
  const paymentModeOptions = useMemo(
    () => Array.from(new Set(allBookings.map((b) => (b.paymentMode || "").trim() || "Unspecified"))).sort().map((n) => ({ value: n, label: n })),
    [allBookings]
  );

  // --- Monthly Timeline ---
  const timelineMonths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const revenue = nonTimeBookings
          .filter((b) => {
            const d = new Date(b.date);
            return d.getFullYear() === timelineYear && d.getMonth() === i;
          })
          .reduce((sum, b) => sum + (b.totalClientPayment || 0), 0);
        return { index: i, label: new Date(0, i).toLocaleString("default", { month: "short" }), revenue };
      }),
    [nonTimeBookings, timelineYear]
  );
  const timelineSelectedIndex = filters.periodType === "monthly" && Number(filters.year) === timelineYear ? Number(filters.month) : null;
  const handleTimelineSelect = (idx) => {
    if (idx === null) setFilters((prev) => ({ ...prev, periodType: "all" }));
    else setFilters((prev) => ({ ...prev, periodType: "monthly", year: timelineYear, month: idx }));
  };

  const periodRevenue = useMemo(() => filteredBookings.reduce((sum, b) => sum + (b.totalClientPayment || 0), 0), [filteredBookings]);
  const periodExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0), [filteredExpenses]);
  const periodProfit = periodRevenue - periodExpenses;

  const slug = periodLabel.replace(/[^a-z0-9]+/gi, "_");

  // --- The Reports page's one export action: every sheet the business
  // uses, in a single workbook, instead of a separate download per report. ---
  const handleExportWorkbook = async () => {
    setIsExportingWorkbook(true);
    try {
      const res = await fetch(`${API_URL}/cash`, { headers: authHeaders() });
      const entries = res.ok ? await res.json() : [];
      let balance = 0;
      const cashRows = [...entries]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((e) => {
          balance += e.type === "received" ? e.amount : -e.amount;
          return { ...e, runningBalance: balance };
        });

      await exportMonthlyWorkbook(`Velocity_Tours_Workbook_${slug}.xlsx`, {
        periodLabel,
        revenue: periodRevenue,
        expenseTotal: periodExpenses,
        profit: periodProfit,
        categoryProfit,
        bookings: filteredBookings,
        expenses: filteredExpenses,
        gst,
        customers,
        vendors,
        cashRows,
      });
    } catch (err) {
      console.error("Export Monthly Workbook failed:", err);
    } finally {
      setIsExportingWorkbook(false);
    }
  };

  if (loading) return <BookingsLoader message="Building your Finance & Insights workspace..." />;

  return (
    <div className="p-6 md:p-10 xl:px-14 space-y-8 pb-24">
      <PageHeader
        title="Finance & Insights"
        subtitle="How much you earned, spent, owe and are owed."
        actions={
          <Button icon={isExportingWorkbook ? Loader2 : Download} disabled={isExportingWorkbook} onPress={handleExportWorkbook}>
            Export Monthly Workbook
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-soft)]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === t.key ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/40"
              }`}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <ReportFilterBar filters={filters} setFilters={setFilters} yearOptions={yearOptions} customerOptions={customerOptions} vendorOptions={vendorOptions} paymentModeOptions={paymentModeOptions} />

      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Revenue" value={formatMoney(comparison.thisMonth.revenue)} deltaPct={comparison.revenueDeltaPct} sparkline={trendData.map((t) => t.revenue)} icon={TrendingUp} tone="blue" />
            <KpiCard label="Expenses" value={formatMoney(comparison.thisMonth.expenses)} deltaPct={comparison.expensesDeltaPct} sparkline={trendData.map((t) => t.expenses)} icon={Receipt} tone="amber" />
            <KpiCard label="Net Profit" value={formatMoney(comparison.thisMonth.profit)} deltaPct={comparison.profitDeltaPct} sparkline={trendData.map((t) => t.profit)} icon={Wallet} tone={comparison.thisMonth.profit >= 0 ? "emerald" : "red"} />
            <KpiCard
              label="Outstanding Amount"
              value={formatMoney(outstandingNow)}
              deltaPct={outstandingDeltaPct}
              sparkline={outstandingTrend.map((t) => t.pending)}
              icon={Users}
              tone={outstandingNow > 0 ? "amber" : "slate"}
              subtext="Owed by customers, right now"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <InsightsPanel insights={insights} aiPrompts={aiPrompts} onAskAi={askAi} />
            </div>
            <div className="lg:col-span-1">
              <CashFlowDiagram moneyIn={moneyIn} moneyOut={moneyOut} />
            </div>
          </div>

          <MonthlyTimeline months={timelineMonths} year={timelineYear} selectedIndex={timelineSelectedIndex} onSelect={handleTimelineSelect} onYearChange={(d) => setTimelineYear((y) => y + d)} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopList
              icon={Trophy}
              iconTone="text-amber-500"
              title="Top Customers by Revenue"
              items={topClients.map((c) => ({ name: c.name, value: c.revenue }))}
              valueTone="text-emerald-600 dark:text-emerald-400"
              emptyIcon={Users}
              emptyTitle="No bookings yet"
              onItemClick={(item) => navigate(`/app/customers/${encodeURIComponent(item.name)}`)}
              onViewAll={() => setActiveTab("revenue")}
            />
            <TopList
              icon={Building2}
              iconTone="text-blue-500"
              title="Top Vendors by Spend"
              items={topVendors.map((v) => ({ name: v.name, value: v.spend }))}
              emptyIcon={Building2}
              emptyTitle="No vendor bills yet"
              onViewAll={() => setActiveTab("expenses")}
            />
          </div>
        </div>
      )}

      {activeTab === "revenue" && (
        <div className="space-y-8">
          <ChartCard title="Revenue Over Time" subtitle="Last 12 months with activity" height={280} empty={trendData.length === 0} emptyIcon={TrendingUp} emptyDescription="Add a booking to see revenue trend.">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="revTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => formatMoney(v)} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revTrendGrad)" strokeWidth={2} />
            </AreaChart>
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Booking Categories" subtitle="Revenue by trip type" height={Math.max(220, categoryData.length * 46)} empty={categoryData.length === 0} emptyIcon={Percent} emptyDescription="Add a booking to see the category split.">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-subtle)" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} fontSize={12} width={80} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {categoryData.map((entry, i) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartCard>

            <ChartCard title="Monthly Collections" subtitle="Client payments actually received" height={280} empty={collectionsTrend.every((c) => c.collected === 0)} emptyIcon={Wallet} emptyDescription="Record a client payment to see collections here.">
              <BarChart data={collectionsTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="collected" name="Collected" fill="#1baf7a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-white">
              <Trophy size={16} className="text-amber-500" /> Top Customers
              <span className="font-normal text-xs text-slate-400">— all-time totals</span>
            </h3>
            <DataTable
              loading={secondaryLoading}
              columns={customerColumns()}
              data={customersForTable(customers, filters.customer)}
              emptyIcon={Users}
              emptyTitle="No customers yet"
              pageSize={8}
              onRowClick={(row) => navigate(`/app/customers/${encodeURIComponent(row.name)}`)}
            />
          </div>
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="space-y-8">
          <ChartCard title="Expenses Over Time" subtitle="Last 12 months with activity" height={280} empty={trendData.length === 0} emptyIcon={Receipt} emptyDescription="Add a vendor bill to see expense trend.">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="expTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => formatMoney(v)} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f97316" fill="url(#expTrendGrad)" strokeWidth={2} />
            </AreaChart>
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Vendor Payments" subtitle="Spend by vendor" height={Math.max(220, topVendors.length * 40)} empty={topVendors.length === 0} emptyIcon={Building2} emptyDescription="Add a vendor bill to see spend by vendor.">
              <BarChart data={topVendors} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-subtle)" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={90} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="spend" fill={CATEGORY_COLORS[1]} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Expense by Category" subtitle="Where vendor cost goes" height={Math.max(220, categoryExpense.length * 46)} empty={categoryExpense.length === 0} emptyIcon={Percent} emptyDescription="Add a vendor bill to see the category split.">
              <BarChart data={categoryExpense} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-subtle)" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} fontSize={12} width={80} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="total" fill={CATEGORY_COLORS[3]} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-white">
              <Building2 size={16} className="text-blue-500" /> Top Vendors
              <span className="font-normal text-xs text-slate-400">— all-time totals</span>
            </h3>
            <DataTable
              loading={secondaryLoading}
              columns={vendorColumns()}
              data={vendorsForTable(vendors, filters.vendor)}
              emptyIcon={Building2}
              emptyTitle="No vendors yet"
              pageSize={8}
              onRowClick={(row) => navigate(`/app/vendors/${row._id}`)}
            />
          </div>
        </div>
      )}

      {activeTab === "gst" && (
        <GstCenter gst={gst} gstDays={upcoming.gstDays} gstDueDate={upcoming.gstDueDate} periodLabel={periodLabel} />
      )}

      {activeTab === "payments" && (
        <div className="space-y-8">
          <ChartCard title="Payment Methods" subtitle="Revenue by how it was received" height={Math.max(220, paymentMethodData.length * 46)} empty={paymentMethodData.length === 0} emptyIcon={Wallet} emptyDescription="Add a booking's payment mode to see the split.">
            <BarChart data={paymentMethodData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-subtle)" />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <YAxis type="category" dataKey="method" tickLine={false} axisLine={false} fontSize={12} width={90} />
              <Tooltip formatter={(v) => formatMoney(v)} />
              <Bar dataKey="revenue" fill={CATEGORY_COLORS[2]} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartCard>

          <UpcomingPayments
            pendingCustomers={upcoming.pendingCustomers}
            pendingVendors={upcoming.pendingVendors}
            needsInvoice={upcoming.needsInvoice}
            gstDays={upcoming.gstDays}
            gstDueDate={upcoming.gstDueDate}
            onCustomerClick={(b) => navigate(`/app/bookings/${b._id}`)}
            onVendorClick={() => navigate("/app/expenses")}
            onInvoiceClick={(b) => navigate(`/app/bookings/${b._id}`)}
            onGstClick={() => setActiveTab("gst")}
          />
        </div>
      )}
    </div>
  );
}

function customersForTable(customers, customerFilter) {
  return customers
    .filter((c) => customerFilter === "all" || c.name === customerFilter)
    .slice()
    .sort((a, b) => b.totalBilled - a.totalBilled);
}

function vendorsForTable(vendors, vendorFilter) {
  return vendors
    .filter((v) => vendorFilter === "all" || v.name === vendorFilter)
    .slice()
    .sort((a, b) => b.totalBilled - a.totalBilled);
}

function customerColumns() {
  return [
    { accessorKey: "name", header: "Customer" },
    { accessorKey: "totalBilled", header: "Revenue", meta: { align: "right" }, cell: ({ getValue }) => <span className="font-semibold text-slate-800 dark:text-white">{formatMoney(getValue())}</span> },
    { accessorKey: "bookingCount", header: "Trips", meta: { align: "right" } },
    {
      accessorKey: "totalPending",
      header: "Outstanding",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className={getValue() > 0 ? "font-semibold text-red-500" : "text-slate-400"}>{formatMoney(getValue())}</span>,
    },
    {
      accessorKey: "lastActivity",
      header: "Last Booking",
      cell: ({ getValue }) => (getValue() ? new Date(getValue()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"),
    },
  ];
}

function vendorColumns() {
  return [
    { accessorKey: "name", header: "Vendor" },
    { accessorKey: "totalPaid", header: "Total Paid", meta: { align: "right" }, cell: ({ getValue }) => <span className="font-semibold text-slate-800 dark:text-white">{formatMoney(getValue())}</span> },
    { accessorKey: "billCount", header: "Bookings", meta: { align: "right" } },
    {
      accessorKey: "totalPending",
      header: "Pending Bills",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className={getValue() > 0 ? "font-semibold text-red-500" : "text-slate-400"}>{formatMoney(getValue())}</span>,
    },
  ];
}
