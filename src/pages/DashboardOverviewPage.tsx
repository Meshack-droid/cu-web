import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CalendarCheck2,
  CheckCircle2,
  HandHeart,
  Church,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  Camera,
  Info,
  BookOpen,
  BookMarked,
  Music2,
  HeartHandshake,
  Globe2,
  Quote,
  ShieldCheck,
  Lock,
  QrCode,
  Mic2,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { fetchMyMembershipStatus } from '@/features/membership/membership.api';
import { fetchMyMinistries } from '@/features/ministries/ministries.api';
import { MyResponsibilitiesWidget } from '@/components/MyResponsibilitiesWidget';


// Community & Fellowship Photography Assets
import heroImage from '@/assets/hero.png';
import musicImg from '@/assets/community/community-1.jpg';
import mediaImg from '@/assets/community/community-2.jpg';
import prayerImg from '@/assets/community/community-3.jpg';
import outreachImg from '@/assets/community/community-4.jpg';

export function DashboardOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [sanctuaryCodeInput, setSanctuaryCodeInput] = useState('');
  const [wordExpanded, setWordExpanded] = useState(false);

  // Queries
  const { data: membership } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: fetchMyMembershipStatus,
  });

  const { data: myMinistries = [] } = useQuery({
    queryKey: ['my-ministries'],
    queryFn: fetchMyMinistries,
  });

  // Personalized Greeting calculation
  const { greeting, firstName } = useMemo(() => {
    const hour = new Date().getHours();
    let g = 'Good morning';
    if (hour >= 12 && hour < 17) g = 'Good afternoon';
    else if (hour >= 17) g = 'Good evening';

    const rawName = typeof user?.full_name === 'string' && user.full_name.trim() ? user.full_name.trim() : '';
    const first = rawName ? rawName.split(/\s+/)[0] : 'Brethren';
    return { greeting: g, firstName: first };
  }, [user]);

  // Current day of the week for "This week at TUMCU" highlighting
  const currentDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  // Weekly spiritual rhythm with dedicated Lucide icons
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

  const featuredMinistries = [
    {
      name: 'Music Ministry',
      slogan: 'Lead worship. Serve with excellence.',
      image: musicImg,
      code: 'MUSIC',
      Icon: Music2,
    },
    {
      name: 'Media Ministry',
      slogan: 'Share the message beyond the walls.',
      image: mediaImg,
      code: 'MEDIA',
      Icon: Camera,
    },
    {
      name: 'Prayer Ministry',
      slogan: 'Stand together in prayer.',
      image: prayerImg,
      code: 'PRAYER',
      Icon: HandHeart,
    },
    {
      name: 'Missions & Outreach',
      slogan: 'Reaching the campus and beyond for Christ.',
      image: outreachImg,
      code: 'MISSIONS',
      Icon: Globe2,
    },
  ];

  const primaryMinistry = myMinistries[0];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* 1. Warm Personalized Welcome Header */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#17201B]">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm sm:text-base text-[#68736C] italic font-serif">
          “Let everything that has breath praise the Lord.” — <span className="font-sans font-semibold text-[#006633] not-italic text-xs">Psalm 150:6</span>
        </p>

        {/* Immediate Callout Bar with crisp borders */}
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#EAF5EF] via-[#F2F8F4] to-white border-l-4 border-l-[#006633] border-y border-r border-[#006633]/20 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs transition hover:border-[#006633]/35">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#006633] text-white shadow-xs border border-[#004D26]">
              <Music2 size={18} />
            </span>
            <div>
              <span className="font-bold text-[#004D26]">This week at TUMCU: </span>
              <span className="text-[#17201B] font-medium">
                Worship & Fellowship · Friday · 5:30 PM · TUMCU Main Hall
              </span>
            </div>
          </div>
          <Link
            to="/dashboard/tumcu"
            className="inline-flex items-center gap-1.5 font-bold text-[#006633] hover:text-[#004D26] shrink-0 transition bg-white/80 hover:bg-white border border-[#006633]/20 rounded-xl px-3 py-1.5 shadow-2xs"
          >
            <span>View programme</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Constitutional Leadership Obligations & Responsibilities Widget */}
      <MyResponsibilitiesWidget />

      {/* 2. One Beautiful Hero Section with Real Photograph & Defined Border */}
      <div className="relative overflow-hidden rounded-3xl shadow-sm border-2 border-emerald-950/20 bg-slate-900 text-white ring-1 ring-black/5">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="TUMCU Fellowship"
            className="h-full w-full object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/40" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-300 uppercase backdrop-blur-md border border-white/20">
            <Sparkles size={12} />
            <span>Welcome to TUMCU</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
            Growing together. Serving together. Living for Christ.
          </h2>
          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-normal">
            Welcome to your student fellowship family at the Technical University of Mombasa. Grounded in prayer, sound biblical doctrine, and mutual love.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard/tumcu"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#006633] hover:bg-[#004D26] px-4 py-2 text-xs font-bold text-white shadow-xs border border-emerald-600/40 transition active:scale-[0.98]"
            >
              <span>View this week's programme</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              to="/dashboard/membership"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition active:scale-[0.98]"
            >
              <Users size={13} />
              <span>My Membership</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. "What's happening?" Section with Structured Beautiful Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-[#EAF5EF] border border-[#006633]/20 text-[#006633]">
              <CalendarDays size={14} />
            </div>
            <h2 className="text-lg font-bold text-[#17201B] tracking-tight">What's happening?</h2>
          </div>
          <Link
            to="/dashboard/tumcu"
            className="text-xs font-bold text-[#006633] hover:text-[#004D26] inline-flex items-center gap-1 transition"
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          {/* Today Card */}
          <div className="group rounded-2xl border-2 border-[#006633]/30 bg-gradient-to-b from-[#FDFEFC] to-[#F4F9F5] p-4.5 shadow-2xs hover:border-[#006633] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#006633] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-2xs">
                Today
              </span>
              <span className="text-[11px] text-[#004D26] font-bold flex items-center gap-1">
                <Clock size={12} /> 5:00 PM
              </span>
            </div>
            <div className="mt-3.5 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#EAF5EF] border border-[#006633]/30 text-[#006633] shrink-0">
                <Music2 size={16} />
              </span>
              <h3 className="font-bold text-sm text-[#17201B] group-hover:text-[#006633] transition-colors">
                Worship Practice
              </h3>
            </div>
            <p className="mt-2 text-xs text-[#68736C] flex items-center gap-1.5 pl-0.5">
              <MapPin size={13} className="text-[#006633] shrink-0" />
              <span>TUMCU Assembly Sanctuary</span>
            </p>
          </div>

          {/* Tomorrow Card */}
          <div className="group rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-[#FAFBF9] p-4.5 shadow-2xs hover:border-amber-400 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#68736C]">
                Tomorrow
              </span>
              <span className="text-[11px] text-[#68736C] font-semibold flex items-center gap-1">
                <Clock size={12} /> 5:30 PM
              </span>
            </div>
            <div className="mt-3.5 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shrink-0">
                <BookOpen size={16} />
              </span>
              <h3 className="font-bold text-sm text-[#17201B] group-hover:text-[#006633] transition-colors">
                Bible Study
              </h3>
            </div>
            <p className="mt-2 text-xs text-[#68736C] flex items-center gap-1.5 pl-0.5">
              <MapPin size={13} className="text-amber-700 shrink-0" />
              <span>Science Complex Classrooms</span>
            </p>
          </div>

          {/* Weekend Card */}
          <div className="group rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-[#FAFBF9] p-4.5 shadow-2xs hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#68736C]">
                Saturday
              </span>
              <span className="text-[11px] text-[#68736C] font-semibold flex items-center gap-1">
                <Clock size={12} /> 9:00 AM
              </span>
            </div>
            <div className="mt-3.5 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 border border-blue-200 text-blue-800 shrink-0">
                <HeartHandshake size={16} />
              </span>
              <h3 className="font-bold text-sm text-[#17201B] group-hover:text-[#006633] transition-colors">
                Community Outreach
              </h3>
            </div>
            <p className="mt-2 text-xs text-[#68736C] flex items-center gap-1.5 pl-0.5">
              <MapPin size={13} className="text-blue-700 shrink-0" />
              <span>Tudor & Hospital Ministry</span>
            </p>
          </div>
        </div>
      </section>

      {/* 4. "Your TUMCU" Section (Beautiful Bordered Card) */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#17201B] tracking-tight">Your TUMCU</h2>

        <div className="rounded-2xl border-t-4 border-t-[#006633] border-x border-b border-slate-200/90 bg-gradient-to-b from-white to-[#FAFBF9] p-5 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70">
            {/* Ministry */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736C]">
                Your Ministry
              </span>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#EAF5EF] text-[#006633] border border-[#006633]/20 shrink-0">
                  <Mic2 size={14} />
                </span>
                {primaryMinistry ? (
                  <span className="font-bold text-xs sm:text-sm text-[#17201B] truncate">
                    {primaryMinistry.ministry_name}
                  </span>
                ) : (
                  <Link
                    to="/dashboard/tumcu"
                    className="font-bold text-xs text-[#006633] hover:underline"
                  >
                    Unassigned · Join →
                  </Link>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5 sm:pl-5 pt-3 sm:pt-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736C]">
                Your role
              </span>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  <ShieldCheck size={14} />
                </span>
                <p className="font-bold text-xs sm:text-sm text-[#17201B]">
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'ministry_leader' ? 'Ministry Leader' : 'Active Member'}
                </p>
              </div>
            </div>

            {/* Attendance */}
            <div className="space-y-1.5 pt-3 sm:pt-0 sm:pl-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736C]">
                Attendance
              </span>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-[#006633] border border-emerald-200 shrink-0">
                  <CalendarCheck2 size={14} />
                </span>
                <p className="font-bold text-xs sm:text-sm text-[#17201B] flex items-center gap-1.5">
                  <span>8 / 10</span>
                  <span className="text-[10px] font-bold text-[#006633] bg-[#EAF5EF] border border-[#006633]/20 px-2 py-0.2 rounded-full">
                    80%
                  </span>
                </p>
              </div>
            </div>

            {/* Membership Standing */}
            <div className="space-y-1.5 pt-3 sm:pt-0 sm:pl-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736C]">
                Membership
              </span>
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#006633]">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#EAF5EF] text-[#006633] border border-[#006633]/20 shrink-0">
                  <CheckCircle2 size={14} />
                </span>
                <span>Active Standing</span>
              </div>
            </div>
          </div>

          {/* Subtle In-Sanctuary Check-In helper row */}
          <div className="mt-5 pt-3.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-[#68736C] text-[11px] flex items-center gap-1.5">
              <Info size={13} className="text-[#006633]" />
              Sunday attendance is recorded in church via sanctuary projector QR.
            </span>
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="font-bold text-[#006633] hover:text-[#004D26] inline-flex items-center gap-1.5 text-[11px] bg-white border border-[#006633]/20 rounded-xl px-2.5 py-1 hover:bg-[#EAF5EF] transition"
            >
              <QrCode size={13} />
              <span>Verify Sanctuary QR Code →</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. "This week at TUMCU" (Signature Component with Beautiful Bordered Tabs) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#17201B] tracking-tight">This week at TUMCU</h2>
            <p className="text-xs text-[#68736C]">Weekly spiritual rhythm & fellowships</p>
          </div>
          <Link
            to="/dashboard/tumcu"
            className="text-xs font-bold text-[#006633] hover:underline"
          >
            Full calendar →
          </Link>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-5">
          {weeklyProgramme.map((item) => {
            const isToday = item.dayIndex === currentDayIndex;
            const ItemIcon = item.Icon;

            return (
              <div
                key={item.day}
                className={`relative rounded-2xl p-4 border-2 transition-all duration-200 flex flex-col justify-between ${
                  isToday
                    ? 'bg-[#EAF5EF] border-[#006633] shadow-xs ring-1 ring-[#006633]/30'
                    : 'bg-gradient-to-b from-white to-[#FAFBF9] border-slate-200/90 hover:border-[#006633]/40 hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isToday ? 'text-[#006633]' : 'text-[#68736C]'
                      }`}
                    >
                      {item.day}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-[#006633] text-white px-2 py-0.5 text-[9px] font-black tracking-wide uppercase">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Icon badge */}
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-xl border shrink-0 ${item.iconColor}`}
                    >
                      <ItemIcon size={16} />
                    </span>
                    <h4 className="font-bold text-xs text-[#17201B] leading-tight line-clamp-2">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-0.5">
                  <p className="text-[11px] font-bold text-[#17201B] flex items-center gap-1">
                    <Clock size={11} className="text-slate-400" />
                    <span>{item.time}</span>
                  </p>
                  <p className="text-[10px] text-[#68736C] truncate flex items-center gap-1">
                    <MapPin size={10} className="text-slate-400" />
                    <span>{item.venue}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Visually Beautiful Image-Backed Ministries with Borders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#17201B] tracking-tight">TUMCU Ministries</h2>
            <p className="text-xs text-[#68736C]">Communities of spiritual growth and service</p>
          </div>
          <Link
            to="/dashboard/tumcu"
            className="text-xs font-bold text-[#006633] hover:underline"
          >
            Explore all 12 →
          </Link>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredMinistries.map((min) => {
            const MinIcon = min.Icon;
            return (
              <Link
                key={min.code}
                to="/dashboard/tumcu"
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200/90 hover:border-[#006633] bg-slate-900 shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col justify-between aspect-[4/3] sm:aspect-auto sm:h-48 p-4 text-white"
              >
                {/* Background Photography with Dark Overlay */}
                <img
                  src={min.image}
                  alt={min.name}
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-70 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-slate-950/20" />

                <div className="relative z-10 flex justify-end">
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white group-hover:bg-[#006633] transition-colors">
                    <MinIcon size={14} />
                  </span>
                </div>

                <div className="relative z-10 space-y-1">
                  <h3 className="font-bold text-sm text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    {min.name}
                  </h3>
                  <p className="text-[11px] text-slate-200/90 line-clamp-2 leading-relaxed font-medium">
                    {min.slogan}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 7. Subtle "Today's Word" (Bordered Scripture Card) */}
      <section className="rounded-2xl border-2 border-emerald-200/90 border-l-4 border-l-[#006633] bg-gradient-to-br from-[#EAF5EF]/80 via-[#F5FAF6] to-white p-5 sm:p-6 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#006633] uppercase tracking-wider">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-white border border-[#006633]/20 shadow-2xs">
              <Quote size={13} className="text-[#006633]" />
            </span>
            <span>Today's Word</span>
          </div>
          <button
            onClick={() => setWordExpanded((prev) => !prev)}
            className="text-xs font-bold text-[#006633] hover:text-[#004D26] transition bg-white/80 border border-[#006633]/20 px-2.5 py-1 rounded-xl shadow-2xs"
          >
            {wordExpanded ? 'Show less' : 'Read reflection →'}
          </button>
        </div>

        <blockquote className="text-base sm:text-lg font-serif italic text-[#17201B] leading-relaxed pl-1">
          “Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.”
        </blockquote>
        <p className="text-xs font-bold text-[#006633] font-sans pl-1">— Joshua 1:9</p>

        {wordExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-3 text-xs text-[#68736C] leading-relaxed border-t border-[#006633]/15 mt-2 bg-white/60 p-3 rounded-xl border border-slate-100"
          >
            No matter the academic pressures, life uncertainties, or new challenges you face on campus today, walk in confidence. You are kept by His everlasting arms. Take courage and shine for Christ in your lecture halls and hostels!
          </motion.div>
        )}
      </section>

      {/* 8. Prayer Should Feel Personal (Bordered Card with Warm Accent) */}
      <section className="rounded-2xl border-2 border-emerald-900/15 bg-gradient-to-br from-white via-[#FAFDFB] to-[#F1F8F3] p-5 sm:p-6 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-[#17201B]">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#EAF5EF] border border-[#006633]/20 text-[#006633]">
                <HandHeart size={16} />
              </span>
              <span>Need prayer?</span>
            </div>
            <p className="text-base font-semibold text-[#004D26]">You're not walking alone.</p>
            <p className="text-xs text-[#68736C] max-w-lg leading-relaxed">
              Whether you carry an academic burden, health concern, family petition, or praise report, our prayer intercessors are ready to stand with you.
            </p>
          </div>

          <Link to="/dashboard/prayer" className="shrink-0">
            <Button
              variant="primary"
              className="text-xs font-bold bg-[#006633] hover:bg-[#004D26] text-white px-4 py-2.5 shadow-xs border border-emerald-800"
            >
              Share a prayer request
            </Button>
          </Link>
        </div>

        <div className="pt-2.5 border-t border-slate-200/80 text-[11px] text-[#68736C] flex items-center gap-1.5">
          <Lock size={12} className="text-[#006633] shrink-0" />
          <span>Your request can be shared privately with the prayer team or submitted anonymously.</span>
        </div>
      </section>

      {/* 9. Peaceful Footer */}
      <footer className="pt-4 border-t border-slate-200/70 text-center space-y-1 text-xs text-[#68736C]">
        <p className="font-semibold text-[#17201B]">Technical University of Mombasa Christian Union</p>
        <p className="text-[11px]">“For God and Fellowship” · P.O. Box 90420-80100, Mombasa, Kenya</p>
      </footer>

      {/* In-Sanctuary Verification Code Scanner Dialog */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF5EF] text-[#006633] border border-[#006633]/20">
                  <Camera size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-[#17201B] text-base">Sanctuary Attendance</h3>
                  <p className="text-xs text-[#68736C]">Sunday In-Person Verification</p>
                </div>
              </div>
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl bg-[#F7F9F7] p-4 border border-slate-200/80 space-y-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#006633] border border-slate-200 shadow-2xs">
                <QrCode size={26} />
              </div>
              <h4 className="font-bold text-sm text-[#17201B]">Attending Sunday Service?</h4>
              <p className="text-xs text-[#68736C] leading-relaxed">
                Scan the official QR code projected in the sanctuary, or enter the service code shown on the screen below:
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#17201B] block">
                Sanctuary Service Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SUN-SERVICE-2026"
                  value={sanctuaryCodeInput}
                  onChange={(e) => setSanctuaryCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-xs font-mono font-bold tracking-wider outline-none text-[#17201B] focus:border-[#006633]"
                />
                <Button
                  variant="primary"
                  className="text-xs font-bold px-4 bg-[#006633] hover:bg-[#004D26]"
                  disabled={!sanctuaryCodeInput.trim()}
                  onClick={() => {
                    const code = sanctuaryCodeInput.trim();
                    setIsScannerModalOpen(false);
                    navigate(`/attendance/check-in?code=${encodeURIComponent(code)}`);
                  }}
                >
                  Verify
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#68736C]">
              <span className="flex items-center gap-1 text-[11px]">
                <Info size={12} className="text-[#006633]" /> Official QR changes weekly
              </span>
              <Button
                variant="ghost"
                onClick={() => setIsScannerModalOpen(false)}
                className="text-xs text-[#68736C]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
