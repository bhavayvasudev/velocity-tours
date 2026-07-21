import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle, Landmark, Download, Edit2, Trash2 } from "lucide-react";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { exportLedger } from "../lib/excelExport";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Dialog from "./ui/Dialog";
import DataTable from "./ui/DataTable";
import StatWidget from "./ui/StatWidget";
import ChartCard from "./ui/ChartCard";
import Badge from "./ui/Badge";
import FilterBar from "./ui/FilterBar";
import SearchField from "./ui/SearchField";
import { TextInput, TextAreaField } from "./ui/Field";
import BookingsLoader from "./BookingsLoader";

const API_URL = `${BASE_API_URL}/api`;

const TYPE_META = {
  received: { label: "Received", color: "success", icon: ArrowDownCircle },
  deposited: { label: "Deposited", color: "accent", icon: Landmark },
  withdrawn: { label: "Withdrawn", color: "warning", icon: ArrowUpCircle },
};

const cashSchema = z.object({
  type: z.enum(["received", "deposited", "withdrawn"]),
  amount: z.coerce.number().positive("Enter a valid amount"),
  date: z.string().min(1, "Date is required"),
  receivedFrom: z.string().optional(),
  depositedTo: z.string().optional(),
  receivedBy: z.string().optional(),
  bank: z.string().optional(),
  remarks: z.string().optional(),
});

const emptyDefaults = {
  type: "received",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  receivedFrom: "",
  depositedTo: "",
  receivedBy: "",
  bank: "",
  remarks: "",
};

export default function CashManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(cashSchema),
    defaultValues: emptyDefaults,
  });
  const watchedType = watch("type");

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [entriesRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/cash`, { headers: authHeaders() }),
        fetch(`${API_URL}/cash/summary`, { headers: authHeaders() }),
      ]);
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (err) {
      console.error("Error loading cash data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // The dashboard FAB's "Cash Entry" quick action lands here with a state
  // flag so the create dialog opens immediately instead of requiring an
  // extra click once the ledger loads.
  useEffect(() => {
    if (location.state?.openCreate) {
      openCreate();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.pathname, navigate]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (e.receivedFrom || "").toLowerCase().includes(q) ||
        (e.depositedTo || "").toLowerCase().includes(q) ||
        (e.receivedBy || "").toLowerCase().includes(q) ||
        (e.remarks || "").toLowerCase().includes(q)
      );
    });
  }, [entries, typeFilter, searchQuery]);

  const trendData = useMemo(() => {
    const buckets = new Map();
    entries.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!buckets.has(key)) buckets.set(key, { key, date: d, label: d.toLocaleString("default", { month: "short" }), net: 0 });
      const bucket = buckets.get(key);
      bucket.net += e.type === "received" ? e.amount : -e.amount;
    });
    return Array.from(buckets.values()).sort((a, b) => a.date - b.date).slice(-6);
  }, [entries]);

  const openCreate = () => {
    setEditingId(null);
    reset(emptyDefaults);
    setShowForm(true);
  };

  const openEdit = (entry) => {
    setEditingId(entry._id);
    reset({
      type: entry.type,
      amount: entry.amount,
      date: new Date(entry.date).toISOString().split("T")[0],
      receivedFrom: entry.receivedFrom || "",
      depositedTo: entry.depositedTo || "",
      receivedBy: entry.receivedBy || "",
      bank: entry.bank || "",
      remarks: entry.remarks || "",
    });
    setShowForm(true);
  };

  const onSubmit = async (values) => {
    try {
      const url = editingId ? `${API_URL}/cash/${editingId}` : `${API_URL}/cash`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(values),
      });
      if (!res.ok) return;
      setShowForm(false);
      reset(emptyDefaults);
      fetchAll();
    } catch (err) {
      console.error("Error saving cash entry:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this cash entry?")) return;
    await fetch(`${API_URL}/cash/${id}`, { method: "DELETE", headers: authHeaders() });
    fetchAll();
  };

  const handleExport = () => {
    let balance = 0;
    const rows = [...filteredEntries]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((e) => {
        balance += e.type === "received" ? e.amount : -e.amount;
        return { ...e, runningBalance: balance };
      });
    exportLedger("Cash_Ledger.xlsx", {
      sheetName: "Cash Ledger",
      title: "Velocity Tours — Cash Ledger",
      columns: [
        { key: "date", header: "Date", value: (e) => new Date(e.date).toLocaleDateString("en-IN") },
        { key: "type", header: "Type", value: (e) => TYPE_META[e.type].label },
        { key: "amount", header: "Amount", align: "right", currency: true },
        { key: "party", header: "Received From / Deposited To", value: (e) => (e.type === "received" ? e.receivedFrom : e.depositedTo) || "" },
        { key: "receivedBy", header: "Received By", value: (e) => e.receivedBy || "" },
        { key: "bank", header: "Bank", value: (e) => e.bank || "" },
        { key: "remarks", header: "Remarks", value: (e) => e.remarks || "" },
        { key: "runningBalance", header: "Balance", align: "right", currency: true },
      ],
      rows,
      totalsColumns: ["amount"],
    });
  };

  const columns = useMemo(() => [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => <span className="text-sm text-slate-500">{new Date(getValue()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => {
        const meta = TYPE_META[getValue()];
        return <Badge color={meta.color} variant="soft">{meta.label}</Badge>;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className="font-bold text-slate-800 dark:text-white">{formatMoney(getValue())}</span>,
    },
    {
      id: "party",
      header: "From / To",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {row.original.type === "received" ? row.original.receivedFrom : row.original.depositedTo || "—"}
        </span>
      ),
    },
    {
      accessorKey: "receivedBy",
      header: "Handled By",
      cell: ({ getValue }) => <span className="text-sm text-slate-500">{getValue() || "—"}</span>,
    },
    {
      accessorKey: "bank",
      header: "Bank",
      cell: ({ getValue }) => <span className="text-sm text-slate-500">{getValue() || "—"}</span>,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDelete(row.original._id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  if (loading) return <BookingsLoader message="Loading cash ledger..." />;

  return (
    <div className="p-6 md:p-10 xl:px-14 space-y-8 pb-24">
      <PageHeader
        title="Cash Management"
        subtitle="What's been received, deposited and given to vendors in cash."
        actions={
          <>
            <Button variant="outline" icon={Download} onPress={handleExport}>Export</Button>
            <Button icon={Plus} onPress={openCreate}>Add Cash Entry</Button>
          </>
        }
      />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatWidget title="Cash Received" value={formatMoney(summary.totalReceived)} subtext="Lifetime" icon={ArrowDownCircle} tone="emerald" />
          <StatWidget title="Cash Deposited" value={formatMoney(summary.totalDeposited)} subtext="Into bank" icon={Landmark} tone="blue" />
          <StatWidget title="Cash Withdrawn / Given" value={formatMoney(summary.totalWithdrawn)} subtext="To vendors / office use" icon={ArrowUpCircle} tone="orange" />
          <StatWidget title="Net Cash in Hand" value={formatMoney(summary.netCashInHand)} subtext="Received - Deposited - Withdrawn" icon={Wallet} tone={summary.netCashInHand >= 0 ? "blue" : "red"} />
        </div>
      )}

      {trendData.length > 0 && (
        <ChartCard title="Net Cash Movement" subtitle="Last 6 months with activity">
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip formatter={(v) => formatMoney(v)} />
            <Bar dataKey="net" name="Net Cash" radius={[6, 6, 0, 0]}>
              {trendData.map((entry, i) => (
                <Cell key={i} fill={entry.net >= 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      )}

      <div className="flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
        <FilterBar label="Type:">
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All" },
              { value: "received", label: "Received" },
              { value: "deposited", label: "Deposited" },
              { value: "withdrawn", label: "Withdrawn" },
            ]}
          />
        </FilterBar>

        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, bank, remarks..."
          className="w-full xl:w-72"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredEntries}
        emptyIcon={Wallet}
        emptyTitle="No cash entries yet"
        emptyDescription="Add what's received, deposited or given out in cash to start the ledger."
        pageSize={10}
      />

      <Dialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editingId ? "Edit Cash Entry" : "Add Cash Entry"}
        footer={
          <Button fullWidth loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
            {editingId ? "Save Changes" : "Add Entry"}
          </Button>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select
                label="Type"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "received", label: "Cash Received" },
                  { value: "deposited", label: "Cash Deposited" },
                  { value: "withdrawn", label: "Cash Withdrawn / Given" },
                ]}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Amount" type="number" error={errors.amount?.message} {...register("amount")} />
            <TextInput label="Date" type="date" error={errors.date?.message} {...register("date")} />
          </div>

          {watchedType === "received" ? (
            <TextInput label="Received From" placeholder="e.g. Rupesh Jain" {...register("receivedFrom")} />
          ) : (
            <TextInput label={watchedType === "deposited" ? "Deposited To" : "Given To"} placeholder="e.g. ICICI Bank / TBO" {...register("depositedTo")} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Handled By" placeholder="Staff member" {...register("receivedBy")} />
            <TextInput label="Bank" placeholder="e.g. ICICI, PNB" {...register("bank")} />
          </div>

          <TextAreaField label="Remarks" placeholder="Optional notes" {...register("remarks")} />
        </form>
      </Dialog>
    </div>
  );
}
