import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const login = (token) => {
    try {
      const decoded = jwtDecode(token);

      localStorage.setItem("token", token);

      setUser({
        token,
        id: decoded.id,
        email: decoded.email,
        exp: decoded.exp,
      });
    } catch (error) {
      console.error("Invalid token during login");
      logout();
    }
  };

  useEffect(() => {
    const restoreSession = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          logout();
        } else {
          setUser({
            token,
            id: decoded.id,
            email: decoded.email,
            exp: decoded.exp,
          });
        }
      } catch (error) {
        logout();
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};