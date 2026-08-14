import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout } from '../api';

interface AuthContextValue {
  authed: boolean;
  loading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  authed: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch('/api/auth/check', { credentials: 'include' })
      .then((r) => {
        if (r.ok) {
          return r.json().then((data) => setAuthed(data.authed));
        }
        setAuthed(false);
      })
      .catch(() => setAuthed(false))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (password: string) => {
    try {
      await apiLogin(password);
      setAuthed(true);
      // Redirect to intended page or home
      const from = (location.state as { from?: string } | null)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch {
      throw new Error('Invalid password');
    }
  }, [navigate, location]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setAuthed(false);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ authed, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
