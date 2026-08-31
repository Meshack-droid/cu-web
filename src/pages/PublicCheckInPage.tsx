import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  QrCode,
  CheckCircle2,
  Heart,
  Church,
  Sparkles,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Home,
  MapPin,
  Clock,
  BookOpen,
  Calendar,
  AlertCircle,
  User,
  LogIn,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchActivePublicSessions,
  fetchSessionDetails,
  submitPublicCheckIn,
  selfCheckIn,
  type AttendanceSession,
  type CheckInResult,
} from '@/features/attendance/attendance.api';

export function PublicCheckInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const codeParam = searchParams.get('code') || '';
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'visitor' | 'member_lookup'>('visitor');

  // Visitor Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState('School of Applied & Health Sciences');
  const [visitorType, setVisitorType] = useState<'first_time' | 'returning'>('first_time');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [notes, setNotes] = useState('');

  // Member Fast Lookup State
  const [memberIdentifier, setMemberIdentifier] = useState('');

  // Result state
  const [checkInResponse, setCheckInResponse] = useState<CheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch active sessions or specific session by code
  const { data: activeSessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['attendance', 'public', 'activeSessions'],
    queryFn: fetchActivePublicSessions,
  });

  const { data: codeSession } = useQuery({
    queryKey: ['attendance', 'public', 'sessionByCode', codeParam],
    queryFn: () => fetchSessionDetails(codeParam),
    enabled: !!codeParam,
  });

  const currentSession: AttendanceSession | undefined =
    codeSession ||
    activeSessions?.find((s) => s.id === selectedSessionId || s.code === codeParam) ||
    activeSessions?.[0];

  useEffect(() => {
    if (currentSession && !selectedSessionId) {
      setSelectedSessionId(currentSession.id);
    }
  }, [currentSession, selectedSessionId]);

  // Public check-in mutation (for visitors or non-logged-in members)
  const publicMutation = useMutation({
    mutationFn: submitPublicCheckIn,
    onSuccess: (data) => {
      setCheckInResponse(data);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Check-in failed. Please try again.');
    },
  });

  // Authenticated 1-tap check-in mutation
  const authCheckInMutation = useMutation({
    mutationFn: (sessId: string) =>
      selfCheckIn('sunday_service', sessId, { prayerRequest: prayerRequest || undefined }),
    onSuccess: (data) => {
      setCheckInResponse(data);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Check-in failed. Please try again.');
    },
  });

  function handleVisitorSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!currentSession) {
      setErrorMsg('No active service session selected.');
      return;
    }

    publicMutation.mutate({
      sessionId: currentSession.id,
      sessionCode: currentSession.code,
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      category,
      visitorType,
      prayerRequest: prayerRequest.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  function handleMemberLookupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberIdentifier.trim()) {
      setErrorMsg('Please enter your email or admission number.');
      return;
    }
    if (!currentSession) {
      setErrorMsg('No active service session selected.');
      return;
    }

    publicMutation.mutate({
      sessionId: currentSession.id,
      sessionCode: currentSession.code,
      identifier: memberIdentifier.trim(),
      prayerRequest: prayerRequest.trim() || undefined,
    });
  }

  function handleAuthCheckIn() {
    if (!currentSession) return;
    authCheckInMutation.mutate(currentSession.id);
  }

  return (
    <div className="mesh-hero-bg min-h-screen flex flex-col justify-between px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* Top Back to Home Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md hover:bg-white hover:text-primary-900 transition active:scale-95"
          >
            <ArrowLeft size={14} />
            <Home size={14} className="text-primary-700" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Top Church Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-3xl bg-primary-800 text-white shadow-xl shadow-primary-950/20 grid place-items-center mb-3">
            <Church size={28} className="text-amber-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-primary-950 tracking-tight">
            Technical University of Mombasa Christian Union
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">
            Sunday Service & Fellowship Attendance
          </p>
        </div>

        {/* Success Confirmation View */}
        {checkInResponse ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="glass" className="p-6 sm:p-8 border-primary-100 shadow-2xl space-y-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-primary-950">
                  {checkInResponse.is_member ? 'Attendance Confirmed!' : 'Welcome to TUMCU!'}
                </h2>
                <p className="text-sm text-slate-600">
                  {checkInResponse.message}
                </p>
              </div>

              {/* Service Info Recap */}
              {currentSession && (
                <div className="rounded-2xl bg-white/70 p-4 text-xs text-slate-600 border border-slate-200/60 space-y-1 text-left">
                  <p className="font-bold text-primary-950 text-sm">{currentSession.title}</p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={13} /> {currentSession.session_date} · {currentSession.venue}
                  </p>
                  {currentSession.theme && (
                    <p className="text-primary-800 font-medium italic">Theme: "{currentSession.theme}"</p>
                  )}
                </div>
              )}

              {/* NON-MEMBER REGISTRATION PROMPT */}
              {checkInResponse.prompt_registration && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-primary-500/10 to-primary-900/10 border border-amber-200/80 p-5 text-left space-y-3"
                >
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Heart size={18} className="text-red-500 fill-red-500" />
                    <span>Become a Part of Our Family</span>
                  </div>
                  <p className="text-xs leading-5 text-slate-700">
                    We're so glad you worshipped with us today! As a full member of TUMCU, you can join ministry teams (Worship, Ushering, Missions, Media), participate in leadership, and access student fellowships.
                  </p>
                  <Button
                    variant="primary"
                    className="w-full gap-2 shadow-md hover:shadow-lg font-bold"
                    onClick={() => {
                      const guest = checkInResponse.guest;
                      const params = new URLSearchParams();
                      if (guest?.fullName) params.set('fullName', guest.fullName);
                      if (guest?.email) params.set('email', guest.email);
                      if (guest?.phoneNumber) params.set('phoneNumber', guest.phoneNumber);
                      params.set('from', 'checkin');
                      navigate(`/register?${params.toString()}`);
                    }}
                  >
                    <UserPlus size={16} /> Register as a Member <ArrowRight size={16} />
                  </Button>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setCheckInResponse(null);
                    setFullName('');
                    setEmail('');
                    setPhoneNumber('');
                    setPrayerRequest('');
                    setMemberIdentifier('');
                  }}
                >
                  Check In Another Person
                </Button>
                {isAuthenticated ? (
                  <Button variant="secondary" className="flex-1" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                ) : (
                  <Button variant="secondary" className="flex-1" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ) : (
          // Active Check-In Form View
          <Card variant="glass" className="p-6 sm:p-8 border-white/80 shadow-2xl space-y-6">
            {/* Active Service Banner */}
            {loadingSessions ? (
              <div className="h-24 animate-pulse rounded-2xl bg-white/60" />
            ) : currentSession ? (
              <div className="rounded-3xl bg-gradient-to-r from-primary-900 to-primary-800 text-white p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    <Sparkles size={12} /> Today's Service
                  </span>
                  <span className="font-mono text-xs text-slate-300 font-semibold">{currentSession.code}</span>
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white">{currentSession.title}</h2>
                  {currentSession.theme && (
                    <p className="text-xs text-amber-200/90 italic mt-0.5">"{currentSession.theme}"</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300 pt-1 border-t border-white/10">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-amber-400" /> {currentSession.venue}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-400" /> {currentSession.start_time}
                  </span>
                  {currentSession.preacher && (
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-amber-400" /> {currentSession.preacher}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-2 border border-amber-200">
                <AlertCircle size={18} className="text-amber-700 shrink-0" />
                <span>No active Sunday service sessions found. Please check with the usher or union administrator.</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2 border border-red-200">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Authenticated Member Quick Check-In */}
            {isAuthenticated && user ? (
              <div className="rounded-3xl bg-primary-50/80 border border-primary-100 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-700 text-white grid place-items-center font-bold text-sm">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary-950">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-[10px] font-bold text-primary-800 uppercase">
                    Member
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Prayer Request / Note (Optional)</label>
                  <textarea
                    rows={2}
                    value={prayerRequest}
                    onChange={(e) => setPrayerRequest(e.target.value)}
                    placeholder="Share any prayer requests with our intercessory team..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <Button
                  variant="primary"
                  className="w-full gap-2 shadow-lg"
                  loading={authCheckInMutation.isPending}
                  onClick={handleAuthCheckIn}
                >
                  <CheckCircle2 size={16} /> 1-Tap Member Check-In
                </Button>
              </div>
            ) : (
              /* Public Check-In for Guests & Visitors */
              <div className="space-y-4">
                {/* Switch tabs: Visitor vs Fast Member Lookup */}
                <div className="flex rounded-2xl bg-slate-100/80 p-1 text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setActiveTab('visitor')}
                    className={`flex-1 rounded-xl py-2 transition ${
                      activeTab === 'visitor'
                        ? 'bg-white text-primary-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Visitor / Guest Check-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('member_lookup')}
                    className={`flex-1 rounded-xl py-2 transition ${
                      activeTab === 'member_lookup'
                        ? 'bg-white text-primary-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Registered Member Fast Check-In
                  </button>
                </div>

                {activeTab === 'visitor' ? (
                  <form onSubmit={handleVisitorSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input
                        label="Full Name *"
                        placeholder="e.g. Grace Wambui"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                      <Input
                        label="Phone Number"
                        type="tel"
                        placeholder="e.g. 0712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="e.g. grace@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Visitor Category</label>
                        <select
                          value={visitorType}
                          onChange={(e) => setVisitorType(e.target.value as any)}
                          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs outline-none focus:border-primary-500"
                        >
                          <option value="first_time">First-Time Visitor</option>
                          <option value="returning">Returning Guest</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Campus Faculty / School</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs outline-none focus:border-primary-500"
                      >
                        <option value="School of Applied & Health Sciences">School of Applied & Health Sciences</option>
                        <option value="School of Business & Social Sciences">School of Business & Social Sciences</option>
                        <option value="School of Humanities & Social Sciences">School of Humanities & Social Sciences</option>
                        <option value="School of Computing & Informatics">School of Computing & Informatics</option>
                        <option value="School of Engineering & Technology">School of Engineering & Technology</option>
                        <option value="Non-Student / Guest">Non-Student / Guest</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Prayer Request / Note (Optional)</label>
                      <textarea
                        rows={2}
                        value={prayerRequest}
                        onChange={(e) => setPrayerRequest(e.target.value)}
                        placeholder="How can we pray for you this week?"
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2 text-xs outline-none focus:border-primary-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full gap-2 shadow-lg"
                      loading={publicMutation.isPending}
                    >
                      <CheckCircle2 size={16} /> Complete Check-In
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleMemberLookupSubmit} className="space-y-4">
                    <p className="text-xs text-slate-500">
                      Enter your TUMCU registered email address or university admission number to check in quickly.
                    </p>
                    <Input
                      label="Email or Admission Number"
                      placeholder="e.g. member@tum.ac.ke or BT/001/2023"
                      value={memberIdentifier}
                      onChange={(e) => setMemberIdentifier(e.target.value)}
                      required
                    />
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Prayer Request (Optional)</label>
                      <textarea
                        rows={2}
                        value={prayerRequest}
                        onChange={(e) => setPrayerRequest(e.target.value)}
                        placeholder="Any prayer item for this week..."
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2 text-xs outline-none focus:border-primary-500"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full gap-2 shadow-lg"
                      loading={publicMutation.isPending}
                    >
                      <CheckCircle2 size={16} /> Submit Member Check-In
                    </Button>

                    <div className="text-center pt-2">
                      <Link to="/login" className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:underline">
                        <LogIn size={13} /> Or login with your account password
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p>© {new Date().getFullYear()} Technical University of Mombasa Christian Union (TUMCU)</p>
          <p>“Rooted and built up in Him, established in the faith.” — Colossians 2:7</p>
        </div>
      </div>
    </div>
  );
}
