import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Users, IndianRupee, Calendar, Wallet, Filter } from "lucide-react";

// 👇 USING THE PRODUCTION URL (Matches your fixed Bookings.jsx)
const API_URL = "https://velocity-tours.vercel.app/api";

// 1. StatCard Component
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
  // --- RAW DATA STATE ---
  const [allBookings, setAllBookings] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);

  // --- FILTER STATE ---
  const [filterType, setFilterType] = useState("monthly"); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  // --- CALCULATED STATS STATE ---
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitAfterTax: 0,
    activeBookings: 0,
    recentActivity: []
  });

  // 1. Fetch All Data on Mount
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const headers = { "Authorization": `Bearer ${token}` };

        const [bookingsRes, expensesRes] = await Promise.all([
          fetch(`${API_URL}/bookings`, { headers }),
          fetch(`${API_URL}/expenses`, { headers })
        ]);
        
        if (bookingsRes.ok && expensesRes.ok) {
            setAllBookings(await bookingsRes.json());
            setAllExpenses(await expensesRes.json());
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    };
    loadData();
  }, []);

  // 2. Filter Engine (Runs whenever filters or data change)
  useEffect(() => {
    const filterData = (data) => {
      if (filterType === "all") return data;

      return data.filter((item) => {
        const date = new Date(item.date);
        const month = date.getMonth(); 
        const year = date.getFullYear();

        if (filterType === "monthly") {
          return month === parseInt(selectedMonth) && year === parseInt(selectedYear);
        }
        if (filterType === "yearly") {
          // Financial Year: April 1st to March 31st (Next Year)
          const fyStart = new Date(selectedYear, 3, 1); 
          const fyEnd = new Date(parseInt(selectedYear) + 1, 2, 31); 
          return date >= fyStart && date <= fyEnd;
        }
        if (filterType === "quarterly") {
          let qStart, qEnd;
          // Financial Quarters
          if (selectedQuarter === "Q1") { // Apr - Jun
            qStart = new Date(selectedYear, 3, 1); 
            qEnd = new Date(selectedYear, 5, 30); 
          } 
          else if (selectedQuarter === "Q2") { // Jul - Sep
            qStart = new Date(selectedYear, 6, 1); 
            qEnd = new Date(selectedYear, 8, 30); 
          } 
          else if (selectedQuarter === "Q3") { // Oct - Dec
            qStart = new Date(selectedYear, 9, 1); 
            qEnd = new Date(selectedYear, 11, 31); 
          } 
          else if (selectedQuarter === "Q4") { // Jan - Mar (Next Year)
            qStart = new Date(parseInt(selectedYear) + 1, 0, 1); 
            qEnd = new Date(parseInt(selectedYear) + 1, 2, 31); 
          }
          return date >= qStart && date <= qEnd;
        }
        return true;
      });
    };

    const filteredBookings = filterData(allBookings);
    const filteredExpenses = filterData(allExpenses);

    // 3. Calculate Math
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.totalClientPayment || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitAfterTax = netProfit / 1.18; // Logic: Remove 18% GST

    setStats({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitAfterTax, 
      activeBookings: filteredBookings.length,
      // Sort newest first, take top 5
      recentActivity: filteredBookings.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5) 
    });

  }, [allBookings, allExpenses, filterType, selectedYear, selectedMonth, selectedQuarter]);


  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper for Year Dropdown
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= 2050; i++) yearOptions.push(i);

  return (
    <div className="p-6 md:p-10 space-y-6 pb-24 md:pb-10 animate-in fade-in duration-500">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Your real-time financial health.</p>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl flex flex-wrap gap-2 items-center border border-slate-200 dark:border-slate-700 w-fit">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium px-2">
                <Filter size={16} /> <span className="text-sm">Filter:</span>
            </div>
            
            <select 
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
            >
                <option value="all">Lifetime</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Financial Year</option>
            </select>

            {filterType !== "all" && (
            <>
                {/* YEAR SELECT */}
                <select 
                    className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    {yearOptions.map(yr => ( 
                        <option key={yr} value={yr}>
                            {filterType === "monthly" ? yr : `FY ${yr}-${yr + 1}`}
                        </option> 
                    ))}
                </select>

                {/* QUARTER SELECT */}
                {filterType === "quarterly" && (
                    <select 
                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                        value={selectedQuarter} 
                        onChange={(e) => setSelectedQuarter(e.target.value)}
                    >
                        <option value="Q1">Q1 (Apr-Jun)</option>
                        <option value="Q2">Q2 (Jul-Sep)</option>
                        <option value="Q3">Q3 (Oct-Dec)</option>
                        <option value="Q4">Q4 (Jan-Mar)</option>
                    </select>
                )}

                {/* MONTH SELECT */}
                {filterType === "monthly" && (
                    <select 
                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {Array.from({ length: 12 }, (_, i) => ( 
                            <option key={i} value={i}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option> 
                        ))}
                    </select>
                )}
            </>
            )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
          subtext="Bookings in Period"
          icon={Users} 
          color="bg-violet-500" 
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Activity</h2>
            <span className="text-xs text-slate-400">Showing top 5 in selected period</span>
        </div>
        
        <div className="space-y-4">
          {stats.recentActivity.length === 0 ? (
             <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                No bookings found for this period.
             </div>
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
                        {new Date(booking.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
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