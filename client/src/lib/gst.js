// Every amount in this app (client payments, vendor bills) is stored GST
// inclusive at a flat 18% (see Bookings.jsx / BookingDetails.jsx tax
// breakdowns) — this just centralizes that same split for the GST and
// Dashboard pages instead of re-deriving it a third time.
export function taxComponents(inclusiveAmount) {
  const amount = inclusiveAmount || 0;
  const base = Math.round(amount / 1.18);
  const totalTax = amount - base;
  return { base, totalTax, cgst: totalTax / 2, sgst: totalTax / 2 };
}

// GSTR-3B is due on the 20th of the month following the tax period. Once
// the 20th has passed, the next filing deadline rolls to next month's 20th.
export function nextGstDueDate(from = new Date()) {
  const due = new Date(from.getFullYear(), from.getMonth(), 20);
  if (from.getDate() > 20) due.setMonth(due.getMonth() + 1);
  return due;
}

export function daysUntilGstDue(from = new Date()) {
  const due = nextGstDueDate(from);
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((due - start) / 86400000);
}
