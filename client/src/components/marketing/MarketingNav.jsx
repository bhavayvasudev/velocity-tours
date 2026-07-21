import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Button from "../ui/Button";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Analytics", href: "#analytics" },
  { label: "FAQ", href: "#faq" },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800" : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-bold text-lg text-slate-900 dark:text-white">
          Velocity<span className="text-blue-600">Tours</span>
        </span>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 px-3 py-2">
            Sign In
          </Link>
          <Link to="/login">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-700 dark:text-slate-200">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 space-y-3">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              {link.label}
            </a>
          ))}
          <Link to="/login" className="block text-sm font-semibold text-blue-600 pt-2">Sign In</Link>
        </div>
      )}
    </header>
  );
}
