import { motion } from "framer-motion";
import { Check, Calendar, Building2, Receipt, PiggyBank, FileSpreadsheet } from "lucide-react";

const MODULES = [
  {
    icon: Calendar,
    title: "Booking Management",
    description: "Every trip in one ledger — invoice number, payment status, mode, bank and remarks, searchable and filterable by period.",
    points: ["Advanced search & filtering", "Payment status badges", "Monthly / quarterly / FY views"],
  },
  {
    icon: Building2,
    title: "Vendor Management",
    description: "Stop hunting through old bookings to remember what a vendor is owed — see their full bill history in one place.",
    points: ["Cross-booking vendor history", "Pending balance at a glance", "Notes per vendor"],
  },
  {
    icon: Receipt,
    title: "GST Management",
    description: "Inclusive 18% GST is split into CGST/SGST automatically on both client revenue and vendor cost.",
    points: ["Automatic CGST/SGST split", "Profit-after-tax on every trip", "Service Tax export"],
  },
  {
    icon: PiggyBank,
    title: "Financial Tracking & Cash",
    description: "A dedicated cash ledger for what's received, deposited and given to vendors — reconciled against the books.",
    points: ["Cash received vs. deposited", "Per-bank breakdown", "Full audit remarks"],
  },
  {
    icon: FileSpreadsheet,
    title: "Excel Reporting",
    description: "Export payment, service-tax, vendor and cash reports in the same column layout your accountant already uses.",
    points: ["Payment & Service Tax reports", "Vendor ledger export", "Cash ledger export"],
  },
];

export default function ModulesShowcase() {
  return (
    <section id="modules" className="py-24 px-6">
      <div className="max-w-5xl mx-auto space-y-20">
        {MODULES.map((mod, i) => (
          <motion.div
            key={mod.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-10`}
          >
            <div className="flex-1">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5">
                <mod.icon size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{mod.title}</h3>
              <p className="mt-3 text-slate-500 dark:text-slate-400">{mod.description}</p>
              <ul className="mt-5 space-y-2">
                {mod.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Check size={16} className="text-emerald-500 shrink-0" /> {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                <mod.icon size={64} className="text-blue-300 dark:text-slate-700" strokeWidth={1} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
