import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Edit2, Save, Download, Trash2 } from "lucide-react";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { exportLedger } from "../lib/excelExport";
import Button from "./ui/Button";
import { TextAreaField } from "./ui/Field";
import { StatusBadge } from "./ui/Badge";
import { deriveStatus } from "../lib/status";
import EmptyState from "./ui/EmptyState";
import BookingsLoader from "./BookingsLoader";

const API_URL = `${BASE_API_URL}/api`;

export default function VendorDetails() {
  const navigate = useNavigate();
  const { id: vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [bills, setBills] = useState([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

  const fetchData = async () => {
    const res = await fetch(`${API_URL}/vendors/${vendorId}`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    setVendor(data.vendor);
    setBills(data.bills);
    setNotesDraft(data.vendor.notes || "");
  };

  useEffect(() => {
    fetchData();
  }, [vendorId]);

  const handleSaveNotes = async () => {
    await fetch(`${API_URL}/vendors/${vendorId}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name: vendor.name, notes: notesDraft }),
    });
    setIsEditingNotes(false);
    fetchData();
  };

  const handleDeleteVendor = async () => {
    if (!window.confirm(`Delete vendor "${vendor.name}"? Existing bills will keep their vendor name text.`)) return;
    await fetch(`${API_URL}/vendors/${vendorId}`, { method: "DELETE", headers: authHeaders() });
    navigate("/app/vendors");
  };

  // Bills load newest-first (see server route); running balance reads
  // naturally date-ascending, so compute it over a sorted copy and map the
  // result back onto the display order instead of re-sorting the page.
  const billsWithBalance = useMemo(() => {
    const ascending = [...bills].sort((a, b) => new Date(a.date) - new Date(b.date));
    const balanceById = new Map();
    let balance = 0;
    for (const bill of ascending) {
      balance += (bill.amount || 0) - (bill.paidAmount || 0);
      balanceById.set(bill._id, balance);
    }
    return bills.map((bill) => ({ ...bill, runningBalance: balanceById.get(bill._id) }));
  }, [bills]);

  const handleExport = () => {
    const ascending = [...billsWithBalance].sort((a, b) => new Date(a.date) - new Date(b.date));
    exportLedger(`${vendor.name.replace(/\s+/g, "_")}_Bills.xlsx`, {
      sheetName: "Vendor Bills",
      title: `Velocity Tours — ${vendor.name} Bill History`,
      columns: [
        { key: "date", header: "Date", value: (b) => new Date(b.date).toLocaleDateString("en-IN") },
        { key: "booking", header: "Booking", value: (b) => b.booking?.name || "—" },
        { key: "billNumber", header: "Bill Number", value: (b) => b.billNumber || "" },
        { key: "amount", header: "Invoice Amount", align: "right", currency: true },
        { key: "paidAmount", header: "Payment Made", align: "right", currency: true },
        { key: "pending", header: "Pending", align: "right", currency: true, pendingHighlight: true, value: (b) => b.amount - b.paidAmount },
        { key: "runningBalance", header: "Running Balance", align: "right", currency: true },
        { key: "notes", header: "Notes", value: (b) => b.notes || "" },
      ],
      rows: ascending,
      totalsColumns: ["amount", "paidAmount"],
    });
  };

  if (!vendor) return <BookingsLoader />;

  const totalBilled = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.reduce((s, b) => s + b.paidAmount, 0);
  const totalPending = totalBilled - totalPaid;

  return (
    <div className="p-6 md:p-10 xl:px-14 pb-32 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button onClick={() => navigate("/app/vendors")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition shrink-0">
            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex flex-wrap items-center gap-2">
                {vendor.name}
                <StatusBadge status={deriveStatus(totalBilled, totalPaid)} />
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{bills.length} bill{bills.length !== 1 && "s"} across all bookings</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" icon={Download} onPress={handleExport}>Export</Button>
          <Button variant="danger" icon={Trash2} onPress={handleDeleteVendor} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)] shadow-[var(--shadow-soft)]">
          <p className="text-xs text-slate-400 font-bold uppercase">Total Billed</p>
          <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">{formatMoney(totalBilled)}</p>
        </div>
        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-[var(--shadow-soft)]">
          <p className="text-xs text-emerald-600 font-bold uppercase">Total Paid</p>
          <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">{formatMoney(totalPaid)}</p>
        </div>
        <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 shadow-[var(--shadow-soft)]">
          <p className="text-xs text-amber-600 font-bold uppercase">Pending</p>
          <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">{formatMoney(totalPending)}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border-subtle)] shadow-[var(--shadow-soft)]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-slate-800 dark:text-white">Notes</h3>
          {isEditingNotes ? (
            <Button size="sm" icon={Save} onPress={handleSaveNotes}>Save</Button>
          ) : (
            <button onClick={() => setIsEditingNotes(true)} className="text-slate-400 hover:text-blue-600">
              <Edit2 size={16} />
            </button>
          )}
        </div>
        {isEditingNotes ? (
          <TextAreaField value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{vendor.notes || "No notes yet."}</p>
        )}
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-subtle)] shadow-[var(--shadow-soft)] overflow-hidden">
        <h3 className="font-bold text-slate-800 dark:text-white p-5 border-b border-[var(--color-border-subtle)]">Bill History</h3>
        {bills.length === 0 ? (
          <EmptyState icon={Building2} title="No bills yet" description="Bills appear here as expenses are added to bookings." />
        ) : (
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {billsWithBalance.map((bill) => (
              <div
                key={bill._id}
                onClick={() => bill.bookingId && navigate(`/app/bookings/${bill.bookingId}`)}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{bill.booking?.name || "Unlinked booking"}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(bill.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    {bill.billNumber && ` • Bill #${bill.billNumber}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-white">{formatMoney(bill.amount)}</p>
                  <p className="text-xs text-amber-600">Pending: {formatMoney(bill.amount - bill.paidAmount)}</p>
                  <p className="text-[11px] text-slate-400">Running balance: {formatMoney(bill.runningBalance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
