import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  CheckCircle2,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  Church,
  FileText,
  UserPlus,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/Button';

interface MinistryLeaderDashboardViewProps {
  user: any;
  ministryName?: string;
  onRecordAttendance?: () => void;
  onAddMember?: () => void;
  onCreateMeeting?: () => void;
}

export function MinistryLeaderDashboardView({
  user,
  ministryName = 'Media Ministry',
  onRecordAttendance,
  onAddMember,
  onCreateMeeting,
}: MinistryLeaderDashboardViewProps) {
  const firstName = user?.full_name?.split(/\s+/)[0] || 'Leader';

  const mockRecentMembers = [
    { name: 'Grace Wanjiru', role: 'Camera Crew', joined: 'Yesterday', status: 'Active' },
    { name: 'David Kiprono', role: 'Livestream Operator', joined: '3 days ago', status: 'Active' },
    { name: 'Joy Akinyi', role: 'Visuals & ProPresenter', joined: '1 week ago', status: 'Active' },
    { name: 'Samuel Mutua', role: 'Audio Assistant', joined: '2 weeks ago', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner for Ministry Leader */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900 uppercase tracking-wider">
              <Church size={14} className="text-emerald-700" /> {ministryName} Leadership
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome, Leader {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage members, rehearsals, attendance, and activity records for {ministryName}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/ministry-portal"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-900 hover:bg-primary-950 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95"
            >
              <span>Full Ministry Portal</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* 4 Ministry KPIs */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Members</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">34</span>
              <span className="text-[11px] font-bold text-emerald-700">+3 this month</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rehearsal Attendance</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">82%</span>
              <span className="text-[11px] font-bold text-emerald-700">Healthy</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Upcoming Gatherings</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">3</span>
              <span className="text-[11px] font-bold text-slate-500">meetings</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pending Tasks</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600">4</span>
              <span className="text-[11px] font-bold text-slate-500">action items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quick Actions</span>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/dashboard/attendance"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs"
          >
            <ClipboardCheck size={14} /> Record Attendance
          </Link>
          <Link
            to="/dashboard/ministry-portal"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <UserPlus size={14} className="text-emerald-700" /> Add Member
          </Link>
          <Link
            to="/dashboard/calendar"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <CalendarDays size={14} className="text-emerald-700" /> Create Meeting
          </Link>
          <Link
            to="/dashboard/more"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 text-xs font-bold transition"
          >
            <FileText size={14} className="text-emerald-700" /> Submit Semester Report
          </Link>
        </div>
      </div>

      {/* Ministry Roster & Recent Activity */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Recent Ministry Members</h3>
            <p className="text-xs text-slate-500">Brothers and sisters serving in {ministryName}</p>
          </div>
          <Link to="/dashboard/ministry-portal" className="text-xs font-bold text-[#006633] hover:underline">
            View All 34 Members →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {mockRecentMembers.map((member, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800 font-black text-xs">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{member.name}</p>
                  <p className="text-[11px] text-slate-500">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Joined {member.joined}</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
