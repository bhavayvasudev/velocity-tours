import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, ArrowRight } from "lucide-react";

export default function Login() {
  /* ============================================================
     ⛔️  LOGIC SECTION (UNCHANGED)
     Backend authentication flow, state, and handlers are preserved.
     ============================================================ */
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

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate("/"); 
      } else {
        setError(result.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Login component error:", err);
      setError("Server connection failed. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ============================================================
     ✨ UI SECTION (REDESIGNED)
     Clean, modern, glassmorphism-inspired layout.
     ============================================================ */
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50">
      
      {/* 🎨 ANIMATED BACKGROUND SHAPES */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {/* Top Left Blob */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        {/* Top Right Blob */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        {/* Bottom Center Blob */}
        <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* 🪟 GLASS CARD CONTAINER */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden">
          
          {/* HEADER SECTION */}
          <div className="pt-10 pb-2 px-10 text-center">
             <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-6 transform transition-transform hover:scale-105 duration-300">
                <Lock className="text-white" size={26} />
             </div>
             <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
               Welcome Back
             </h1>
             <p className="text-slate-500 text-sm font-medium">
               Sign in to manage your Velocity Tours dashboard
             </p>
          </div>

          {/* FORM SECTION */}
          <div className="p-10 pt-8">
            {error && (
              <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-600 text-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle size={18} className="mt-0.5 shrink-0" /> 
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-sm"
                    placeholder="admin@velocity.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-11 pr-12 py-3.5 bg-white/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transform transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In to Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Velocity Tours Secure Portal &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer Link */}
        <p className="text-center text-slate-400 text-xs mt-6 opacity-60">
           Need help? <span className="underline cursor-pointer hover:text-blue-500 transition-colors">Contact Support</span>
        </p>
      </div>
    </div>
  );
}