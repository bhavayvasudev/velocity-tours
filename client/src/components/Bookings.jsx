import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  X,
  Filter
} from "lucide-react";
import * as XLSX from "xlsx";

// SAME ORIGIN API
const API_URL = "";

export default function Bookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // FILTER STATES
  const [filterType, setFilterType] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  // FORM STATE
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    totalClientPayment: "",
    date: new Date().toISOString().split("T")[0]
  });

  // YEAR OPTIONS (REQUIRED)
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= 2050; i++) {
    yearOptions.push(i);
  }

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [resBookings, resExpenses] = await Promise.all([
        fetch("/api/bookings", { headers }),
        fetch("/api/expenses", { headers })
      ]);

      if (resBookings.ok && resExpenses.ok) {
        setBookings(await resBookings.json());
        setExpenses(await resExpenses.json());
      }
    };

    fetchData();
  }, []);

  // =========================
  // CREATE BOOKING
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...formData,
        totalClientPayment: Number(formData.totalClientPayment),
        clientPaidAmount: 0
      })
    });

    const data = await res.json();
    if (res.ok) {
      setBookings([data, ...bookings]);
      setShowForm(false);
      setFormData({
        name: "",
        clientName: "",
        totalClientPayment: "",
        date: new Date().toISOString().split("T")[0]
      });
    }
  };

  // =========================
  // FILTER LOGIC
  // =========================
  const getFilteredBookings = () => {
    if (filterType === "all") return bookings;

    return bookings.filter((b) => {
      const date = new Date(b.date);
      const month = date.getMonth();
      const year = date.getFullYear();

      if (filterType === "monthly") {
        return month === selectedMonth && year === Number(selectedYear);
      }

      if (filterType === "yearly") {
        const fyStart = new Date(selectedYear, 3, 1);
        const fyEnd = new Date(Number(selectedYear) + 1, 2, 31);
        return date >= fyStart && date <= fyEnd;
      }

      if (filterType === "quarterly") {
        let qStart, qEnd;
        if (selectedQuarter === "Q1") {
          qStart = new Date(selectedYear, 3, 1);
          qEnd = new Date(selectedYear, 5, 30);
        } else if (selectedQuarter === "Q2") {
          qStart = new Date(selectedYear, 6, 1);
          qEnd = new Date(selectedYear, 8, 30);
        } else if (selectedQuarter === "Q3") {
          qStart = new Date(selectedYear, 9, 1);
          qEnd = new Date(selectedYear, 11, 31);
        } else {
          qStart = new Date(Number(selectedYear) + 1, 0, 1);
          qEnd = new Date(Number(selectedYear) + 1, 2, 31);
        }
        return date >= qStart && date <= qEnd;
      }

      return true;
    });
  };

  const filteredList = getFilteredBookings();

  // =========================
  // RENDER
  // =========================
  return (
    <div className="p-4 md:p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Bookings</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage client trips & payments
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex gap-2 items-center"
        >
          <Plus size={18} /> New
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl mb-6 flex flex-wrap gap-4 items-center border">
        <Filter size={18} />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 rounded-lg border dark:bg-slate-800"
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
              onChange={(e) => setSelectedYear(e.target.value)}
              className="p-2 rounded-lg border dark:bg-slate-800"
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {filterType === "monthly" ? yr : `FY ${yr}-${yr + 1}`}
                </option>
              ))}
            </select>

            {filterType === "quarterly" && (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="p-2 rounded-lg border dark:bg-slate-800"
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            )}

            {filterType === "monthly" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2 rounded-lg border dark:bg-slate-800"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long"
                    })}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* BOOKINGS LIST */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No bookings found
          </div>
        ) : (
          filteredList.map((booking) => (
            <div
              key={booking._id}
              onClick={() => navigate(`/bookings/${booking._id}`)}
              className="flex justify-between items-center p-5 border-b hover:bg-blue-50 cursor-pointer"
            >
              <div className="flex gap-4 items-center">
                <Calendar />
                <div>
                  <h3 className="font-bold dark:text-white">
                    {booking.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {booking.clientName}
                  </p>
                </div>
              </div>

              <div className="font-bold dark:text-white">
                ₹{booking.totalClientPayment.toLocaleString("en-IN")}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-md relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold mb-6 dark:text-white">
              New Trip
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                placeholder="Trip Name"
                className="w-full p-3 border rounded"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <input
                placeholder="Client Name"
                className="w-full p-3 border rounded"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                required
              />

              <input
                type="number"
                placeholder="Amount"
                className="w-full p-3 border rounded"
                value={formData.totalClientPayment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalClientPayment: e.target.value
                  })
                }
                required
              />

              <input
                type="date"
                className="w-full p-3 border rounded"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />

              <button className="w-full bg-blue-600 text-white py-3 rounded">
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
