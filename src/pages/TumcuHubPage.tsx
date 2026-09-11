import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Church,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CalendarCheck2,
  ShieldCheck,
  BookOpen,
  HeartHandshake,
  Music2,
  Globe2,
  Camera,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchMinistries,
  fetchMyMinistries,
  joinMinistry,
  leaveMinistry,
  getMinistryBackground,
  type Ministry,
} from '@/features/ministries/ministries.api';
import { fetchPublicEvents, type PublicEvent } from '@/features/events/events.api';
import { fetchRoleAssignments } from '@/features/admin/admin.api';
import { MinistryBackgroundModal } from '@/components/MinistryBackgroundModal';

// TUMCU Official Weekly Programme with dedicated liturgical icons (No Emojis!)
const WEEKLY_PROGRAMME = [
  {
    day: 'Wednesday',
    title: 'Mid-Week Service & Corporate Intercession',
    Icon: HeartHandshake,
    iconColor: 'bg-emerald-50 text-[#006633] border-emerald-200',
    time: '5:00 PM – 7:00 PM',
    venue: 'Main Sanctuary / Assembly Hall',
    leader: 'Prayer & Intercession Ministry',
    description: 'Corporate intercession for the University, the nation, and spiritual revival across the campus body.',
  },
  {
    day: 'Thursday',
    title: 'Discipleship & Bible Study Classes (BEST)',
    Icon: BookOpen,
    iconColor: 'bg-amber-50 text-amber-800 border-amber-200',
    time: '5:30 PM – 7:00 PM',
    venue: 'Science Complex Classrooms',
    leader: 'Bible Study Ministry',
    description: 'Systematic verse-by-verse scripture study, discipleship cohorts, and interactive group discussions.',
  },
  {
    day: 'Friday',
    title: 'Main Fellowship Night & Praise',
    Icon: Music2,
    iconColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    time: '6:00 PM – 8:30 PM',
    venue: 'Main Assembly Hall',
    leader: 'Executive Committee & Praise Ministry',
    description: 'Dynamic campus fellowship, guest ministers, worship, testimonies, and spiritual impartation.',
  },
  {
    day: 'Saturday',
    title: 'Evangelism Outreaches & Ministry Rehearsals',
    Icon: Globe2,
    iconColor: 'bg-blue-50 text-blue-800 border-blue-200',
    time: '9:00 AM – 1:00 PM',
    venue: 'Mombasa Campus & Surrounding Communities',
    leader: 'Missions & Evangelism Ministry',
    description: 'Hospital visits, door-to-door evangelism, high school ministry, and choir/instrumental practice.',
  },
  {
    day: 'Sunday',
    title: 'Main Sunday Worship & Word Service',
    Icon: Church,
    iconColor: 'bg-emerald-100 text-[#006633] border-emerald-300',
    time: '8:30 AM – 12:30 PM',
    venue: 'Main Sanctuary',
    leader: 'TUMCU Fellowship Body',
    description: 'The premier weekly gathering of the Christian Union featuring deep expository preaching and communion.',
  },
];

export function TumcuHubPage() {
  const queryClient = useQueryClient();
  const { user, roles, permissions } = useAuthStore();
  const isSuperAdminState = useAuthStore((s) => s.isSuperAdmin());

  // Check if current user has Super Admin authority
  const isSuperAdmin =
    isSuperAdminState ||
    user?.role === 'super_admin' ||
    user?.role === 'system_admin' ||
    user?.role === 'chairperson' ||
    user?.role === 'secretary' ||
    String(user?.email || '').toLowerCase().trim() === 'meshackokoth436@gmail.com' ||
    String(user?.email || '').toLowerCase().trim() === 'admin@tumcu.ac.ke' ||
    roles.some((r) => ['super_admin', 'system_admin', 'chairperson', 'secretary'].includes(r.code)) ||
    permissions.includes('*') ||
    permissions.includes('system.manage_roles');

  const [activeTab, setActiveTab] = useState<'programme' | 'ministries' | 'events' | 'leadership'>('programme');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [editingBackgroundMinistry, setEditingBackgroundMinistry] = useState<Ministry | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Queries
  const { data: ministries = [], isLoading: ministriesLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: fetchMinistries,
  });

  const { data: myMinistries = [] } = useQuery({
    queryKey: ['my-ministries'],
    queryFn: fetchMyMinistries,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'public'],
    queryFn: fetchPublicEvents,
  });

  const { data: leadershipData = [] } = useQuery({
    queryKey: ['leadership-assignments'],
    queryFn: async () => {
      try {
        const res = await fetchRoleAssignments();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  // Join & Leave Mutations
  const joinMutation = useMutation({
    mutationFn: (ministryId: string) => joinMinistry(ministryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ministries'] });
      setActionFeedback('Ministry application approved! You have successfully joined this ministry.');
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (ministryId: string) => leaveMinistry(ministryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ministries'] });
      setActionFeedback('You have stepped down from this ministry.');
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  // Current leadership
  const currentLeaders = leadershipData.filter((l) => Boolean(l.is_current));

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Presidential TUMCU Fellowship Crest & Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        {/* Subtle decorative emerald accent border top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#006633] via-amber-400 to-[#006633]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF5EF] px-3 py-1 text-xs font-bold text-[#006633] border border-[#006633]/20">
              <Church size={13} className="text-[#006633]" />
              <span className="tracking-wide uppercase text-[10px] font-black">
                Technical University of Mombasa Christian Union
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#17201B] tracking-tight">
              TUMCU Fellowship Hub
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              "Growing together. Serving together. Living for Christ." — Explore weekly spiritual services, constitutional ministries, campus evangelism, and leadership directories.
            </p>

            <p className="text-[11px] font-serif italic text-amber-900/80 pt-0.5">
              “Behold, how good and how pleasant it is for brethren to dwell together in unity!” — Psalm 133:1
            </p>
          </div>

          {/* Quick Statistics or Super Admin Pill */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
            {isSuperAdmin && (
              <Link
                to="/dashboard/admin?tab=ministries"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 text-xs font-bold text-amber-950 shadow-2xs transition active:scale-95"
              >
                <ShieldCheck size={15} className="text-amber-700" />
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase text-amber-800">Executive Console</div>
                  <span className="text-xs">Manage Ministry Media</span>
                </div>
              </Link>
            )}
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">12 Ministries</span>
              <span>·</span>
              <span className="font-semibold text-slate-800">5 Weekly Services</span>
            </div>
          </div>
        </div>

        {/* Super Admin Quick Media Guidance Bar */}
        {isSuperAdmin && (
          <div className="mt-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-950 font-medium">
              <Camera size={15} className="text-amber-700 shrink-0" />
              <span>
                <strong>Super Admin Media Mode:</strong> You can update any ministry's background photograph directly using the camera button on its card below.
              </span>
            </div>
            <Link
              to="/dashboard/admin"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 underline shrink-0"
            >
              <span>Admin Center</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Navigation Tabs (Strictly Lucide Icons, Borders, No Emojis!) */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveTab('programme')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === 'programme'
                ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CalendarDays size={14} className={activeTab === 'programme' ? 'text-white' : 'text-[#006633]'} />
            <span>Weekly Programme</span>
          </button>

          <button
            onClick={() => setActiveTab('ministries')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === 'ministries'
                ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Church size={14} className={activeTab === 'ministries' ? 'text-white' : 'text-[#006633]'} />
            <span>Constitutional Ministries</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === 'ministries' ? 'bg-white/25 text-white' : 'bg-[#EAF5EF] text-[#006633]'
              }`}
            >
              {ministries.length || 12}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === 'events'
                ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CalendarCheck2 size={14} className={activeTab === 'events' ? 'text-white' : 'text-[#006633]'} />
            <span>Events & Calendar</span>
            {events.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  activeTab === 'events' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {events.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('leadership')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === 'leadership'
                ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={14} className={activeTab === 'leadership' ? 'text-white' : 'text-[#006633]'} />
            <span>Leadership Roster</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Weekly Programme (Structured Cards with Dedicated Icons) */}
      {activeTab === 'programme' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Canonical Weekly Fellowship Rhythm
              </h2>
              <p className="text-xs text-slate-500">Scheduled spiritual gatherings for worship, doctrine, and outreach</p>
            </div>
            <span className="text-[11px] font-bold text-[#006633] bg-[#EAF5EF] px-2.5 py-0.5 rounded-full border border-[#006633]/20">
              Academic Year 2026
            </span>
          </div>

          <div className="grid gap-3.5">
            {WEEKLY_PROGRAMME.map((prog) => {
              const ServiceIcon = prog.Icon;
              return (
                <div
                  key={prog.day}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-[#006633]/50 hover:shadow-xs transition duration-150"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${prog.iconColor} shadow-2xs`}>
                        <ServiceIcon size={20} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-lg bg-[#006633] px-2.5 py-0.5 text-xs font-black text-white shadow-2xs tracking-wide">
                            {prog.day}
                          </span>
                          <h3 className="text-base font-bold text-[#17201B] tracking-tight">{prog.title}</h3>
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{prog.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2">
                          <span className="inline-flex items-center gap-1.5 font-bold text-[#006633] bg-[#EAF5EF] px-2.5 py-1 rounded-lg border border-[#006633]/15">
                            <Clock size={13} />
                            <span>{prog.time}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <MapPin size={13} className="text-slate-400" />
                            <span>{prog.venue}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <Users size={13} className="text-slate-400" />
                            <span>{prog.leader}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: 12 Constitutional Ministries with Real Background Photographs & Admin Edit */}
      {activeTab === 'ministries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                12 Constitutional Ministries
              </h2>
              <p className="text-xs text-slate-500">
                Every member equipped for spiritual edification, evangelistic outreach, and campus worship.
              </p>
            </div>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                <Camera size={12} className="text-amber-700" /> Super Admin can customize tab pictures
              </span>
            )}
          </div>

          {ministriesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {ministries.map((min) => {
                const isEnrolled = myMinistries.some(
                  (m) => m.ministry_id === min.id || m.ministry_code === min.code
                );
                const bgImage = getMinistryBackground(min);

                return (
                  <div
                    key={min.id}
                    className={`group relative overflow-hidden rounded-3xl border transition duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
                      isEnrolled
                        ? 'border-emerald-400 ring-2 ring-emerald-300/60'
                        : 'border-slate-200/90 hover:border-[#006633]'
                    }`}
                  >
                    {/* Real Background Image with Cinematic Overlay */}
                    <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
                      <img
                        src={bgImage}
                        alt={min.name}
                        className="h-full w-full object-cover object-center group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/25" />

                      {/* Header overlay badges */}
                      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/30 text-emerald-300">
                            {min.code}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isEnrolled && (
                              <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs">
                                ✓ Enrolled
                              </span>
                            )}
                            {/* Super Admin Camera Edit Button */}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                title="Change Background Photo"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBackgroundMinistry(min);
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-amber-400 text-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide hover:bg-amber-300 shadow-sm transition active:scale-95"
                              >
                                <Camera size={12} />
                                <span>Edit Photo</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title and description on image overlay */}
                        <div>
                          <h3 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-sm leading-snug">
                            {min.name}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-200/90 line-clamp-2 mt-1 drop-shadow-xs font-normal">
                            {min.description ||
                              'Equipping university believers for consecrated Christian service, prayer, and campus revival.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action strip */}
                    <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>📍 {min.meeting_venue || 'Main Sanctuary'}</span>
                        <span>🗓️ {min.meeting_day || 'Weekly'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMinistry(min);
                          setActionFeedback(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-[#EAF5EF] hover:text-[#006633] px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                      >
                        <span>Details & Join</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Events & Missions */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Upcoming Fellowship Events & Campus Missions
              </h2>
              <p className="text-xs text-slate-500">Participate in revivals, weekend challenges, and community outreaches</p>
            </div>
          </div>

          {eventsLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center text-xs text-slate-500 shadow-2xs">
              <CalendarCheck2 size={36} className="mx-auto mb-2 text-slate-400" />
              No upcoming public events scheduled right now. Check back soon for the next fellowship challenge!
            </div>
          ) : (
            <div className="grid gap-3.5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-[#006633]/40 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF5EF] text-[#006633] border border-[#006633]/20 shadow-2xs font-black text-center">
                        <div>
                          <div className="text-[10px] uppercase tracking-tighter">
                            {new Date(evt.start_at).toLocaleDateString(undefined, { month: 'short' })}
                          </div>
                          <div className="text-sm leading-none">
                            {new Date(evt.start_at).getDate()}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-bold text-[#006633]">
                            {evt.event_type}
                          </span>
                          <h3 className="font-bold text-[#17201B] text-base tracking-tight">{evt.title}</h3>
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{evt.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1.5">
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Clock size={13} className="text-[#006633]" />
                            {new Date(evt.start_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400" />
                            {evt.location || 'TUM Campus Sanctuary'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Executive Leadership Directory — Dignified, Presidential */}
      {activeTab === 'leadership' && (
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              TUMCU Executive Servant Leadership
            </h2>
            <p className="text-xs text-slate-500">
              Constitutional stewards dedicated to pastoral oversight, financial integrity, and campus discipleship.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {currentLeaders.length === 0 ? (
              <>
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-xs transition">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#006633] text-white font-black text-sm shadow-xs">
                      MO
                    </div>
                    <div>
                      <h3 className="font-bold text-[#17201B] text-sm">Meshack Okoth</h3>
                      <p className="text-xs font-semibold text-[#006633]">Chairperson</p>
                      <p className="text-[10px] text-slate-500">Executive Committee · 2025/2026</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-xs transition">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500 text-white font-black text-sm shadow-xs">
                      GS
                    </div>
                    <div>
                      <h3 className="font-bold text-[#17201B] text-sm">General Secretary</h3>
                      <p className="text-xs font-semibold text-amber-900">Secretary General</p>
                      <p className="text-[10px] text-slate-500">Secretariat & Records</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-xs transition">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-xs">
                      TR
                    </div>
                    <div>
                      <h3 className="font-bold text-[#17201B] text-sm">Treasurer</h3>
                      <p className="text-xs font-semibold text-indigo-900">Finance Steward</p>
                      <p className="text-[10px] text-slate-500">Stewardship & Auditing</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              currentLeaders.map((ldr) => (
                <div
                  key={ldr.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-xs transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#006633] text-white font-bold text-sm shadow-xs">
                      {ldr.full_name?.charAt(0) || 'L'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#17201B] text-sm truncate">{ldr.full_name}</h3>
                      <p className="text-xs font-semibold text-[#006633] truncate">{ldr.role_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {ldr.scope_name || 'Executive Committee'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Ministry Detail Modal */}
      <AnimatePresence>
        {selectedMinistry && (() => {
          const isEnrolled = myMinistries.some(
            (m) => m.ministry_id === selectedMinistry.id || m.ministry_code === selectedMinistry.code
          );
          const bgPhoto = getMinistryBackground(selectedMinistry);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-3xl bg-white overflow-hidden shadow-2xl border border-slate-200 my-auto"
              >
                {/* Photo Header */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  <img
                    src={bgPhoto}
                    alt={selectedMinistry.name}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />
                  
                  <button
                    onClick={() => {
                      setSelectedMinistry(null);
                      setActionFeedback(null);
                    }}
                    className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition"
                  >
                    <X size={16} />
                  </button>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-300 bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">
                      {selectedMinistry.code}
                    </span>
                    <h3 className="text-lg font-black text-white drop-shadow-sm mt-1">
                      {selectedMinistry.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {actionFeedback && (
                    <div className="rounded-2xl bg-emerald-50 p-3 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                      <span>{actionFeedback}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedMinistry.description ||
                      'Dedicated to equipping university students in sound Christian doctrine, worship, and faithful service.'}
                  </p>

                  <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs space-y-1 text-slate-700">
                    <div className="font-bold text-slate-900">Ministry Meetings & Location:</div>
                    <p>📍 Venue: {selectedMinistry.meeting_venue || 'Main Sanctuary'}</p>
                    <p>🗓️ Time: {selectedMinistry.meeting_day || 'Weekly Fellowship'}</p>
                  </div>

                  {/* Enrollment Action Box */}
                  {isEnrolled ? (
                    <div className="rounded-2xl bg-emerald-50/90 p-4 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                          <CheckCircle2 size={15} className="text-emerald-700" /> Active Ministry Member
                        </div>
                        <p className="text-emerald-800 text-[11px] mt-0.5">
                          You are registered with this fellowship group and receive scheduling updates.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="text-xs font-bold text-red-700 border-red-200 hover:bg-red-50 py-1.5 px-3 shrink-0"
                        loading={leaveMutation.isPending}
                        onClick={() => leaveMutation.mutate(selectedMinistry.id)}
                      >
                        Leave Ministry
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">Join {selectedMinistry.name}</div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Open to every active member of the Christian Union.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        className="text-xs font-bold gap-1.5 bg-[#006633] hover:bg-[#004D26] text-white shrink-0 shadow-xs"
                        loading={joinMutation.isPending}
                        onClick={() => joinMutation.mutate(selectedMinistry.id)}
                      >
                        <Church size={14} /> Apply & Join
                      </Button>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedMinistry(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Super Admin Ministry Background Customization Modal */}
      {editingBackgroundMinistry && (
        <MinistryBackgroundModal
          isOpen={Boolean(editingBackgroundMinistry)}
          onClose={() => setEditingBackgroundMinistry(null)}
          ministry={editingBackgroundMinistry}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
          }}
        />
      )}
    </div>
  );
}
