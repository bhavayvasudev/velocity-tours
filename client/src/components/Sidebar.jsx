import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Receipt, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X 
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Bookings", path: "/bookings", icon: <CalendarDays size={20} /> },
    { name: "Expenses", path: "/expenses", icon: <Receipt size={20} /> },
    { name: "Settings", path: "/settings", icon: <SettingsIcon size={20} /> },
  ];

  return (
    <>
      {/* MOBILE MENU */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md md:hidden"
      >
        {isOpen ? <X size={24} className="text-slate-800 dark:text-white"/> : <Menu size={24} className="text-slate-800 dark:text-white"/>}
      </button>

      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        z-50 transition-transform duration-300 ease-in-out flex flex-col justify-between
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        
        {/* TOP SECTION */}
        <div>
          {/* --- BRANDING HEADER (UPDATED) --- */}
          <div className="flex items-center gap-3 p-6 mb-4">
            
            {/* LOGO: Uses /logo.png from public folder. timestamp forces refresh */}
            <img 
              src={`/logo.png?v=${new Date().getTime()}`} 
              alt="Logo" 
              className="h-10 w-auto object-contain"
              onError={(e) => e.target.style.display = 'none'} 
            />

            {/* TEXT: Vertical Stack to force separation */}
            <div className="flex flex-col justify-center">
              <span className="text-xl font-bold text-blue-600 leading-none">
                Velocity
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight mt-1">
                Tours Pvt. Ltd.
              </span>
            </div>
          </div>
          {/* --------------------------------- */}

          <nav className="flex flex-col gap-2 px-4">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  pathname === link.path 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* BOTTOM SECTION */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            {/* PROFILE PIC (LOGO) */}
            <div className="w-10 h-10 min-w-[2.5rem] bg-white p-1 rounded-full border shadow-sm flex items-center justify-center">
               <img 
                 src="/logo.png" 
                 alt="User" 
                 className="w-full h-full object-contain rounded-full" 
               />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                {user?.name || "User"}
              </p>
              <button 
                onClick={logout} 
                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <LogOut size={12} /> Logout
              </button>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}