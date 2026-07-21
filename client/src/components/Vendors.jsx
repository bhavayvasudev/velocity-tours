import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Building2, Download } from "lucide-react";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { exportLedger } from "../lib/excelExport";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Dialog from "./ui/Dialog";
import DataTable from "./ui/DataTable";
import FilterBar from "./ui/FilterBar";
import SearchField from "./ui/SearchField";
import { TextInput, TextAreaField } from "./ui/Field";
import { StatusBadge } from "./ui/Badge";
import { deriveStatus } from "../lib/status";
import BookingsLoader from "./BookingsLoader";

const API_URL = `${BASE_API_URL}/api`;

const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  notes: z.string().optional(),
});

export default function Vendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(vendorSchema),
    defaultValues: { name: "", notes: "" },
  });

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/vendors`, { headers: authHeaders() });
      if (res.ok) setVendors(await res.json());
    } catch (err) {
      console.error("Error fetching vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = useMemo(
    () =>
      vendors
        .filter((v) => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((v) => statusFilter === "all" || deriveStatus(v.totalBilled, v.totalPaid) === statusFilter),
    [vendors, searchQuery, statusFilter]
  );

  const onSubmit = async (values) => {
    try {
      const res = await fetch(`${API_URL}/vendors`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to create vendor");
        return;
      }
      setShowForm(false);
      reset();
      fetchVendors();
    } catch (err) {
      console.error("Error creating vendor:", err);
    }
  };

  const handleExport = () => {
    exportLedger("Vendor_Ledger.xlsx", {
      sheetName: "Vendor Ledger",
      title: "Velocity Tours — Vendor Ledger",
      columns: [
        { key: "name", header: "Vendor Name" },
        { key: "billCount", header: "Bills", align: "right" },
        { key: "totalBilled", header: "Total Billed", align: "right", currency: true },
        { key: "totalPaid", header: "Total Paid", align: "right", currency: true },
        { key: "totalPending", header: "Pending", align: "right", currency: true, pendingHighlight: true },
        { key: "lastActivity", header: "Last Activity", value: (v) => (v.lastActivity ? new Date(v.lastActivity).toLocaleDateString("en-IN") : "") },
      ],
      rows: filteredVendors,
      totalsColumns: ["totalBilled", "totalPaid", "totalPending"],
    });
  };

  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Vendor",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Building2 size={16} />
          </div>
          <p className="font-bold text-slate-800 dark:text-white">{row.original.name}</p>
        </div>
      ),
    },
    {
      accessorKey: "billCount",
      header: "Bills",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-300">{getValue()}</span>,
    },
    {
      accessorKey: "totalBilled",
      header: "Total Billed",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className="font-semibold text-slate-800 dark:text-white">{formatMoney(getValue())}</span>,
    },
    {
      accessorKey: "totalPaid",
      header: "Total Paid",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(getValue())}</span>,
    },
    {
      accessorKey: "totalPending",
      header: "Pending",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className="text-orange-500 font-semibold">{formatMoney(getValue())}</span>,
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      meta: { align: "right" },
      cell: ({ row }) => <StatusBadge status={deriveStatus(row.original.totalBilled, row.original.totalPaid)} />,
    },
  ], []);

  if (loading) return <BookingsLoader message="Loading vendors..." />;

  return (
    <div className="p-6 md:p-10 xl:px-14 space-y-8 pb-24">
      <PageHeader
        title="Vendors"
        subtitle="Every vendor's bill history, across all bookings, in one place."
        actions={
          <>
            <Button variant="outline" icon={Download} onPress={handleExport}>Export</Button>
            <Button icon={Plus} onPress={() => setShowForm(true)}>Add Vendor</Button>
          </>
        }
      />

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
          placeholder="Search vendors..."
          className="w-full sm:w-80"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredVendors}
        onRowClick={(vendor) => navigate(`/app/vendors/${vendor._id}`)}
        emptyIcon={Building2}
        emptyTitle="No vendors yet"
        emptyDescription="Vendors are created automatically the first time you add an expense, or manually with Add Vendor."
        pageSize={10}
      />

      <Dialog
        open={showForm}
        onOpenChange={setShowForm}
        title="Add Vendor"
        footer={
          <Button fullWidth loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
            Create Vendor
          </Button>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextInput label="Vendor Name" placeholder="e.g. Indigo Airlines" error={errors.name?.message} {...register("name")} />
          <TextAreaField label="Notes" placeholder="Optional notes about this vendor" {...register("notes")} />
        </form>
      </Dialog>
    </div>
  );
}
