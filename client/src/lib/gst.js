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
