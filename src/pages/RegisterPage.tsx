import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { register as registerApi, type RegisterPayload } from '@/features/auth/auth.api';

const STEPS = ['Personal Details', 'University Information', 'Membership Declaration', 'Review'];

const DECLARATION_TEXT =
  'I declare Jesus Christ as my Lord and Savior and commit to upholding the mission, vision, ' +
  'and values of the Technical University of Mombasa Christian Union as set out in its constitution.';

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<RegisterPayload>>({ membership_type: 'full' });
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: registerApi,
    onSuccess: () => navigate('/login', { state: { justRegistered: true } }),
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      setError(message);
    },
  });

  function update<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    setError(null);

    if (step === 0) {
      if (!form.full_name?.trim() || !form.email?.trim() || !form.password) {
        setError('Please complete your name, email and password before continuing.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (form.password.length < 10 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
        setError('Password must be at least 10 characters and include uppercase, lowercase, number and symbol.');
        return;
      }
    }

    if (step === 1 && !form.admission_number?.trim()) {
      setError('Please enter your university admission number.');
      return;
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    if (!declarationChecked) {
      setError('You must accept the membership declaration to continue.');
      return;
    }
    const payload = { ...form, declaration_accepted: true } as RegisterPayload;
    if (typeof payload.phone_number === 'string' && payload.phone_number.trim() === '') delete payload.phone_number;
    if (typeof payload.admission_number === 'string' && payload.admission_number.trim() === '') delete payload.admission_number;
    mutation.mutate(payload);
  }

  return (
    <div className="mesh-hero-bg flex min-h-screen items-center justify-center px-6 py-16">
      <Card variant="glass" className="w-full max-w-xl p-7 sm:p-9">
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  i <= step ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 ${i < step ? 'bg-primary-600' : 'bg-slate-100'}`} />
              )}
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-primary-900">{STEPS[step]}</h2>

        {step === 0 && (
          <div className="mt-4 flex flex-col gap-4">
            <Input
              label="Full name"
              value={form.full_name ?? ''}
              onChange={(e) => update('full_name', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => update('email', e.target.value)}
            />
            <Input
              label="Phone number"
              value={form.phone_number ?? ''}
              onChange={(e) => update('phone_number', e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={form.password ?? ''}
              onChange={(e) => update('password', e.target.value)}
              hint="At least 10 characters with uppercase, lowercase, number and symbol."
            />
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 flex flex-col gap-4">
            <Input
              label="Admission number"
              value={form.admission_number ?? ''}
              onChange={(e) => update('admission_number', e.target.value)}
            />
            <label className="text-sm font-medium text-slate-700">Membership type</label>
            <select
              className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
              value={form.membership_type}
              onChange={(e) => update('membership_type', e.target.value as RegisterPayload['membership_type'])}
            >
              <option value="full">Full Member</option>
              <option value="special">Special Member</option>
              <option value="associate">Associate Member</option>
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 flex flex-col gap-4">
            <p className="rounded-[var(--radius-card)] bg-primary-50 p-4 text-sm text-slate-700">
              {DECLARATION_TEXT}
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
              />
              I accept this declaration
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
            <p>
              <strong>Name:</strong> {form.full_name}
            </p>
            <p>
              <strong>Email:</strong> {form.email}
            </p>
            <p>
              <strong>Admission No:</strong> {form.admission_number}
            </p>
            <p>
              <strong>Membership type:</strong> {form.membership_type}
            </p>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submit} loading={mutation.isPending}>
              Submit Application
            </Button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already a member?{' '}
          <Link to="/login" className="font-medium text-primary-700">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
