// Fixed payment-mode list shared by every place a payment mode is picked
// (Booking form, Booking Details edit, Vendor Bill form) — matches the
// company's own ledger columns ("RECEIVED" / bank used) exactly, so the app
// never invents a mode the business doesn't actually use.
export const PAYMENT_MODE_OPTIONS = [
  { value: "ICICI", label: "ICICI" },
  { value: "PNB", label: "PNB" },
  { value: "Cash", label: "Cash" },
  { value: "ICICI Cash", label: "ICICI Cash" },
  { value: "PNB Cash", label: "PNB Cash" },
  { value: "TBO CC", label: "TBO CC" },
  { value: "Cheque", label: "Cheque" },
  { value: "Other", label: "Other" },
];
