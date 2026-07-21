import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import ChartCard from "../../ui/ChartCard";

const REVENUE_TREND = [
  { month: "Jan", revenue: 420000, expenses: 260000 },
  { month: "Feb", revenue: 510000, expenses: 300000 },
  { month: "Mar", revenue: 610000, expenses: 340000 },
  { month: "Apr", revenue: 540000, expenses: 310000 },
  { month: "May", revenue: 720000, expenses: 400000 },
  { month: "Jun", revenue: 810000, expenses: 430000 },
];

const CASH_FLOW = [
  { month: "Jan", cash: 180000 },
  { month: "Feb", cash: 220000 },
  { month: "Mar", cash: 160000 },
  { month: "Apr", cash: 260000 },
  { month: "May", cash: 300000 },
  { month: "Jun", cash: 240000 },
];

/** Illustrative numbers only — not wired to any live API. */
export default function Analytics() {
  return (
    <section id="analytics" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Trends, not just totals</h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Sample data shown — sign in to see your real numbers.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ChartCard title="Revenue vs. Expenses" subtitle="Last 6 months">
            <AreaChart data={REVENUE_TREND}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#f97316" fill="none" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Cash Position" subtitle="Net cash by month">
            <BarChart data={CASH_FLOW}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Bar dataKey="cash" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
