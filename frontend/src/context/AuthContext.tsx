import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface GisuUser {
  id: string;
  email: string;
  display_name?: string;
}

interface AuthContextValue {
  token: string | null;
  user: GisuUser | null;
  login: (token: string, user: GisuUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): GisuUser | null {
  try {
    const raw = localStorage.getItem('gisul_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gisul_token'));
  const [user, setUser] = useState<GisuUser | null>(loadUser);

  const login = useCallback((newToken: string, newUser: GisuUser) => {
    localStorage.setItem('gisul_token', newToken);
    localStorage.setItem('gisul_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gisul_token');
    localStorage.removeItem('gisul_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
