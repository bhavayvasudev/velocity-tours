import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Admin Components
import AdminLayout from "./components/AdminLayout";
import DashboardHome from "./components/DashboardHome";
import Bookings from "./components/Bookings";
import BookingDetails from "./components/BookingDetails";
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

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route
            path="/"
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

            {/* Settings */}
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
