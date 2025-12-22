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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center dark:bg-slate-900 dark:text-white">
        Loading...
      </div>
    );
  }

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
