// Export handlers specific to the Reports page. Pure formatting glue over
// excelExport.js — callers pass already-computed figures (Reports.jsx owns
// all the filtering/derivation) so this file only ever decides how a report
// is laid out, never recomputes business numbers itself.
import { exportWorkbook } from "./excelExport";

// The Reports page's single "Export Monthly Workbook" action — every sheet
// the business actually uses, in one file, instead of a separate download
// per report. Mirrors the company's own ledger workbook: a revenue (client
// payment) ledger, a vendor-bill ledger with its recorded Input GST, a GST
// summary, a P&L summary, and per-party/cash ledgers.
export async function exportMonthlyWorkbook(
  filename,
  { periodLabel, revenue, expenseTotal, profit, categoryProfit, bookings, expenses, gst, customers, vendors, cashRows }
) {
  await exportWorkbook(filename, [
    {
      sheetName: "P&L Summary",
      title: `Velocity Tours — P&L Summary (${periodLabel})`,
      columns: [
        { key: "metric", header: "Metric" },
        { key: "value", header: "Amount", align: "right", currency: true },
      ],
      rows: [
        { metric: "Revenue", value: revenue },
        { metric: "Expenses", value: expenseTotal },
        { metric: "Net Profit", value: profit },
        { metric: "Output GST", value: gst.output },
        { metric: "Input GST", value: gst.input },
        { metric: "Net GST Payable", value: gst.payable },
      ],
    },
    {
      sheetName: "P&L by Category",
      title: `Velocity Tours — P&L by Category (${periodLabel})`,
      columns: [
        { key: "category", header: "Category" },
        { key: "revenue", header: "Revenue", align: "right", currency: true },
        { key: "expense", header: "Expense", align: "right", currency: true },
        { key: "profit", header: "Profit", align: "right", currency: true },
      ],
      rows: categoryProfit,
      totalsColumns: ["revenue", "expense", "profit"],
    },
    {
      sheetName: "Revenue",
      title: `Velocity Tours — Revenue (${periodLabel})`,
      columns: [
        { key: "invoiceNumber", header: "Invoice No", value: (b) => b.invoiceNumber || "" },
        { key: "date", header: "Date", value: (b) => new Date(b.date).toLocaleDateString("en-IN") },
        { key: "name", header: "Trip" },
        { key: "clientName", header: "Client" },
        { key: "totalClientPayment", header: "Invoice Amount", align: "right", currency: true },
        { key: "clientPaidAmount", header: "Amount Received", align: "right", currency: true },
        { key: "pending", header: "Pending", align: "right", currency: true, pendingHighlight: true, value: (b) => (b.totalClientPayment || 0) - (b.clientPaidAmount || 0) },
        { key: "paymentMode", header: "Received In", value: (b) => b.paymentMode || "" },
        { key: "paymentDate", header: "Payment Date", value: (b) => (b.paymentDate ? new Date(b.paymentDate).toLocaleDateString("en-IN") : "") },
        { key: "remarks", header: "Remarks", value: (b) => b.remarks || "" },
      ],
      rows: bookings,
      totalsColumns: ["totalClientPayment", "clientPaidAmount", "pending"],
    },
    {
      sheetName: "Vendor Bills",
      title: `Velocity Tours — Vendor Bills (${periodLabel})`,
      columns: [
        { key: "vendorName", header: "Vendor" },
        { key: "billNumber", header: "Invoice No", value: (e) => e.billNumber || "" },
        { key: "billDate", header: "Invoice Date", value: (e) => new Date(e.billDate || e.date).toLocaleDateString("en-IN") },
        { key: "amount", header: "Vendor Amount", align: "right", currency: true },
        { key: "paymentMode", header: "Payment Mode", value: (e) => e.paymentMode || "" },
        { key: "bankName", header: "Bank Used", value: (e) => e.bankName || "" },
        { key: "inputGst", header: "Input GST", align: "right", currency: true, value: (e) => e.inputGst || 0 },
        { key: "inputCgst", header: "Input CGST", align: "right", currency: true, value: (e) => e.inputCgst || 0 },
        { key: "inputSgst", header: "Input SGST", align: "right", currency: true, value: (e) => e.inputSgst || 0 },
        { key: "paidAmount", header: "Total Paid", align: "right", currency: true },
        { key: "pending", header: "Pending", align: "right", currency: true, pendingHighlight: true, value: (e) => (e.amount || 0) - (e.paidAmount || 0) },
        { key: "notes", header: "Remarks", value: (e) => e.notes || "" },
      ],
      rows: expenses,
      totalsColumns: ["amount", "inputGst", "inputCgst", "inputSgst", "paidAmount", "pending"],
    },
    {
      sheetName: "GST Summary",
      title: `Velocity Tours — GST Summary (${periodLabel})`,
      columns: [
        { key: "metric", header: "Metric" },
        { key: "value", header: "Amount", align: "right", currency: true },
      ],
      rows: [
        { metric: "Output GST", value: gst.output },
        { metric: "Output CGST", value: gst.outputCgst },
        { metric: "Output SGST", value: gst.outputSgst },
        { metric: "Input GST", value: gst.input },
        { metric: "Input CGST", value: gst.inputCgst },
        { metric: "Input SGST", value: gst.inputSgst },
        { metric: "Net GST Payable", value: gst.payable },
      ],
    },
    {
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
    },
    {
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
    },
    {
      sheetName: "Cash Ledger",
      title: "Velocity Tours — Cash Ledger",
      columns: [
        { key: "date", header: "Date", value: (e) => new Date(e.date).toLocaleDateString("en-IN") },
        { key: "type", header: "Type" },
        { key: "amount", header: "Amount", align: "right", currency: true },
        { key: "party", header: "Party", value: (e) => (e.type === "received" ? e.receivedFrom : e.depositedTo) || "" },
        { key: "runningBalance", header: "Balance", align: "right", currency: true },
      ],
      rows: cashRows,
      totalsColumns: ["amount"],
    },
  ]);
}
