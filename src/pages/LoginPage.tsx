import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { fetchCurrentSession, login } from '@/features/auth/auth.api';
import { useAuthStore } from '@/store/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = Boolean((location.state as { justRegistered?: boolean } | null)?.justRegistered);
  const setSession = useAuthStore((s) => s.setSession);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setRoles = useAuthStore((s) => s.setRoles);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
        // Non-fatal: the dashboard just won't show permission-gated sections
        // until the next successful /auth/me call (e.g. after a refresh).
      }
      navigate('/dashboard');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please try again.';
      setError(message);
    },
  });

  return (
    <div className="mesh-hero-bg flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-16 sm:px-6">
      <Card variant="glass" className="w-full max-w-md p-7 sm:p-9">
        <h1 className="text-xl font-semibold text-primary-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your TUMCU account</p>
        {justRegistered && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-800">Registration received. Your membership application is awaiting approval. You can sign in once an administrator approves it.</div>}

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
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" loading={mutation.isPending} className="mt-2">
            Login
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Not a member yet?{' '}
          <Link to="/register" className="font-medium text-primary-700">
            Register here
          </Link>
        </p>
      </Card>
    </div>
  );
}
