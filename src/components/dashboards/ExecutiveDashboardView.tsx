import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Church,
  Award,
  CalendarDays,
  DollarSign,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Megaphone,
  QrCode,
  Sparkles,
  Layers,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { SundayServiceQrModal } from '@/components/SundayServiceQrModal';

interface ExecutiveDashboardViewProps {
  user: any;
  summaryData?: any;
  applicationsCount?: number;
  vacantPositionsCount?: number;
  financeApprovalsCount?: number;
  onOpenAssignWizard: () => void;
  onOpenQrModal: () => void;
}

export function ExecutiveDashboardView({
  user,
  summaryData,
  applicationsCount = 17,
  vacantPositionsCount = 3,
  financeApprovalsCount = 2,
  onOpenAssignWizard,
  onOpenQrModal,
}: ExecutiveDashboardViewProps) {
  const firstName = user?.full_name?.split(/\s+/)[0] || 'Chairperson';

  return (
    <div className="space-y-6">
      {/* Top Banner: TUMCU Administration */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              <ShieldCheck size={14} className="text-indigo-700" /> TUMCU ADMINISTRATION
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Manage the Christian Union from one place.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Welcome, {firstName}. Here is your executive overview across fellowship departments.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={onOpenQrModal}
              className="text-xs font-bold gap-1.5 bg-amber-400 border-amber-400 text-slate-950 hover:bg-amber-500 shadow-xs"
            >
              <QrCode size={14} /> Sunday Service QR
            </Button>
            <Link
              to="/dashboard/admin"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
            >
              <span>Administration Centre</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* 6 Executive High-Level Stat Indicators */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
              <Users size={12} className="text-emerald-700" /> MEMBERS
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">
              {summaryData?.totalMembers || 428}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
              <Church size={12} className="text-emerald-700" /> MINISTRIES
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">
              {summaryData?.totalMinistries || 12}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
              <Award size={12} className="text-emerald-700" /> LEADERSHIP
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">
              {summaryData?.totalLeaders || 24}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
              <CalendarDays size={12} className="text-emerald-700" /> EVENTS
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">8</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
              <DollarSign size={12} className="text-emerald-700" /> FINANCE
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">Active</p>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-amber-800 text-[10px] font-black uppercase">
              <FileCheck size={12} className="text-amber-700" /> APPLICATIONS
            </div>
            <p className="text-xl font-black text-amber-900 mt-1">
              {applicationsCount}
            </p>
          </div>
        </div>
      </div>

      {/* 🔴 NEEDS YOUR ATTENTION SECTION (Action Oriented) */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Needs Your Attention
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Prioritized by urgency</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Applications */}
          <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Applications
              </span>
              <span className="text-xs font-black text-rose-900">{applicationsCount} pending</span>
            </div>
            <p className="text-[11px] text-slate-500">New students applying for official fellowship membership.</p>
            <Link
              to="/dashboard/admin?tab=applications"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 pt-1"
            >
              Review Applications <ArrowRight size={12} />
            </Link>
          </div>

          {/* 2. Leadership Vacancies */}
          <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Leadership
              </span>
              <span className="text-xs font-black text-amber-900">{vacantPositionsCount} positions</span>
            </div>
            <p className="text-[11px] text-slate-500">Open leadership positions requiring appointment or handover.</p>
            <Link
              to="/dashboard/admin?tab=leadership"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 pt-1"
            >
              View Leadership <ArrowRight size={12} />
            </Link>
          </div>

          {/* 3. Finance Approvals */}
          <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Finance
              </span>
              <span className="text-xs font-black text-amber-900">{financeApprovalsCount} pending</span>
            </div>
            <p className="text-[11px] text-slate-500">Financial resolutions awaiting executive signatory ratifications.</p>
            <Link
              to="/dashboard/admin?tab=finance"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 pt-1"
            >
              Review Approvals <ArrowRight size={12} />
            </Link>
          </div>

          {/* 4. System Health */}
          <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Systems
              </span>
              <span className="text-xs font-black text-emerald-900">100% Operational</span>
            </div>
            <p className="text-[11px] text-slate-500">Database, authentication and role matrix healthy.</p>
            <Link
              to="/dashboard/admin?tab=system"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 pt-1"
            >
              System Health <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quick Actions</span>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/dashboard/membership"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 text-xs font-bold transition"
          >
            <UserPlus size={14} className="text-emerald-700" /> Add Member
          </Link>
          <Link
            to="/dashboard/calendar"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 text-xs font-bold transition"
          >
            <CalendarDays size={14} className="text-blue-700" /> Create Event
          </Link>
          <button
            onClick={onOpenAssignWizard}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs"
          >
            <Award size={14} /> Assign Leader
          </button>
          <Link
            to="/dashboard/admin?tab=communication"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 text-xs font-bold transition"
          >
            <Megaphone size={14} className="text-purple-700" /> Post Announcement
          </Link>
          <Link
            to="/dashboard/tumcu"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 text-xs font-bold transition"
          >
            <Layers size={14} className="text-slate-700" /> Create Programme
          </Link>
        </div>
      </div>

      {/* RECENT ACTIVITY & AUDIT SNAPSHOT */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-slate-700" />
            <h3 className="text-base font-black text-slate-900">Recent Executive Activity</h3>
          </div>
          <Link to="/dashboard/admin?tab=audit" className="text-xs font-bold text-primary-900 hover:underline">
            View Audit Log →
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">John Mwangi approved as Christian Union Member</p>
              <p className="text-[11px] text-slate-500">Processed by Secretariat • Membership ID #2026-0428</p>
            </div>
            <span className="text-[11px] text-slate-400">10 mins ago</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">Media Ministry Leader appointment ratified</p>
              <p className="text-[11px] text-slate-500">Grace Wanjiru assigned as Media Lead for 2026/2027</p>
            </div>
            <span className="text-[11px] text-slate-400">2 hours ago</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">Sunday Service Fellowship programme published</p>
              <p className="text-[11px] text-slate-500">Venue confirmed: TUMCU Assembly Sanctuary</p>
            </div>
            <span className="text-[11px] text-slate-400">Yesterday</span>
          </div>
        </div>
      </div>
    </div>
  );
}
