import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("Auth check failed:", err);
        localStorage.removeItem("accessToken");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = ({ accessToken, user }) => {
    localStorage.setItem("accessToken", accessToken);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {loading ? (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "100vh",
          color: "#f9fafb"
        }}>
          Loading...
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
