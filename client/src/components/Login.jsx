import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
  credentials: "include" // <--- YOU MUST HAVE THIS
});
    
    if (result.success) {
      navigate("/"); // Redirect to Dashboard
    } else {
      setError(result.message || "Login failed");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Velocity Tours</h1>
          <p className="text-blue-100 mt-2 text-sm">Restricted Access Portal</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white outline-none transition-all"
                  placeholder="admin@velocity.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full pl-10 pr-10 p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Authenticating..." : <><LogIn size={20} /> Login to Dashboard</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Forgot password? Contact system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}