import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HandHeart,
  ShieldCheck,
  Users,
  QrCode,
  Sparkles,
  Download,
  Edit3,
  RotateCcw,
  Save,
  Trash2,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  History,
  Building,
  GraduationCap,
  Phone,
  Mail,
  Vote,
  Church,
  WalletCards,
  FileSpreadsheet,
  Check,
  Plus,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore, type AuditEditItem } from '@/store/dashboard.store';
import {
  fetchMyMembershipStatus,
  fetchAllMembers,
  deleteMemberApi,
  type MemberListItem,
  fetchPendingApplications,
} from '@/features/membership/membership.api';
import { fetchPublicEvents } from '@/features/events/events.api';
import { fetchMyAttendance, fetchAttendanceSessions, type AttendanceSession } from '@/features/attendance/attendance.api';
import { fetchMeetings, type Meeting } from '@/features/meetings/meetings.api';
import { fetchPrayerRequests } from '@/features/prayer/prayer.api';
import { SundayServiceQrModal } from '@/components/SundayServiceQrModal';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function DashboardOverviewPage() {
  const { user, hasPermission } = useAuthStore();
  const queryClient = useQueryClient();

  const isSuperAdmin =
    user?.role === 'super_admin' ||
    user?.role === 'system_admin' ||
    user?.role === 'chairperson' ||
    user?.role === 'secretary';

  // Dashboard store for editable writings & audit logs
  const {
    writings,
    auditLogs,
    isEditMode,
    toggleEditMode,
    updateWritings,
    resetWritings,
    addAuditLog,
  } = useDashboardStore();

  // Local state for editing writings modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editHeroEyebrow, setEditHeroEyebrow] = useState(writings.heroEyebrow);
  const [editHeroTitle, setEditHeroTitle] = useState(writings.heroTitle);
  const [editHeroSubtitle, setEditHeroSubtitle] = useState(writings.heroSubtitle);
  const [editSpiritualTheme, setEditSpiritualTheme] = useState(writings.spiritualTheme);
  const [editVerseOfTheWeek, setEditVerseOfTheWeek] = useState(writings.verseOfTheWeek);
  const [editAnnouncementTitle, setEditAnnouncementTitle] = useState(writings.announcementTitle);
  const [editAnnouncementText, setEditAnnouncementText] = useState(writings.announcementText);
  const [editMotto, setEditMotto] = useState(writings.motto);
  const [editPresidentialDirective, setEditPresidentialDirective] = useState(writings.presidentialDirective);
  const [editAnnouncementActive, setEditAnnouncementActive] = useState(writings.announcementActive);

  // Sunday Service QR Modal state
  const [isSundayQrOpen, setIsSundayQrOpen] = useState(false);

  // Overview Member Register state
  const [memberSearch, setMemberSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [memberToDelete, setMemberToDelete] = useState<MemberListItem | null>(null);

  // Audit filter state
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>('all');

  // Queries
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: fetchMyMembershipStatus,
  });

  const { data: allMembers = [], isLoading: allMembersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['membership', 'all-overview', memberSearch, yearFilter],
    queryFn: () =>
      fetchAllMembers({
        search: memberSearch,
        yearOfStudy: yearFilter,
      }),
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'public'],
    queryFn: fetchPublicEvents,
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['attendance', 'sessions'],
    queryFn: fetchAttendanceSessions,
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: fetchMyAttendance,
  });

  const { data: prayers, isLoading: prayersLoading } = useQuery({
    queryKey: ['prayer-requests'],
    queryFn: fetchPrayerRequests,
  });

  const { data: applications } = useQuery({
    queryKey: ['membership', 'applications', 'pending'],
    queryFn: fetchPendingApplications,
    enabled: hasPermission('membership.review') || hasPermission('membership.approve'),
  });

  // Delete member mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMemberApi,
    onSuccess: (_, deletedId) => {
      const deletedMember = allMembers.find((m) => m.id === deletedId || m.user_id === deletedId);
      const name = deletedMember?.full_name || 'Member Record';
      const adm = deletedMember?.admission_number || '';

      addAuditLog({
        module: 'Membership',
        action: 'Deleted Member from Official Register',
        details: `Deleted member record: ${name} (${adm}) from TUMCU register`,
        actor: typeof user?.full_name === 'string' ? user.full_name : 'Super Admin',
        role: 'Super Admin',
      });

      setMemberToDelete(null);
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
    onError: () => {
      alert('Failed to delete member.');
    },
  });

  function handleSaveDashboardWritings() {
    updateWritings(
      {
        heroEyebrow: editHeroEyebrow,
        heroTitle: editHeroTitle,
        heroSubtitle: editHeroSubtitle,
        spiritualTheme: editSpiritualTheme,
        verseOfTheWeek: editVerseOfTheWeek,
        announcementTitle: editAnnouncementTitle,
        announcementText: editAnnouncementText,
        announcementActive: editAnnouncementActive,
        motto: editMotto,
        presidentialDirective: editPresidentialDirective,
      },
      typeof user?.full_name === 'string' ? user.full_name : 'Super Admin'
    );
    setIsEditModalOpen(false);
  }

  function handleResetDashboardWritings() {
    if (confirm('Are you sure you want to reset all dashboard writings to system default?')) {
      resetWritings(typeof user?.full_name === 'string' ? user.full_name : 'Super Admin');
      setEditHeroEyebrow(writings.heroEyebrow);
      setEditHeroTitle(writings.heroTitle);
      setEditHeroSubtitle(writings.heroSubtitle);
      setEditSpiritualTheme(writings.spiritualTheme);
      setEditVerseOfTheWeek(writings.verseOfTheWeek);
      setEditAnnouncementTitle(writings.announcementTitle);
      setEditAnnouncementText(writings.announcementText);
      setEditMotto(writings.motto);
      setEditPresidentialDirective(writings.presidentialDirective);
      setIsEditModalOpen(false);
    }
  }

  // Helper to safely match year of study whether string or number
  const isYear = (val: unknown, target: number) => {
    if (val === null || val === undefined) return false;
    const s = String(val).toLowerCase();
    return s.includes(`year ${target}`) || s === String(target);
  };

  // Derived Tallies
  const totalRegisteredMembers = allMembers.length;
  const year1Count = allMembers.filter((m) => isYear(m.year_of_study, 1)).length;
  const year2Count = allMembers.filter((m) => isYear(m.year_of_study, 2)).length;
  const year3Count = allMembers.filter((m) => isYear(m.year_of_study, 3)).length;
  const year4PlusCount = allMembers.filter((m) => isYear(m.year_of_study, 4) || isYear(m.year_of_study, 5)).length;

  const totalSundayCheckIns = sessions.reduce((acc, s) => acc + (s.attendees_count || 0), 0);
  const activeSessionsCount = sessions.filter((s) => s.is_active).length;
  const upcomingMeetingsCount = meetings.filter((m) => m.status === 'scheduled').length;
  const upcomingEventsCount = events.filter((e) => new Date(e.start_at).getTime() >= Date.now()).length;

  const filteredAuditLogs = useMemo(() => {
    if (auditModuleFilter === 'all') return auditLogs;
    return auditLogs.filter((log) => log.module === auditModuleFilter);
  }, [auditLogs, auditModuleFilter]);

  const activeMembership = membership?.memberships.find((m) => m.status === 'active');
  const firstName = String(user?.full_name ?? 'Leader').trim().split(/\s+/)[0] || 'Leader';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-7 pb-12">
      {/* Top Banner: Sunday Service Attendance QR Code Quick Launcher */}
      <motion.section variants={itemVariants}>
        <Card
          variant="glass"
          className="border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-primary-500/10 to-primary-900/10 p-5 sm:p-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-400 text-slate-950 shadow-md font-black">
                <QrCode size={28} />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/60 px-3 py-0.5 text-xs font-black text-amber-950 uppercase tracking-wider mb-1">
                  <Sparkles size={13} className="text-amber-700" /> Sunday Service Attendance Studio
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-primary-950">
                  Sunday Main Worship & Word Service QR Code
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                  Code: <strong className="font-mono text-primary-900 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">SUN-REVIVAL-2026</strong> · Fullscreen projector display, customizable check-in code, live member & visitor check-in roster.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="primary"
                onClick={() => setIsSundayQrOpen(true)}
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 text-xs sm:text-sm px-4 py-2.5"
              >
                <QrCode size={16} /> Open Sunday Service QR
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsSundayQrOpen(true)}
                className="gap-1.5 text-xs font-bold px-3 py-2.5 bg-white border border-slate-200 text-primary-950"
              >
                <Maximize2 size={14} /> Projector Mode
              </Button>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Hero Welcome & Editable Writings Header */}
      <motion.section
        variants={itemVariants}
        className="mesh-hero-bg overflow-hidden rounded-[2rem] border border-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-8 relative"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="eyebrow flex items-center gap-1.5">
                <CheckCircle2 size={14} /> {writings.heroEyebrow}
              </span>
              {isSuperAdmin && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-primary-800 border border-primary-200/70 hover:bg-primary-50 transition shadow-xs flex items-center gap-1"
                  title="Edit Dashboard Writings"
                >
                  <Edit3 size={11} /> Edit Writings
                </button>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary-950">
              {writings.heroTitle.includes('Super Admin')
                ? writings.heroTitle
                : `${writings.heroTitle}, ${firstName}.`}
            </h1>
            <p className="text-sm sm:text-base leading-6 text-slate-600 font-medium">
              {writings.heroSubtitle}
            </p>

            {/* Spiritual Theme & Scripture Banner */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-semibold text-primary-900">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary-100/70 px-3 py-1.5 border border-primary-200/60">
                <Sparkles size={14} className="text-primary-700 shrink-0" />
                <span>{writings.spiritualTheme}</span>
              </div>
              <span className="italic text-slate-600">"{writings.verseOfTheWeek}"</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0 pt-2 lg:pt-0">
            {isSuperAdmin && (
              <Button
                variant="primary"
                onClick={() => setIsEditModalOpen(true)}
                className="gap-2 bg-primary-900 text-white font-bold text-xs sm:text-sm shadow-md"
              >
                <Edit3 size={15} /> Edit Dashboard Content
              </Button>
            )}
            <Link to="/dashboard/membership">
              <Button variant="secondary" className="gap-2 text-xs sm:text-sm">
                <Users size={15} /> Full Member Register
              </Button>
            </Link>
            <Link to="/dashboard/meetings">
              <Button variant="secondary" className="gap-2 text-xs sm:text-sm">
                <CalendarDays size={15} /> Meetings & Events
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Announcement Banner if active */}
        {writings.announcementActive && writings.announcementText && (
          <div className="mt-5 rounded-2xl bg-gold-50/80 border border-gold-200/90 p-4 text-xs sm:text-sm text-gold-950 flex items-start gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gold-200 text-gold-900 font-black text-xs mt-0.5">
              !
            </span>
            <div className="flex-1">
              <strong className="font-black text-gold-900 mr-2">{writings.announcementTitle}:</strong>
              <span>{writings.announcementText}</span>
            </div>
          </div>
        )}
      </motion.section>

      {/* SECTION 1: EVERY TALLY (Comprehensive Live System Tallies) */}
      <motion.section variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-primary-950">Every System Tally & Live Counts</h2>
            <p className="text-xs text-slate-500">Live metrics across membership, Sunday services, ministries, elections & finance</p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 border border-primary-200/60">
            Real-Time Audit Sync
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Tally 1: Registered Members */}
          <Card variant="glass" className="p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Members</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-50 text-primary-700">
                <Users size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-primary-950">{totalRegisteredMembers}</div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              Y1: {year1Count} · Y2: {year2Count} · Y3: {year3Count} · Y4+: {year4PlusCount}
            </p>
          </Card>

          {/* Tally 2: Sunday Check-ins */}
          <Card variant="glass" className="p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sunday Check-ins</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-800">
                <QrCode size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-primary-950">{totalSundayCheckIns}</div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {activeSessionsCount} active Sunday {activeSessionsCount === 1 ? 'session' : 'sessions'}
            </p>
          </Card>

          {/* Tally 3: Constitutional Ministries */}
          <Card variant="glass" className="p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ministries</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-50 text-primary-700">
                <Church size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-primary-950">12 / 12</div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              12 Constitutional Ministries
            </p>
          </Card>

          {/* Tally 4: Elections & Ballots */}
          <Card variant="glass" className="p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Elections & Votes</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gold-50 text-gold-700">
                <Vote size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-primary-950">Active</div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              Constitutional Voting Portal
            </p>
          </Card>

          {/* Tally 5: Scheduled Meetings & Events */}
          <Card variant="glass" className="p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Meetings & Events</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-50 text-primary-700">
                <CalendarDays size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-primary-950">{upcomingMeetingsCount + upcomingEventsCount} Upcoming</div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {meetings.length} Total records logged
            </p>
          </Card>

          {/* Tally 6: Pending Applications */}
          <Card variant="glass" className="p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Applications</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck size={16} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-primary-950">
              {applications?.length ?? 0} Pending
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {prayers?.length ?? 0} Prayer requests open
            </p>
          </Card>
        </div>
      </motion.section>

      {/* SECTION 2: EVERYTHING THAT HAS BEEN EDITED (Live System Audit Trail Log) */}
      <motion.section variants={itemVariants}>
        <Card variant="glass" className="p-6 border border-slate-200/80 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-900 text-white shadow-sm">
                <History size={18} />
              </span>
              <div>
                <h2 className="text-base font-black text-primary-950">System Audit Trail & Recent Edits</h2>
                <p className="text-xs text-slate-500">
                  Live constitutional audit showing every modification made to the dashboard, membership, QR codes & meetings
                </p>
              </div>
            </div>

            {/* Filter by module */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter:</span>
              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">All Modules ({auditLogs.length})</option>
                <option value="Dashboard">Dashboard</option>
                <option value="Membership">Membership</option>
                <option value="Attendance & QR">Attendance & QR</option>
                <option value="Meetings & Events">Meetings & Events</option>
                <option value="Elections">Elections</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No edits recorded for this category.</div>
            ) : (
              filteredAuditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-lg bg-primary-100 px-2 py-1 font-bold text-primary-800 text-[10px] shrink-0 uppercase tracking-wider">
                      {log.module}
                    </span>
                    <div>
                      <p className="font-bold text-primary-950 text-xs sm:text-sm">{log.action}</p>
                      <p className="text-slate-600 text-xs mt-0.5">{log.details}</p>
                      {log.previousValue && log.newValue && (
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">
                          Changed: <span className="line-through">{log.previousValue}</span> → <strong className="text-primary-900">{log.newValue}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-right shrink-0">
                    <span className="font-semibold text-slate-800">{log.actor}</span>
                    <span className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {formatDate(log.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.section>

      {/* SECTION 3: EVERY MEMBER THAT IS ON THE MEMBERSHIP PAGE TAB (Live Mirror with Delete Only) */}
      <motion.section variants={itemVariants}>
        <Card variant="glass" className="p-6 border border-slate-200/80 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700">
                <Users size={20} />
              </span>
              <div>
                <h2 className="text-base font-black text-primary-950">Official Registered Members Register</h2>
                <p className="text-xs text-slate-500">
                  Live mirror of membership tab · Super Admin can view all member details and perform member deletions
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/membership"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900"
            >
              Open Full Membership Tab <ArrowRight size={14} />
            </Link>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search member name, admission number, or department..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 outline-none"
              />
            </div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none"
            >
              <option value="all">All Years of Study</option>
              <option value="Year 1">Year 1</option>
              <option value="Year 2">Year 2</option>
              <option value="Year 3">Year 3</option>
              <option value="Year 4">Year 4 & 5</option>
            </select>
          </div>

          {/* Member List Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Adm & Member No</th>
                  <th className="py-3 px-4">Year & Dept</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allMembersLoading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">Loading members register...</td>
                  </tr>
                ) : allMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">No members found matching your search.</td>
                  </tr>
                ) : (
                  allMembers.slice(0, 8).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-primary-950">{m.full_name}</div>
                        <span className="text-[10px] text-slate-400">{m.role_name || 'Member'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700 font-bold">{m.admission_number || '—'}</div>
                        <span className="text-[10px] text-slate-400">{m.membership_number}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-800">
                          {m.year_of_study}
                        </span>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{m.department}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{m.phone_number}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{m.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                          <Check size={11} /> Present
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isSuperAdmin && (
                          <button
                            onClick={() => setMemberToDelete(m)}
                            className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition"
                            title="Delete Member"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Showing first 8 of {allMembers.length} registered members</span>
            <Link to="/dashboard/membership" className="font-bold text-primary-700 hover:underline">
              View all {allMembers.length} members →
            </Link>
          </div>
        </Card>
      </motion.section>

      {/* SECTION 4: MEETINGS & EVENTS OVERVIEW */}
      <motion.section variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Meetings Card */}
        <Card variant="glass" className="p-6 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-700">
                <CalendarDays size={18} />
              </span>
              <div>
                <h3 className="font-black text-primary-950">Meetings & Executive Sessions</h3>
                <p className="text-xs text-slate-500">Agendas, QR codes & official minutes</p>
              </div>
            </div>
            <Link to="/dashboard/meetings" className="text-xs font-bold text-primary-700 hover:underline">
              All Meetings →
            </Link>
          </div>

          <div className="space-y-3">
            {meetings.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <div className="font-bold text-primary-950">{m.title}</div>
                  <p className="text-slate-500 mt-0.5">
                    {formatDate(m.scheduled_at)} · {m.venue || 'Sanctuary'}
                  </p>
                </div>
                <Link to="/dashboard/meetings">
                  <Button size="sm" variant="outline" className="text-[11px] font-bold px-2.5 py-1">
                    Manage / QR
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Public Events Card */}
        <Card variant="glass" className="p-6 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-100 text-gold-800">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="font-black text-primary-950">Upcoming Church Events</h3>
                <p className="text-xs text-slate-500">Missions, worship nights & retreats</p>
              </div>
            </div>
            <Link to="/events" className="text-xs font-bold text-primary-700 hover:underline">
              Public Calendar →
            </Link>
          </div>

          <div className="space-y-3">
            {events.slice(0, 3).map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <div className="font-bold text-primary-950">{e.title}</div>
                  <p className="text-slate-500 mt-0.5">
                    {formatDate(e.start_at)} · {e.location || 'TUM Campus'}
                  </p>
                </div>
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                  {e.event_type}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.section>

      {/* EDIT DASHBOARD WRITINGS MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-xl font-black text-primary-950 flex items-center gap-2">
                    <Edit3 size={20} className="text-primary-700" /> Edit Dashboard Writings & Text
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Super Admin controls to customize all writings, headlines, themes, scripture verses, and announcements.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hero Eyebrow Banner</label>
                  <input
                    value={editHeroEyebrow}
                    onChange={(e) => setEditHeroEyebrow(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Main Welcome Headline</label>
                    <input
                      value={editHeroTitle}
                      onChange={(e) => setEditHeroTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Theme of the Spiritual Year</label>
                    <input
                      value={editSpiritualTheme}
                      onChange={(e) => setEditSpiritualTheme(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hero Subtitle Description</label>
                  <textarea
                    rows={2}
                    value={editHeroSubtitle}
                    onChange={(e) => setEditHeroSubtitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Scripture Verse of the Week</label>
                    <input
                      value={editVerseOfTheWeek}
                      onChange={(e) => setEditVerseOfTheWeek(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Christian Union Motto</label>
                    <input
                      value={editMotto}
                      onChange={(e) => setEditMotto(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950">Live Announcement Notice Bar</span>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-900">
                      <input
                        type="checkbox"
                        checked={editAnnouncementActive}
                        onChange={(e) => setEditAnnouncementActive(e.target.checked)}
                        className="rounded h-4 w-4 text-amber-600"
                      />
                      Show on Dashboard
                    </label>
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Announcement Title</label>
                    <input
                      value={editAnnouncementTitle}
                      onChange={(e) => setEditAnnouncementTitle(e.target.value)}
                      className="w-full rounded-xl border border-amber-300 bg-white p-2 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Announcement Body Text</label>
                    <textarea
                      rows={2}
                      value={editAnnouncementText}
                      onChange={(e) => setEditAnnouncementText(e.target.value)}
                      className="w-full rounded-xl border border-amber-300 bg-white p-2 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDashboardWritings}
                  className="gap-1.5 text-red-700 border-red-200 hover:bg-red-50 text-xs font-bold"
                >
                  <RotateCcw size={14} /> Reset Defaults
                </Button>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveDashboardWritings}
                    className="gap-1.5 bg-primary-900 text-white font-bold text-xs"
                  >
                    <Save size={14} /> Save Writings & Log Audit
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MEMBER CONFIRMATION MODAL */}
      <AnimatePresence>
        {memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-black text-slate-900">Delete Member Record</h3>
              </div>
              <p className="text-xs text-slate-600 leading-5">
                Are you sure you want to delete <strong>{memberToDelete.full_name}</strong> ({memberToDelete.admission_number || memberToDelete.email}) from the official TUMCU register?
              </p>
              <p className="mt-2 text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 font-semibold">
                This action will be permanently recorded in the system audit trail.
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setMemberToDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(memberToDelete.id || memberToDelete.user_id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirm Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUNDAY SERVICE QR MODAL */}
      {isSundayQrOpen && (
        <SundayServiceQrModal onClose={() => setIsSundayQrOpen(false)} />
      )}
    </motion.div>
  );
}
