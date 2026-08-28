import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  QrCode,
  Download,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Calendar,
  MapPin,
  Sparkles,
  UserCheck,
  Heart,
  FileSpreadsheet,
  Maximize2,
  ExternalLink,
  ChevronRight,
  UserPlus,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchMyAttendance,
  fetchAttendanceSessions,
  fetchSessionRoster,
  downloadAttendanceCsv,
  toggleSessionStatus,
  selfCheckIn,
  ATTENDABLE_TYPE_LABELS,
  type AttendanceSession,
  type AttendeeRosterItem,
  type AttendableType,
} from '@/features/attendance/attendance.api';
import { fetchMeetings } from '@/features/meetings/meetings.api';
import { SundayServiceQrModal } from '@/components/SundayServiceQrModal';
import { CreateSessionModal } from '@/components/CreateSessionModal';
import { ManualCheckInModal } from '@/components/ManualCheckInModal';
import { PageHeaderGuide } from '@/components/PageHeaderGuide';

const STATUS_META: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  present: { icon: CheckCircle2, color: 'text-emerald-800 bg-emerald-50 font-semibold' },
  late: { icon: Clock, color: 'text-amber-700 bg-amber-100 font-semibold' },
  excused: { icon: Clock, color: 'text-slate-600 bg-slate-100' },
  absent: { icon: XCircle, color: 'text-red-700 bg-red-50' },
};

function SelfCheckInForm({ onChecked }: { onChecked: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AttendableType>('sunday_service');
  const [id, setId] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');

  const mutation = useMutation({
    mutationFn: () => selfCheckIn(type, id, { prayerRequest: prayerRequest || undefined }),
    onSuccess: () => {
      setOpen(false);
      setId('');
      setPrayerRequest('');
      onChecked();
    },
  });

  return (
    <div>
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.div
            key="button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <Button variant="primary" className="gap-1.5 shadow-md hover:shadow-lg transition-all" onClick={() => setOpen(true)}>
              <QrCode size={16} /> Fast Check In
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            <Card variant="glass" className="border-primary-100/70 shadow-xl">
              <div className="mb-2 text-sm font-bold text-primary-950">Self Check-In</div>
              <p className="mb-3 text-xs leading-5 text-slate-500">
                Enter your fellowship or service session ID to confirm your attendance.
              </p>
              <div className="flex flex-col gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AttendableType)}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-xs outline-none backdrop-blur-sm"
                >
                  {(['sunday_service', 'bible_study', 'kesha', 'training', 'outreach', 'programme'] as const).map((t) => (
                    <option key={t} value={t}>
                      {ATTENDABLE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Session Code or ID (e.g. SUN-2026-0830)"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2 text-xs outline-none backdrop-blur-sm"
                />
                <textarea
                  placeholder="Optional prayer request..."
                  rows={2}
                  value={prayerRequest}
                  onChange={(e) => setPrayerRequest(e.target.value)}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2 text-xs outline-none backdrop-blur-sm"
                />
                <div className="flex gap-2 pt-1">
                  <Button disabled={!id.trim()} loading={mutation.isPending} onClick={() => mutation.mutate()} size="sm">
                    Confirm
                  </Button>
                  <Button variant="ghost" onClick={() => setOpen(false)} size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AttendancePage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();

  const isLeaderOrAdmin =
    hasPermission('attendance.view') ||
    hasPermission('attendance.record') ||
    hasPermission('leadership.assign') ||
    user?.role === 'super_admin' ||
    user?.role === 'system_admin' ||
    user?.role === 'executive_leader' ||
    user?.role === 'ministry_leader';

  const [activeTab, setActiveTab] = useState<'hub' | 'personal'>(isLeaderOrAdmin ? 'hub' : 'personal');

  // Modals state
  const [qrModalSession, setQrModalSession] = useState<AttendanceSession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manualCheckInSession, setManualCheckInSession] = useState<AttendanceSession | null>(null);

  // Selected session for Roster view
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState<'all' | 'members' | 'first_time' | 'returning'>('all');
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Queries
  const { data: myRecords, isLoading: loadingMyRecords } = useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: fetchMyAttendance,
  });

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['attendance', 'sessions'],
    queryFn: fetchAttendanceSessions,
    enabled: isLeaderOrAdmin,
  });

  const { data: meetings } = useQuery({ queryKey: ['meetings'], queryFn: fetchMeetings });
  const meetingTitle = (id: string) => meetings?.find((m) => m.id === id)?.title;

  // Active session selection
  const currentSession = sessions?.find((s) => s.id === (selectedSessionId || sessions[0]?.id)) || sessions?.[0];

  const { data: roster, isLoading: loadingRoster } = useQuery({
    queryKey: ['attendance', 'roster', currentSession?.id],
    queryFn: () => (currentSession ? fetchSessionRoster(currentSession.id) : Promise.resolve([])),
    enabled: !!currentSession && isLeaderOrAdmin,
  });

  // Toggle session status mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleSessionStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] });
    },
  });

  // Handle CSV Download
  async function handleDownloadCsv(session: AttendanceSession) {
    try {
      setExportingId(session.id);
      await downloadAttendanceCsv(session.id, session.title, session.session_date);
    } catch (err) {
      console.error('Failed to download CSV', err);
    } finally {
      setExportingId(null);
    }
  }

  // Filtered Roster
  const filteredRoster = (roster || []).filter((item) => {
    const matchesSearch =
      (item.full_name || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (item.admission_number || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (item.phone_number || '').toLowerCase().includes(rosterSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (rosterFilter === 'members') return item.is_member;
    if (rosterFilter === 'first_time') return !item.is_member && item.visitor_type === 'first_time';
    if (rosterFilter === 'returning') return !item.is_member && item.visitor_type === 'returning';
    return true;
  });

  const myPresentCount = myRecords?.filter((r) => r.status === 'present').length ?? 0;
  const totalSessionAttendees = roster?.length || 0;
  const totalMembers = roster?.filter((r) => r.is_member).length || 0;
  const totalVisitors = roster?.filter((r) => !r.is_member).length || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Interactive Guide */}
      <PageHeaderGuide
        title="Sunday Service & Attendance Hub"
        badge="Contact-Free Check-In"
        subtitle="Manage Sunday service sessions, display high-resolution QR codes for instant member check-in, and view live attendance rosters."
        summarySteps={[
          {
            title: '1. Scan QR / Check-In',
            description: 'Members scan the screen QR code or enter their admission number in 10 seconds.',
            badge: 'Scan & Go',
          },
          {
            title: '2. Live Attendance Roster',
            description: 'Rosters update in real-time with member vs visitor breakdowns and timestamped logs.',
            badge: 'Real-time',
          },
          {
            title: '3. Ministry & Service Exports',
            description: 'Export official attendance sheets to CSV for church administration and follow-up.',
            badge: 'CSV Export',
          },
        ]}
        quickTips={[
          'Use the "Projector Mode" inside the Sunday Service QR modal to display the code on large projection screens.',
          'Visitors can register their phone numbers and prayer requests during check-in for hospitality follow-up.',
          'Leaders can also use Manual Register Entry to check in brethren without smartphones.',
        ]}
        actionButton={
          isLeaderOrAdmin && activeTab === 'hub'
            ? {
                label: 'Generate Sunday Service QR',
                onClick: () => setShowCreateModal(true),
                icon: Plus,
              }
            : undefined
        }
      />

      {/* Tabs / Switcher */}
      <div className="flex items-center justify-between">
        {isLeaderOrAdmin ? (
          <div className="flex rounded-2xl bg-slate-100/90 p-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('hub')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'hub' ? 'bg-white text-primary-950 shadow-xs font-black' : 'text-slate-500'
              }`}
            >
              Service QR & Rosters
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`rounded-xl px-3.5 py-1.5 transition ${
                activeTab === 'personal' ? 'bg-white text-primary-950 shadow-xs font-black' : 'text-slate-500'
              }`}
            >
              My History
            </button>
          </div>
        ) : (
          <div />
        )}

        {activeTab === 'personal' && (
          <SelfCheckInForm onChecked={() => queryClient.invalidateQueries({ queryKey: ['attendance', 'me'] })} />
        )}
      </div>

      {/* ADMIN & LEADER HUB TAB */}
      {isLeaderOrAdmin && activeTab === 'hub' && (
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="glass" className="p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Services</span>
                <Sparkles size={16} className="text-primary-700" />
              </div>
              <div className="text-2xl font-black text-primary-950">
                {sessions?.filter((s) => s.is_active).length || 0}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Ready for QR check-in</div>
            </Card>

            <Card variant="glass" className="p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Current Attendance</span>
                <Users size={16} className="text-emerald-700" />
              </div>
              <div className="text-2xl font-black text-emerald-800">{totalSessionAttendees}</div>
              <div className="text-xs text-slate-500 mt-0.5">{currentSession?.title || 'Selected Service'}</div>
            </Card>

            <Card variant="glass" className="p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Registered Members</span>
                <UserCheck size={16} className="text-primary-700" />
              </div>
              <div className="text-2xl font-black text-primary-900">{totalMembers}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {totalSessionAttendees > 0 ? `${Math.round((totalMembers / totalSessionAttendees) * 100)}% of total` : '0%'}
              </div>
            </Card>

            <Card variant="glass" className="p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Visitors & Guests</span>
                <Heart size={16} className="text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-800">{totalVisitors}</div>
              <div className="text-xs text-slate-500 mt-0.5">Prompted to register</div>
            </Card>
          </div>

          {/* Service Sessions Carousel / Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-primary-950">Sunday Services & Scheduled Sessions</h2>
              <span className="text-xs text-slate-500">{sessions?.length || 0} sessions available</span>
            </div>

            {loadingSessions ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/50" />
                ))}
              </div>
            ) : sessions?.length === 0 ? (
              <Card variant="glass" className="p-8 text-center text-sm text-slate-500">
                <QrCode size={36} className="mx-auto mb-2 text-slate-400" />
                <p className="font-bold text-primary-950">No Attendance Sessions Created</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Generate Sunday Service QR" above to create this Sunday's check-in session.
                </p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions?.map((sess) => {
                  const isSelected = sess.id === currentSession?.id;
                  return (
                    <motion.div
                      key={sess.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card
                        variant="glass"
                        className={`p-5 space-y-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500/80 shadow-md ring-2 ring-primary-500/20 bg-white/95'
                            : 'border-white/70 hover:border-primary-200'
                        }`}
                        onClick={() => setSelectedSessionId(sess.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  sess.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {sess.is_active ? 'Active' : 'Closed'}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-500">{sess.code}</span>
                            </div>
                            <h3 className="text-sm font-bold text-primary-950 mt-1.5 line-clamp-1">{sess.title}</h3>
                          </div>
                        </div>

                        {sess.theme && (
                          <p className="text-xs text-slate-600 italic line-clamp-1 border-l-2 border-primary-500 pl-2">
                            "{sess.theme}"
                          </p>
                        )}

                        <div className="space-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-primary-700 shrink-0" />
                            <span>
                              {sess.session_date} · {sess.start_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-primary-700 shrink-0" />
                            <span className="truncate">{sess.venue}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                          <div className="font-bold text-primary-900">
                            {sess.attendees_count ?? 0} <span className="font-normal text-slate-500">attendees</span>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs gap-1 py-1 px-2.5"
                              onClick={() => setQrModalSession(sess)}
                            >
                              <QrCode size={13} /> View QR
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs p-1.5 text-slate-600 hover:text-primary-900"
                              title="Download CSV Records"
                              loading={exportingId === sess.id}
                              onClick={() => handleDownloadCsv(sess)}
                            >
                              <Download size={15} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Session Roster & Export Panel */}
          {currentSession && (
            <Card variant="glass" className="p-6 border-white/80 shadow-xl space-y-5">
              {/* Roster Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-[10px] font-bold text-primary-800 uppercase">
                      Live Attendee Roster
                    </span>
                    <span className="font-mono text-xs text-slate-400 font-semibold">{currentSession.code}</span>
                  </div>
                  <h2 className="text-lg font-black text-primary-950 mt-1">{currentSession.title}</h2>
                  <p className="text-xs text-slate-500">
                    {currentSession.session_date} · {currentSession.venue} · {roster?.length || 0} total attendees
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setManualCheckInSession(currentSession)}
                  >
                    <UserPlus size={14} /> Add Walk-In Attendee
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setQrModalSession(currentSession)}
                  >
                    <Maximize2 size={14} /> Projector / QR
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5 text-xs shadow-md"
                    loading={exportingId === currentSession.id}
                    onClick={() => handleDownloadCsv(currentSession)}
                  >
                    <Download size={14} /> Download Records (CSV)
                  </Button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Search attendee by name, admission, phone..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 pl-9 pr-3 py-2 text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
                  {(
                    [
                      { key: 'all', label: 'All' },
                      { key: 'members', label: 'Full Members' },
                      { key: 'first_time', label: '1st-Time Visitors' },
                      { key: 'returning', label: 'Returning Guests' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setRosterFilter(f.key)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
                        rosterFilter === f.key
                          ? 'bg-primary-900 text-white'
                          : 'bg-white/70 text-slate-600 hover:bg-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster Table */}
              {loadingRoster ? (
                <div className="space-y-2 py-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/60" />
                  ))}
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                  <Users size={28} className="mx-auto mb-2 text-slate-400" />
                  No attendees matching filter. Project the QR code for attendees to check in.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/70">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Attendee Name</th>
                        <th className="py-3 px-4">Classification</th>
                        <th className="py-3 px-4">Admission / ID</th>
                        <th className="py-3 px-4">Phone / Email</th>
                        <th className="py-3 px-4">Method & Time</th>
                        <th className="py-3 px-4">Prayer Requests / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRoster.map((att, idx) => (
                        <tr key={att.id} className="hover:bg-white/90 transition">
                          <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-primary-950">{att.full_name}</div>
                            {att.school_faculty && (
                              <div className="text-[10px] text-slate-400">{att.school_faculty}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {att.is_member ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                                <CheckCircle2 size={11} /> Full Member
                              </span>
                            ) : att.visitor_type === 'first_time' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <Heart size={11} /> 1st-Time Visitor
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                Guest
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {att.admission_number || att.membership_number || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <div>{att.phone_number || '—'}</div>
                            {att.email && <div className="text-[11px] text-slate-400">{att.email}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            <div className="capitalize">{att.method.replace(/_/g, ' ')}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(att.checked_in_at).toLocaleTimeString('en-KE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                            {att.prayer_request || att.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* MEMBER PERSONAL ATTENDANCE TAB */}
      {(activeTab === 'personal' || !isLeaderOrAdmin) && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="glass" className="w-fit px-6 py-4 shadow-sm">
              <div className="text-3xl font-black text-primary-900">{myPresentCount}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sessions attended</div>
            </Card>
          </motion.div>

          {loadingMyRecords && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/50" />
              ))}
            </div>
          )}

          {!loadingMyRecords && myRecords?.length === 0 && (
            <Card variant="glass" className="p-8 text-center text-sm text-slate-500">
              <QrCode size={32} className="mx-auto mb-2 text-slate-400" />
              No attendance recorded yet. Scan the Sunday service QR code or enter session code above to check in.
            </Card>
          )}

          <motion.div layout className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {myRecords?.map((record, idx) => {
                const meta = STATUS_META[record.status] ?? STATUS_META.present;
                const Icon = meta.icon;
                const title =
                  record.attendable_type === 'meeting' ? meetingTitle(record.attendable_id) : undefined;
                return (
                  <motion.div
                    layout
                    key={record.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    whileHover={{ x: 3 }}
                  >
                    <Card variant="glass" className="flex items-center justify-between py-3.5 transition-shadow hover:shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                            {ATTENDABLE_TYPE_LABELS[record.attendable_type] || record.attendable_type}
                          </span>
                          {title && <span className="text-sm font-bold text-primary-950">{title}</span>}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {record.checked_in_at
                            ? new Date(record.checked_in_at).toLocaleString('en-KE', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Not yet checked in'}
                          {' · '}
                          <span className="capitalize">{record.method.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${meta.color}`}>
                        <Icon size={13} /> {record.status}
                      </span>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* QR MODAL */}
      {qrModalSession && (
        <SundayServiceQrModal
          session={qrModalSession}
          onClose={() => setQrModalSession(null)}
        />
      )}

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newSession) => {
            setShowCreateModal(false);
            setSelectedSessionId(newSession.id);
            setQrModalSession(newSession); // Automatically open QR view!
          }}
        />
      )}

      {/* MANUAL WALK-IN MODAL */}
      {manualCheckInSession && (
        <ManualCheckInModal
          session={manualCheckInSession}
          onClose={() => setManualCheckInSession(null)}
          onSuccess={() => setManualCheckInSession(null)}
        />
      )}
    </div>
  );
}
