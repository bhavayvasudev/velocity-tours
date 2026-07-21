import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Banknote, Download, FileText, ArrowDownLeft, Wallet, Clock } from "lucide-react";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { openInvoice } from "../lib/invoice";
import { deriveStatus } from "../lib/status";
import { exportLedger } from "../lib/excelExport";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Dialog from "./ui/Dialog";
import DataTable from "./ui/DataTable";
import StatWidget from "./ui/StatWidget";
import FilterBar from "./ui/FilterBar";
import SearchField from "./ui/SearchField";
import { TextInput } from "./ui/Field";
import { StatusBadge } from "./ui/Badge";
import BookingsLoader from "./BookingsLoader";

const API_URL = `${BASE_API_URL}/api`;

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const recordSchema = z.object({
  bookingId: z.string().min(1, "Pick a booking"),
  amount: z.coerce.number().positive("Enter a valid amount"),
});

export default function Payments() {
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showInvoicePicker, setShowInvoicePicker] = useState(false);
  const [invoiceBookingId, setInvoiceBookingId] = useState("");

  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(recordSchema),
    defaultValues: { bookingId: "", amount: "" },
  });
  const watchedBookingId = watch("bookingId");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/bookings`, { headers: authHeaders() });
      if (res.ok) setBookings(await res.json());
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // The dashboard FAB and "Receive Payment" quick action land here with a
  // state flag so the right dialog opens immediately instead of requiring
  // an extra click once the page loads.
  useEffect(() => {
    if (location.state?.openRecord) {
      setShowRecordForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.openInvoicePicker) {
      setShowInvoicePicker(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const rows = useMemo(
    () =>
      bookings.map((b) => ({
        ...b,
        pending: (b.totalClientPayment || 0) - (b.clientPaidAmount || 0),
        status: b.paymentStatus || deriveStatus(b.totalClientPayment, b.clientPaidAmount),
      })),
    [bookings]
  );

  const filteredRows = useMemo(
    () =>
      rows
        .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((b) => statusFilter === "all" || b.status === statusFilter),
    [rows, searchQuery, statusFilter]
  );

  const pendingBookings = useMemo(() => rows.filter((b) => b.pending > 0).sort((a, b) => b.pending - a.pending), [rows]);

  const totals = useMemo(() => {
    const now = new Date();
    let received = 0, pending = 0, receivedThisMonth = 0;
    rows.forEach((b) => {
      received += b.clientPaidAmount || 0;
      pending += b.pending;
      const d = new Date(b.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) receivedThisMonth += b.clientPaidAmount || 0;
    });
    return { received, pending, receivedThisMonth };
  }, [rows]);

  const onRecordPayment = async (values) => {
    const booking = bookings.find((b) => b._id === values.bookingId);
    if (!booking) return;
    const newPaid = Math.min((booking.clientPaidAmount || 0) + Number(values.amount), booking.totalClientPayment);
    try {
      const res = await fetch(`${API_URL}/bookings/${booking._id}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ clientPaidAmount: newPaid, paymentStatus: deriveStatus(booking.totalClientPayment, newPaid) }),
      });
      if (!res.ok) return;
      setShowRecordForm(false);
      reset({ bookingId: "", amount: "" });
      fetchBookings();
    } catch (err) {
      console.error("Error recording payment:", err);
    }
  };

  const handleGenerateInvoice = () => {
    const booking = bookings.find((b) => b._id === invoiceBookingId);
    if (!booking) return;
    openInvoice(booking);
    setShowInvoicePicker(false);
    setInvoiceBookingId("");
  };

  const handleExport = () => {
    exportLedger("Payments.xlsx", {
      sheetName: "Payments",
      title: "Velocity Tours — Payments",
      columns: [
        { key: "invoiceNumber", header: "Invoice No", value: (b) => b.invoiceNumber || "" },
        { key: "date", header: "Date", value: (b) => new Date(b.date).toLocaleDateString("en-IN") },
        { key: "name", header: "Trip" },
        { key: "clientName", header: "Client" },
        { key: "totalClientPayment", header: "Total", align: "right", currency: true },
        { key: "clientPaidAmount", header: "Received", align: "right", currency: true },
        { key: "pending", header: "Pending", align: "right", currency: true, pendingHighlight: true },
        { key: "status", header: "Status" },
      ],
      rows: filteredRows,
      totalsColumns: ["totalClientPayment", "clientPaidAmount", "pending"],
    });
  };

  const columns = useMemo(() => [
    {
      accessorKey: "clientName",
      header: "Client",
      cell: ({ row }) => (
        <div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/app/customers/${encodeURIComponent(row.original.clientName)}`); }}
            className="font-bold text-slate-800 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400"
          >
            {row.original.clientName}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.original.name}</p>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => <span className="text-sm text-slate-500">{new Date(getValue()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>,
    },
    {
      accessorKey: "totalClientPayment",
      header: "Total",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className="font-semibold text-slate-800 dark:text-white">{formatMoney(getValue())}</span>,
    },
    {
      accessorKey: "clientPaidAmount",
      header: "Received",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatMoney(getValue())}</span>,
    },
    {
      accessorKey: "pending",
      header: "Pending",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className={`font-semibold ${getValue() > 0 ? "text-orange-500" : "text-slate-400"}`}>{formatMoney(getValue())}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { align: "right" },
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); openInvoice(row.original); }}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-colors"
          title="Print invoice"
        >
          <FileText size={16} />
        </button>
      ),
    },
  ], []);

  if (loading) return <BookingsLoader message="Loading payments..." />;

  return (
    <div className="p-6 md:p-10 xl:px-14 space-y-8 pb-24">
      <PageHeader
        title="Payments"
        subtitle="Every client payment, across all trips, in one place."
        actions={
          <>
            <Button variant="outline" icon={Download} onPress={handleExport}>Export</Button>
            <Button variant="outline" icon={FileText} onPress={() => setShowInvoicePicker(true)}>Generate Invoice</Button>
            <Button icon={ArrowDownLeft} onPress={() => setShowRecordForm(true)}>Receive Payment</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget title="Total Received" value={formatMoney(totals.received)} subtext="Lifetime" icon={Banknote} tone="emerald" />
        <StatWidget title="Received This Month" value={formatMoney(totals.receivedThisMonth)} subtext="Current calendar month" icon={ArrowDownLeft} tone="blue" />
        <StatWidget title="Total Pending" value={formatMoney(totals.pending)} subtext="Across all clients" icon={Clock} tone="orange" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <FilterBar label="Status:">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All" },
              { value: "paid", label: "Paid" },
              { value: "partial", label: "Partial" },
              { value: "pending", label: "Pending" },
            ]}
          />
        </FilterBar>

        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search clients or trips..."
          className="w-full sm:w-80"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        onRowClick={(b) => navigate(`/app/bookings/${b._id}`)}
        emptyIcon={Wallet}
        emptyTitle="No payments found"
        emptyDescription="Payments are created automatically from bookings."
        pageSize={10}
      />

      <Dialog
        open={showRecordForm}
        onOpenChange={setShowRecordForm}
        title="Receive Payment"
        description="Log an amount received from a client against one of their bookings."
        footer={
          <Button fullWidth loading={isSubmitting} onPress={handleSubmit(onRecordPayment)}>
            Record Payment
          </Button>
        }
      >
        <form onSubmit={handleSubmit(onRecordPayment)} className="space-y-4">
          <Controller
            control={control}
            name="bookingId"
            render={({ field }) => (
              <Select
                label="Booking"
                value={field.value}
                onChange={field.onChange}
                placeholder="Select a booking with pending amount"
                options={pendingBookings.map((b) => ({ value: b._id, label: `${b.clientName} — ${b.name} (Due ${formatMoney(b.pending)})` }))}
              />
            )}
          />
          {errors.bookingId && <p className="text-xs font-medium text-[var(--color-danger)] -mt-2">{errors.bookingId.message}</p>}
          <TextInput
            label="Amount Received"
            type="number"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register("amount")}
          />
          {watchedBookingId && (
            <p className="text-xs text-slate-400">
              Pending on this booking: {formatMoney(pendingBookings.find((b) => b._id === watchedBookingId)?.pending || 0)}
            </p>
          )}
        </form>
      </Dialog>

      <Dialog
        open={showInvoicePicker}
        onOpenChange={setShowInvoicePicker}
        title="Generate Invoice"
        description="Pick a booking to print a GST invoice for."
        footer={
          <Button fullWidth disabled={!invoiceBookingId} onPress={handleGenerateInvoice}>
            Print Invoice
          </Button>
        }
      >
        <Select
          label="Booking"
          value={invoiceBookingId}
          onChange={setInvoiceBookingId}
          placeholder="Select a booking"
          options={[...rows].sort((a, b) => new Date(b.date) - new Date(a.date)).map((b) => ({ value: b._id, label: `${b.clientName} — ${b.name}` }))}
        />
      </Dialog>
    </div>
  );
}
