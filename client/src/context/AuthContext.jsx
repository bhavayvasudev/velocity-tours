import { createContext, useState, useEffect, useContext } from "react";

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
  // LOGIN (TOKEN BASED)
  // ==========================================
  const login = async (email, password) => {
    try {
        const res = await fetch("https://velocity-tours.vercel.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include" 
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message };
      }

      // ✅ SAVE TOKEN + USER
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "Server connection failed" };
    }
  };

  // ==========================================
  // LOGOUT (CLIENT SIDE)
  // ==========================================
  const logout = async () => {
    try {
      // HARDCODED BACKEND URL: Ensures we hit the real server to delete the cookie
      await fetch("https://velocity-tours.vercel.app/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    // Always clear the local storage immediately
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
