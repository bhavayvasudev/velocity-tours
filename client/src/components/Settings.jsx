import { useState, useEffect } from "react";
import {
  Save,
  Trash2,
  RefreshCcw,
  ShieldAlert,
  Building,
  Moon,
  Sun,
  LogOut,
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL as BASE_API_URL, authHeaders } from "../lib/api";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Select from "./ui/Select";
import { TextInput } from "./ui/Field";

const API_URL = `${BASE_API_URL}/api`;

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
    role: "staff"
  });
  const [staffMessage, setStaffMessage] = useState(null);
  const [staffList, setStaffList] = useState([]);

  // --- Fetch Users List ---
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setStaffList(await res.json());
      }
    } catch {
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
    setStaffMessage(null);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(staffData)
      });

      const data = await res.json();

      if (res.ok) {
        setStaffMessage({ ok: true, text: data.message });
        setStaffData({
          name: "",
          email: "",
          role: "staff"
        });
        fetchUsers();
      } else {
        setStaffMessage({ ok: false, text: data.message || "Failed" });
      }
    } catch {
      setStaffMessage({ ok: false, text: "Server connection error" });
    }
  };

  // --- Delete Staff ---
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await fetch(`${API_URL}/auth/users/${userId}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        fetchUsers();
      } catch {
        alert("Failed to delete user");
      }
    }
  };

  // ==========================================
  // 4. SYSTEM MAINTENANCE
  // ==========================================
  const handleCleanGhosts = async () => {
    try {
      await fetch(`${API_URL}/expenses/cleanup/ghosts`, {
        headers: authHeaders(),
      });
      alert("Ghost cleanup complete.");
    } catch {
      alert("Error cleaning database.");
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm("DANGER: This will delete ALL bookings and expenses.")) {
      if (window.confirm("Are you 100% sure?")) {
        try {
          const res = await fetch(`${API_URL}/bookings/database/reset`, {
            method: "DELETE",
            headers: authHeaders(),
          });

          if (res.ok) {
              alert("Database has been reset.");
              window.location.reload();
          } else {
              const data = await res.json();
              alert("Failed: " + (data.message || "Unknown error"));
          }
        } catch {
          alert("Error resetting database.");
        }
      }
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="p-6 md:p-10 xl:px-14 max-w-4xl mx-auto pb-24 space-y-8">
      <PageHeader
        title="Settings"
        subtitle={
          <>Logged in as: <span className="font-bold uppercase text-blue-600">{user?.role}</span></>
        }
      />

      {/* --- 1. APPEARANCE (VISIBLE TO ALL) --- */}
      <Card size="md">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          {isDarkMode ? <Moon size={18} className="text-slate-400" /> : <Sun size={18} className="text-amber-500" />}
          Appearance
        </h2>
        <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-600">
          <div>
            <h3 className="font-bold text-sm">
              Dark Mode
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Toggle app theme
            </p>
          </div>
          <button
            onClick={toggleTheme}
            aria-pressed={isDarkMode}
            aria-label="Toggle dark mode"
            className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </Card>

      {/* --- ADMIN ONLY SECTION START --- */}
      {user?.role === 'admin' && (
        <>
          {/* --- 2. TEAM MANAGEMENT --- */}
          <Card size="md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-600" /> Team Management
            </h2>

            {/* ADD USER FORM */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                <UserPlus size={16}/> Authorize New Team Member
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Sign-in is via Google only. Authorize their email below and they'll get access the next time they sign in with "Continue with Google".
              </p>

              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Name"
                  required
                  value={staffData.name}
                  onChange={e => setStaffData({...staffData, name: e.target.value})}
                />
                <TextInput
                  label="Google Email"
                  required
                  type="email"
                  value={staffData.email}
                  onChange={e => setStaffData({...staffData, email: e.target.value})}
                />
                <Select
                  label="Role"
                  value={staffData.role}
                  onChange={(v) => setStaffData({...staffData, role: v})}
                  options={[
                    { value: "staff", label: "Staff" },
                    { value: "admin", label: "Admin" },
                  ]}
                />

                <div className="md:col-span-2 pt-2 flex flex-wrap items-center gap-4">
                  <Button type="submit">Authorize Access</Button>
                  {staffMessage && (
                    <span className={`flex items-center gap-1.5 font-semibold text-sm ${staffMessage.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                      {staffMessage.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      {staffMessage.text}
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
              <div className="rounded-xl overflow-hidden border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
                {staffList.length === 0 ? (
                   <div className="p-4 text-center text-slate-500 text-sm">
                     No other users found.
                   </div>
                ) : (
                  staffList.map((staff) => (
                    <div key={staff._id} className="flex items-center justify-between p-4 bg-[var(--color-surface-muted)]">
                      <div className="flex items-center gap-3">

                        {/* --- BRANDING: LOGO IMAGE --- */}
                        <div className="w-10 h-10 rounded-full bg-white p-1 border flex items-center justify-center border-slate-200 dark:border-slate-600 shrink-0">
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
                          className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700 transition-colors"
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
          </Card>

          {/* --- 3. COMPANY PROFILE --- */}
          <Card size="md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Building size={18} className="text-blue-600" /> Company Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label="Company Name"
                value={profile.companyName}
                onChange={(e) => setProfile({...profile, companyName: e.target.value})}
              />
              <TextInput
                label="Admin Email"
                type="email"
                disabled
                value={profile.email}
              />
            </div>

            <Button className="mt-6" icon={Save} onPress={handleSaveProfile}>
              Save Changes
            </Button>
          </Card>

          {/* --- 4. MAINTENANCE --- */}
          <Card size="md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <RefreshCcw size={18} className="text-slate-500" /> Maintenance
            </h2>

            <div className="flex flex-wrap justify-between items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-sm">
                  Clean Ghost Data
                </h3>
                <p className="text-xs text-slate-500">
                  Fix math errors.
                </p>
              </div>
              <Button variant="outline" size="sm" onPress={handleCleanGhosts}>
                Run
              </Button>
            </div>
          </Card>

          {/* --- 5. DANGER ZONE --- */}
          <Card size="md" className="!bg-red-50 !border-red-100 dark:!bg-red-900/20 dark:!border-red-900">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
              <ShieldAlert size={18} /> Danger Zone
            </h2>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
              Permanently delete all data. This action cannot be undone.
            </p>
            <Button variant="danger" fullWidth icon={Trash2} onPress={handleResetDatabase}>
              Delete Everything
            </Button>
          </Card>
        </>
      )}

      {/* --- LOGOUT (VISIBLE TO ALL) --- */}
      <Button variant="outline" fullWidth icon={LogOut} onPress={logout}>
        Log Out
      </Button>

    </div>
  );
}
