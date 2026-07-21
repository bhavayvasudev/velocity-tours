import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-bold text-slate-800 dark:text-white">
          Velocity<span className="text-blue-600">Tours</span>
        </span>
        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Velocity Tours & Travel Pvt. Ltd. Internal operations platform.
        </p>
        <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline">
          Staff Sign In
        </Link>
      </div>
    </footer>
  );
}
