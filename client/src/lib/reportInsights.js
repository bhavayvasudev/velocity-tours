// Report-page-only derivations layered on top of analytics.js's shared
// trend/ranking helpers. Kept framework-agnostic (plain data in, plain data
// out, no JSX/icons) so it's trivial to unit-reason about and reuse in
// exports — components decide tone/icon/copy from the values returned here.
import { categorizeBooking, categoryBreakdown } from "./analytics";
import { taxComponents, daysUntilGstDue, nextGstDueDate } from "./gst";

const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;

/**
 * Outstanding (accounts receivable) is a balance, not a monthly flow — so
 * unlike revenue/expenses it has to be tracked cumulatively across a
 * booking's *entire* history, not just the trailing `monthsBack` window,
 * otherwise the running total would silently reset every window.
 */
export function cumulativeOutstandingTrend(bookings, { monthsBack = 12, labelFormat = { month: "short" } } = {}) {
  const buckets = new Map();
  bookings.forEach((b) => {
    const d = new Date(b.date);
    const key = monthKey(d);
    if (!buckets.has(key)) buckets.set(key, { key, date: d, label: d.toLocaleString("default", labelFormat), billed: 0, collected: 0 });
    const bucket = buckets.get(key);
    bucket.billed += b.totalClientPayment || 0;
    bucket.collected += b.clientPaidAmount || 0;
  });

  const sorted = Array.from(buckets.values()).sort((a, b) => a.date - b.date);
  let cumBilled = 0;
  let cumCollected = 0;
  const withRunningBalance = sorted.map((b) => {
    cumBilled += b.billed;
    cumCollected += b.collected;
    return { ...b, pending: Math.max(cumBilled - cumCollected, 0) };
  });

  return withRunningBalance.slice(-monthsBack);
}

// Expense total grouped by the *linked booking's* trip category — same
// categorizeBooking heuristic used for revenue, applied via the expense's
// bookingId so "largest expense category" and "most profitable category"
// compare like with like.
export function categoryExpenseBreakdown(bookings, expenses) {
  const bookingById = new Map(bookings.map((b) => [b._id, b]));
  const byCategory = new Map();
  expenses.forEach((e) => {
    const booking = bookingById.get(e.bookingId);
    const category = categorizeBooking(booking?.name);
    byCategory.set(category, (byCategory.get(category) || 0) + (e.amount || 0));
  });
  return Array.from(byCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

// Profit per trip category = category revenue minus the vendor cost tied to
// bookings in that category — a truer "most profitable category" than just
// ranking by revenue, since a high-revenue category can still run thin.
export function categoryProfitBreakdown(bookings, expenses) {
  const revenueByCategory = categoryBreakdown(bookings);
  const expenseByCategory = categoryExpenseBreakdown(bookings, expenses);
  const expenseMap = new Map(expenseByCategory.map((e) => [e.category, e.total]));
  return revenueByCategory
    .map((r) => {
      const expense = expenseMap.get(r.category) || 0;
      return { category: r.category, revenue: r.revenue, expense, profit: r.revenue - expense };
    })
    .sort((a, b) => b.profit - a.profit);
}

/**
 * Deterministic, data-derived business insights — no LLM call involved.
 * Each insight only appears once its underlying data is actually
 * meaningful (e.g. no "revenue increased" claim with nothing to compare
 * against), returned as plain {tone, text} so the panel can render without
 * re-deriving anything.
 */
export function buildInsights({ comparison, categoryProfit, categoryExpense, topClients, topVendors }) {
  const insights = [];
  const pct = (n) => Math.abs(n).toFixed(0);

  if (comparison.revenueDeltaPct !== null) {
    const up = comparison.revenueDeltaPct >= 0;
    insights.push({ tone: up ? "emerald" : "red", text: `Revenue ${up ? "increased" : "decreased"} ${pct(comparison.revenueDeltaPct)}% this month.` });
  }

  if (comparison.expensesDeltaPct !== null) {
    const up = comparison.expensesDeltaPct >= 0;
    insights.push({ tone: up ? "amber" : "emerald", text: `Vendor costs ${up ? "increased" : "decreased"} ${pct(comparison.expensesDeltaPct)}% this month.` });
  }

  if (categoryProfit.length > 0 && categoryProfit[0].profit > 0) {
    insights.push({ tone: "blue", text: `Most profitable booking category: ${categoryProfit[0].category}.` });
  }

  if (categoryExpense.length > 0 && categoryExpense[0].total > 0) {
    insights.push({ tone: "neutral", text: `Largest expense category: ${categoryExpense[0].category}.` });
  }

  if (topClients.length > 0) {
    insights.push({ tone: "neutral", text: `Top customer: ${topClients[0].name}.` });
  }

  if (topVendors.length > 0) {
    insights.push({ tone: "neutral", text: `Top vendor: ${topVendors[0].name}.` });
  }

  return insights;
}

// Money actually *collected* per month (clientPaidAmount) — distinct from
// buildTrendData's "revenue" (totalClientPayment, i.e. billed), so the
// Revenue tab's "Monthly Collections" chart answers "what did we bank" not
// "what did we invoice."
export function monthlyCollectionsTrend(bookings, { monthsBack = 12, labelFormat = { month: "short" } } = {}) {
  const buckets = new Map();
  bookings.forEach((b) => {
    const d = new Date(b.date);
    const key = monthKey(d);
    if (!buckets.has(key)) buckets.set(key, { key, date: d, label: d.toLocaleString("default", labelFormat), collected: 0 });
    buckets.get(key).collected += b.clientPaidAmount || 0;
  });
  return Array.from(buckets.values())
    .sort((a, b) => a.date - b.date)
    .slice(-monthsBack);
}

// Collection-rate insight lives here as its own function (needs clientPaidAmount
// per month, which the shared trend builder doesn't track) so Reports.jsx can
// splice it into the list at the right spot without duplicating bucket logic.
export function collectionRateDelta(bookings) {
  const buckets = new Map();
  bookings.forEach((b) => {
    const d = new Date(b.date);
    const key = monthKey(d);
    if (!buckets.has(key)) buckets.set(key, { key, date: d, billed: 0, collected: 0 });
    const bucket = buckets.get(key);
    bucket.billed += b.totalClientPayment || 0;
    bucket.collected += b.clientPaidAmount || 0;
  });
  const sorted = Array.from(buckets.values()).sort((a, b) => a.date - b.date);
  const now = new Date();
  const thisKey = monthKey(now);
  const lastKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const thisMonth = sorted.find((b) => b.key === thisKey);
  const lastMonth = sorted.find((b) => b.key === lastKey);
  const rate = (b) => (b && b.billed > 0 ? (b.collected / b.billed) * 100 : null);
  const thisRate = rate(thisMonth);
  const lastRate = rate(lastMonth);
  if (thisRate === null || lastRate === null) return null;
  return { thisRate, lastRate, deltaPts: thisRate - lastRate };
}

export function upcomingPayments(bookings, expenses, { now = new Date() } = {}) {
  const pendingCustomers = bookings
    .map((b) => ({ ...b, pending: Math.max((b.totalClientPayment || 0) - (b.clientPaidAmount || 0), 0) }))
    .filter((r) => r.pending > 0)
    .sort((a, b) => b.pending - a.pending);

  const pendingVendors = expenses
    .map((e) => ({ ...e, pending: Math.max((e.amount || 0) - (e.paidAmount || 0), 0) }))
    .filter((r) => r.pending > 0)
    .sort((a, b) => b.pending - a.pending);

  const needsInvoice = bookings
    .filter((b) => !b.invoiceNumber && (b.clientPaidAmount || 0) > 0 && now - new Date(b.date) <= 30 * 86400000)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    pendingCustomers,
    pendingVendors,
    needsInvoice,
    gstDays: daysUntilGstDue(now),
    gstDueDate: nextGstDueDate(now),
  };
}

// Output GST is still the 18%-inclusive estimate derived from client
// invoice amounts (unchanged). Input GST is no longer estimated the same
// way — vendor bills record their own actual GST (Input GST/CGST/SGST),
// entered manually on the vendor bill, so this just sums whatever was
// recorded instead of re-deriving it from the bill total.
export function gstCenterData(bookings, expenses) {
  const output = bookings.reduce((sum, b) => sum + taxComponents(b.totalClientPayment).totalTax, 0);
  const input = expenses.reduce((sum, e) => sum + (e.inputGst || 0), 0);
  const inputCgst = expenses.reduce((sum, e) => sum + (e.inputCgst || 0), 0);
  const inputSgst = expenses.reduce((sum, e) => sum + (e.inputSgst || 0), 0);
  const netGst = output - input;
  return {
    output,
    outputCgst: output / 2,
    outputSgst: output / 2,
    input,
    inputCgst,
    inputSgst,
    netGst,
    payable: Math.max(netGst, 0),
    credit: Math.max(-netGst, 0),
  };
}
