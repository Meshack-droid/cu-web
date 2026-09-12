import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  CalendarDays,
  ClipboardCheck,
  Megaphone,
  FileText,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/Button';

interface SecretaryDashboardViewProps {
  user: any;
  pendingApplicationsCount?: number;
}

export function SecretaryDashboardView({
  user,
  pendingApplicationsCount = 17,
}: SecretaryDashboardViewProps) {
  const firstName = user?.full_name?.split(/\s+/)[0] || 'Secretary';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900 uppercase tracking-wider">
            <FileCheck size={14} className="text-blue-700" /> Secretariat & Records
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Secretary Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Welcome, {firstName}. Manage membership admissions, executive meeting minutes, and Union documentation.
          </p>
        </div>

        {/* 5 Secretary KPIs */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Pending Applications</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-900">{pendingApplicationsCount}</span>
              <span className="text-[10px] font-bold text-amber-700">need review</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Upcoming Meetings</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">4</span>
              <span className="text-[10px] font-bold text-slate-500">scheduled</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Attendance Records</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">6</span>
              <span className="text-[10px] font-bold text-emerald-700">sessions</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Announcements</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">3</span>
              <span className="text-[10px] font-bold text-slate-500">active</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reports Due</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-700">2</span>
              <span className="text-[10px] font-bold text-slate-500">sem reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Secretary Action Center</span>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/dashboard/admin?tab=applications"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold transition shadow-xs"
          >
            <FileCheck size={14} /> Review Applications ({pendingApplicationsCount})
          </Link>
          <Link
            to="/dashboard/calendar"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <CalendarDays size={14} className="text-blue-700" /> Manage Programmes
          </Link>
          <Link
            to="/dashboard/meetings"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <BookOpen size={14} className="text-blue-700" /> Record Meeting Minutes
          </Link>
          <Link
            to="/dashboard/admin?tab=communication"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <Megaphone size={14} className="text-blue-700" /> Post Announcement
          </Link>
          <Link
            to="/dashboard/more"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <FileText size={14} className="text-blue-700" /> Generate Register Report
          </Link>
        </div>
      </div>

      {/* Actionable Tasks */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Immediate Administrative Tasks</h3>
          <span className="text-xs font-bold text-amber-700">Urgent</span>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">New Membership Applications</p>
              <p className="text-[11px] text-slate-500">{pendingApplicationsCount} student applications await verification and approval.</p>
            </div>
            <Link
              to="/dashboard/admin?tab=applications"
              className="text-xs font-bold text-primary-900 hover:underline shrink-0"
            >
              Review Now →
            </Link>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">Executive Committee Meeting Agenda</p>
              <p className="text-[11px] text-slate-500">Draft agenda for Thursday executive fellowship with the Patron.</p>
            </div>
            <Link to="/dashboard/calendar" className="text-xs font-bold text-primary-900 hover:underline shrink-0">
              Draft Agenda →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
