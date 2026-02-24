import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "../types/user";

const STORAGE_KEY = "auth";

interface StoredAuth {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    null
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    null
  );

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const data: StoredAuth = JSON.parse(raw);
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (user && accessToken && refreshToken) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, accessToken, refreshToken })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, accessToken, refreshToken]);

  function login(data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) {
    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
  }

  function logout() {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}