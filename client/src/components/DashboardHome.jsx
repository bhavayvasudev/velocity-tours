import { useEffect, useState } from "react";
// We import IndianRupee here to replace the Dollar sign
import { TrendingUp, TrendingDown, Users, IndianRupee, Calendar, Wallet } from "lucide-react";

// 1. Updated StatCard to support Dark Mode
const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} shadow-lg shadow-${color.replace('bg-', '')}/30`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h2>
    <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">{subtext}</p>
  </div>
);

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitAfterTax: 0,
    activeBookings: 0,
    recentActivity: []
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      const token = localStorage.getItem("token"); // <--- Get Token
      if (!token) return;

      try {
        const headers = { "Authorization": `Bearer ${token}` }; // <--- Add Header

        const [bookingsRes, expensesRes] = await Promise.all([
          fetch("https://velocity-tours-git-main-bhavay-vasudevs-projects.vercel.app/api/bookings", { headers }),
          fetch("https://velocity-tours-git-main-bhavay-vasudevs-projects.vercel.app/api/expenses", { headers })
        ]);
        
        // ... (Rest of the code remains the same)

        if (bookingsRes.ok && expensesRes.ok) {
            const bookings = await bookingsRes.json();
            const expenses = await expensesRes.json();
    
            // 3. Calculate Totals
            const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalClientPayment || 0), 0);
            const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
            // 4. Profit Math
            const netProfit = totalRevenue - totalExpenses;
            const profitAfterTax = netProfit / 1.18; // Logic: Remove 18% GST from Net Profit
    
            setStats({
              totalRevenue,
              totalExpenses,
              netProfit,
              profitAfterTax, 
              activeBookings: bookings.length,
              // Sort by date (newest first) then take top 5
              recentActivity: bookings.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5) 
            });
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      }
    };

    loadDashboardData();
  }, []);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 pb-24 md:pb-10 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Your real-time financial health.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* REVENUE CARD with RUPEE ICON */}
        <StatCard 
          title="Total Revenue" 
          value={formatMoney(stats.totalRevenue)} 
          subtext="Total Deal Value"
          icon={IndianRupee} 
          color="bg-blue-500" 
        />
        
        <StatCard 
          title="Total Expenses" 
          value={formatMoney(stats.totalExpenses)} 
          subtext="Vendor Costs"
          icon={TrendingDown} 
          color="bg-red-500" 
        />
        
        <StatCard 
          title="Net Profit (Gross)" 
          value={formatMoney(stats.netProfit)} 
          subtext="Before Tax"
          icon={TrendingUp} 
          color={stats.netProfit >= 0 ? "bg-emerald-500" : "bg-orange-500"} 
        />
        
        <StatCard 
          title="Profit After Tax" 
          value={formatMoney(stats.profitAfterTax)} 
          subtext="Real Cash (Excl. GST)"
          icon={Wallet} 
          color="bg-indigo-500" 
        />
        
        <StatCard 
          title="Total Trips" 
          value={stats.activeBookings} 
          subtext="Active Bookings"
          icon={Users} 
          color="bg-violet-500" 
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Bookings</h2>
        <div className="space-y-4">
          {stats.recentActivity.length === 0 ? (
             <p className="text-slate-400 dark:text-slate-500 text-sm">No bookings yet.</p>
          ) : (
            stats.recentActivity.map((booking) => (
              <div key={booking._id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">{booking.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{booking.clientName}</p>
                  </div>
                </div>
                <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    +{formatMoney(booking.totalClientPayment)}
                    </span>
                    <span className="text-xs text-slate-400">
                        {new Date(booking.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}