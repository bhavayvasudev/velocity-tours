import { useState, useEffect } from "react";
import { Plus, Calendar, User, X, Filter, Download, ChevronDown, FileSpreadsheet } from "lucide-react";
import BookingDetails from "./BookingDetails";
import * as XLSX from "xlsx";

// 👇 REPLACE THIS WITH YOUR EXACT VERCEL URL
// (I took this from your screenshot, but verify it matches your browser bar)
const API_URL = "https://velocity-tours-fsjn-bznnc6ajn-bhavay-vasudevs-projects.vercel.app/api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]); 
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // --- FILTER STATES ---
  const [filterType, setFilterType] = useState("monthly"); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  // --- FORM STATES ---
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    totalClientPayment: "",
    date: new Date().toISOString().split('T')[0]
  });

 // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const headers = { "Authorization": `Bearer ${token}` };

        // ✅ FIXED: Using API_URL variable
        const [resBookings, resExpenses] = await Promise.all([
          fetch(`${API_URL}/bookings`, { headers }),
          fetch(`${API_URL}/expenses`, { headers })
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

  // 2. Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!formData.name || !formData.clientName || !formData.totalClientPayment) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // ✅ FIXED: Using API_URL variable
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          clientName: formData.clientName,
          totalClientPayment: Number(formData.totalClientPayment),
          date: formData.date,
          // ✅ ADDED: Explicitly sending these to prevent schema errors
          clientPaidAmount: 0, 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBookings([data, ...bookings]); // Add new booking to list immediately
        setShowForm(false);
        // Reset form
        setFormData({ 
            name: "", 
            clientName: "", 
            totalClientPayment: "", 
            date: new Date().toISOString().split('T')[0] 
        });
      } else {
        console.error("Server Error:", data);
        alert(`Error: ${data.message || "Failed to save"}`);
      }
    } catch (err) {
      console.error("Network Error:", err);
      alert("Network Error: Check your internet or server URL.");
    }
  };

  // --- FILTERING ENGINE ---
  const getFilteredBookings = () => {
    if (filterType === "all") return bookings;

    return bookings.filter((b) => {
      const date = new Date(b.date);
      const month = date.getMonth(); 
      const year = date.getFullYear();

      if (filterType === "monthly") {
        return month === parseInt(selectedMonth) && year === parseInt(selectedYear);
      }
      if (filterType === "yearly") {
        const fyStart = new Date(selectedYear, 3, 1); 
        const fyEnd = new Date(parseInt(selectedYear) + 1, 2, 31); 
        return date >= fyStart && date <= fyEnd;
      }
      if (filterType === "quarterly") {
        let qStart, qEnd;
        if (selectedQuarter === "Q1") { qStart = new Date(selectedYear, 3, 1); qEnd = new Date(selectedYear, 5, 30); } 
        else if (selectedQuarter === "Q2") { qStart = new Date(selectedYear, 6, 1); qEnd = new Date(selectedYear, 8, 30); } 
        else if (selectedQuarter === "Q3") { qStart = new Date(selectedYear, 9, 1); qEnd = new Date(selectedYear, 11, 31); } 
        else if (selectedQuarter === "Q4") { qStart = new Date(parseInt(selectedYear) + 1, 0, 1); qEnd = new Date(parseInt(selectedYear) + 1, 2, 31); }
        return date >= qStart && date <= qEnd;
      }
      return true;
    });
  };

  const filteredList = getFilteredBookings();

  // --- HELPER: GET NET PROFIT ---
  const getNetProfit = (bookingId, totalRevenue) => {
    const bookingExpenses = expenses.filter(e => e.bookingId === bookingId);
    const totalCost = bookingExpenses.reduce((sum, e) => sum + e.amount, 0);
    return totalRevenue - totalCost;
  };

  // --- HELPER: DYNAMIC FILE NAME ---
  const getDynamicFileName = (prefix) => {
    let suffix = "All_Time";
    if (filterType === 'monthly') {
      const monthName = new Date(0, selectedMonth).toLocaleString('default', { month: 'short' });
      suffix = `${monthName}_${selectedYear}`;
    } else if (filterType === 'quarterly') {
      suffix = `${selectedQuarter}_${selectedYear}`;
    } else if (filterType === 'yearly') {
      suffix = `FY_${selectedYear}-${parseInt(selectedYear) + 1}`;
    }
    return `${prefix}_${suffix}.xlsx`;
  };

  // ==========================================
  // EXPORT 1: SERVICE TAX REPORT
  // ==========================================
  const exportServiceTax = () => {
    const header = [
      ["S. No", "Client Name", "Total Income", "Amount (PAT)", "Client Output", "", "Vendor Output", "", ""],
      ["", "", "", "", "SGST", "CGST", "CGST", "SGST", "IGST"]
    ];

    const dataRows = filteredList.map((b, index) => {
      const netProfit = getNetProfit(b._id, b.totalClientPayment);
      const pat = netProfit / 1.18; 
      const clientSGST = pat * 0.09;
      const clientCGST = pat * 0.09;

      return [
        index + 1, b.clientName, b.totalClientPayment, pat.toFixed(2),
        clientSGST.toFixed(2), clientCGST.toFixed(2), 0, 0, 0
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([...header, ...dataRows]);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, 
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, 
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, 
      { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, 
      { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, 
      { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } }, 
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Service Tax");
    XLSX.writeFile(wb, getDynamicFileName("Service_Tax"));
    setShowExportMenu(false);
  };

  // ==========================================
  // EXPORT 2: PAYMENT REPORT
  // ==========================================
  const exportPaymentReport = () => {
    const header = [["S. No", "Client Name", "Amount (To Be Taken From Client)", "Trip Date", "Date of Receiving"]];
    const dataRows = filteredList.map((b, index) => [
      index + 1, b.clientName, b.totalClientPayment - (b.clientPaidAmount || 0), new Date(b.date).toLocaleDateString('en-IN'), ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...header, ...dataRows]);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, getDynamicFileName("Payment_Report"));
    setShowExportMenu(false);
  };

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= 2050; i++) {
    yearOptions.push(i);
  }

  // --- RENDER ---
  if (selectedBookingId) {
    return <BookingDetails bookingId={selectedBookingId} onBack={() => setSelectedBookingId(null)} />;
  }

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500" onClick={() => setShowExportMenu(false)}>
      
      {/* HEADER & BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Bookings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage client trips & payments</p>
        </div>
        <div className="flex gap-3 relative">
          
          {/* EXPORT DROPDOWN */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-green-700 transition-all shadow-sm"
            >
              <Download size={20} /> Export <ChevronDown size={16} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                <button onClick={exportServiceTax} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-200">
                  <FileSpreadsheet size={18} className="text-green-600" /> Service Tax Report
                </button>
                <div className="border-t border-slate-100 dark:border-slate-700"></div>
                <button onClick={exportPaymentReport} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-200">
                  <FileSpreadsheet size={18} className="text-blue-600" /> Payment Report
                </button>
              </div>
            )}
          </div>
          
          {/* NEW BOOKING BUTTON */}
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm">
            <Plus size={20} /> New
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl mb-6 flex flex-wrap gap-4 items-center border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mr-2"><Filter size={18} /> Filters:</div>
        <select className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Time</option><option value="monthly">Monthly View</option><option value="quarterly">Quarterly</option><option value="yearly">Financial Year</option>
        </select>
        {filterType !== "all" && (
          <>
            <select className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {yearOptions.map(yr => ( <option key={yr} value={yr}>{filterType === "monthly" ? yr : `FY ${yr}-${yr + 1}`}</option> ))}
            </select>
            {filterType === "quarterly" && (
              <select className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                <option value="Q1">Q1 (Apr - Jun)</option><option value="Q2">Q2 (Jul - Sep)</option><option value="Q3">Q3 (Oct - Dec)</option><option value="Q4">Q4 (Jan - Mar)</option>
              </select>
            )}
            {filterType === "monthly" && (
              <select className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => ( <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option> ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* LIST */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No bookings found. {filterType !== 'all' && <button onClick={() => setFilterType('all')} className="text-blue-500 hover:underline ml-2">Clear filters</button>}</div>
        ) : (
          filteredList.map((booking) => (
            <div key={booking._id} onClick={() => setSelectedBookingId(booking._id)} className="flex items-center justify-between p-5 border-b border-slate-50 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">{booking.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <User size={12} /> {booking.clientName}
                    <span className="mx-1">•</span>
                    <span>{new Date(booking.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800 dark:text-white">₹{booking.totalClientPayment.toLocaleString('en-IN')}</div>
                <span className="text-xs text-slate-400">Click details</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL (FIXED) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
             <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">New Trip</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trip Name</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client Name</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Amount (₹)</label><input type="number" className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white" value={formData.totalClientPayment} onChange={(e) => setFormData({...formData, totalClientPayment: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label><input type="date" className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required /></div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}