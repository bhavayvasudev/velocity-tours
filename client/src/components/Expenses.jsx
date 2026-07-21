import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Receipt, Download, Plus, Building2, Wallet, Clock } from "lucide-react";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
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
import { TextInput, TextAreaField } from "./ui/Field";
import { StatusBadge } from "./ui/Badge";
import BookingsLoader from "./BookingsLoader";

const API_URL = `${BASE_API_URL}/api`;

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const billSchema = z.object({
  bookingId: z.string().min(1, "Pick a booking"),
  vendorName: z.string().min(1, "Vendor name is required"),
  amount: z.coerce.number().positive("Enter a valid amount"),
  paidAmount: z.coerce.number().min(0).optional(),
  billNumber: z.string().optional(),
  billDate: z.string().optional(),
  notes: z.string().optional(),
});

export default function Expenses() {
  const navigate = useNavigate();
  const location = useLocation();

  const [expenses, setExpenses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(billSchema),
    defaultValues: { bookingId: "", vendorName: "", amount: "", paidAmount: "", billNumber: "", billDate: new Date().toISOString().split("T")[0], notes: "" },
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [expensesRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/expenses`, { headers: authHeaders() }),
        fetch(`${API_URL}/bookings`, { headers: authHeaders() }),
      ]);
      if (expensesRes.ok) setExpenses(await expensesRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (location.state?.openCreate) {
      setShowForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const bookingById = useMemo(() => new Map(bookings.map((b) => [b._id, b])), [bookings]);

  const rows = useMemo(
    () =>
      expenses.map((e) => ({
        ...e,
        pending: (e.amount || 0) - (e.paidAmount || 0),
        status: e.paymentStatus || deriveStatus(e.amount, e.paidAmount),
        tripName: bookingById.get(e.bookingId)?.name || "—",
      })),
    [expenses, bookingById]
  );

  const filteredRows = useMemo(
    () =>
      rows
        .filter((e) => e.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) || e.tripName.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((e) => statusFilter === "all" || e.status === statusFilter),
    [rows, searchQuery, statusFilter]
  );

  const totals = useMemo(() => {
    let billed = 0, paid = 0;
    rows.forEach((e) => { billed += e.amount || 0; paid += e.paidAmount || 0; });
    return { billed, paid, pending: billed - paid };
  }, [rows]);

  const onSubmit = async (values) => {
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...values,
          amount: Number(values.amount),
          paidAmount: Number(values.paidAmount || 0),
          date: values.billDate || new Date(),
        }),
      });
      if (!res.ok) return;
      setShowForm(false);
      reset();
      fetchAll();
    } catch (err) {
      console.error("Error creating vendor bill:", err);
    }
  };

  const handleExport = () => {
    exportLedger("Expenses.xlsx", {
      sheetName: "Expenses",
      title: "Velocity Tours — Expenses",
      columns: [
        { key: "vendorName", header: "Vendor" },
        { key: "billNumber", header: "Bill No", value: (e) => e.billNumber || "" },
        { key: "tripName", header: "Trip" },
        { key: "billDate", header: "Bill Date", value: (e) => new Date(e.billDate || e.date).toLocaleDateString("en-IN") },
        { key: "amount", header: "Amount", align: "right", currency: true },
        { key: "paidAmount", header: "Paid", align: "right", currency: true },
        { key: "pending", header: "Pending", align: "right", currency: true, pendingHighlight: true },
        { key: "status", header: "Status" },
      ],
      rows: filteredRows,
      totalsColumns: ["amount", "paidAmount", "pending"],
    });
  };

  const columns = useMemo(() => [
    {
      accessorKey: "vendorName",
      header: "Vendor",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <Building2 size={16} />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white">{row.original.vendorName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.original.tripName}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "billDate",
      header: "Date",
      cell: ({ row }) => <span className="text-sm text-slate-500">{new Date(row.original.billDate || row.original.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>,
    },
    {
      accessorKey: "amount",
      header: "Billed",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className="font-semibold text-slate-800 dark:text-white">{formatMoney(getValue())}</span>,
    },
    {
      accessorKey: "paidAmount",
      header: "Paid",
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
  ], []);

  if (loading) return <BookingsLoader message="Loading expenses..." />;

  return (
    <div className="p-6 md:p-10 xl:px-14 space-y-8 pb-24">
      <PageHeader
        title="Expenses"
        subtitle="Every vendor bill, across all trips, in one place."
        actions={
          <>
            <Button variant="outline" icon={Download} onPress={handleExport}>Export</Button>
            <Button icon={Plus} onPress={() => setShowForm(true)}>Add Vendor Bill</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget title="Total Billed" value={formatMoney(totals.billed)} subtext="Lifetime" icon={Receipt} tone="slate" />
        <StatWidget title="Total Paid" value={formatMoney(totals.paid)} subtext="To vendors" icon={Wallet} tone="emerald" />
        <StatWidget title="Total Pending" value={formatMoney(totals.pending)} subtext="Across all vendors" icon={Clock} tone="orange" />
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
          placeholder="Search vendors or trips..."
          className="w-full sm:w-80"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        onRowClick={(e) => e.bookingId && navigate(`/app/bookings/${e.bookingId}`)}
        emptyIcon={Receipt}
        emptyTitle="No vendor bills yet"
        emptyDescription="Add a vendor bill to start tracking what's owed."
        pageSize={10}
      />

      <Dialog
        open={showForm}
        onOpenChange={setShowForm}
        title="Add Vendor Bill"
        footer={
          <Button fullWidth loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
            Save Bill
          </Button>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            control={control}
            name="bookingId"
            render={({ field }) => (
              <Select
                label="Trip"
                value={field.value}
                onChange={field.onChange}
                placeholder="Which booking is this bill for?"
                options={[...bookings].sort((a, b) => new Date(b.date) - new Date(a.date)).map((b) => ({ value: b._id, label: `${b.clientName} — ${b.name}` }))}
              />
            )}
          />
          {errors.bookingId && <p className="text-xs font-medium text-[var(--color-danger)] -mt-2">{errors.bookingId.message}</p>}

          <TextInput label="Vendor / Type" placeholder="e.g. Indigo Airlines, Taj Hotel" error={errors.vendorName?.message} {...register("vendorName")} />

          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Total Cost" type="number" placeholder="0.00" error={errors.amount?.message} {...register("amount")} />
            <TextInput label="Paid So Far" type="number" placeholder="0.00" {...register("paidAmount")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Bill Number" placeholder="Optional" {...register("billNumber")} />
            <TextInput label="Bill Date" type="date" {...register("billDate")} />
          </div>

          <TextAreaField label="Notes" placeholder="Optional notes" {...register("notes")} />
        </form>
      </Dialog>
    </div>
  );
}
