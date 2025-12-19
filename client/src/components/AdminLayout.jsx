import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Calendar, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { logout, user } = useAuth();

  const navItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
    { name: "Bookings", icon: <Calendar size={20} />, path: "/bookings" },
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      
      {/* 1. SIDEBAR */}
      <aside className={`${isSidebarOpen ? "w-64" : "w-20"} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col z-20`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-slate-700">
          {isSidebarOpen ? (
            <h1 className="font-bold text-xl text-blue-600 dark:text-white">Velocity<span className="text-slate-400">Tours</span></h1>
          ) : (
            <span className="font-bold text-xl text-blue-600">V</span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`
              }
            >
              {item.icon}
              {isSidebarOpen && <span className="font-medium">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && "justify-center"}`}>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200 font-bold">
              {user?.name?.charAt(0) || "A"}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-700 dark:text-white truncate">{user?.name}</p>
                <button onClick={logout} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <LogOut size={12} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-auto p-4 md:p-8 relative">
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)} 
          className="absolute top-4 left-4 md:hidden bg-white p-2 rounded-lg shadow-md"
        >
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
        <Outlet />
      </main>
    </div>
  );
}