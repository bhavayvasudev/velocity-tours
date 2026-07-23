import { useEffect, useMemo, useState } from "react";
import { Download, TrendingUp, TrendingDown, Scale, Info } from "lucide-react";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { taxComponents } from "../lib/gst";
import { exportWorkbook } from "../lib/excelExport";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import Select from "./ui/Select";
import StatWidget from "./ui/StatWidget";
import FilterBar from "./ui/FilterBar";
import BookingsLoader from "./BookingsLoader";

const API_URL = `${BASE_API_URL}/api`;

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

// The GST page is a summary/dashboard only — Output GST is still the
// 18%-inclusive estimate derived from client invoice amounts (unchanged
// from the original implementation). Input GST is no longer estimated the
// same way: it's whatever was recorded on each vendor bill's own Input
// GST/CGST/SGST fields, summed as-is. No manual entry happens on this page.
export default function GST() {
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [bookingsRes, expensesRes] = await Promise.all([
          fetch(`${API_URL}/bookings`, { headers: authHeaders() }),
          fetch(`${API_URL}/expenses`, { headers: authHeaders() }),
        ]);
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (expensesRes.ok) setExpenses(await expensesRes.json());
      } catch (err) {
        console.error("Error loading GST data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const inPeriod = (dateStr) => {
    if (filterType === "all") return true;
    const d = new Date(dateStr);
    const m = d.getMonth(), y = d.getFullYear();
    if (filterType === "monthly") return m === Number(selectedMonth) && y === Number(selectedYear);
    if (filterType === "yearly") {
      const fyStart = new Date(selectedYear, 3, 1);
      const fyEnd = new Date(Number(selectedYear) + 1, 2, 31);
      return d >= fyStart && d <= fyEnd;
    }
    if (filterType === "quarterly") {
      const ranges = { Q1: [3, 5], Q2: [6, 8], Q3: [9, 11], Q4: [0, 2] };
      const [start, end] = ranges[selectedQuarter];
      const fy = selectedQuarter === "Q4" ? Number(selectedYear) + 1 : Number(selectedYear);
      return m >= start && m <= end && y === fy;
    }
    return true;
  };

  // --- OUTPUT GST — collected on client invoices/bookings. Unchanged from
  // the original implementation. ---
  const filteredBookings = useMemo(() => bookings.filter((b) => inPeriod(b.date)), [bookings, filterType, selectedYear, selectedMonth, selectedQuarter]);

  const invoiceRows = useMemo(
    () => filteredBookings.map((b) => ({ ...b, tax: taxComponents(b.totalClientPayment) })),
    [filteredBookings]
  );

  const outputGst = invoiceRows.reduce((sum, r) => sum + r.tax.totalTax, 0);
  const outputCgst = invoiceRows.reduce((sum, r) => sum + r.tax.cgst, 0);
  const outputSgst = invoiceRows.reduce((sum, r) => sum + r.tax.sgst, 0);

  // --- INPUT GST — recorded directly on each vendor bill, not derived. ---
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => inPeriod(e.billDate || e.date)),
    [expenses, filterType, selectedYear, selectedMonth, selectedQuarter]
  );

  const inputGst = filteredExpenses.reduce((sum, e) => sum + (e.inputGst || 0), 0);
  const inputCgst = filteredExpenses.reduce((sum, e) => sum + (e.inputCgst || 0), 0);
  const inputSgst = filteredExpenses.reduce((sum, e) => sum + (e.inputSgst || 0), 0);

  // --- NET POSITION ---
  const netGst = outputGst - inputGst;
  const gstPayable = Math.max(netGst, 0);
  const gstCredit = Math.max(-netGst, 0);

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 2; i++) yearOptions.push(i);

  const handleExport = () => {
    exportWorkbook("GST_Summary.xlsx", [
      {
        sheetName: "Output GST",
        title: "Velocity Tours — Output GST",
        columns: [
          { key: "invoiceNumber", header: "Invoice No", value: (r) => r.invoiceNumber || "" },
          { key: "clientName", header: "Client" },
          { key: "name", header: "Trip" },
          { key: "date", header: "Date", value: (r) => new Date(r.date).toLocaleDateString("en-IN") },
          { key: "base", header: "Taxable Value", align: "right", currency: true, value: (r) => r.tax.base },
          { key: "cgst", header: "Output CGST (9%)", align: "right", currency: true, value: (r) => r.tax.cgst },
          { key: "sgst", header: "Output SGST (9%)", align: "right", currency: true, value: (r) => r.tax.sgst },
          { key: "total", header: "Total", align: "right", currency: true, value: (r) => r.totalClientPayment },
        ],
        rows: invoiceRows,
        totalsColumns: ["base", "cgst", "sgst", "total"],
      },
      {
        sheetName: "Input GST",
        title: "Velocity Tours — Input GST",
        columns: [
          { key: "billNumber", header: "Bill No", value: (r) => r.billNumber || "" },
          { key: "vendorName", header: "Vendor" },
          { key: "date", header: "Date", value: (r) => new Date(r.billDate || r.date).toLocaleDateString("en-IN") },
          { key: "amount", header: "Vendor Amount", align: "right", currency: true },
          { key: "inputGst", header: "Input GST", align: "right", currency: true, value: (r) => r.inputGst || 0 },
          { key: "inputCgst", header: "Input CGST", align: "right", currency: true, value: (r) => r.inputCgst || 0 },
          { key: "inputSgst", header: "Input SGST", align: "right", currency: true, value: (r) => r.inputSgst || 0 },
        ],
        rows: filteredExpenses,
        totalsColumns: ["amount", "inputGst", "inputCgst", "inputSgst"],
      },
      {
        sheetName: "Summary",
        title: "Velocity Tours — GST Summary",
        columns: [
          { key: "metric", header: "Metric" },
          { key: "value", header: "Amount", align: "right", currency: true },
        ],
        rows: [
          { metric: "Output GST", value: outputGst },
          { metric: "Output CGST", value: outputCgst },
          { metric: "Output SGST", value: outputSgst },
          { metric: "Input GST", value: inputGst },
          { metric: "Input CGST", value: inputCgst },
          { metric: "Input SGST", value: inputSgst },
          { metric: "Net GST (Output − Input)", value: netGst },
          { metric: "GST Payable", value: gstPayable },
        ],
      },
    ]);
  };

  if (loading) return <BookingsLoader message="Calculating GST..." />;

  return (
    <div className="p-6 md:p-10 xl:px-14 space-y-8 pb-24">
      <PageHeader
        title="GST"
        subtitle="Estimated tax position for the selected period."
        actions={<Button variant="outline" icon={Download} onPress={handleExport}>Export</Button>}
      />

      <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>
          Output GST is estimated from the 18% GST already assumed inclusive in your invoice amounts (9% CGST + 9% SGST).
          Input GST is the actual GST recorded on each vendor bill. Confirm with your CA before filing.
        </p>
      </div>

      <FilterBar label="Period:">
        <Select
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: "all", label: "Lifetime" },
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "yearly", label: "Financial Year" },
          ]}
        />
        {filterType !== "all" && (
          <>
            <Select
              value={String(selectedYear)}
              onChange={(v) => setSelectedYear(Number(v))}
              options={yearOptions.map((y) => ({ value: String(y), label: filterType === "monthly" ? String(y) : `FY ${y}-${y + 1}` }))}
            />
            {filterType === "quarterly" && (
              <Select
                value={selectedQuarter}
                onChange={setSelectedQuarter}
                options={[
                  { value: "Q1", label: "Q1 (Apr-Jun)" },
                  { value: "Q2", label: "Q2 (Jul-Sep)" },
                  { value: "Q3", label: "Q3 (Oct-Dec)" },
                  { value: "Q4", label: "Q4 (Jan-Mar)" },
                ]}
              />
            )}
            {filterType === "monthly" && (
              <Select
                value={String(selectedMonth)}
                onChange={(v) => setSelectedMonth(Number(v))}
                options={Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: new Date(0, i).toLocaleString("default", { month: "long" }) }))}
              />
            )}
          </>
        )}
      </FilterBar>

      <div>
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
          <TrendingUp size={13} /> Output GST — collected on client revenue
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatWidget title="Total Output GST" value={formatMoney(outputGst)} subtext="Total collected" icon={TrendingUp} tone="blue" />
          <StatWidget title="Output CGST" value={formatMoney(outputCgst)} subtext="Half of Output GST" icon={TrendingUp} tone="blue" />
          <StatWidget title="Output SGST" value={formatMoney(outputSgst)} subtext="Half of Output GST" icon={TrendingUp} tone="blue" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
          <TrendingDown size={13} /> Input GST — recorded on vendor bills
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatWidget title="Total Input GST" value={formatMoney(inputGst)} subtext="Total recorded from vendors" icon={TrendingDown} tone="orange" />
          <StatWidget title="Input CGST" value={formatMoney(inputCgst)} subtext="As recorded on vendor bills" icon={TrendingDown} tone="orange" />
          <StatWidget title="Input SGST" value={formatMoney(inputSgst)} subtext="As recorded on vendor bills" icon={TrendingDown} tone="orange" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <StatWidget
          title="Net GST Payable"
          value={formatMoney(gstPayable)}
          subtext={gstCredit > 0 ? `${formatMoney(gstCredit)} input credit carried forward` : "Output GST minus Input GST"}
          icon={Scale}
          tone={gstPayable > 0 ? "red" : "emerald"}
        />
      </div>
    </div>
  );
}
