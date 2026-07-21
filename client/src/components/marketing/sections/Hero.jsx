import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import GoogleSignInButton from "../../GoogleSignInButton";

export default function Hero() {
  const navigate = useNavigate();

  const scrollToDemo = () => {
    document.getElementById("dashboard-preview")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative pt-40 pb-28 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[-5%] right-[-10%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block mb-6 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wide"
        >
          Built for Velocity Tours & Travel
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white"
        >
          Run your travel business <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">without the spreadsheet chaos</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-6 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
        >
          Bookings, vendor bills, cash ledgers, GST and profit — all in one place, with the same
          numbers your accountant already trusts, minus the manual Excel upkeep.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <GoogleSignInButton className="sm:w-64" onSuccess={() => navigate("/app")} />
          <button
            onClick={scrollToDemo}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors px-4 py-3.5"
          >
            <PlayCircle size={18} /> View Demo
          </button>
        </motion.div>

        <p className="mt-4 text-xs text-slate-400">
          Staff accounts are created by your admin —{" "}
          <Link to="/login" className="underline hover:text-blue-500">sign in</Link> with your Google account.
        </p>
      </div>
    </section>
  );
}
