import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Home, Sparkles, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { fetchCurrentSession, login } from '@/features/auth/auth.api';
import { useAuthStore } from '@/store/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionExpired = searchParams.get('session') === 'expired';
  const justRegistered = Boolean((location.state as { justRegistered?: boolean } | null)?.justRegistered);
  const setSession = useAuthStore((s) => s.setSession);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setRoles = useAuthStore((s) => s.setRoles);
  const [identifier, setIdentifier] = useState('meshackokoth436@gmail.com');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (result) => {
      setSession(result.accessToken, result.refreshToken, result.user as never);
      try {
        const session = await fetchCurrentSession();
        setPermissions((session.permissions as string[]) ?? []);
        setRoles((session.roles as Parameters<typeof setRoles>[0]) ?? []);
      } catch {
        // Non-fatal
      }
      navigate('/dashboard');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials. Please verify your email or password.';
      setError(message);
    },
  });

  const handleQuickLogin = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setError(null);
    mutation.mutate({ identifier: email, password: pass });
  };

  return (
    <div className="mesh-hero-bg flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md hover:bg-white hover:text-primary-900 transition active:scale-95"
        >
          <ArrowLeft size={14} />
          <Home size={14} className="text-primary-700" />
          <span>Back to Home</span>
        </Link>
      </div>

      <Card variant="glass" className="w-full max-w-md p-7 sm:p-9 shadow-lg border border-white/80">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary-950">Welcome back</h1>
            <p className="mt-0.5 text-xs text-slate-500">Sign in to your TUMCU Portal</p>
          </div>
          <div className="h-9 w-9 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-700 border border-primary-100">
            <Sparkles size={18} />
          </div>
        </div>

        {sessionExpired && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs font-medium text-amber-800">
            Your session has ended. Please sign in below to continue.
          </div>
        )}

        {justRegistered && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-800">
            Registration received. Your membership application is awaiting approval. You can sign in once an administrator approves it.
          </div>
        )}

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            mutation.mutate({ identifier: identifier.trim(), password });
          }}
        >
          <Input
            label="Email, admission number, or phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. admin@tumcu.ac.ke or ADM/2026/001"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}
          <Button type="submit" loading={mutation.isPending} className="mt-1">
            Sign In to Dashboard
          </Button>
        </form>

        {/* Quick Demo Logins for Fast Access */}
        <div className="mt-6 border-t border-slate-200/70 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <KeyRound size={12} className="text-primary-600" />
            <span>Instant Demo Accounts</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('meshackokoth436@gmail.com', 'Admin@12345')}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 text-left p-2 rounded-xl border border-primary-100 bg-primary-50/70 hover:bg-primary-100/70 transition text-xs text-primary-950 font-medium"
            >
              <ShieldCheck size={14} className="text-primary-700 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-primary-900 truncate">Meshack Okoth</div>
                <div className="text-[10px] text-primary-600">Super Admin</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@tumcu.ac.ke', 'Admin@12345')}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 text-left p-2 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-slate-100 transition text-xs text-slate-800 font-medium"
            >
              <UserCheck size={14} className="text-slate-600 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-slate-900 truncate">System Admin</div>
                <div className="text-[10px] text-slate-500">Administrator</div>
              </div>
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Not a member yet?{' '}
          <Link to="/register" className="font-bold text-primary-700 hover:underline">
            Register for Membership
          </Link>
        </p>
      </Card>
    </div>
  );
}
