import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Plus, Edit2, CheckCircle, AlertCircle, Save, X, Trash2, Calculator } from "lucide-react";

export default function BookingDetails({ bookingId, onBack }) {
  const [booking, setBooking] = useState(null);
  const [expenses, setExpenses] = useState([]);
  
  // Edit States
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  
  // Form Data
  const [editBookingData, setEditBookingData] = useState({});
  const [newExpenseData, setNewExpenseData] = useState({ vendorName: "", amount: "", paidAmount: "" });
  const [editExpenseData, setEditExpenseData] = useState({});

  // --- HELPER: GET AUTH HEADERS ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` // <--- THE KEY
    };
  };

  // 1. Fetch Data
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = { "Authorization": `Bearer ${token}` };

      const [resBooking, resExpenses] = await Promise.all([
        fetch(`http://localhost:5000/api/bookings/${bookingId}`, { headers }),
        fetch(`http://localhost:5000/api/expenses/booking/${bookingId}`, { headers })
      ]);

      if (resBooking.ok && resExpenses.ok) {
        setBooking(await resBooking.json());
        setExpenses(await resExpenses.json());
      } else {
        console.error("Failed to fetch details.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [bookingId]);

  // 2. Handle Booking Update
  const handleUpdateBooking = async () => {
    await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(editBookingData),
    });
    setIsEditingBooking(false);
    fetchData();
  };

  // 3. Handle Expense Update
  const handleUpdateExpense = async (expenseId) => {
    await fetch(`http://localhost:5000/api/expenses/${expenseId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(editExpenseData),
    });
    setEditingExpenseId(null);
    fetchData();
  };

  // 4. Handle Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:5000/api/expenses", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        bookingId,
        vendorName: newExpenseData.vendorName,
        amount: Number(newExpenseData.amount),
        paidAmount: Number(newExpenseData.paidAmount || 0),
        date: new Date()
      }),
    });
    setShowExpenseForm(false);
    setNewExpenseData({ vendorName: "", amount: "", paidAmount: "" });
    fetchData();
  };

  // 5. Handle Delete Expense
  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm("Delete this expense record?")) {
      await fetch(`http://localhost:5000/api/expenses/${expenseId}`, { 
        method: "DELETE",
        headers: getAuthHeaders()
      });
      fetchData();
    }
  };

  // 6. Handle Delete Booking
  const handleDeleteBooking = async () => {
    if (window.confirm("Are you sure you want to delete this booking? This cannot be undone.")) {
      await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      onBack(); 
    }
  };

  if (!booking) return <div className="p-10 dark:text-white">Loading details...</div>;

  // --- MATH LOGIC ---
  const clientPending = booking.totalClientPayment - booking.clientPaidAmount;
  const totalVendorCost = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVendorPaid = expenses.reduce((sum, e) => sum + e.paidAmount, 0);
  const totalVendorPending = totalVendorCost - totalVendorPaid;
  
  // Profit Calculations
  const netProfit = booking.totalClientPayment - totalVendorCost;
  
  // Tax Calculations & Rounding
  const profitAfterTaxRaw = netProfit / 1.18; 
  const profitAfterTaxDisplay = Math.round(profitAfterTaxRaw); 

  const cgstRaw = profitAfterTaxRaw * 0.09;
  const sgstRaw = profitAfterTaxRaw * 0.09;

  const cgstDisplay = Number(cgstRaw.toFixed(2));
  const sgstDisplay = Number(sgstRaw.toFixed(2));

  const totalCalculated = profitAfterTaxDisplay + cgstDisplay + sgstDisplay;
  const roundOff = netProfit - totalCalculated;

  const inputClass = "p-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-32 animate-in fade-in duration-300">
      {/* Top Bar: Back and Delete */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back
        </button>
        <button 
          onClick={handleDeleteBooking}
          className="flex items-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors font-medium"
        >
          <Trash2 size={18} className="mr-2" /> Delete Booking
        </button>
      </div>

      {/* --- SECTION 1: BOOKING & CLIENT PAYMENT --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8 relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          {isEditingBooking ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Trip Name</label>
                <input 
                  className={`${inputClass} font-bold text-xl w-full`} 
                  value={editBookingData.name || booking.name} 
                  onChange={e => setEditBookingData({...editBookingData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Client Name</label>
                <input 
                  className={`${inputClass} w-full`} 
                  value={editBookingData.clientName || booking.clientName} 
                  onChange={e => setEditBookingData({...editBookingData, clientName: e.target.value})}
                />
              </div>
              <div>
                 <label className="text-xs text-slate-400 block mb-1">Trip Date</label>
                 <input 
                    type="date" 
                    className={`${inputClass} w-full`} 
                    value={editBookingData.date ? new Date(editBookingData.date).toISOString().split('T')[0] : ""} 
                    onChange={e => setEditBookingData({...editBookingData, date: e.target.value})} 
                 />
              </div>

              <div className="flex gap-2 items-end">
                <button onClick={handleUpdateBooking} className="bg-green-600 text-white px-4 py-2 rounded-lg flex gap-2 h-10 items-center"><Save size={18}/> Save</button>
                <button onClick={() => setIsEditingBooking(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg h-10 flex items-center"><X size={18}/></button>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{booking.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-slate-500 dark:text-slate-400 text-lg">{booking.clientName}</p>
                   <span className="text-slate-300 mx-2">•</span>
                   <p className="text-slate-500 dark:text-slate-400 text-sm">{new Date(booking.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsEditingBooking(true); setEditBookingData(booking); }}
                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg h-fit"
              >
                <Edit2 size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Client Payment Status Bar */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-100 dark:border-slate-600">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Client Payment Status</span>
            {isEditingBooking ? (
               <div className="flex gap-2 items-center dark:text-white">
                 <span className="text-sm">Total: ₹</span>
                 <input type="number" className={`${inputClass} w-28`} value={editBookingData.totalClientPayment} onChange={e => setEditBookingData({...editBookingData, totalClientPayment: Number(e.target.value)})}/>
                 <span className="text-sm ml-2">Paid: ₹</span>
                 <input type="number" className={`${inputClass} w-28`} value={editBookingData.clientPaidAmount} onChange={e => setEditBookingData({...editBookingData, clientPaidAmount: Number(e.target.value)})}/>
               </div>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-400">Total Deal Value: <b className="text-slate-800 dark:text-white">₹{booking.totalClientPayment.toLocaleString('en-IN')}</b></span>
            )}
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-4 mb-2">
            <div 
              className={`h-4 rounded-full transition-all ${clientPending <= 0 ? 'bg-green-500' : 'bg-blue-500'}`} 
              style={{ width: `${Math.min((booking.clientPaidAmount / booking.totalClientPayment) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm font-medium">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle size={14}/> Paid: ₹{booking.clientPaidAmount.toLocaleString('en-IN')}</span>
            <span className={`${clientPending > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400'} flex items-center gap-1`}>
              <AlertCircle size={14}/> Pending: ₹{clientPending.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: FINANCIAL SUMMARY --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Net Profit */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
            <p className="text-emerald-700 dark:text-emerald-400 font-medium text-xs uppercase tracking-wider">Net Profit (Gross)</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">₹{netProfit.toLocaleString('en-IN')}</p>
        </div>

        {/* Profit After Tax (PAT) */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <p className="text-blue-700 dark:text-blue-400 font-medium text-xs uppercase tracking-wider">Profit After Tax</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">₹{profitAfterTaxDisplay.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
        </div>

        {/* Taxes Breakdown & Round Off */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/50 col-span-1 md:col-span-2">
            <div className="flex justify-between items-start mb-3">
               <p className="text-purple-700 dark:text-purple-400 font-medium text-xs uppercase tracking-wider flex items-center gap-2">
                 <Calculator size={14}/> GST Calculation (18%)
               </p>
               <span className="text-xs text-slate-400">Total Vendor Due: <b className="text-red-500 dark:text-red-400">₹{totalVendorPending.toLocaleString('en-IN')}</b></span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-t border-purple-200 dark:border-purple-800 pt-3">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">CGST (9%)</span>
                <span className="font-bold text-slate-700 dark:text-white text-lg block">₹{cgstDisplay.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">SGST (9%)</span>
                <span className="font-bold text-slate-700 dark:text-white text-lg block">₹{sgstDisplay.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Round Off</span>
                <span className={`font-bold text-lg block ${roundOff !== 0 ? 'text-orange-500' : 'text-slate-400'}`}>
                  {roundOff > 0 ? "+" : ""}{roundOff.toFixed(2)}
                </span>
              </div>
            </div>
        </div>
      </div>

      {/* --- SECTION 3: VENDOR EXPENSES --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/30">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Building2 size={20} /> Vendor Expenses</h3>
          <button onClick={() => setShowExpenseForm(true)} className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-black dark:hover:bg-white"><Plus size={16} /> Add Vendor</button>
        </div>

        {/* New Expense Form */}
        {showExpenseForm && (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/50 animate-in fade-in slide-in-from-top-4">
            <form onSubmit={handleAddExpense} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Vendor Name</label>
                <input required placeholder="e.g. Indigo Airlines" className={`${inputClass} w-full`} value={newExpenseData.vendorName} onChange={e => setNewExpenseData({...newExpenseData, vendorName: e.target.value})}/>
              </div>
              <div className="w-32">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Cost</label>
                <input required type="number" placeholder="0" className={`${inputClass} w-full`} value={newExpenseData.amount} onChange={e => setNewExpenseData({...newExpenseData, amount: e.target.value})}/>
              </div>
              <div className="w-32">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Paid Now</label>
                <input required type="number" placeholder="0" className={`${inputClass} w-full`} value={newExpenseData.paidAmount} onChange={e => setNewExpenseData({...newExpenseData, paidAmount: e.target.value})}/>
              </div>
              <button className="bg-blue-600 text-white p-2 rounded-lg px-6 font-bold h-[42px]">Save</button>
              <button type="button" onClick={() => setShowExpenseForm(false)} className="text-slate-500 dark:text-slate-400 p-2 h-[42px]">Cancel</button>
            </form>
          </div>
        )}

        {/* Expense List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {expenses.map((exp) => (
            <div key={exp._id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              {editingExpenseId === exp._id ? (
                 // EDIT MODE
                 <div className="flex gap-4 items-center">
                    <input className={`${inputClass} flex-1`} value={editExpenseData.vendorName} onChange={e => setEditExpenseData({...editExpenseData, vendorName: e.target.value})} />
                    <input className={`${inputClass} w-28`} type="number" value={editExpenseData.amount} onChange={e => setEditExpenseData({...editExpenseData, amount: Number(e.target.value)})} />
                    <input className={`${inputClass} w-28`} type="number" value={editExpenseData.paidAmount} onChange={e => setEditExpenseData({...editExpenseData, paidAmount: Number(e.target.value)})} />
                    <button onClick={() => handleUpdateExpense(exp._id)} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                    <button onClick={() => setEditingExpenseId(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded">Cancel</button>
                 </div>
              ) : (
                // VIEW MODE
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">{exp.vendorName}</h4>
                    <p className="text-xs text-slate-400">Total Bill: ₹{exp.amount.toLocaleString('en-IN')}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Paid / Pending</div>
                      <div className="font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400">₹{exp.paidAmount.toLocaleString('en-IN')}</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-2">/</span>
                        <span className="text-red-500 dark:text-red-400">₹{(exp.amount - exp.paidAmount).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    {/* EDIT BUTTON */}
                    <button 
                      onClick={() => { setEditingExpenseId(exp._id); setEditExpenseData(exp); }}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2"
                    >
                      <Edit2 size={18} />
                    </button>
                    {/* DELETE BUTTON */}
                    <button 
                      onClick={() => handleDeleteExpense(exp._id)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}