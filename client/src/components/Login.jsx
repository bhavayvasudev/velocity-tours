import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle } from "lucide-react";
import GoogleSignInButton from "./GoogleSignInButton";

export default function Login() {
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

            <GoogleSignInButton
              onSuccess={() => navigate("/app")}
              onError={(message) => setError(message)}
            />

            <p className="mt-6 text-center text-xs text-slate-400 font-medium">
              Access is granted per Google account by your admin. Contact them if you don't have access yet.
            </p>

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
