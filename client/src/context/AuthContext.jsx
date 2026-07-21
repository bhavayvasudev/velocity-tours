import { createContext, useState, useEffect, useContext } from "react";
import { googleLogout } from "@react-oauth/google";
import { API_URL } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOAD SESSION ON APP START
  // ==========================================
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ==========================================
  // LOGIN (GOOGLE) — `credential` is the ID token from @react-oauth/google.
  // ==========================================
  const loginWithGoogle = async (credential) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message };
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (err) {
      console.error("Google login error:", err);
      return { success: false, message: "Server connection failed" };
    }
  };

  // ==========================================
  // LOGOUT (CLIENT SIDE)
  // Clears the refresh token cookie server-side, revokes the Google session
  // so it doesn't silently re-auth on the next visit, and wipes every trace
  // of local session data — this is a financial app, so nothing (auth
  // tokens, cached AI chat history, etc.) should survive on a shared machine.
  // ==========================================
  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    try {
      googleLogout();
    } catch (err) {
      console.error("Google logout error:", err);
    }

    // Invalidate auth context first, then wipe storage — order matters so
    // nothing re-reads a token mid-clear.
    setToken(null);
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
