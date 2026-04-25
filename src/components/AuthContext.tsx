"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  branchId?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      // Check local storage for token first
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            // Token invalid, try to refresh
            await refreshToken();
          }
        } catch (error) {
          console.error("Auth check error:", error);
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  // Redirect if not authenticated on protected pages
  useEffect(() => {
    const publicPaths = ["/login"];
    const isPublicPage = publicPaths.some((path) => pathname?.startsWith(path));
    
    if (!isLoading && !user && !isPublicPage) {
      router.push("/login");
    }
    
    if (!isLoading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { error: data.error || "Login failed" };
      }
      
      // Store token and user
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      
      return {};
    } catch (error) {
      console.error("Login error:", error);
      return { error: "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      router.push("/login");
    }
  };

  const refreshToken = async () => {
    try {
      // Try to get refresh token from cookie via an API call
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // refresh token from cookie
      });
      
      if (!res.ok) {
        // Refresh failed, clear session
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return;
      }
      
      const data = await res.json();
      localStorage.setItem("token", data.token);
      setToken(data.token);
      
      // Fetch user with new token
      const meRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }
    } catch (error) {
      console.error("Token refresh error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
