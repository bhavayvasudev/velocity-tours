import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, Download, FileText, Calendar } from "lucide-react";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { exportLedger } from "../lib/excelExport";
import Button from "./ui/Button";
import { StatusBadge } from "./ui/Badge";
import { deriveStatus } from "../lib/status";
import EmptyState from "./ui/EmptyState";
import BookingsLoader from "./BookingsLoader";

const API_URL = `${BASE_API_URL}/api`;

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { name: encodedName } = useParams();
  const customerName = decodeURIComponent(encodedName);
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${API_URL}/customers/${encodedName}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setCustomer(data.customer);
      setBookings(data.bookings);
    };
    fetchData();
  }, [encodedName]);

  // Bookings arrive date-ascending (see server route); running balance is
  // the cumulative outstanding amount (billed minus received) through each
  // booking — same "running total of pending" shape used on the Vendor
  // Ledger, just walked in date order for the client's own booking history.
  const bookingsWithBalance = useMemo(() => {
    const result = [];
    let balance = 0;
    for (const b of bookings) {
      balance += (b.totalClientPayment || 0) - (b.clientPaidAmount || 0);
      result.push({ ...b, runningBalance: balance });
    }
    return result;
  }, [bookings]);

  const handleExport = () => {
    exportLedger(`${customerName.replace(/\s+/g, "_")}_Ledger.xlsx`, {
      sheetName: "Customer Ledger",
      title: `Velocity Tours — ${customerName} Ledger`,
      columns: [
        { key: "date", header: "Date", value: (b) => new Date(b.date).toLocaleDateString("en-IN") },
        { key: "name", header: "Trip / Booking" },
        { key: "invoiceNumber", header: "Invoice No", value: (b) => b.invoiceNumber || "" },
        { key: "totalClientPayment", header: "Invoice Amount", align: "right", currency: true },
        { key: "clientPaidAmount", header: "Payment Received", align: "right", currency: true },
        { key: "pending", header: "Pending", align: "right", currency: true, pendingHighlight: true, value: (b) => b.totalClientPayment - b.clientPaidAmount },
        { key: "runningBalance", header: "Running Balance", align: "right", currency: true },
        { key: "remarks", header: "Remarks", value: (b) => b.remarks || "" },
      ],
      rows: bookingsWithBalance,
      totalsColumns: ["totalClientPayment", "clientPaidAmount"],
    });
  };

  if (!customer) return <BookingsLoader />;

  return (
    <div className="p-6 md:p-10 xl:px-14 pb-32 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button onClick={() => navigate("/app/customers")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition shrink-0">
            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Users size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex flex-wrap items-center gap-2">
                {customer.name}
                <StatusBadge status={deriveStatus(customer.totalBilled, customer.totalPaid)} />
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{customer.bookingCount} booking{customer.bookingCount !== 1 && "s"}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" icon={Download} onPress={handleExport}>Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)] shadow-[var(--shadow-soft)]">
          <p className="text-xs text-slate-400 font-bold uppercase">Total Billed</p>
          <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">{formatMoney(customer.totalBilled)}</p>
        </div>
        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-[var(--shadow-soft)]">
          <p className="text-xs text-emerald-600 font-bold uppercase">Total Received</p>
          <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">{formatMoney(customer.totalPaid)}</p>
        </div>
        <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 shadow-[var(--shadow-soft)]">
          <p className="text-xs text-amber-600 font-bold uppercase">Outstanding</p>
          <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">{formatMoney(customer.totalPending)}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-subtle)] shadow-[var(--shadow-soft)] overflow-hidden">
        <h3 className="font-bold text-slate-800 dark:text-white p-5 border-b border-[var(--color-border-subtle)]">Booking History</h3>
        {bookingsWithBalance.length === 0 ? (
          <EmptyState icon={Users} title="No bookings yet" description="Bookings for this customer will appear here." />
        ) : (
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {bookingsWithBalance.map((booking) => (
              <div
                key={booking._id}
                onClick={() => navigate(`/app/bookings/${booking._id}`)}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{booking.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <Calendar size={12} />
                    {new Date(booking.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    {booking.invoiceNumber && (
                      <>
                        <span>•</span>
                        <FileText size={12} />
                        Invoice #{booking.invoiceNumber}
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-white">{formatMoney(booking.totalClientPayment)}</p>
                  <p className="text-xs text-amber-600">Pending: {formatMoney(booking.totalClientPayment - booking.clientPaidAmount)}</p>
                  <p className="text-[11px] text-slate-400">Running balance: {formatMoney(booking.runningBalance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
