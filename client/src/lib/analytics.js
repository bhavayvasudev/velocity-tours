// Shared trend/ranking logic previously duplicated between DashboardHome.jsx
// and Reports.jsx — both bucketed revenue/expenses per month and ranked top
// clients/vendors with near-identical code. Centralized here so both pages
// (and any new chart) share one source of truth.

const keyFor = (d) => `${d.getFullYear()}-${d.getMonth()}`;

/**
 * Buckets bookings (revenue) and expenses (cost) into calendar months.
 * Expenses fall into the month of their linked booking when one exists
 * (mirrors how the P&L is actually earned), falling back to the expense's
 * own date otherwise. Returns the most recent `monthsBack` months that have
 * any activity, oldest first.
 */
export function buildTrendData(bookings, expenses, { monthsBack = 6, labelFormat = { month: "short" } } = {}) {
  const bookingById = new Map(bookings.map((b) => [b._id, b]));
  const buckets = new Map();
  const labelFor = (d) => d.toLocaleString("default", labelFormat);

  bookings.forEach((b) => {
    const d = new Date(b.date);
    const key = keyFor(d);
    if (!buckets.has(key)) buckets.set(key, { key, date: d, label: labelFor(d), revenue: 0, expenses: 0 });
    buckets.get(key).revenue += b.totalClientPayment || 0;
  });
  expenses.forEach((e) => {
    const booking = bookingById.get(e.bookingId);
    const d = new Date(booking ? booking.date : e.date);
    const key = keyFor(d);
    if (!buckets.has(key)) buckets.set(key, { key, date: d, label: labelFor(d), revenue: 0, expenses: 0 });
    buckets.get(key).expenses += e.amount || 0;
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.date - b.date)
    .slice(-monthsBack)
    .map((b) => ({ ...b, profit: b.revenue - b.expenses, net: b.revenue - b.expenses }));
}

export function topByClient(bookings, limit = 5) {
  const byClient = new Map();
  bookings.forEach((b) => byClient.set(b.clientName, (byClient.get(b.clientName) || 0) + (b.totalClientPayment || 0)));
  return Array.from(byClient.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function topByVendor(expenses, limit = 5) {
  const byVendor = new Map();
  expenses.forEach((e) => byVendor.set(e.vendorName, (byVendor.get(e.vendorName) || 0) + (e.amount || 0)));
  return Array.from(byVendor.entries())
    .map(([name, spend]) => ({ name, spend }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, limit);
}

// Same trip-type keyword heuristic Bookings.jsx uses for its per-row icon
// (flight/stay/visa/other) — reused here just for grouping, not rendering,
// since bookings have no dedicated category field.
export function categorizeBooking(name) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("air") || lower.includes("flight") || lower.includes("ticket")) return "Flights";
  if (lower.includes("hotel") || lower.includes("room") || lower.includes("stay")) return "Stays";
  if (lower.includes("visa") || lower.includes("earth") || lower.includes("global") || lower.includes("world")) return "Visa";
  return "Other";
}

export function categoryBreakdown(bookings) {
  const byCategory = new Map();
  bookings.forEach((b) => {
    const category = categorizeBooking(b.name);
    byCategory.set(category, (byCategory.get(category) || 0) + (b.totalClientPayment || 0));
  });
  return Array.from(byCategory.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

// Capped at 6 named methods + "Other" — payment mode is free text, so
// without a cap a long tail of one-off entries would each mint their own
// pie slice instead of a readable chart.
export function paymentMethodBreakdown(bookings, limit = 6) {
  const byMethod = new Map();
  bookings.forEach((b) => {
    const method = (b.paymentMode || "").trim() || "Unspecified";
    byMethod.set(method, (byMethod.get(method) || 0) + (b.totalClientPayment || 0));
  });
  const sorted = Array.from(byMethod.entries())
    .map(([method, revenue]) => ({ method, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  if (sorted.length <= limit) return sorted;
  const top = sorted.slice(0, limit);
  const otherTotal = sorted.slice(limit).reduce((sum, r) => sum + r.revenue, 0);
  return [...top, { method: "Other", revenue: otherTotal }];
}

/**
 * This-month vs. last-month deltas for revenue/expenses/profit, derived from
 * buildTrendData's output. `referenceDate` defaults to the real current date,
 * but Reports.jsx passes the Monthly Timeline's selected month instead when
 * one is active, so clicking a past month re-anchors "this month" to it.
 */
export function monthlyComparison(trendData, referenceDate = new Date()) {
  const now = referenceDate;
  const thisKey = keyFor(now);
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastKey = keyFor(last);
  const empty = { revenue: 0, expenses: 0, profit: 0, net: 0 };
  const thisMonth = trendData.find((t) => t.key === thisKey) || empty;
  const prevMonth = trendData.find((t) => t.key === lastKey) || empty;
  const pctDelta = (curr, prev) => (prev > 0 ? ((curr - prev) / prev) * 100 : null);

  return {
    thisMonth,
    prevMonth,
    revenueDeltaPct: pctDelta(thisMonth.revenue, prevMonth.revenue),
    expensesDeltaPct: pctDelta(thisMonth.expenses, prevMonth.expenses),
    profitDeltaPct: pctDelta(thisMonth.profit, prevMonth.profit),
  };
}
