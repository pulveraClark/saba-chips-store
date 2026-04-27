import { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "../assets/services/authService.js";

const AuthContext = createContext();

/* eslint-disable react-refresh/only-export-components */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await getMe();
      setUser(data.user || null);
      return data.user || null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  const isAdmin = user?.role === "admin" || user?.email === "admin@sabachips.com";

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refreshUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
