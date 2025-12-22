import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Filter, X, Search, Briefcase } from "lucide-react";

// ✅ LIVE BACKEND URL
const API_URL = "https://velocity-tours.vercel.app";

export default function Bookings() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 Added Search

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  // New booking form
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    totalClientPayment: "",
    date: new Date().toISOString().split("T")[0],
  });

  /* ================= HELPERS ================= */
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 5; i++) {
    yearOptions.push(i);
  }

  /* ================= FETCH BOOKINGS ================= */
  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchBookings();
  }, []);

  /* ================= CREATE BOOKING ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          totalClientPayment: Number(formData.totalClientPayment),
          clientPaidAmount: 0,
        }),
      });

      if (!res.ok) return;

      const newBooking = await res.json();
      setBookings([newBooking, ...bookings]);
      setShowForm(false);
      setFormData({
        name: "",
        clientName: "",
        totalClientPayment: "",
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  /* ================= FILTER LOGIC ================= */
  const filteredBookings = bookings.filter((b) => {
    // 1. Search Filter
    const matchesSearch = 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Date Filter
    if (filterType === "all") return true;

    const d = new Date(b.date);
    const m = d.getMonth();
    const y = d.getFullYear();

    if (filterType === "monthly") {
      return m === selectedMonth && y === selectedYear;
    }

    if (filterType === "yearly") {
      const fyStart = new Date(selectedYear, 3, 1);
      const fyEnd = new Date(selectedYear + 1, 2, 31);
      return d >= fyStart && d <= fyEnd;
    }

    if (filterType === "quarterly") {
      const ranges = {
        Q1: [3, 5],
        Q2: [6, 8],
        Q3: [9, 11],
        Q4: [0, 2],
      };
      const [start, end] = ranges[selectedQuarter];
      const fy = selectedQuarter === "Q4" && m <= 2 ? selectedYear + 1 : selectedYear;
      
      if (selectedQuarter === "Q4") {
         return (m >= 0 && m <= 2 && y === selectedYear + 1);
      }
      return m >= start && m <= end && y === fy;
    }

    return true;
  });

  /* ================= RENDER ================= */
  return (
    <div className="p-6 md:p-10 space-y-6 pb-24">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            All Trips
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your client bookings and payments.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus size={20} /> New Trip
        </button>
      </div>

      {/* 2. CONTROLS BAR (Filters + Search) */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
        
        {/* MATCHING DASHBOARD FILTER STYLE */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl flex flex-wrap gap-2 items-center border border-slate-200 dark:border-slate-700 w-fit">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium px-2">
                <Filter size={16} /> <span className="text-sm">Filter:</span>
            </div>
            
            <select
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
            >
                <option value="all">All Time</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Financial Year</option>
            </select>

            {filterType !== "all" && (
            <>
                <select
                    className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                    {yearOptions.map((y) => (
                        <option key={y} value={y}>
                            {filterType === "monthly" ? y : `FY ${y}-${y + 1}`}
                        </option>
                    ))}
                </select>

                {filterType === "quarterly" && (
                    <select
                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(e.target.value)}
                    >
                        <option value="Q1">Q1 (Apr–Jun)</option>
                        <option value="Q2">Q2 (Jul–Sep)</option>
                        <option value="Q3">Q3 (Oct–Dec)</option>
                        <option value="Q4">Q4 (Jan–Mar)</option>
                    </select>
                )}

                {filterType === "monthly" && (
                    <select
                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                                {new Date(0, i).toLocaleString("default", { month: "long" })}
                            </option>
                        ))}
                    </select>
                )}
            </>
            )}
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full xl:w-72">
           <Search className="absolute left-3 top-3 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder="Search trips or clients..."
             className="w-full pl-10 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      {/* 3. BOOKINGS LIST (Cards Style) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Briefcase size={32} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">No trips found</p>
            <p className="text-sm">Try adjusting filters or create a new one.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredBookings.map((b) => (
              <div
                key={b._id}
                onClick={() => navigate(`/bookings/${b._id}`)}
                className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                      {b.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                       <span className="font-medium text-slate-600 dark:text-slate-300">{b.clientName}</span>
                       <span>•</span>
                       <span>{formatDate(b.date)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                    {formatMoney(b.totalClientPayment)}
                  </p>
                  <p className="text-xs text-slate-400">Total Value</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. NEW BOOKING MODAL (Same logic, polished UI) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-md relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
               <Briefcase className="text-blue-600" /> New Trip
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trip Name</label>
                <input
                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Dubai Family Trip"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name</label>
                <input
                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Deal Value</label>
                <input
                    type="number"
                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="₹ 0.00"
                    value={formData.totalClientPayment}
                    onChange={(e) => setFormData({ ...formData, totalClientPayment: e.target.value })}
                    required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Booking Date</label>
                <input
                    type="date"
                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                />
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 mt-2 transition-transform active:scale-95">
                Create Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}