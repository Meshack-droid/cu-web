import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  CalendarDays,
  Users,
  HandHeart,
  Church,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  QrCode,
  Music2,
  Globe2,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/Button';
import heroImage from '@/assets/hero.png';
import musicImg from '@/assets/community/community-1.jpg';
import mediaImg from '@/assets/community/community-2.jpg';
import prayerImg from '@/assets/community/community-3.jpg';
import outreachImg from '@/assets/community/community-4.jpg';
import { MyResponsibilitiesWidget } from '@/components/MyResponsibilitiesWidget';

interface MemberDashboardViewProps {
  user: any;
  membership: any;
  myMinistries: any[];
  onOpenCheckIn: () => void;
}

export function MemberDashboardView({
  user,
  membership,
  myMinistries,
  onOpenCheckIn,
}: MemberDashboardViewProps) {
  const firstName = user?.full_name?.split(/\s+/)[0] || 'Brethren';
  const isActiveMember = membership?.memberships?.some((m: any) => m.status === 'active') ?? true;

  const currentDayIndex = new Date().getDay();

  const weeklyProgramme = [
    {
      day: 'MON',
      name: 'Monday',
      dayIndex: 1,
      Icon: BookOpen,
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200/80',
      title: 'Bible Study & BEST',
      time: '5:30 PM',
      venue: 'Science Complex',
    },
    {
      day: 'WED',
      name: 'Wednesday',
      dayIndex: 3,
      Icon: HandHeart,
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      title: 'Prayer & Intercession',
      time: '5:00 PM',
      venue: 'Assembly Sanctuary',
    },
    {
      day: 'FRI',
      name: 'Friday',
      dayIndex: 5,
      Icon: Music2,
      iconColor: 'text-[#006633] bg-[#EAF5EF] border-[#006633]/25',
      title: 'Fellowship Night',
      time: '5:30 PM',
      venue: 'TUMCU Main Hall',
    },
    {
      day: 'SAT',
      name: 'Saturday',
      dayIndex: 6,
      Icon: Globe2,
      iconColor: 'text-blue-700 bg-blue-50 border-blue-200/80',
      title: 'Community Outreach',
      time: '9:00 AM',
      venue: 'Campus & Town',
    },
    {
      day: 'SUN',
      name: 'Sunday',
      dayIndex: 0,
      Icon: Church,
      iconColor: 'text-purple-700 bg-purple-50 border-purple-200/80',
      title: 'Worship & Word Service',
      time: '8:30 AM',
      venue: 'Assembly Sanctuary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Member KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Membership Status */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Membership</span>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-black">
              {isActiveMember ? 'ACTIVE' : 'PENDING'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Admitted TUMCU Member</p>
        </div>

        {/* Next Service / Event */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Next Service</span>
          <p className="text-xs font-black text-slate-900 mt-1 truncate">Sunday Fellowship</p>
          <p className="text-[11px] text-emerald-700 font-bold mt-0.5">8:30 AM · Main Hall</p>
        </div>

        {/* Attendance Score */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Attendance</span>
          <p className="text-base font-black text-slate-900 mt-0.5">82%</p>
          <p className="text-[11px] text-slate-500">Consistent fellowship</p>
        </div>

        {/* My Ministry */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">My Ministry</span>
          <p className="text-xs font-black text-slate-900 mt-1 truncate">
            {myMinistries.length > 0 ? myMinistries[0].ministry_name : 'Media Ministry'}
          </p>
          <Link to="/dashboard/tumcu" className="text-[11px] text-[#006633] font-bold hover:underline">
            View activities →
          </Link>
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 text-white shadow-sm">
        <div className="absolute inset-0">
          <img src={heroImage} alt="TUMCU Fellowship" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-300 uppercase backdrop-blur-md">
            <Sparkles size={12} /> Student Fellowship Family
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Welcome back, {firstName}.
          </h2>
          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
            Technical University of Mombasa Christian Union: Grounded in prayer, sound biblical doctrine, and mutual love.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              onClick={onOpenCheckIn}
              className="text-xs font-bold gap-1.5 bg-amber-400 text-slate-950 hover:bg-amber-500 shadow-xs"
            >
              <QrCode size={14} /> Check In to Service
            </Button>
            <Link
              to="/dashboard/prayer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition"
            >
              <HandHeart size={14} /> Request Prayer
            </Link>
          </div>
        </div>
      </div>

      {/* Leadership Responsibilities if assigned */}
      <MyResponsibilitiesWidget />

      {/* Weekly Rhythm */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Weekly Spiritual Rhythm</h3>
            <p className="text-xs text-slate-500">Regular weekly fellowship and prayer gatherings</p>
          </div>
          <Link to="/dashboard/tumcu" className="text-xs font-bold text-[#006633] hover:underline">
            Full Schedule →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {weeklyProgramme.map((prog) => {
            const Icon = prog.Icon;
            const isToday = currentDayIndex === prog.dayIndex;
            return (
              <div
                key={prog.day}
                className={`rounded-2xl p-3.5 border transition ${
                  isToday
                    ? 'border-[#006633] bg-[#EAF5EF] shadow-2xs'
                    : 'border-slate-200/70 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black tracking-wider ${isToday ? 'text-[#006633]' : 'text-slate-400'}`}>
                    {prog.day}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-[#006633] text-white px-1.5 py-0.2 text-[9px] font-black uppercase">
                      Today
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className={`grid h-7 w-7 place-items-center rounded-lg ${prog.iconColor}`}>
                    <Icon size={14} />
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">{prog.title}</p>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  <p className="font-semibold text-slate-700">{prog.time}</p>
                  <p className="truncate">{prog.venue}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
