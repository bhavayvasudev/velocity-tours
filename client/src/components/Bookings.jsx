import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  User,
  X,
  Filter,
  Download,
  ChevronDown,
  FileSpreadsheet
} from "lucide-react";
import * as XLSX from "xlsx";

// SAME-ORIGIN API (BEST PRACTICE)
const API_URL = "";

export default function Bookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // FILTER STATES
  const [filterType, setFilterType] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  // FORM STATES
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    totalClientPayment: "",
    date: new Date().toISOString().split("T")[0]
  });

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [resBookings, resExpenses] = await Promise.all([
          fetch("/api/bookings", { headers }),
          fetch("/api/expenses", { headers })
        ]);

        if (resBookings.ok && resExpenses.ok) {
          setBookings(await resBookings.json());
          setExpenses(await resExpenses.json());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
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

    if (!formData.name || !formData.clientName || !formData.totalClientPayment) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          clientName: formData.clientName,
          totalClientPayment: Number(formData.totalClientPayment),
          date: formData.date,
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
      } else {
        alert(data.message || "Failed to create booking");
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  };

  // =========================
  // FILTERING ENGINE
  // =========================
  const getFilteredBookings = () => {
    if (filterType === "all") return bookings;

    return bookings.filter((b) => {
      const date = new Date(b.date);
      const month = date.getMonth();
      const year = date.getFullYear();

      if (filterType === "monthly") {
        return month === Number(selectedMonth) && year === Number(selectedYear);
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
  // EXPORT HELPERS
  // =========================
  const getNetProfit = (bookingId, totalRevenue) => {
    const bookingExpenses = expenses.filter((e) => e.bookingId === bookingId);
    const totalCost = bookingExpenses.reduce((sum, e) => sum + e.amount, 0);
    return totalRevenue - totalCost;
  };

  const getDynamicFileName = (prefix) => {
    let suffix = "All_Time";
    if (filterType === "monthly") {
      const monthName = new Date(0, selectedMonth).toLocaleString("default", {
        month: "short"
      });
      suffix = `${monthName}_${selectedYear}`;
    } else if (filterType === "quarterly") {
      suffix = `${selectedQuarter}_${selectedYear}`;
    } else if (filterType === "yearly") {
      suffix = `FY_${selectedYear}-${Number(selectedYear) + 1}`;
    }
    return `${prefix}_${suffix}.xlsx`;
  };

  const exportServiceTax = () => {
    const header = [
      ["S. No", "Client Name", "Total Income", "Amount (PAT)", "SGST", "CGST"]
    ];

    const dataRows = filteredList.map((b, index) => {
      const netProfit = getNetProfit(b._id, b.totalClientPayment);
      const pat = netProfit / 1.18;
      return [
        index + 1,
        b.clientName,
        b.totalClientPayment,
        pat.toFixed(2),
        (pat * 0.09).toFixed(2),
        (pat * 0.09).toFixed(2)
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([...header, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Service Tax");
    XLSX.writeFile(wb, getDynamicFileName("Service_Tax"));
    setShowExportMenu(false);
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="p-4 md:p-8" onClick={() => setShowExportMenu(false)}>
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold dark:text-white">Bookings</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex gap-2"
        >
          <Plus /> New
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredList.map((booking) => (
          <div
            key={booking._id}
            onClick={() => navigate(`/bookings/${booking._id}`)}
            className="flex justify-between items-center p-5 border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer"
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
        ))}
      </div>

      {/* NEW BOOKING MODAL (UNCHANGED UI) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-md">
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
                className="w-full p-3 rounded-lg"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <input
                placeholder="Client Name"
                className="w-full p-3 rounded-lg"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Amount"
                className="w-full p-3 rounded-lg"
                value={formData.totalClientPayment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalClientPayment: e.target.value
                  })
                }
              />
              <input
                type="date"
                className="w-full p-3 rounded-lg"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
              <button className="w-full bg-blue-600 text-white py-3 rounded-xl">
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
