import { Quote } from "lucide-react";

// Internal-team quotes, attributed by role rather than name/photo — this is
// Velocity Tours' own operations tool, not a multi-customer SaaS product.
const QUOTES = [
  {
    quote: "I used to keep three Excel tabs open just to know what a vendor still owed us. Now it's one screen.",
    role: "Operations Desk",
  },
  {
    quote: "The GST split used to be a manual formula I'd redo every quarter. It's just... there now, on every booking.",
    role: "Accounts",
  },
  {
    quote: "Cash given to vendors vs. deposited used to live in someone's head. Now it's a ledger anyone on the team can check.",
    role: "Founder's Desk",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">From the team that runs on it</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {QUOTES.map((t) => (
            <div key={t.role} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Quote className="text-blue-200 dark:text-blue-900" size={28} />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">"{t.quote}"</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">{t.role} · Velocity Tours</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
