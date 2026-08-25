import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HandHeart,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { fetchMyMembershipStatus } from '@/features/membership/membership.api';
import { fetchPublicEvents } from '@/features/events/events.api';
import { fetchMyAttendance } from '@/features/attendance/attendance.api';
import { fetchPrayerRequests } from '@/features/prayer/prayer.api';
import { fetchPendingApplications } from '@/features/membership/membership.api';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  caption: string;
  icon: typeof Users;
}) {
  return (
    <Card variant="glass" className="relative overflow-hidden">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-500/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-primary-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700">
          <Icon size={20} />
        </span>
      </div>
    </Card>
  );
}

export function DashboardOverviewPage() {
  const { user, hasPermission } = useAuthStore();
  const canReviewApplications = hasPermission('membership.review') || hasPermission('membership.approve');

  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: fetchMyMembershipStatus,
  });
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'public'],
    queryFn: fetchPublicEvents,
  });
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: fetchMyAttendance,
  });
  const { data: prayers, isLoading: prayersLoading } = useQuery({
    queryKey: ['prayer-requests'],
    queryFn: fetchPrayerRequests,
  });
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['membership', 'applications', 'pending'],
    queryFn: fetchPendingApplications,
    enabled: canReviewApplications,
  });

  const activeMembership = membership?.memberships.find((m) => m.status === 'active');
  const upcomingEvents = useMemo(
    () =>
      (events ?? [])
        .filter((event) => new Date(event.start_at).getTime() >= Date.now())
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        .slice(0, 3),
    [events]
  );
  const attended = attendance?.filter((record) => record.status === 'present' || record.status === 'late').length ?? 0;
  const openPrayers = prayers?.filter((request) => request.status !== 'answered' && request.status !== 'closed').length ?? 0;

  const firstName = String(user?.full_name ?? 'Member').trim().split(/\s+/)[0] || 'Member';

  return (
    <div className="space-y-7">
      <section className="mesh-hero-bg overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-8">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow"><CheckCircle2 size={14} /> TUMCU MEMBER PORTAL</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-primary-950 sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Your membership, fellowship, events and ministry activity are all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/attendance"><Button variant="secondary" className="gap-2"><CheckCircle2 size={16} /> Check attendance</Button></Link>
            <Link to="/dashboard/prayer"><Button className="gap-2"><HandHeart size={16} /> Prayer request</Button></Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Membership" value={membershipLoading ? '…' : activeMembership ? 'Active' : 'Pending'} caption={activeMembership ? `No. ${activeMembership.membership_number}` : 'Application status'} icon={Users} />
        <StatCard label="Upcoming" value={eventsLoading ? '…' : upcomingEvents.length} caption="Events on your calendar" icon={CalendarDays} />
        <StatCard label="Attendance" value={attendanceLoading ? '…' : attended} caption="Sessions attended" icon={CheckCircle2} />
        <StatCard label="Prayer" value={prayersLoading ? '…' : openPrayers} caption="Requests still open" icon={HandHeart} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Card variant="glass">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-primary-950">What’s next</h2>
              <p className="text-sm text-slate-500">Upcoming TUMCU events</p>
            </div>
            <Link to="/events" className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-500">All events <ArrowRight size={14} /></Link>
          </div>

          {eventsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100/80" />)}</div>
          ) : upcomingEvents.length ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/55 p-4 backdrop-blur-xl">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><CalendarDays size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-primary-950">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(event.start_at)}{event.location ? ` · ${event.location}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-7 text-center">
              <CalendarDays className="mx-auto text-slate-300" size={28} />
              <p className="mt-2 text-sm font-semibold text-slate-600">No upcoming events yet</p>
              <p className="mt-1 text-xs text-slate-400">Check the events page again soon.</p>
            </div>
          )}
        </Card>

        <Card variant="glass">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-700"><Clock3 size={18} /></span>
            <div>
              <h2 className="font-black text-primary-950">Your membership</h2>
              <p className="text-xs text-slate-500">Current standing</p>
            </div>
          </div>
          {activeMembership ? (
            <div className="rounded-2xl bg-primary-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-700">Active member</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-primary-700">{activeMembership.membership_number}</span>
              </div>
              <p className="mt-4 text-xs text-slate-500">Registered {formatDate(activeMembership.registration_date)}</p>
              <p className="mt-1 text-xs text-slate-500">Renewal {formatDate(activeMembership.renewal_date)}</p>
              <Link to="/dashboard/membership" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-700">Open membership <ArrowRight size={13} /></Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-gold-50/70 p-4">
              <p className="text-sm font-bold text-primary-900">Your application is being processed.</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Open Membership to see the latest application status.</p>
              <Link to="/dashboard/membership" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-700">View status <ArrowRight size={13} /></Link>
            </div>
          )}
        </Card>
      </div>

      {canReviewApplications && (
        <Card variant="glass" className="border-primary-100/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-50 text-primary-700"><ShieldCheck size={20} /></span>
              <div>
                <h2 className="font-black text-primary-950">Administration</h2>
                <p className="text-xs text-slate-500">Membership applications awaiting your attention</p>
              </div>
            </div>
            <Link to="/dashboard/admin/applications" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-900 px-4 py-2.5 text-xs font-bold text-white">
              Review {applicationsLoading ? '…' : applications?.length ?? 0} applications <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
