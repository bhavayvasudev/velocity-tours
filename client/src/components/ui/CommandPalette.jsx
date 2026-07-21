import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Receipt,
  Wallet,
  BarChart3,
  Percent,
  Settings as SettingsIcon,
  Clock,
  CornerDownLeft,
} from "lucide-react";
import { API_URL as BASE_API_URL, authHeaders } from "../../lib/api";
import Dialog from "./Dialog";

const API_URL = `${BASE_API_URL}/api`;
const RECENTS_KEY = "velocity.recentSearches";
const MAX_RECENTS = 5;

const QUICK_NAV = [
  { id: "nav-dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/app" },
  { id: "nav-bookings", label: "Bookings", icon: Calendar, path: "/app/bookings" },
  { id: "nav-payments", label: "Payments", icon: Wallet, path: "/app/payments" },
  { id: "nav-customers", label: "Customer Ledger", icon: Users, path: "/app/customers" },
  { id: "nav-vendors", label: "Vendors", icon: Building2, path: "/app/vendors" },
  { id: "nav-expenses", label: "Expenses", icon: Receipt, path: "/app/expenses" },
  { id: "nav-cash", label: "Cash Management", icon: Wallet, path: "/app/cash" },
  { id: "nav-reports", label: "Reports", icon: BarChart3, path: "/app/reports" },
  { id: "nav-gst", label: "GST", icon: Percent, path: "/app/gst" },
  { id: "nav-settings", label: "Settings", icon: SettingsIcon, path: "/app/settings" },
];

function loadRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(term) {
  if (!term.trim()) return;
  const existing = loadRecents().filter((t) => t.toLowerCase() !== term.toLowerCase());
  const updated = [term, ...existing].slice(0, MAX_RECENTS);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
}

function Section({ title, children }) {
  return (
    <div className="mb-2">
      <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function ResultRow({ icon: Icon, label, sub, active, onClick, onMouseEnter }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{label}</p>
        {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
      </span>
      {active && <CornerDownLeft size={13} className="shrink-0 text-blue-500" />}
    </button>
  );
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recents, setRecents] = useState([]);
  const [data, setData] = useState({ bookings: [], vendors: [], loaded: false });
  const inputRef = useRef(null);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
    setRecents(loadRecents());
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPalette]);

  // Lazy-load once per session, first time the palette is opened.
  useEffect(() => {
    if (!open || data.loaded) return;
    const load = async () => {
      try {
        const [bookingsRes, vendorsRes] = await Promise.all([
          fetch(`${API_URL}/bookings`, { headers: authHeaders() }),
          fetch(`${API_URL}/vendors`, { headers: authHeaders() }),
        ]);
        setData({
          bookings: bookingsRes.ok ? await bookingsRes.json() : [],
          vendors: vendorsRes.ok ? await vendorsRes.json() : [],
          loaded: true,
        });
      } catch (err) {
        console.error("Error loading command palette data:", err);
        setData((d) => ({ ...d, loaded: true }));
      }
    };
    load();
  }, [open, data.loaded]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const bookingMatches = data.bookings
      .filter((b) => b.name.toLowerCase().includes(q) || b.clientName.toLowerCase().includes(q))
      .slice(0, 5)
      .map((b) => ({
        id: `booking-${b._id}`,
        icon: Calendar,
        label: b.name,
        sub: b.clientName,
        onSelect: () => navigate(`/app/bookings/${b._id}`),
      }));

    const vendorMatches = data.vendors
      .filter((v) => v.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((v) => ({
        id: `vendor-${v.name}`,
        icon: Building2,
        label: v.name,
        sub: "Vendor",
        onSelect: () => navigate(`/app/vendors/${v._id}`),
      }));

    const navMatches = QUICK_NAV.filter((n) => n.label.toLowerCase().includes(q)).map((n) => ({
      id: n.id,
      icon: n.icon,
      label: n.label,
      sub: "Go to page",
      onSelect: () => navigate(n.path),
    }));

    return { bookings: bookingMatches, vendors: vendorMatches, nav: navMatches };
  }, [query, data, navigate]);

  const flatItems = useMemo(() => {
    if (!results) return QUICK_NAV.map((n) => ({ id: n.id, icon: n.icon, label: n.label, sub: "Go to page", onSelect: () => navigate(n.path) }));
    return [...results.bookings, ...results.vendors, ...results.nav];
  }, [results, navigate]);

  const handleSelect = (item) => {
    if (!item) return;
    if (query.trim()) saveRecent(query.trim());
    item.onSelect();
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(flatItems[activeIndex]);
    }
  };

  return (
    <>
      <button
        onClick={openPalette}
        className="flex items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2 text-sm text-slate-400 shadow-[var(--shadow-soft)] transition-colors hover:text-slate-600 dark:hover:text-slate-200"
        aria-label="Open search"
      >
        <Search size={15} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded-md border border-[var(--color-border-subtle)] px-1.5 py-0.5 text-[10px] font-semibold sm:inline">Ctrl K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen} size="lg">
        <div>
          <div className="mb-3 flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-3">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              onKeyDown={onKeyDown}
              placeholder="Search bookings, vendors, or jump to a page..."
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>

          <div className="max-h-[55vh] overflow-y-auto">
            {!results && recents.length > 0 && (
              <Section title="Recent Searches">
                {recents.map((term) => (
                  <ResultRow
                    key={term}
                    icon={Clock}
                    label={term}
                    onClick={() => setQuery(term)}
                    onMouseEnter={() => {}}
                  />
                ))}
              </Section>
            )}

            {results && results.bookings.length > 0 && (
              <Section title="Bookings">
                {results.bookings.map((item) => {
                  const idx = flatItems.findIndex((i) => i.id === item.id);
                  return (
                    <ResultRow key={item.id} icon={item.icon} label={item.label} sub={item.sub} active={idx === activeIndex} onClick={() => handleSelect(item)} onMouseEnter={() => setActiveIndex(idx)} />
                  );
                })}
              </Section>
            )}

            {results && results.vendors.length > 0 && (
              <Section title="Vendors">
                {results.vendors.map((item) => {
                  const idx = flatItems.findIndex((i) => i.id === item.id);
                  return (
                    <ResultRow key={item.id} icon={item.icon} label={item.label} sub={item.sub} active={idx === activeIndex} onClick={() => handleSelect(item)} onMouseEnter={() => setActiveIndex(idx)} />
                  );
                })}
              </Section>
            )}

            {(() => {
              const navItems = results
                ? results.nav
                : QUICK_NAV.map((n) => ({ id: n.id, icon: n.icon, label: n.label, sub: "Go to page", onSelect: () => navigate(n.path) }));
              if (navItems.length === 0) return null;
              return (
                <Section title="Quick Navigation">
                  {navItems.map((item) => {
                    const idx = flatItems.findIndex((i) => i.id === item.id);
                    return (
                      <ResultRow key={item.id} icon={item.icon} label={item.label} sub={item.sub} active={idx === activeIndex} onClick={() => handleSelect(item)} onMouseEnter={() => setActiveIndex(idx)} />
                    );
                  })}
                </Section>
              );
            })()}

            {results && results.bookings.length === 0 && results.vendors.length === 0 && results.nav.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-400">No results for &ldquo;{query}&rdquo;.</p>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
