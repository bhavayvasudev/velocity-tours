import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Plus,
  Edit2,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Trash2,
  Calculator,
  Wallet,
  TrendingUp,
  Banknote,
  Calendar
} from "lucide-react";

// ✅ FIX: USE LIVE BACKEND URL
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

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !bookingId) return;

      const headers = { Authorization: `Bearer ${token}` };

      // ✅ FIX: Use API_URL
      const [resBooking, resExpenses] = await Promise.all([
        fetch(`${API_URL}/api/bookings/${bookingId}`, { headers }),
        fetch(`${API_URL}/api/expenses/booking/${bookingId}`, { headers })
      ]);

      if (!resBooking.ok || !resExpenses.ok) {
        console.error("Failed to fetch booking data");
        return;
      }

      const bookingData = await resBooking.json();
      setBooking(bookingData);
      setExpenses(await resExpenses.json());
      
      // Prep edit form
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

  const clientPending = booking.totalClientPayment - booking.clientPaidAmount;
  const totalVendorCost = expenses.reduce((s, e) => s + e.amount, 0);
  const totalVendorPaid = expenses.reduce((s, e) => s + e.paidAmount, 0);
  const netProfit = booking.totalClientPayment - totalVendorCost;
  
  // Tax Logic
  const profitAfterTaxRaw = netProfit / 1.18;
  const profitAfterTax = Math.round(profitAfterTaxRaw);
  const taxAmount = netProfit - profitAfterTax;

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
          
          {/* A. REVENUE CARD */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-slate-500 font-medium mb-4 flex items-center gap-2">
              <Banknote size={18} /> Revenue Breakdown
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                 <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">Total Deal Value</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{formatMoney(booking.totalClientPayment)}</p>
               </div>
               
               <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                 <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">Payment Received</p>
                 {isEditingBooking ? (
                   <input 
                     type="number"
                     className="w-full mt-1 bg-white p-1 rounded border"
                     value={editBookingData.clientPaidAmount}
                     onChange={(e) => setEditBookingData({...editBookingData, clientPaidAmount: Number(e.target.value)})}
                   />
                 ) : (
                   <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{formatMoney(booking.clientPaidAmount)}</p>
                 )}
               </div>

               <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                 <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase">Pending Balance</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{formatMoney(clientPending)}</p>
               </div>
            </div>
          </div>

          {/* B. PROFITABILITY CARD */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-slate-500 font-medium mb-4 flex items-center gap-2">
              <TrendingUp size={18} /> Profitability Analysis
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm">Net Profit (Gross)</p>
                <p className={`text-3xl font-bold mt-1 ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatMoney(netProfit)}
                </p>
              </div>
              
              <div>
                <p className="text-slate-400 text-sm">Profit After Tax (Excl. GST)</p>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatMoney(profitAfterTax)}</p>
                   <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">
                     Tax: {formatMoney(taxAmount)}
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EXPENSES */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <Wallet size={18} /> Expenses
                 </h3>
                 <p className="text-xs text-slate-400">Total: {formatMoney(totalVendorCost)}</p>
              </div>
              <button 
                onClick={() => setShowExpenseForm(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {expenses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No expenses added yet.</div>
              ) : (
                expenses.map((expense) => (
                  <div key={expense._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group relative">
                    {/* EDIT MODE */}
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
                      <>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{expense.vendorName}</p>
                            <p className="text-xs text-slate-400">Paid: {formatMoney(expense.paidAmount)}</p>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-white">{formatMoney(expense.amount)}</p>
                        </div>
                        
                        {/* ACTIONS (Visible on Hover) */}
                        <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg border">
                           <button 
                             onClick={() => {
                               setEditingExpenseId(expense._id);
                               setEditExpenseData(expense);
                             }}
                             className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                           >
                             <Edit2 size={12} />
                           </button>
                           <button 
                             onClick={() => handleDeleteExpense(expense._id)}
                             className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                           >
                             <Trash2 size={12} />
                           </button>
                        </div>
                      </>
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
                 <label className="text-xs font-semibold text-slate-500 uppercase">Vendor</label>
                 <input 
                   required
                   className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white"
                   placeholder="e.g. Indigo Airlines"
                   value={newExpenseData.vendorName}
                   onChange={(e) => setNewExpenseData({...newExpenseData, vendorName: e.target.value})}
                 />
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