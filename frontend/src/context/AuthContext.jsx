import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function getCurrentUser() {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include"
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Failed to get current user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  useEffect(() => {
    getCurrentUser();
  }, []);

  const value = {
    user,
    setUser,
    loading,
    logout,
    refreshUser: getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;