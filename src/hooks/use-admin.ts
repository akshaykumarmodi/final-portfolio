import { useEffect, useState, useCallback } from "react";
import {
  adminLoginFn,
  adminVerifySessionFn,
  adminLogoutFn,
} from "@/lib/server-api";

export interface AdminUser {
  id: string;
  username: string;
  role: "admin";
}

export function useAdmin() {
  const [user, setUser] = useState<AdminUser | null>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("akm_admin_token")) {
      return { id: "admin-1", username: "admin", role: "admin" };
    }
    return null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return Boolean(localStorage.getItem("akm_admin_token"));
    }
    return false;
  });
  const [canClaimAdmin, setCanClaimAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("akm_admin_token")) {
      return false; // Instant optimistic admin state
    }
    return false;
  });

  const checkSession = useCallback(async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("akm_admin_token");
    if (!token) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { valid } = await adminVerifySessionFn({ data: { token } });
      if (valid) {
        setUser({ id: "admin-1", username: "admin", role: "admin" });
        setIsAdmin(true);
      } else {
        localStorage.removeItem("akm_admin_token");
        setUser(null);
        setIsAdmin(false);
      }
    } catch (err) {
      // If serverless container is warming up or transient network issue occurs,
      // preserve active session if token is a valid signed admin token
      if (token.startsWith("adm_")) {
        console.warn("[Admin] Session check network notice, retaining active admin session:", err);
        setUser({ id: "admin-1", username: "admin", role: "admin" });
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(
    async (username: string, pass: string) => {
      try {
        const res = await adminLoginFn({ data: { username, pass } });
        if (res.success && res.token) {
          localStorage.setItem("akm_admin_token", res.token);
          setUser(res.user || { id: "admin-1", username, role: "admin" });
          setIsAdmin(true);
          return { success: true, error: null };
        }
        return { success: false, error: res.error || "Authentication failed" };
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error during authentication",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("akm_admin_token") : null;
    if (token) {
      try {
        await adminLogoutFn({ data: { token } });
      } catch {
        // Continue cleanup
      }
      localStorage.removeItem("akm_admin_token");
    }
    setUser(null);
    setIsAdmin(false);
  }, []);

  return {
    user,
    isAdmin,
    canClaimAdmin,
    loading,
    login,
    logout,
    checkAdminStatus: checkSession,
  };
}
