import { taxComponents } from "./gst";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount || 0);

// Booking fields are free-text entered elsewhere in the app (trip name,
// client name, remarks) and land here via document.write, so they need
// escaping same as any other untrusted string rendered as HTML.
const escapeHtml = (str) =>
  String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/**
 * Opens a print-ready invoice for a booking in a new tab and triggers the
 * browser print dialog (Save as PDF works from there) — no PDF-generation
 * dependency needed for a one-off printable document.
 */
export function openInvoice(booking) {
  const { base, cgst, sgst } = taxComponents(booking.totalClientPayment);
  const balanceDue = (booking.totalClientPayment || 0) - (booking.clientPaidAmount || 0);
  const win = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!win) return;

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${escapeHtml(booking.invoiceNumber || booking._id)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; padding: 48px; max-width: 720px; margin: 0 auto; }
          .brand { font-size: 22px; font-weight: 800; color: #2563eb; margin-bottom: 4px; }
          .muted { color: #64748b; font-size: 13px; }
          .row { display: flex; justify-content: space-between; margin-top: 32px; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 28px; }
          th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          th { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px; }
          .amount-col { text-align: right; }
          .totals { margin-top: 16px; margin-left: auto; width: 260px; }
          .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .totals .grand { font-weight: 800; font-size: 16px; border-top: 1px solid #e2e8f0; margin-top: 6px; padding-top: 10px; }
          .due { color: ${balanceDue > 0 ? "#ea580c" : "#059669"}; font-weight: 700; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="brand">Velocity Tours</div>
        <div class="muted">Travel &amp; Holiday Bookings</div>

        <div class="row">
          <div>
            <h1>Invoice ${booking.invoiceNumber ? "#" + escapeHtml(booking.invoiceNumber) : ""}</h1>
            <div class="muted">${new Date(booking.date).toLocaleDateString("en-IN", { dateStyle: "long" })}</div>
          </div>
          <div style="text-align:right">
            <div class="muted">Billed to</div>
            <div style="font-weight:700">${escapeHtml(booking.clientName)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Description</th><th class="amount-col">Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>${escapeHtml(booking.name)}</td><td class="amount-col">${formatMoney(base)}</td></tr>
          </tbody>
        </table>

        <div class="totals">
          <div><span>Taxable Value</span><span>${formatMoney(base)}</span></div>
          <div><span>CGST (9%)</span><span>${formatMoney(cgst)}</span></div>
          <div><span>SGST (9%)</span><span>${formatMoney(sgst)}</span></div>
          <div class="grand"><span>Total</span><span>${formatMoney(booking.totalClientPayment)}</span></div>
          <div><span>Amount Received</span><span>${formatMoney(booking.clientPaidAmount)}</span></div>
          <div class="due"><span>Balance Due</span><span>${formatMoney(balanceDue)}</span></div>
        </div>

        ${booking.remarks ? `<p class="muted" style="margin-top:32px">Notes: ${escapeHtml(booking.remarks)}</p>` : ""}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
