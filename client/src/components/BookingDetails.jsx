import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Plus,
  Edit2,
  Save,
  X,
  Trash2,
  Wallet,
  TrendingUp,
  Banknote,
  Calendar,
  Plane,
  FileText,
  CreditCard
} from "lucide-react";

// ✅ LIVE BACKEND URL
const API_URL = "https://velocity-tours.vercel.app";

export default function BookingDetails() {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [expenses, setExpenses] = useState([]);

  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Forms
  const [editBookingData, setEditBookingData] = useState({});
  const [newExpenseData, setNewExpenseData] = useState({
    vendorName: "",
    amount: "",
    paidAmount: ""
  });
  const [editExpenseData, setEditExpenseData] = useState({});

  /* ================= HELPERS ================= */
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  };

  // 🎨 SMART ICON LOGIC
  const getCategoryIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("air") || lower.includes("flight") || lower.includes("ticket") || lower.includes("indigo") || lower.includes("vistara")) {
      return <Plane size={18} className="text-blue-600" />;
    }
    if (lower.includes("hotel") || lower.includes("room") || lower.includes("stay") || lower.includes("resort") || lower.includes("bnb")) {
      return <Building2 size={18} className="text-orange-600" />;
    }
    if (lower.includes("visa") || lower.includes("insurance") || lower.includes("tax") || lower.includes("fee")) {
      return <FileText size={18} className="text-purple-600" />;
    }
    return <Wallet size={18} className="text-slate-500" />;
  };

  const getCategoryColor = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("air") || lower.includes("flight")) return "bg-blue-100 dark:bg-blue-900/30";
    if (lower.includes("hotel") || lower.includes("resort")) return "bg-orange-100 dark:bg-orange-900/30";
    if (lower.includes("visa") || lower.includes("tax")) return "bg-purple-100 dark:bg-purple-900/30";
    return "bg-slate-100 dark:bg-slate-800";
  };

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !bookingId) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [resBooking, resExpenses] = await Promise.all([
        fetch(`${API_URL}/api/bookings/${bookingId}`, { headers }),
        fetch(`${API_URL}/api/expenses/booking/${bookingId}`, { headers })
      ]);

      if (!resBooking.ok || !resExpenses.ok) return;

      const bookingData = await resBooking.json();
      setBooking(bookingData);
      setExpenses(await resExpenses.json());
      setEditBookingData(bookingData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bookingId]);

  /* ================= HANDLERS ================= */
  const handleUpdateBooking = async () => {
    await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(editBookingData)
    });
    setIsEditingBooking(false);
    fetchData();
  };

  const handleUpdateExpense = async (expenseId) => {
    await fetch(`${API_URL}/api/expenses/${expenseId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(editExpenseData)
    });
    setEditingExpenseId(null);
    fetchData();
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/expenses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        bookingId,
        vendorName: newExpenseData.vendorName,
        amount: Number(newExpenseData.amount),
        paidAmount: Number(newExpenseData.paidAmount || 0),
        date: new Date()
      })
    });
    setShowExpenseForm(false);
    setNewExpenseData({ vendorName: "", amount: "", paidAmount: "" });
    fetchData();
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Delete this expense?")) return;
    await fetch(`${API_URL}/api/expenses/${expenseId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    fetchData();
  };

  const handleDeleteBooking = async () => {
    if (!window.confirm("Delete this booking permanently?")) return;
    await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    navigate("/bookings");
  };

  /* ================= CALCULATIONS ================= */
  if (!booking) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  // 1. Client Stats
  const clientPending = booking.totalClientPayment - booking.clientPaidAmount;
  const clientProgress = booking.totalClientPayment > 0 
    ? (booking.clientPaidAmount / booking.totalClientPayment) * 100 
    : 0;

  // 2. Vendor Stats
  const totalVendorCost = expenses.reduce((s, e) => s + e.amount, 0);
  const totalVendorPaid = expenses.reduce((s, e) => s + e.paidAmount, 0);
  const totalVendorPending = totalVendorCost - totalVendorPaid;
  const vendorProgress = totalVendorCost > 0
    ? (totalVendorPaid / totalVendorCost) * 100
    : 0;

  // 3. Profit & Tax (Inclusive 18% GST)
  const netProfit = booking.totalClientPayment - totalVendorCost;
  // Formula: Amount / 1.18 = Base Amount
  const profitAfterTax = Math.round(netProfit / 1.18); 
  const totalTax = netProfit - profitAfterTax;
  
  // Split 18% into 9% + 9%
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  /* ================= RENDER ================= */
  return (
    <div className="p-6 md:p-10 pb-32 max-w-7xl mx-auto space-y-6">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/bookings")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              {isEditingBooking ? (
                <input 
                  className="bg-transparent border-b-2 border-blue-500 focus:outline-none"
                  value={editBookingData.name}
                  onChange={(e) => setEditBookingData({...editBookingData, name: e.target.value})}
                />
              ) : booking.name}
              
              {!isEditingBooking && (
                <button onClick={() => setIsEditingBooking(true)} className="text-slate-400 hover:text-blue-600">
                  <Edit2 size={18} />
                </button>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
              <Calendar size={14} /> 
              {new Date(booking.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
              <span className="mx-1">•</span>
              {booking.clientName}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditingBooking ? (
            <button onClick={handleUpdateBooking} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Save size={18} /> Save
            </button>
          ) : (
            <button onClick={handleDeleteBooking} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2 transition">
              <Trash2 size={18} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: FINANCIALS */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* A. REVENUE CARD + PROGRESS BAR */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-500 font-medium flex items-center gap-2">
                <Banknote size={18} /> Revenue & Client Payment
              </h3>
              <span className={`text-xs font-bold px-2 py-1 rounded ${clientProgress >= 100 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                {Math.round(clientProgress)}% Received
              </span>
            </div>

            {/* 🟢 PROGRESS BAR */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-6 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${clientProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(clientProgress, 100)}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-600">
                 <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total Deal Value</p>
                 <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{formatMoney(booking.totalClientPayment)}</p>
               </div>
               
               <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                 <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">Received</p>
                 {isEditingBooking ? (
                   <input 
                     type="number"
                     className="w-full mt-1 bg-white p-1 rounded border"
                     value={editBookingData.clientPaidAmount}
                     onChange={(e) => setEditBookingData({...editBookingData, clientPaidAmount: Number(e.target.value)})}
                   />
                 ) : (
                   <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{formatMoney(booking.clientPaidAmount)}</p>
                 )}
               </div>

               <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                 <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase">Pending</p>
                 <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{formatMoney(clientPending)}</p>
               </div>
            </div>
          </div>

          {/* B. PROFITABILITY CARD (WITH GST BREAKDOWN) */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-slate-500 font-medium mb-4 flex items-center gap-2">
              <TrendingUp size={18} /> Profitability & Tax Breakdown
            </h3>

            <div className="grid grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-slate-400 text-sm">Net Profit (Gross)</p>
                <p className={`text-4xl font-bold mt-2 ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatMoney(netProfit)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Inclusive of 18% GST</p>
              </div>
              
              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                 <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-sm text-slate-500">Profit After Tax</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{formatMoney(profitAfterTax)}</span>
                 </div>
                 <div className="space-y-1 pt-1">
                   <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>CGST (9%)</span>
                      <span>{formatMoney(cgst)}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>SGST (9%)</span>
                      <span>{formatMoney(sgst)}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700 mt-1">
                      <span>Total Tax Paid</span>
                      <span>{formatMoney(totalTax)}</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EXPENSES */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-700">
               <div className="flex justify-between items-center mb-3">
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <CreditCard size={18} /> Expenses
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Total Cost: {formatMoney(totalVendorCost)}</p>
                 </div>
                 <button 
                   onClick={() => setShowExpenseForm(true)}
                   className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition"
                 >
                   <Plus size={18} />
                 </button>
               </div>
               
               {/* 🟠 VENDOR PROGRESS BAR */}
               <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-400 rounded-full" 
                    style={{ width: `${Math.min(vendorProgress, 100)}%` }}
                  ></div>
               </div>
               <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold">
                 <span>Paid: {formatMoney(totalVendorPaid)}</span>
                 <span className="text-orange-500">Due: {formatMoney(totalVendorPending)}</span>
               </div>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {expenses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No expenses added yet.</div>
              ) : (
                expenses.map((expense) => (
                  <div key={expense._id} className="group relative flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    
                    {/* 🎨 SMART ICON */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(expense.vendorName)}`}>
                      {getCategoryIcon(expense.vendorName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingExpenseId === expense._id ? (
                         <div className="space-y-2">
                            <input 
                              className="w-full p-2 border rounded text-sm"
                              placeholder="Vendor Name"
                              value={editExpenseData.vendorName}
                              onChange={(e) => setEditExpenseData({...editExpenseData, vendorName: e.target.value})}
                            />
                            <div className="flex gap-2">
                              <input 
                                type="number"
                                className="w-1/2 p-2 border rounded text-sm"
                                placeholder="Cost"
                                value={editExpenseData.amount}
                                onChange={(e) => setEditExpenseData({...editExpenseData, amount: Number(e.target.value)})}
                              />
                              <button onClick={() => handleUpdateExpense(expense._id)} className="bg-green-100 text-green-700 p-2 rounded"><Save size={14}/></button>
                              <button onClick={() => setEditingExpenseId(null)} className="bg-red-100 text-red-700 p-2 rounded"><X size={14}/></button>
                            </div>
                         </div>
                      ) : (
                        // VIEW MODE
                        <div className="flex justify-between items-center">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{expense.vendorName}</p>
                            <p className="text-xs text-slate-400">Paid: {formatMoney(expense.paidAmount)}</p>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm whitespace-nowrap">{formatMoney(expense.amount)}</p>
                        </div>
                      )}
                    </div>

                    {/* EDIT ACTIONS (Hover) */}
                    {!editingExpenseId && (
                      <div className="hidden group-hover:flex flex-col gap-1 absolute right-2 top-2 bg-white dark:bg-slate-800 shadow-md p-1 rounded-lg border z-10">
                         <button onClick={() => { setEditingExpenseId(expense._id); setEditExpenseData(expense); }} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                           <Edit2 size={12} />
                         </button>
                         <button onClick={() => handleDeleteExpense(expense._id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                           <Trash2 size={12} />
                         </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ADD EXPENSE MODAL */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
             <button onClick={() => setShowExpenseForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X /></button>
             
             <h3 className="text-xl font-bold mb-4 dark:text-white">Add Expense</h3>
             
             <form onSubmit={handleAddExpense} className="space-y-3">
               <div>
                 <label className="text-xs font-semibold text-slate-500 uppercase">Vendor / Type</label>
                 <input 
                   required
                   className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white"
                   placeholder="e.g. Indigo Flight, Taj Hotel, Visa Fee"
                   value={newExpenseData.vendorName}
                   onChange={(e) => setNewExpenseData({...newExpenseData, vendorName: e.target.value})}
                 />
                 <p className="text-[10px] text-slate-400 mt-1">Tip: Use keywords like "Flight", "Hotel", "Visa" for auto-icons.</p>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Total Cost</label>
                    <input 
                      required
                      type="number"
                      className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white"
                      placeholder="₹"
                      value={newExpenseData.amount}
                      onChange={(e) => setNewExpenseData({...newExpenseData, amount: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Paid So Far</label>
                    <input 
                      type="number"
                      className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white"
                      placeholder="₹"
                      value={newExpenseData.paidAmount}
                      onChange={(e) => setNewExpenseData({...newExpenseData, paidAmount: e.target.value})}
                    />
                 </div>
               </div>

               <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-2">
                 Add Expense
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}