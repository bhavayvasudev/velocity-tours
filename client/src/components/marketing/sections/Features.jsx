import { motion } from "framer-motion";
import { Calendar, Building2, Receipt, Wallet, FileSpreadsheet, LineChart } from "lucide-react";

const FEATURES = [
  { icon: Calendar, title: "Booking & Invoices", description: "Track every trip's invoice number, payment status, mode and remarks in one ledger." },
  { icon: Building2, title: "Vendor Management", description: "See every vendor's bill history and pending balance across all bookings, not just one." },
  { icon: Receipt, title: "GST-Ready Profit", description: "Inclusive 18% GST math with CGST/SGST breakdown computed automatically per booking." },
  { icon: Wallet, title: "Cash Ledger", description: "A dedicated cash-in-hand ledger for what's received, deposited, and given to vendors." },
  { icon: FileSpreadsheet, title: "Excel Reporting", description: "Export payment, service-tax, vendor and cash reports in the exact format your accountant expects." },
  { icon: LineChart, title: "Live Analytics", description: "Monthly, quarterly and financial-year views of revenue, expenses and profit trends." },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Everything the ledger used to do, done properly</h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400">One system for bookings, vendors and cash — instead of one spreadsheet per season.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <feature.icon size={22} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
