import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api`;

/**
 * AuthProvider wraps the app and provides authentication state,
 * login/register functions, and an authenticated fetch helper.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("parakh_token");
    const savedUser = localStorage.getItem("parakh_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("parakh_token");
        localStorage.removeItem("parakh_user");
      }
    }
    setLoading(false);
  }, []);

  /**
   * Register a new teacher account.
   */
  const register = async ({ email, password, name, institution, role }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, institution, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = typeof data.error === "string" 
        ? data.error 
        : data.error?.message || data.message || "Registration failed.";
      throw new Error(errMsg);
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("parakh_token", data.token);
    localStorage.setItem("parakh_user", JSON.stringify(data.user));

    return data;
  };

  /**
   * Login with email and password.
   */
  const login = async ({ email, password }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = typeof data.error === "string" 
        ? data.error 
        : data.error?.message || data.message || "Login failed.";
      throw new Error(errMsg);
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("parakh_token", data.token);
    localStorage.setItem("parakh_user", JSON.stringify(data.user));

    return data;
  };

  /**
   * Logout and clear session.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("parakh_token");
    localStorage.removeItem("parakh_user");
  }, []);

  /**
   * Authenticated fetch helper.
   * Automatically attaches the Bearer token to requests.
   * Handles 401 responses by logging the user out.
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    const res = await fetch(url.startsWith("http") ? url : `${API_BASE}${url}`, {
      ...options,
      headers,
    });

    // If unauthorized, clear session
    if (res.status === 401) {
      logout();
    }

    return res;
  }, [token, logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    register,
    login,
    logout,
    authFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context from any component.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
