import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  HandHeart,
  ShieldCheck,
  Users,
  QrCode,
  Sparkles,
  History,
  Building,
  Church,
  Headphones,
  ClipboardCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
import {
  fetchMyMembershipStatus,
  fetchAllMembers,
  fetchPendingApplications,
} from '@/features/membership/membership.api';
import { fetchPublicEvents } from '@/features/events/events.api';
import { fetchAttendanceSessions } from '@/features/attendance/attendance.api';
import { fetchMeetings } from '@/features/meetings/meetings.api';
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

  const isSuperAdmin =
    user?.role === 'super_admin' ||
    user?.role === 'system_admin' ||
    user?.role === 'chairperson' ||
    user?.role === 'secretary';

  // Dashboard store for theme writings & audit logs
  const { writings, auditLogs } = useDashboardStore();

  // Sunday Service QR Modal state
  const [isSundayQrOpen, setIsSundayQrOpen] = useState(false);

  // Queries
  const { data: membership } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: fetchMyMembershipStatus,
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ['membership', 'all-overview'],
    queryFn: () => fetchAllMembers(),
    enabled: hasPermission('membership.view_all') || hasPermission('membership.review'),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', 'public'],
    queryFn: fetchPublicEvents,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['attendance', 'sessions'],
    queryFn: fetchAttendanceSessions,
  });

  const { data: applications } = useQuery({
    queryKey: ['membership', 'applications', 'pending'],
    queryFn: fetchPendingApplications,
    enabled: hasPermission('membership.review') || hasPermission('membership.approve'),
  });

  // Derived Tallies
  const totalRegisteredMembers = allMembers.length;
  const totalSundayCheckIns = sessions.reduce((acc, s) => acc + (s.attendees_count || 0), 0);
  const activeSessionsCount = sessions.filter((s) => s.is_active).length;
  const upcomingMeetingsCount = meetings.filter((m) => m.status === 'scheduled').length;
  const upcomingEventsCount = events.filter((e) => new Date(e.start_at).getTime() >= Date.now()).length;

  const activeMembership = membership?.memberships?.find((m) => m.status === 'active') ?? membership?.memberships?.[0];
  const userFullName = typeof user?.full_name === 'string' && user.full_name.trim() ? user.full_name.trim() : '';
  const firstName = userFullName ? userFullName.split(/\s+/)[0] : (isSuperAdmin ? 'Admin' : 'Member');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-12">
      {/* Clean, Friendly Header */}
      <motion.section
        variants={itemVariants}
        className="mesh-hero-bg overflow-hidden rounded-[2rem] border border-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-7 relative"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="eyebrow flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={13} />{' '}
                {isSuperAdmin ? 'TUMCU Executive Portal' : 'Technical University of Mombasa Christian Union'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary-950">
              {isSuperAdmin ? `Welcome, ${firstName}` : firstName}
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
              {isSuperAdmin
                ? 'Oversee fellowship operations, Sunday attendance, and review pending member registrations.'
                : 'Welcome to your TUMCU fellowship portal. Connect with ministries, attend Sunday services, and view fellowship updates.'}
            </p>

            {/* Spiritual Theme & Scripture Banner */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary-900">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary-100/70 px-2.5 py-1 border border-primary-200/60">
                <Sparkles size={13} className="text-primary-700 shrink-0" />
                <span>{writings.spiritualTheme}</span>
              </div>
              <span className="italic text-slate-600 text-[11px]">"{writings.verseOfTheWeek}"</span>
            </div>
          </div>

          {/* Simple, Purpose-Driven Action Buttons (Only 2 essential buttons) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isSuperAdmin ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => setIsSundayQrOpen(true)}
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-sm px-4 py-2.5"
                >
                  <QrCode size={16} /> Sunday Service QR
                </Button>
                <Link to="/dashboard/admin/applications">
                  <Button variant="secondary" className="gap-2 text-xs sm:text-sm border-slate-200 px-4 py-2.5">
                    <ClipboardCheck size={16} /> Applications {applications && applications.length > 0 ? `(${applications.length})` : ''}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard/attendance">
                  <Button variant="primary" className="gap-2 bg-primary-900 text-white font-bold text-xs sm:text-sm shadow-md">
                    <QrCode size={15} /> Fast Check-In
                  </Button>
                </Link>
                <Link to="/dashboard/membership">
                  <Button variant="secondary" className="gap-2 text-xs sm:text-sm">
                    <Users size={15} /> My Membership
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live Announcement Banner if active */}
        {writings.announcementActive && writings.announcementText && (
          <div className="mt-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-lg bg-amber-200 text-amber-900 font-bold text-[11px] mt-0.5">
              !
            </span>
            <div className="flex-1">
              <strong className="font-bold text-amber-900 mr-2">{writings.announcementTitle}:</strong>
              <span>{writings.announcementText}</span>
            </div>
          </div>
        )}
      </motion.section>

      {/* MEMBER VIEW: Clean, friendly personal hub */}
      {!isSuperAdmin && (
        <>
          {/* Member Card & Status */}
          <motion.section variants={itemVariants} className="grid gap-4 md:grid-cols-3">
            <Card variant="glass" className="p-5 md:col-span-2 border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-700 font-bold">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-primary-950">Official Membership Standing</h2>
                    <p className="text-[11px] text-slate-500">TUMCU Constitution Chapter 4</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={13} /> {activeMembership ? 'Active Member' : 'Member in Good Standing'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Member No.</span>
                  <span className="font-mono font-black text-primary-950 text-sm">
                    {activeMembership?.membership_number || 'TUMCU-2026-0004'}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Spiritual Year</span>
                  <span className="font-bold text-primary-950">2026 / 2027</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Type</span>
                  <span className="font-bold text-primary-950">Full Member</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Voting Rights</span>
                  <span className="font-bold text-emerald-700">Eligible (AGM)</span>
                </div>
              </div>
            </Card>

            {/* Quick Sunday Service Check-in Reminder */}
            <Card variant="glass" className="p-5 border border-amber-200/80 bg-amber-50/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm mb-1">
                  <QrCode size={16} className="text-amber-700" /> Sunday Service Check-In
                </div>
                <p className="text-xs text-slate-600 leading-5">
                  Check into Sunday worship, prayer meetings, or bible study sessions directly from your device.
                </p>
              </div>
              <div className="pt-4">
                <Link to="/dashboard/attendance" className="w-full block">
                  <Button variant="primary" className="w-full text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm">
                    <QrCode size={14} /> Enter Check-In Code
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.section>

          {/* Simple 4-Card Action Hub for Members */}
          <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/dashboard/meetings" className="group block">
              <Card variant="glass" className="p-4 border border-slate-200/80 bg-white hover:border-primary-300 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700 group-hover:scale-105 transition">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <h3 className="font-bold text-primary-950 text-sm">Meetings & Events</h3>
                    <p className="text-[11px] text-slate-500">{upcomingMeetingsCount + upcomingEventsCount} scheduled sessions</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/dashboard/prayer" className="group block">
              <Card variant="glass" className="p-4 border border-slate-200/80 bg-white hover:border-primary-300 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700 group-hover:scale-105 transition">
                    <HandHeart size={18} />
                  </span>
                  <div>
                    <h3 className="font-bold text-primary-950 text-sm">Prayer Requests</h3>
                    <p className="text-[11px] text-slate-500">Confidential prayer support</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/dashboard/sermons" className="group block">
              <Card variant="glass" className="p-4 border border-slate-200/80 bg-white hover:border-primary-300 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 group-hover:scale-105 transition">
                    <Headphones size={18} />
                  </span>
                  <div>
                    <h3 className="font-bold text-primary-950 text-sm">Sermons & Resources</h3>
                    <p className="text-[11px] text-slate-500">Audio, notes & hymnal</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/dashboard/constitution" className="group block">
              <Card variant="glass" className="p-4 border border-slate-200/80 bg-white hover:border-primary-300 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition">
                    <Building size={18} />
                  </span>
                  <div>
                    <h3 className="font-bold text-primary-950 text-sm">Constitution 2024</h3>
                    <p className="text-[11px] text-slate-500">Doctrinal basis & structure</p>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.section>
        </>
      )}

      {/* SUPER ADMIN VIEW: Simplified, Friendly, Task-Focused */}
      {isSuperAdmin && (
        <>
          {/* Section 1: 4 Core Executive Metric Cards */}
          <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/dashboard/membership" className="group block">
              <Card variant="glass" className="p-5 border border-slate-200/80 bg-white hover:border-primary-300 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Members</span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700 group-hover:scale-105 transition">
                    <Users size={18} />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-primary-950">{totalRegisteredMembers}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Active registry</span>
                  <span className="font-bold text-primary-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                    View Register <ArrowRight size={12} />
                  </span>
                </div>
              </Card>
            </Link>

            <Link to="/dashboard/attendance" className="group block">
              <Card variant="glass" className="p-5 border border-slate-200/80 bg-white hover:border-amber-300 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sunday Check-Ins</span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition">
                    <QrCode size={18} />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-primary-950">{totalSundayCheckIns}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{activeSessionsCount} active sessions</span>
                  <span className="font-bold text-amber-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                    Attendance <ArrowRight size={12} />
                  </span>
                </div>
              </Card>
            </Link>

            <Link to="/dashboard/admin/ministries" className="group block">
              <Card variant="glass" className="p-5 border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ministries</span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition">
                    <Church size={18} />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-primary-950">12 Active</div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Constitutional bodies</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                    Manage <ArrowRight size={12} />
                  </span>
                </div>
              </Card>
            </Link>

            <Link to="/dashboard/admin/applications" className="group block">
              <Card variant="glass" className="p-5 border border-slate-200/80 bg-white hover:border-purple-300 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Applications</span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-700 group-hover:scale-105 transition">
                    <ClipboardCheck size={18} />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-primary-950">{applications?.length ?? 0} Pending</div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Membership reviews</span>
                  <span className="font-bold text-purple-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                    Review Now <ArrowRight size={12} />
                  </span>
                </div>
              </Card>
            </Link>
          </motion.section>

          {/* Section 2: Administrative Tasks (Clear 4 Task Cards) */}
          <motion.section variants={itemVariants} className="space-y-3">
            <div>
              <h2 className="text-sm font-bold text-primary-950">Administrative Tasks</h2>
              <p className="text-xs text-slate-500">Direct shortcuts to essential executive functions</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card variant="glass" className="p-5 border border-slate-200/80 bg-white flex flex-col justify-between hover:border-amber-300 transition">
                <div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 font-bold mb-3">
                    <QrCode size={20} />
                  </span>
                  <h3 className="font-bold text-sm text-primary-950">Sunday Service QR</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Display fullscreen worship attendance code for members on mobile or projector.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    variant="primary"
                    onClick={() => setIsSundayQrOpen(true)}
                    className="w-full text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm"
                  >
                    <QrCode size={14} /> Open Sunday QR
                  </Button>
                </div>
              </Card>

              <Card variant="glass" className="p-5 border border-slate-200/80 bg-white flex flex-col justify-between hover:border-primary-300 transition">
                <div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700 font-bold mb-3">
                    <Users size={20} />
                  </span>
                  <h3 className="font-bold text-sm text-primary-950">Member Directory</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Search and verify official membership numbers, year of study, and contact records.
                  </p>
                </div>
                <div className="pt-4">
                  <Link to="/dashboard/membership" className="w-full block">
                    <Button variant="secondary" className="w-full text-xs font-bold gap-1.5 border-slate-200">
                      <Users size={14} /> View Members
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card variant="glass" className="p-5 border border-slate-200/80 bg-white flex flex-col justify-between hover:border-purple-300 transition">
                <div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-700 font-bold mb-3">
                    <ShieldCheck size={20} />
                  </span>
                  <h3 className="font-bold text-sm text-primary-950">Roles & Governance</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Assign constitutional leadership, executive roles, and committee coordinators.
                  </p>
                </div>
                <div className="pt-4">
                  <Link to="/dashboard/admin/roles" className="w-full block">
                    <Button variant="secondary" className="w-full text-xs font-bold gap-1.5 border-slate-200">
                      <ShieldCheck size={14} /> Manage Roles
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card variant="glass" className="p-5 border border-slate-200/80 bg-white flex flex-col justify-between hover:border-emerald-300 transition">
                <div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 font-bold mb-3">
                    <CalendarDays size={20} />
                  </span>
                  <h3 className="font-bold text-sm text-primary-950">Meetings & Calendar</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Schedule executive meetings, post agendas, and review fellowship gatherings.
                  </p>
                </div>
                <div className="pt-4">
                  <Link to="/dashboard/meetings" className="w-full block">
                    <Button variant="secondary" className="w-full text-xs font-bold gap-1.5 border-slate-200">
                      <CalendarDays size={14} /> View Meetings
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </motion.section>

          {/* Section 3: Recent System Updates (Compact & Clean) */}
          <motion.section variants={itemVariants}>
            <Card variant="glass" className="p-5 border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-50 text-primary-700">
                    <History size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-primary-950">Recent System Activity</h3>
                    <p className="text-[11px] text-slate-500">Live operational updates and audit log</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  Live Sync
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-600 text-[10px] uppercase">
                        {log.module}
                      </span>
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-slate-400 hidden md:inline truncate max-w-md">— {log.details}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 shrink-0">
                      {formatDate(log.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.section>
        </>
      )}

      {/* SUNDAY SERVICE QR MODAL */}
      {isSundayQrOpen && (
        <SundayServiceQrModal onClose={() => setIsSundayQrOpen(false)} />
      )}
    </motion.div>
  );
}

