import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Filter, X } from "lucide-react";

// ✅ FIX: Use the Full Backend URL (Same as your Login)
const API_URL = "https://velocity-tours.vercel.app";

export default function Bookings() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);

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

  /* ================= YEAR OPTIONS ================= */
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
        // ✅ FIX: Use API_URL here
        const res = await fetch(`${API_URL}/api/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("Failed to fetch bookings");
          return;
        }

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
      // ✅ FIX: Use API_URL here too
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

      if (!res.ok) {
        alert("Failed to create booking");
        return;
      }

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
      // Adjust year for Q4 (Jan-Mar is in the next calendar year)
      const fy = selectedQuarter === "Q4" && m <= 2 ? selectedYear + 1 : selectedYear;
      
      // If Q4 is selected (Jan-Mar), we need to handle the year boundary carefully
      if (selectedQuarter === "Q4") {
         return (m >= 0 && m <= 2 && y === selectedYear + 1);
      }
      return m >= start && m <= end && y === fy;
    }

    return true;
  });

  /* ================= RENDER ================= */
  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Bookings
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage client trips & payments
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold"
        >
          <Plus size={18} /> New
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
          <Filter size={18} /> Filters
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:text-white"
        >
          <option value="all">All Time</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Financial Year</option>
        </select>

        {filterType !== "all" && (
          <>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:text-white"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {filterType === "monthly" ? y : `FY ${y}-${y + 1}`}
                </option>
              ))}
            </select>

            {filterType === "monthly" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:text-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            )}

            {filterType === "quarterly" && (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:text-white"
              >
                <option value="Q1">Q1 (Apr–Jun)</option>
                <option value="Q2">Q2 (Jul–Sep)</option>
                <option value="Q3">Q3 (Oct–Dec)</option>
                <option value="Q4">Q4 (Jan–Mar)</option>
              </select>
            )}
          </>
        )}
      </div>

      {/* BOOKINGS LIST */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        {filteredBookings.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No bookings found
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div
              key={b._id}
              onClick={() => navigate(`/bookings/${b._id}`)}
              className="flex justify-between items-center p-5 border-b last:border-b-0 hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    {b.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {b.clientName}
                  </p>
                </div>
              </div>

              <div className="font-bold text-slate-800 dark:text-white">
                ₹{b.totalClientPayment.toLocaleString("en-IN")}
              </div>
            </div>
          ))
        )}
      </div>

      {/* NEW BOOKING MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-md relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold mb-6 dark:text-white">
              New Trip
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full p-3 border rounded dark:bg-slate-900 dark:text-white"
                placeholder="Trip Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <input
                className="w-full p-3 border rounded dark:bg-slate-900 dark:text-white"
                placeholder="Client Name"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                required
              />

              <input
                type="number"
                className="w-full p-3 border rounded dark:bg-slate-900 dark:text-white"
                placeholder="Amount"
                value={formData.totalClientPayment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalClientPayment: e.target.value,
                  })
                }
                required
              />

              <input
                type="date"
                className="w-full p-3 border rounded dark:bg-slate-900 dark:text-white"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}