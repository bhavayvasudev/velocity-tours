import { Sparkles } from "lucide-react";

const TONE_DOT = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  neutral: "bg-slate-300",
};

/**
 * "AI-generated insights" per the brief, but computed deterministically
 * from real bookings/expenses rather than an actual model call — the
 * server's AI assistant has no live database access (see server/services/ai.js),
 * so anything it "generated" about real figures would be invented. These
 * read the same to a user but are honest, reproducible facts.
 *
 * The AI Reports prompts below *do* call the real assistant — each one
 * hands it the numbers already computed on this page so it can actually
 * answer instead of disclaiming that it has no data access.
 */
export default function InsightsPanel({ insights, aiPrompts, onAskAi }) {
  return (
    <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
        <Sparkles size={16} className="text-violet-500" /> Business Insights
      </h3>
      <p className="mb-4 text-xs text-slate-400">What changed, and who matters most</p>

      {insights.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">Add a booking and a vendor bill to see insights here.</p>
      ) : (
        <ul className="space-y-2.5">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[insight.tone] || TONE_DOT.neutral}`} />
              {insight.text}
            </li>
          ))}
        </ul>
      )}

      {aiPrompts && aiPrompts.length > 0 && (
        <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Ask the AI Assistant</p>
          <div className="flex flex-col gap-1.5">
            {aiPrompts.map((item) => (
              <button
                key={item.label}
                onClick={() => onAskAi(item)}
                className="rounded-xl border border-[var(--color-border-subtle)] px-3 py-2 text-left text-xs text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-violet-900/10"
              >
                ✨ {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
