import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import api, { logout as apiLogout } from '@/lib/api';
export interface UserInfo { _id: string; name: string; email: string; isAdmin: boolean; picture?: string; createdAt?: string }
interface AuthContextType { user: UserInfo | null; loading: boolean; setUser: (user: UserInfo) => void; logoutUser: () => Promise<void> }
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionVersion = useRef(0);
  useEffect(() => {
    let active = true;
    const refreshSession = () => {
      const version = ++sessionVersion.current;
      api.get<UserInfo>('/auth/profile').then(({ data }) => {
        if (active && version === sessionVersion.current) setUserState(data);
      }).catch(() => {
        if (active && version === sessionVersion.current) setUserState(null);
      }).finally(() => { if (active && version === sessionVersion.current) setLoading(false); });
    };
    const syncSession = (event: StorageEvent) => {
      if (event.key !== 'userInfo' && event.key !== null) return;
      setUserState(null); setLoading(true);
      refreshSession();
    };
    refreshSession();
    window.addEventListener('storage', syncSession);
    return () => { active = false; window.removeEventListener('storage', syncSession); };
  }, []);
  const setUser = useCallback((data: UserInfo) => {
    ++sessionVersion.current;
    setUserState(data); setLoading(false);
    try { localStorage.setItem('userInfo', JSON.stringify(data)); } catch { /* optional cache */ }
  }, []);
  const logoutUser = useCallback(async () => {
    await apiLogout();
    ++sessionVersion.current;
    try { localStorage.removeItem('userInfo'); } catch { /* optional cache */ }
    setUserState(null); setLoading(false);
  }, []);
  return <AuthContext.Provider value={{ user, loading, setUser, logoutUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
