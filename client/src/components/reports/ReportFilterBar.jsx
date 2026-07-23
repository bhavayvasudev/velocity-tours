import { RotateCcw } from "lucide-react";
import FilterBar from "../ui/FilterBar";
import Select from "../ui/Select";

const BOOKING_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "Flights", label: "Flights" },
  { value: "Stays", label: "Stays" },
  { value: "Visa", label: "Visa" },
  { value: "Other", label: "Other" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: new Date(0, i).toLocaleString("default", { month: "long" }),
}));

const QUARTER_OPTIONS = [
  { value: "Q1", label: "Q1 (Apr-Jun)" },
  { value: "Q2", label: "Q2 (Jul-Sep)" },
  { value: "Q3", label: "Q3 (Oct-Dec)" },
  { value: "Q4", label: "Q4 (Jan-Mar)" },
];

/**
 * The one global filter bar driving every tab (section 12 of the brief) —
 * period, booking type, customer, vendor and payment mode all live here
 * instead of each tab re-implementing its own subset, so switching tabs
 * never silently drops a filter the user just set.
 */
export default function ReportFilterBar({ filters, setFilters, yearOptions, customerOptions, vendorOptions, paymentModeOptions }) {
  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const hasActiveFilters =
    filters.periodType !== "all" ||
    filters.bookingType !== "all" ||
    filters.customer !== "all" ||
    filters.vendor !== "all" ||
    filters.paymentMode !== "all";

  const reset = () =>
    setFilters((prev) => ({
      ...prev,
      periodType: "all",
      bookingType: "all",
      customer: "all",
      vendor: "all",
      paymentMode: "all",
    }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterBar label="Period:">
        <Select
          value={filters.periodType}
          onChange={set("periodType")}
          options={[
            { value: "all", label: "Lifetime" },
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "yearly", label: "Financial Year" },
          ]}
        />
        {filters.periodType !== "all" && (
          <Select
            value={String(filters.year)}
            onChange={(v) => set("year")(Number(v))}
            options={yearOptions.map((y) => ({ value: String(y), label: filters.periodType === "monthly" ? String(y) : `FY ${y}-${y + 1}` }))}
          />
        )}
        {filters.periodType === "quarterly" && <Select value={filters.quarter} onChange={set("quarter")} options={QUARTER_OPTIONS} />}
        {filters.periodType === "monthly" && <Select value={String(filters.month)} onChange={(v) => set("month")(Number(v))} options={MONTH_OPTIONS} />}
      </FilterBar>

      <FilterBar label="Type:">
        <Select value={filters.bookingType} onChange={set("bookingType")} options={BOOKING_TYPE_OPTIONS} />
      </FilterBar>

      <FilterBar label="Customer:">
        <Select value={filters.customer} onChange={set("customer")} options={[{ value: "all", label: "All Customers" }, ...customerOptions]} />
      </FilterBar>

      <FilterBar label="Vendor:">
        <Select value={filters.vendor} onChange={set("vendor")} options={[{ value: "all", label: "All Vendors" }, ...vendorOptions]} />
      </FilterBar>

      <FilterBar label="Payment:">
        <Select value={filters.paymentMode} onChange={set("paymentMode")} options={[{ value: "all", label: "All Modes" }, ...paymentModeOptions]} />
      </FilterBar>

      {hasActiveFilters && (
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-subtle)] px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
        >
          <RotateCcw size={13} /> Reset
        </button>
      )}
    </div>
  );
}
