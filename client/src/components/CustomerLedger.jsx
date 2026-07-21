import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Download } from "lucide-react";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import { exportLedger } from "../lib/excelExport";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import Select from "./ui/Select";
import DataTable from "./ui/DataTable";
import FilterBar from "./ui/FilterBar";
import SearchField from "./ui/SearchField";
import { StatusBadge } from "./ui/Badge";
import { deriveStatus } from "../lib/status";
import BookingsLoader from "./BookingsLoader";

const API_URL = `${BASE_API_URL}/api`;

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function CustomerLedger() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/customers`, { headers: authHeaders() });
        if (res.ok) setCustomers(await res.json());
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(
    () =>
      customers
        .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((c) => statusFilter === "all" || deriveStatus(c.totalBilled, c.totalPaid) === statusFilter),
    [customers, searchQuery, statusFilter]
  );

  const handleExport = () => {
    exportLedger("Customer_Ledger.xlsx", {
      sheetName: "Customer Ledger",
      title: "Velocity Tours — Customer Ledger",
      columns: [
        { key: "name", header: "Customer" },
        { key: "bookingCount", header: "Bookings", align: "right" },
        { key: "totalBilled", header: "Total Billed", align: "right", currency: true },
        { key: "totalPaid", header: "Total Paid", align: "right", currency: true },
        { key: "totalPending", header: "Outstanding", align: "right", currency: true, pendingHighlight: true },
        { key: "lastActivity", header: "Last Activity", value: (c) => (c.lastActivity ? new Date(c.lastActivity).toLocaleDateString("en-IN") : "") },
      ],
      rows: filteredCustomers,
      totalsColumns: ["totalBilled", "totalPaid", "totalPending"],
    });
  };

  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Users size={16} />
          </div>
          <p className="font-bold text-slate-800 dark:text-white">{row.original.name}</p>
        </div>
      ),
    },
    {
      accessorKey: "bookingCount",
      header: "Bookings",
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
      header: "Outstanding",
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

  if (loading) return <BookingsLoader message="Loading customer ledger..." />;

  return (
    <div className="p-6 md:p-10 xl:px-14 space-y-8 pb-24">
      <PageHeader
        title="Customer Ledger"
        subtitle="Every client's running balance and payment history, across all bookings."
        actions={<Button variant="outline" icon={Download} onPress={handleExport}>Export</Button>}
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
          placeholder="Search customers..."
          className="w-full sm:w-80"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredCustomers}
        onRowClick={(customer) => navigate(`/app/customers/${encodeURIComponent(customer.name)}`)}
        emptyIcon={Users}
        emptyTitle="No customers yet"
        emptyDescription="Customers appear here automatically as bookings are created."
        pageSize={10}
      />
    </div>
  );
}
