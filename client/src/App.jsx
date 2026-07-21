import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Marketing
import LandingPage from "./components/marketing/LandingPage";

// Admin Components
import AdminLayout from "./components/AdminLayout";
import DashboardHome from "./components/DashboardHome";
import Bookings from "./components/Bookings";
import BookingDetails from "./components/BookingDetails";
import Payments from "./components/Payments";
import CustomerLedger from "./components/CustomerLedger";
import CustomerDetails from "./components/CustomerDetails";
import Vendors from "./components/Vendors";
import VendorDetails from "./components/VendorDetails";
import Expenses from "./components/Expenses";
import CashManagement from "./components/CashManagement";
import Reports from "./components/Reports";
import GST from "./components/GST";
import Settings from "./components/Settings";

// 1. Protection Wrapper
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
  <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    <p className="mt-4 text-slate-500 font-medium">Verifying Session...</p>
  </div>
);

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// 2. Main App
export default function App() {
  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // If the browser restores an authenticated page from bfcache (e.g. via
  // the Back button) after the user has logged out, force a hard reload so
  // the app boots fresh instead of showing a stale, already-rendered page.
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted && !localStorage.getItem("token")) {
        window.location.replace("/");
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public marketing site */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected app */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardHome />} />

            {/* Bookings */}
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:id" element={<BookingDetails />} />

            {/* Payments */}
            <Route path="payments" element={<Payments />} />

            {/* Customers */}
            <Route path="customers" element={<CustomerLedger />} />
            <Route path="customers/:name" element={<CustomerDetails />} />

            {/* Vendors */}
            <Route path="vendors" element={<Vendors />} />
            <Route path="vendors/:id" element={<VendorDetails />} />

            {/* Expenses */}
            <Route path="expenses" element={<Expenses />} />

            {/* Cash Management — reachable via the Dashboard's Cash Position
                card; not in the top nav, same as booking/vendor detail pages. */}
            <Route path="cash" element={<CashManagement />} />

            {/* Reports */}
            <Route path="reports" element={<Reports />} />

            {/* GST */}
            <Route path="gst" element={<GST />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Anything unmatched falls back to the marketing site */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
