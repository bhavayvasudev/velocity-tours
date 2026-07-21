import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Briefcase,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  CreditCard,
  Loader2,
  Plane,
  Building2,
  Globe,
  Calendar,
  Edit2,
  ArrowDownLeft,
  MoreHorizontal,
  Trash2,
  Eye
} from "lucide-react";
import BookingsLoader from "./BookingsLoader";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { openInvoice } from "../lib/invoice";
import { deriveStatus } from "../lib/status";
import { exportLedger, exportServiceTaxReport } from "../lib/excelExport";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Dropdown from "./ui/Dropdown";
import Dialog from "./ui/Dialog";
import EmptyState from "./ui/EmptyState";
import FilterBar from "./ui/FilterBar";
import SearchField from "./ui/SearchField";
import { TextInput } from "./ui/Field";

const API_URL = `${BASE_API_URL}/api`;

// Soft pastel icon-chip tones per trip type — echoes the reference app's
// per-merchant icon color instead of every row wearing the same blue chip.
const TRIP_ICON_TONES = {
  flight: { icon: Plane, tone: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" },
  stay: { icon: Building2, tone: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300" },
  visa: { icon: Globe, tone: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300" },
  default: { icon: Calendar, tone: "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300" },
};

// Payment-status pill tones for the booking card feed — a colored dot +
// tinted background instead of the flat admin-dashboard badge, so status
// reads at a glance the way a banking app's transaction state does.
const PAYMENT_STATUS_PILL = {
  paid: { dot: "bg-emerald-500", tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", label: "Paid" },
  partial: { dot: "bg-amber-500", tint: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", label: "Partial Payment" },
  pending: { dot: "bg-red-500", tint: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300", label: "Pending" },
  cancelled: { dot: "bg-slate-500", tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", label: "Cancelled" },
};

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

// Dynamic per-trip-type icon + soft pastel chip tone
const getTripIconMeta = (name) => {
  const lower = (name || "").toLowerCase();
  if (lower.includes("air") || lower.includes("flight") || lower.includes("ticket")) return TRIP_ICON_TONES.flight;
  if (lower.includes("hotel") || lower.includes("room") || lower.includes("stay")) return TRIP_ICON_TONES.stay;
  if (lower.includes("visa") || lower.includes("earth") || lower.includes("global") || lower.includes("world")) return TRIP_ICON_TONES.visa;
  return TRIP_ICON_TONES.default;
};

const defaultFormValues = () => ({
  name: "",
  clientName: "",
  totalClientPayment: "",
  date: new Date().toISOString().split("T")[0],
  invoiceNumber: "",
  paymentStatus: "pending",
  paymentMode: "",
  bankName: "",
  paymentReference: "",
  remarks: "",
});

const bookingToFormValues = (booking) => ({
  name: booking.name || "",
  clientName: booking.clientName || "",
  totalClientPayment: booking.totalClientPayment ?? "",
  date: booking.date ? new Date(booking.date).toISOString().split("T")[0] : "",
  invoiceNumber: booking.invoiceNumber || "",
  paymentStatus: booking.paymentStatus || "pending",
  paymentMode: booking.paymentMode || "",
  bankName: booking.bankName || "",
  paymentReference: booking.paymentReference || "",
  remarks: booking.remarks || "",
});

function PaymentStatusPill({ status }) {
  const style = PAYMENT_STATUS_PILL[status] || PAYMENT_STATUS_PILL.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style.tint}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

// One booking, one card — no columns, no header row. Grouped naturally:
// identity + amount up top, meta (date/invoice/mode) and status in the
// middle, quick actions below a hairline divider. Modeled on a premium
// banking transaction feed rather than an admin table row.
function BookingCard({ booking, onOpenDetails, onEdit, onViewInvoice, onReceivePayment, onDelete }) {
  const { icon: TripIcon, tone } = getTripIconMeta(booking.name);
  const status = booking.paymentStatus || "pending";

  return (
    <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-lg)]">
      <button type="button" onClick={() => onOpenDetails(booking)} className="flex w-full items-start gap-4 text-left">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
          <TripIcon size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-800 dark:text-white">{booking.name}</p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{booking.clientName}</p>
            </div>
            <p className="shrink-0 text-lg font-bold text-slate-800 dark:text-white">{formatMoney(booking.totalClientPayment)}</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} />
              {formatDate(booking.date)}
            </span>
            {booking.invoiceNumber && (
              <span className="inline-flex items-center gap-1.5">
                <FileText size={13} />
                Invoice #{booking.invoiceNumber}
              </span>
            )}
            {booking.paymentMode && (
              <span className="inline-flex items-center gap-1.5">
                <CreditCard size={13} />
                {booking.paymentMode}
              </span>
            )}
          </div>

          <div className="mt-3.5">
            <PaymentStatusPill status={status} />
          </div>
        </div>
      </button>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-[var(--color-border-subtle)]/70 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="ghost" size="sm" icon={Edit2} onPress={() => onEdit(booking)}>Edit</Button>
          <Button variant="ghost" size="sm" icon={FileText} onPress={() => onViewInvoice(booking)}>Invoice</Button>
          <Button variant="ghost" size="sm" icon={ArrowDownLeft} onPress={() => onReceivePayment(booking)}>Receive Payment</Button>
        </div>

        <Dropdown
          align="end"
          trigger={
            <Button variant="ghost" size="sm" icon={MoreHorizontal} aria-label="More actions" className="!rounded-full !px-2" />
          }
          items={[
            { key: "details", label: "View Details", icon: Eye, onSelect: () => onOpenDetails(booking) },
            { key: "delete", label: "Delete Booking", icon: Trash2, danger: true, onSelect: () => onDelete(booking) },
          ]}
        />
      </div>
    </div>
  );
}

const bookingSchema = z.object({
  name: z.string().min(1, "Trip name is required"),
  clientName: z.string().min(1, "Client name is required"),
  totalClientPayment: z.coerce.number().positive("Enter a valid amount"),
  date: z.string().min(1, "Date is required"),
  invoiceNumber: z.string().optional(),
  paymentStatus: z.enum(["paid", "partial", "pending"]).default("pending"),
  paymentMode: z.string().optional(),
  bankName: z.string().optional(),
  paymentReference: z.string().optional(),
  remarks: z.string().optional(),
});

export default function Bookings() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ================= STATE ================= */
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [receivingBooking, setReceivingBooking] = useState(null);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: defaultFormValues(),
  });

  /* ================= HELPERS ================= */
  // Tax Calculation (Inclusive 18%)
  const calculateTaxComponents = (amount) => {
    const base = Math.round(amount / 1.18);
    const totalTax = amount - base;
    return {
      base,
      tax: totalTax,
      cgst: totalTax / 2,
      sgst: totalTax / 2
    };
  };

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 5; i++) {
    yearOptions.push(i);
  }

  /* ================= EFFECTS ================= */
  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/bookings`, {
          headers: authHeaders(),
        });

        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchBookings();
  }, []);

  // The floating nav's "New Booking" pill lands here with a state flag so
  // the create dialog opens immediately instead of requiring an extra click
  // once the list loads.
  useEffect(() => {
    if (location.state?.openCreate) {
      setShowForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (bookings.length > 0) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filterType, selectedYear, selectedMonth, selectedQuarter]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, filterType, selectedYear, selectedMonth, selectedQuarter]);

  /* ================= FILTER LOGIC (unchanged) ================= */
  const filteredBookings = useMemo(() => bookings.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "all") return true;

    const d = new Date(b.date);
    const m = d.getMonth();
    const y = d.getFullYear();

    if (filterType === "monthly") {
      return m === selectedMonth && y === selectedYear;
    }

    if (filterType === "yearly") {
      const fyStart = new Date(selectedYear, 3, 1);
      const fyEnd = new Date(selectedYear + 1, 2, 31);
      return d >= fyStart && d <= fyEnd;
    }

    if (filterType === "quarterly") {
      const ranges = {
        Q1: [3, 5],
        Q2: [6, 8],
        Q3: [9, 11],
        Q4: [0, 2],
      };
      const [start, end] = ranges[selectedQuarter];
      const fy = selectedQuarter === "Q4" && m <= 2 ? selectedYear + 1 : selectedYear;

      if (selectedQuarter === "Q4") {
         return (m >= 0 && m <= 2 && y === selectedYear + 1);
      }
      return m >= start && m <= end && y === fy;
    }

    return true;
  }), [bookings, searchQuery, filterType, selectedYear, selectedMonth, selectedQuarter]);

  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const pagedBookings = useMemo(
    () => filteredBookings.slice(page * pageSize, page * pageSize + pageSize),
    [filteredBookings, page]
  );

  /* ================= EXPORT LOGIC (unchanged calculations) ================= */

  // 1. PAYMENT REPORT — columns extended to mirror the company's historical
  // ledger layout (invoice no / date / amount / name / bank received /
  // amount received / pending / remarks).
  const handleExportPayment = () => {
    exportLedger("Payment_Report.xlsx", {
      sheetName: "Payment Report",
      title: "Velocity Tours — Payment Report",
      columns: [
        { key: "invoiceNumber", header: "Invoice No", value: (b) => b.invoiceNumber || "—" },
        { key: "date", header: "Date", value: (b) => new Date(b.date).toLocaleDateString("en-IN") },
        { key: "totalClientPayment", header: "Amount", align: "right", currency: true },
        { key: "clientName", header: "Name" },
        { key: "paymentMode", header: "Received (Bank/Mode)", value: (b) => b.paymentMode || "" },
        { key: "clientPaidAmount", header: "Amount Received", align: "right", currency: true },
        { key: "pending", header: "Pending", align: "right", currency: true, pendingHighlight: true, value: (b) => b.totalClientPayment - (b.clientPaidAmount || 0) },
        { key: "remarks", header: "Remarks", value: (b) => b.remarks || "" },
      ],
      rows: filteredBookings,
      totalsColumns: ["totalClientPayment", "clientPaidAmount", "pending"],
    });
  };

  // 2. SERVICE TAX REPORT (unchanged)
  const handleExportServiceTax = async () => {
    setIsExporting(true);

    try {
      const enrichedBookings = await Promise.all(
        filteredBookings.map(async (b) => {
          let totalVendorCost = 0;
          try {
            const res = await fetch(`${API_URL}/expenses/booking/${b._id}`, {
              headers: authHeaders(),
            });
            if (res.ok) {
              const expenses = await res.json();
              totalVendorCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            }
          } catch (e) {
            console.error("Failed to fetch expenses for export", e);
          }

          const netProfit = b.totalClientPayment - totalVendorCost;
          const clientTax = calculateTaxComponents(b.totalClientPayment);
          const vendorTax = calculateTaxComponents(totalVendorCost);

          return {
            income: b.totalClientPayment,
            profit: netProfit,
            clientSGST: clientTax.sgst,
            clientCGST: clientTax.cgst,
            vendorCGST: vendorTax.cgst,
            vendorSGST: vendorTax.sgst,
            vendorIGST: 0
          };
        })
      );

      await exportServiceTaxReport("Service_Tax_Report.xlsx", enrichedBookings);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  /* ================= CREATE BOOKING ================= */
  const onSubmit = async (values) => {
    try {
      const payload = { ...values, totalClientPayment: Number(values.totalClientPayment) };

      if (editingBooking) {
        const res = await fetch(`${API_URL}/bookings/${editingBooking._id}`, {
          method: "PUT",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        if (!res.ok) return;
        const updated = await res.json();
        setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      } else {
        const res = await fetch(`${API_URL}/bookings`, {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ ...payload, clientPaidAmount: 0 }),
        });
        if (!res.ok) return;
        const newBooking = await res.json();
        setBookings((prev) => [newBooking, ...prev]);
      }

      setShowForm(false);
      setEditingBooking(null);
      reset(defaultFormValues());
    } catch (error) {
      console.error("Error saving booking:", error);
    }
  };

  const handleNewBooking = () => {
    setEditingBooking(null);
    reset(defaultFormValues());
    setShowForm(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    reset(bookingToFormValues(booking));
    setShowForm(true);
  };

  const openReceivePayment = (booking) => {
    setReceivingBooking(booking);
    setReceiveAmount("");
  };

  const submitReceivePayment = async () => {
    if (!receivingBooking) return;
    const amount = Number(receiveAmount);
    if (!amount || amount <= 0) return;

    const newPaid = Math.min((receivingBooking.clientPaidAmount || 0) + amount, receivingBooking.totalClientPayment);
    try {
      const res = await fetch(`${API_URL}/bookings/${receivingBooking._id}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          clientPaidAmount: newPaid,
          paymentStatus: deriveStatus(receivingBooking.totalClientPayment, newPaid),
        }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      setReceivingBooking(null);
      setReceiveAmount("");
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  };

  const handleDeleteBooking = async (booking) => {
    if (!window.confirm(`Delete "${booking.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/bookings/${booking._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setBookings((prev) => prev.filter((b) => b._id !== booking._id));
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="p-6 md:p-10 xl:px-14 space-y-8 pb-24">

      <PageHeader
        title="All Trips"
        subtitle="Manage your client bookings and payments."
        actions={
          <>
            <Dropdown
              trigger={
                <Button variant="outline" icon={isExporting ? Loader2 : Download} disabled={isExporting}>
                  Export <ChevronDown size={16} />
                </Button>
              }
              items={[
                {
                  key: "service-tax",
                  label: "Service Tax Report",
                  description: "Profit & GST Data",
                  icon: FileText,
                  onSelect: handleExportServiceTax,
                },
                {
                  key: "payment",
                  label: "Payment Report",
                  description: "Client Payments",
                  icon: CreditCard,
                  onSelect: handleExportPayment,
                },
              ]}
            />
            <Button icon={Plus} onPress={handleNewBooking}>New Trip</Button>
          </>
        }
      />

      {/* CONTROLS BAR (Filters + Search) */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
        <FilterBar label="Filter:">
          <Select
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: "all", label: "All Time" },
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
                options={yearOptions.map((y) => ({
                  value: String(y),
                  label: filterType === "monthly" ? String(y) : `FY ${y}-${y + 1}`,
                }))}
              />

              {filterType === "quarterly" && (
                <Select
                  value={selectedQuarter}
                  onChange={setSelectedQuarter}
                  options={[
                    { value: "Q1", label: "Q1 (Apr–Jun)" },
                    { value: "Q2", label: "Q2 (Jul–Sep)" },
                    { value: "Q3", label: "Q3 (Oct–Dec)" },
                    { value: "Q4", label: "Q4 (Jan–Mar)" },
                  ]}
                />
              )}

              {filterType === "monthly" && (
                <Select
                  value={String(selectedMonth)}
                  onChange={(v) => setSelectedMonth(Number(v))}
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: String(i),
                    label: new Date(0, i).toLocaleString("default", { month: "long" }),
                  }))}
                />
              )}
            </>
          )}
        </FilterBar>

        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search trips or clients..."
          className="w-full xl:w-72"
        />
      </div>

      {/* BOOKING CARD FEED */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm min-h-[400px] flex items-center justify-center">
            <BookingsLoader />
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No trips found"
          description="Try adjusting filters or create a new one."
        />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {pagedBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onOpenDetails={(b) => navigate(`/app/bookings/${b._id}`)}
                onEdit={handleEditBooking}
                onViewInvoice={openInvoice}
                onReceivePayment={openReceivePayment}
                onDelete={handleDeleteBooking}
              />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-1 text-sm text-[var(--color-text-muted)]">
              <span>Page {page + 1} of {pageCount}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={ChevronLeft} disabled={page === 0} onPress={() => setPage((p) => Math.max(0, p - 1))} />
                <Button variant="outline" size="sm" icon={ChevronRight} disabled={page >= pageCount - 1} onPress={() => setPage((p) => Math.min(pageCount - 1, p + 1))} />
              </div>
            </div>
          )}
        </>
      )}

      {/* NEW / EDIT BOOKING DIALOG */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingBooking(null);
        }}
        title={editingBooking ? "Edit Trip" : "New Trip"}
        footer={
          <Button fullWidth loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
            {editingBooking ? "Save Changes" : "Create Booking"}
          </Button>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextInput label="Trip Name" placeholder="e.g. Dubai Family Trip" error={errors.name?.message} {...register("name")} />
          <TextInput label="Client Name" placeholder="e.g. Rahul Sharma" error={errors.clientName?.message} {...register("clientName")} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Total Deal Value" type="number" placeholder="0.00" error={errors.totalClientPayment?.message} {...register("totalClientPayment")} />
            <TextInput label="Booking Date" type="date" error={errors.date?.message} {...register("date")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Invoice Number" placeholder="Optional" {...register("invoiceNumber")} />
            <Controller
              control={control}
              name="paymentStatus"
              render={({ field }) => (
                <Select
                  label="Payment Status"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "partial", label: "Partial" },
                    { value: "paid", label: "Paid" },
                  ]}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Payment Mode" placeholder="e.g. ICICI CASH" {...register("paymentMode")} />
            <TextInput label="Bank Name" placeholder="e.g. ICICI" {...register("bankName")} />
          </div>
          <TextInput label="Payment Reference" placeholder="Cheque no. / UTR (optional)" {...register("paymentReference")} />
          <TextInput label="Remarks" placeholder="Optional notes" {...register("remarks")} />
        </form>
      </Dialog>

      {/* RECEIVE PAYMENT DIALOG */}
      <Dialog
        open={!!receivingBooking}
        onOpenChange={(open) => { if (!open) setReceivingBooking(null); }}
        title="Receive Payment"
        description={receivingBooking ? `Log an amount received for "${receivingBooking.name}".` : undefined}
        footer={
          <Button fullWidth onPress={submitReceivePayment} disabled={!receiveAmount || Number(receiveAmount) <= 0}>
            Record Payment
          </Button>
        }
      >
        {receivingBooking && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm">
              <span className="text-[var(--color-text-muted)]">Pending amount</span>
              <span className="font-bold text-slate-800 dark:text-white">
                {formatMoney(receivingBooking.totalClientPayment - (receivingBooking.clientPaidAmount || 0))}
              </span>
            </div>
            <TextInput
              label="Amount Received"
              type="number"
              placeholder="0.00"
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(e.target.value)}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
