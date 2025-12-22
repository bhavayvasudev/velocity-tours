import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Filter, X, Search, Briefcase, Download, ChevronDown, FileText, CreditCard, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

// ✅ LIVE BACKEND URL
const API_URL = "https://velocity-tours.vercel.app";

export default function Bookings() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

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

  // Tax Calculation (Inclusive 18%)
  const calculateTaxComponents = (amount) => {
    const base = Math.round(amount / 1.18);
    const totalTax = amount - base;
    return {
      base,
      tax: totalTax,
      cgst: totalTax / 2,
      sgst: totalTax / 2
    };
  };

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 5; i++) {
    yearOptions.push(i);
  }

  /* ================= EFFECTS ================= */
  // Fetch Bookings
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

  // Close Export Menu on Click Outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= EXPORT LOGIC ================= */

  // 1. PAYMENT REPORT
  const handleExportPayment = () => {
    const dataToExport = filteredBookings.map((b, index) => ({
      "S. No": index + 1,
      "Client Name": b.clientName,
      "Amount (To Be Taken From Client)": b.totalClientPayment,
      "Date of Receiving": new Date(b.date).toLocaleDateString("en-IN")
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Auto-width columns
    const wscols = [
      { wch: 8 },  // S. No
      { wch: 25 }, // Client Name
      { wch: 30 }, // Amount
      { wch: 20 }  // Date
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Report");
    XLSX.writeFile(workbook, "Payment_Report.xlsx");
    setShowExportMenu(false);
  };

  // 2. SERVICE TAX REPORT
  const handleExportServiceTax = async () => {
    setIsExporting(true);
    const token = localStorage.getItem("token");

    try {
      // Fetch expenses for ALL filtered bookings to calculate profit/vendor tax
      const enrichedBookings = await Promise.all(
        filteredBookings.map(async (b) => {
          let totalVendorCost = 0;
          try {
            // Fetch expenses for this specific booking
            const res = await fetch(`${API_URL}/api/expenses/booking/${b._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const expenses = await res.json();
              totalVendorCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            }
          } catch (e) {
            console.error("Failed to fetch expenses for export", e);
          }

          const netProfit = b.totalClientPayment - totalVendorCost;
          const clientTax = calculateTaxComponents(b.totalClientPayment);
          const vendorTax = calculateTaxComponents(totalVendorCost);

          return {
            income: b.totalClientPayment,
            profit: netProfit,
            clientSGST: clientTax.sgst,
            clientCGST: clientTax.cgst,
            vendorCGST: vendorTax.cgst,
            vendorSGST: vendorTax.sgst,
            vendorIGST: 0
          };
        })
      );

      // Construct Array of Arrays for grouped headers
      const ws_data = [
        // Main Header Row
        ["Total Income", "Amount (Profit)", "Client Output", "", "Vendor Output", "", ""],
        // Sub Header Row
        ["", "", "SGST", "CGST", "CGST", "SGST", "IGST"],
        // Data Rows
        ...enrichedBookings.map(d => [
          d.income,
          d.profit,
          d.clientSGST,
          d.clientCGST,
          d.vendorCGST,
          d.vendorSGST,
          d.vendorIGST
        ])
      ];

      // Create Sheet
      const worksheet = XLSX.utils.aoa_to_sheet(ws_data);

      // Merge Cells for Headers
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Merge Total Income (A1:A2)
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Merge Profit (B1:B2)
        { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // Merge Client Output (C1:D1)
        { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } }, // Merge Vendor Output (E1:G1)
      ];

      // Formatting Columns
      const wscols = [
        { wch: 15 }, // Income
        { wch: 15 }, // Profit
        { wch: 10 }, // C-SGST
        { wch: 10 }, // C-CGST
        { wch: 10 }, // V-CGST
        { wch: 10 }, // V-SGST
        { wch: 10 }  // V-IGST
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Service Tax Report");
      XLSX.writeFile(workbook, "Service_Tax_Report.xlsx");

    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

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

        <div className="flex gap-2">
          {/* EXPORT DROPDOWN */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              {isExporting ? <Loader2 className="animate-spin" size={20}/> : <Download size={20} />}
              Export
              <ChevronDown size={16} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handleExportServiceTax}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
                >
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded text-blue-600 dark:text-blue-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="font-semibold">Service Tax Report</p>
                    <p className="text-xs text-slate-400">Profit & GST Data</p>
                  </div>
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 mx-4"></div>
                <button
                  onClick={handleExportPayment}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
                >
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded text-emerald-600 dark:text-emerald-400">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <p className="font-semibold">Payment Report</p>
                    <p className="text-xs text-slate-400">Client Payments</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus size={20} /> New Trip
          </button>
        </div>
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

      {/* 4. NEW BOOKING MODAL */}
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