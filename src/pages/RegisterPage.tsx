import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { HeartHandshake, ArrowLeft, Home } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<RegisterPayload>>({ membership_type: 'full' });
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFromVisitorCheckIn = searchParams.get('from') === 'checkin' || !!searchParams.get('email') || !!searchParams.get('fullName') || !!searchParams.get('name');

  useEffect(() => {
    const fullName = searchParams.get('fullName') || searchParams.get('name');
    const email = searchParams.get('email');
    const phoneNumber = searchParams.get('phoneNumber') || searchParams.get('phone');

    if (fullName || email || phoneNumber) {
      setForm((prev) => ({
        ...prev,
        full_name: fullName || prev.full_name,
        email: email || prev.email,
        phone_number: phoneNumber || prev.phone_number,
      }));
    }
  }, [searchParams]);

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
    <div className="mesh-hero-bg flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md hover:bg-white hover:text-primary-900 transition active:scale-95"
        >
          <ArrowLeft size={14} />
          <Home size={14} className="text-primary-700" />
          <span>Back to Home</span>
        </Link>
      </div>

      <Card variant="glass" className="w-full max-w-xl p-7 sm:p-9">
        {isFromVisitorCheckIn && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/80 p-4 text-xs leading-5 text-primary-900 shadow-sm">
            <HeartHandshake className="shrink-0 text-primary-700" size={20} />
            <div>
              <p className="font-bold text-primary-950">Welcome to the TUMCU Family!</p>
              <p className="mt-0.5 text-slate-600">
                We loved having you at our fellowship. Complete your membership registration below to join ministries, access spiritual resources, and become part of our community.
              </p>
            </div>
          </div>
        )}

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
              placeholder="e.g. BENG/2026/045"
              value={form.admission_number ?? ''}
              onChange={(e) => update('admission_number', e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Year of Education / Study (TUM Standards)
              </label>
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                value={(form as any).year_of_study || 'Year 1 (Undergraduate)'}
                onChange={(e) => update('year_of_study' as any, e.target.value)}
              >
                <option value="Year 1 (Undergraduate)">Year 1 (Undergraduate Degree)</option>
                <option value="Year 2 (Undergraduate)">Year 2 (Undergraduate Degree)</option>
                <option value="Year 3 (Undergraduate)">Year 3 (Undergraduate Degree)</option>
                <option value="Year 4 (Undergraduate)">Year 4 (Undergraduate Degree)</option>
                <option value="Year 5 (Undergraduate - Engineering/Arch)">Year 5 (Undergraduate - Engineering / Architecture)</option>
                <option value="Diploma Year 1">Diploma Year 1</option>
                <option value="Diploma Year 2">Diploma Year 2</option>
                <option value="Diploma Year 3">Diploma Year 3</option>
                <option value="Certificate Year 1">Certificate Year 1</option>
                <option value="Certificate Year 2">Certificate Year 2</option>
                <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                <option value="Associate / Staff / Alumni">Associate / Staff / Alumni</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Academic Department / Faculty (TUM)
              </label>
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                value={(form as any).department || 'Department of Computing and Informatics'}
                onChange={(e) => update('department' as any, e.target.value)}
              >
                <option value="Department of Computing and Informatics">Department of Computing and Informatics</option>
                <option value="Department of Electrical and Electronic Engineering">Department of Electrical and Electronic Engineering</option>
                <option value="Department of Mechanical and Automotive Engineering">Department of Mechanical and Automotive Engineering</option>
                <option value="Department of Civil and Building Engineering">Department of Civil and Building Engineering</option>
                <option value="Department of Mathematics and Physics">Department of Mathematics and Physics</option>
                <option value="Department of Pure and Applied Sciences">Department of Pure and Applied Sciences</option>
                <option value="Department of Business Administration">Department of Business Administration</option>
                <option value="Department of Accounting and Finance">Department of Accounting and Finance</option>
                <option value="Department of Hospitality and Tourism Management">Department of Hospitality and Tourism Management</option>
                <option value="Department of Medical Sciences">Department of Medical Sciences</option>
                <option value="Department of Environment and Health Sciences">Department of Environment and Health Sciences</option>
                <option value="Department of Media and Graphic Design">Department of Media and Graphic Design</option>
                <option value="Department of Humanities and Social Sciences">Department of Humanities and Social Sciences</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Membership Type</label>
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                value={form.membership_type}
                onChange={(e) => update('membership_type', e.target.value as RegisterPayload['membership_type'])}
              >
                <option value="full">Full Member (Baptized/Born-Again TUM Student)</option>
                <option value="special">Special Member (Non-Resident / Distance Learner)</option>
                <option value="associate">Associate Member (Alumni / University Staff)</option>
              </select>
            </div>
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
