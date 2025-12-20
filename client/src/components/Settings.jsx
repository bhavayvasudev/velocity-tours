import { useState, useEffect } from "react";
import { 
  Save, 
  Trash2, 
  RefreshCcw, 
  ShieldAlert, 
  User, 
  Mail, 
  Building, 
  Moon, 
  Sun, 
  LogOut, 
  Users, 
  UserPlus 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { logout, user } = useAuth();
  
  // ==========================================
  // 1. THEME MANAGEMENT
  // ==========================================
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // ==========================================
  // 2. PROFILE SETTINGS
  // ==========================================
  const [profile, setProfile] = useState({
    companyName: localStorage.getItem("companyName") || "Velocity Tours",
    email: user?.email || "admin@velocity.in",
  });

  const handleSaveProfile = () => {
    localStorage.setItem("companyName", profile.companyName);
    localStorage.setItem("companyEmail", profile.email);
    alert("Profile settings saved locally!");
  };

  // ==========================================
  // 3. TEAM MANAGEMENT STATE
  // ==========================================
  const [staffData, setStaffData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "staff" 
  });
  const [staffMessage, setStaffMessage] = useState("");
  const [staffList, setStaffList] = useState([]); 

  // --- Fetch Users List ---
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      // FIXED URL BELOW
      const res = await fetch("https://velocity-tours.vercel.app/api/auth/users", {
        headers: { 
          "Authorization": `Bearer ${token}` 
        }
      });
      if (res.ok) {
        setStaffList(await res.json());
      }
    } catch (err) { 
      console.error("Failed to load users"); 
    }
  };

  // Load users ONLY if Admin
  useEffect(() => { 
    if (user?.role === 'admin') {
      fetchUsers(); 
    }
  }, [user]);

  // --- Create New Staff ---
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffMessage("");

    try {
      const token = localStorage.getItem("token");
      // FIXED URL BELOW
      const res = await fetch("https://velocity-tours.vercel.app/api/auth/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(staffData)
      });

      const data = await res.json();
      
      if (res.ok) {
        setStaffMessage("✅ " + data.message);
        setStaffData({ 
          name: "", 
          email: "", 
          password: "", 
          role: "staff" 
        }); 
        fetchUsers(); 
      } else {
        setStaffMessage("❌ " + (data.message || "Failed"));
      }
    } catch (err) {
      setStaffMessage("❌ Server connection error");
    }
  };

  // --- Delete Staff ---
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const token = localStorage.getItem("token");
        // FIXED URL BELOW
        await fetch(`https://velocity-tours.vercel.app/api/auth/users/${userId}`, {
          method: "DELETE",
          headers: { 
            "Authorization": `Bearer ${token}` 
          }
        });
        fetchUsers(); 
      } catch (err) { 
        alert("Failed to delete user"); 
      }
    }
  };

  // ==========================================
  // 4. SYSTEM MAINTENANCE
  // ==========================================
  const handleCleanGhosts = async () => {
    try {
      const token = localStorage.getItem("token");
      // FIXED URL BELOW
      await fetch("https://velocity-tours.vercel.app/api/expenses/cleanup/ghosts", { 
         headers: { 
           "Authorization": `Bearer ${token}` 
         }
      });
      alert("Ghost cleanup complete.");
    } catch (err) { 
      alert("Error cleaning database."); 
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm("⚠️ DANGER: This will delete ALL bookings and expenses.")) {
      if (window.confirm("Are you 100% sure?")) {
        try {
          const token = localStorage.getItem("token");
          // FIXED URL BELOW
          await fetch("https://velocity-tours.vercel.app/api/bookings/database/reset", { 
            method: "DELETE",
            headers: { 
              "Authorization": `Bearer ${token}` 
            }
          });
          alert("Database has been reset.");
          window.location.reload();
        } catch (err) { 
          alert("Error resetting database."); 
        }
      }
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto pb-24 text-slate-900 dark:text-white animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-2">
        Settings
      </h1>
      <p className="mb-8 text-slate-500 dark:text-slate-400">
        Logged in as: <span className="font-bold uppercase text-blue-600">{user?.role}</span>
      </p>

      {/* --- 1. APPEARANCE (VISIBLE TO ALL) --- */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          {isDarkMode ? <Moon size={20} className="text-purple-400" /> : <Sun size={20} className="text-orange-500" />} 
          Appearance
        </h2>
        <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-600">
          <div>
            <h3 className="font-bold">
              Dark Mode
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Toggle app theme
            </p>
          </div>
          <button 
            onClick={toggleTheme} 
            className={`w-14 h-7 flex items-center rounded-full p-1 duration-300 cursor-pointer ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>

      {/* --- ADMIN ONLY SECTION START --- */}
      {user?.role === 'admin' && (
        <>
          {/* --- 2. TEAM MANAGEMENT --- */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600" /> Team Management
            </h2>
            
            {/* ADD USER FORM */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50 mb-8">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <UserPlus size={18}/> Add New Staff
              </h3>
              
              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Name
                  </label>
                  <input 
                    required 
                    className="w-full p-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-600" 
                    value={staffData.name} 
                    onChange={e => setStaffData({...staffData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Email
                  </label>
                  <input 
                    required 
                    type="email" 
                    className="w-full p-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-600" 
                    value={staffData.email} 
                    onChange={e => setStaffData({...staffData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Password
                  </label>
                  <input 
                    required 
                    type="password" 
                    className="w-full p-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-600" 
                    value={staffData.password} 
                    onChange={e => setStaffData({...staffData, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Role
                  </label>
                  <select 
                    className="w-full p-2 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-600" 
                    value={staffData.role} 
                    onChange={e => setStaffData({...staffData, role: e.target.value})}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 pt-2 flex items-center gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                    Create Account
                  </button>
                  {staffMessage && (
                    <span className={`font-bold text-sm ${staffMessage.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                      {staffMessage}
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* STAFF LIST */}
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-3 px-1">
                Current Team Members
              </h3>
              <div className="border rounded-xl overflow-hidden border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                {staffList.length === 0 ? (
                   <div className="p-4 text-center text-slate-500 text-sm">
                     No other users found.
                   </div>
                ) : (
                  staffList.map((staff) => (
                    <div key={staff._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        
                        {/* --- BRANDING: LOGO IMAGE --- */}
                        <div className="w-10 h-10 rounded-full bg-white p-1 border flex items-center justify-center border-slate-200 dark:border-slate-600">
                          <img 
                            src="/logo.png" 
                            alt="User" 
                            className="w-full h-full object-contain rounded-full" 
                            onError={(e) => {e.target.style.display='none'; e.target.parentElement.innerText='?'}} 
                          />
                        </div>
                        {/* ----------------------------- */}

                        <div>
                          <p className="font-bold text-sm dark:text-white">
                            {staff.name} {staff._id === user.id && "(You)"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {staff.email} • <span className="uppercase font-semibold">{staff.role}</span>
                          </p>
                        </div>
                      </div>
                      
                      {staff._id !== user.id && (
                        <button 
                          onClick={() => handleDeleteUser(staff._id)} 
                          className="text-slate-400 hover:text-red-600 p-2 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={18}/>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* --- 3. COMPANY PROFILE --- */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Building size={20} className="text-blue-600" /> Company Profile
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Company Name
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-600" 
                  value={profile.companyName} 
                  onChange={(e) => setProfile({...profile, companyName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Admin Email
                </label>
                <input 
                  type="email" 
                  disabled 
                  className="w-full p-2.5 border rounded-xl bg-slate-100 dark:bg-slate-900/50 dark:border-slate-600 text-slate-500" 
                  value={profile.email}
                />
              </div>
            </div>
            
            <button 
              onClick={handleSaveProfile} 
              className="mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>

          {/* --- 4. MAINTENANCE --- */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <RefreshCcw size={20} className="text-indigo-500" /> Maintenance
            </h2>
            
            <div className="flex justify-between items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <div>
                <h3 className="font-bold">
                  Clean Ghost Data
                </h3>
                <p className="text-xs text-slate-500">
                  Fix math errors.
                </p>
              </div>
              <button 
                onClick={handleCleanGhosts} 
                className="px-4 py-2 bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white rounded shadow-sm"
              >
                Run
              </button>
            </div>
          </div>

          {/* --- 5. DANGER ZONE --- */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900 p-6 mb-8">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
              <ShieldAlert size={20} /> Danger Zone
            </h2>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
              Permanently delete all data. This action cannot be undone.
            </p>
            <button 
              onClick={handleResetDatabase} 
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <Trash2 size={18} /> Delete Everything
            </button>
          </div>
        </>
      )}

      {/* --- LOGOUT (VISIBLE TO ALL) --- */}
      <button 
        onClick={logout} 
        className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
      >
        <LogOut size={20} /> Log Out
      </button>

    </div>
  );
}