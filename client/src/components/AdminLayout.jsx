import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Plus,
  ArrowDownLeft,
  Receipt,
  Wallet,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PillNav from "./ui/PillNav";
import SpeedDial from "./ui/SpeedDial";
import Dropdown from "./ui/Dropdown";
import Button from "./ui/Button";
import CommandPalette from "./ui/CommandPalette";
import AIAssistant from "./ui/AIAssistant";

// Only the primary destinations live in the floating nav. Payments, Vendors,
// Expenses and GST are still real routes (see App.jsx) — reachable from the
// Dashboard's health rows, Reports' export tiles, and the New Entry menu
// below — they just don't need a permanent top-level slot. "New Booking" is
// the single most common action, so it takes GST's slot as a highlighted
// CTA pill living inside the same nav capsule, not a separate button beside it.
const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/app", end: true },
  { name: "Bookings", icon: Calendar, path: "/app/bookings" },
  { name: "Reports", icon: BarChart3, path: "/app/reports" },
  { name: "Settings", icon: SettingsIcon, path: "/app/settings" },
  { name: "New Booking", icon: Plus, path: "/app/bookings", state: { openCreate: true }, type: "cta" },
];

function UserMenu({ user, onSettings, onLogout }) {
  const initials = user?.name?.charAt(0)?.toUpperCase() || "A";
  const firstName = user?.name?.split(" ")[0] || "Account";

  return (
    <Dropdown
      trigger={
        // Must be `ui/Button` (not a plain <button>) — HeroUI's Dropdown is
        // built on React Aria's MenuTrigger, which wires up open/close
        // behavior via a Button-context provider that a raw DOM button
        // never receives, so the menu wouldn't open otherwise.
        <Button
          variant="outline"
          className="!h-auto shrink-0 gap-2 !rounded-full !border-[var(--color-border-subtle)] !bg-[var(--color-surface)] !py-1.5 !pl-1.5 !pr-2.5 shadow-[var(--shadow-soft)] sm:!pr-3"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
            {initials}
          </span>
          <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-200 sm:inline">{firstName}</span>
          <ChevronDown size={14} className="hidden text-slate-400 sm:inline" />
        </Button>
      }
      items={[
        { key: "settings", label: "Settings", icon: SettingsIcon, onSelect: onSettings },
        { key: "logout", label: "Log Out", icon: LogOut, danger: true, onSelect: onLogout },
      ]}
    />
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Sign-out must land on the public landing page, not the login screen —
  // replace (not push) so the authenticated route it came from drops out of
  // history instead of sitting one Back press away.
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  // Every "New Entry" action a travel-agency owner needs day to day,
  // reachable from any screen without a nav trip first. "New Booking" lives
  // in the nav pill itself (it's the single most common action), so it's
  // deliberately not repeated here. Each one hands the destination page a
  // location.state flag so it can auto-open its create dialog instead of
  // just landing on the list.
  const speedDialActions = [
    { key: "payment", icon: ArrowDownLeft, label: "Receive Payment", onSelect: () => navigate("/app/payments", { state: { openRecord: true } }) },
    { key: "bill", icon: Receipt, label: "Vendor Bill", onSelect: () => navigate("/app/expenses", { state: { openCreate: true } }) },
    { key: "cash", icon: Wallet, label: "Cash Entry", onSelect: () => navigate("/app/cash", { state: { openCreate: true } }) },
    { key: "expense", icon: Receipt, label: "Expense", onSelect: () => navigate("/app/expenses", { state: { openCreate: true } }) },
    { key: "invoice", icon: FileText, label: "Generate Invoice", onSelect: () => navigate("/app/payments", { state: { openInvoicePicker: true } }) },
    { key: "export", icon: FileSpreadsheet, label: "Export Excel", onSelect: () => navigate("/app/reports") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-app-bg-from)] to-[var(--color-app-bg-to)] transition-colors dark:from-[var(--color-surface-muted)] dark:to-[var(--color-surface-muted)]">
      <header className="sticky top-0 z-40 px-4 pt-4 md:px-8 md:pt-6">
        <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-3">
          <button onClick={() => navigate("/app")} className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base font-extrabold text-white shadow-[var(--shadow-soft)]">
              V
            </span>
            <span className="hidden text-lg font-bold text-slate-800 sm:inline dark:text-white">
              Velocity<span className="font-medium text-slate-400">Tours</span>
            </span>
          </button>

          <div className="absolute left-1/2 top-0 hidden -translate-x-1/2 md:block">
            <PillNav items={navItems} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CommandPalette />
            <UserMenu user={user} onSettings={() => navigate("/app/settings")} onLogout={handleLogout} />
          </div>
        </div>

        {/* Below md, the floating-centered pill would collide with the logo
            and avatar, so it drops into flow as its own centered row instead. */}
        <div className="mt-3 flex justify-center md:hidden">
          <PillNav items={navItems} />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px]">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <SpeedDial actions={speedDialActions} />
      <AIAssistant />
    </div>
  );
}

/**
 * Subtle crossfade + rise between routes — keyed on pathname so React
 * treats each page as a distinct element and animates the swap. Kept to
 * opacity/transform only (no layout properties) so it stays cheap.
 */
function PageTransition({ children }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const offset = reduceMotion ? 0 : 6;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: offset }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -offset }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
