import { motion } from "framer-motion";
import { Banknote, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import StatWidget from "../../ui/StatWidget";

const PREVIEW_STATS = [
  { title: "Total Revenue", value: "₹12,84,000", subtext: "This quarter", icon: Banknote, tone: "blue" },
  { title: "Total Expenses", value: "₹7,42,300", subtext: "Vendor costs", icon: TrendingDown, tone: "red" },
  { title: "Net Profit", value: "₹5,41,700", subtext: "Before tax", icon: TrendingUp, tone: "emerald" },
  { title: "Profit After Tax", value: "₹4,59,068", subtext: "Real cash (excl. GST)", icon: Wallet, tone: "indigo" },
];

/** Illustrative numbers only — not wired to any live API. */
export default function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">A dashboard that actually answers "where do we stand?"</h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Sample data shown — sign in to see your real numbers.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/5 overflow-hidden"
        >
          <div className="h-10 flex items-center gap-1.5 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {PREVIEW_STATS.map((stat) => (
              <StatWidget key={stat.title} {...stat} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
