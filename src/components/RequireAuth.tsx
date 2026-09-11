import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { fetchCurrentSession } from '@/features/auth/auth.api';

export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setRoles = useAuthStore((s) => s.setRoles);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [checking, setChecking] = useState(Boolean(isAuthenticated && accessToken));

  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated || !accessToken) {
      setChecking(false);
      return;
    }
    fetchCurrentSession()
      .then((session) => {
        if (!mounted) return;
        if (session.user || (session as any).email) {
          setUser((session.user || session) as any);
        }
        setPermissions((session.permissions as string[]) ?? []);
        setRoles((session.roles as Parameters<typeof setRoles>[0]) ?? []);
      })
      .catch(() => {
        if (mounted) logout();
      })
      .finally(() => mounted && setChecking(false));
    return () => { mounted = false; };
  }, [accessToken, isAuthenticated, logout, setPermissions, setRoles, setUser]);

  if (checking) return <div className="grid min-h-screen place-items-center bg-[#f4f7f5]"><div className="rounded-2xl border border-white/70 bg-white/70 px-5 py-3 text-sm font-semibold text-primary-800 shadow-xl backdrop-blur-xl">Securing your session…</div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
