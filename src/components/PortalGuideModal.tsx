import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Users,
  QrCode,
  Vote,
  Church,
  CalendarDays,
  Headphones,
  WalletCards,
  HandHeart,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface PortalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_MODULES = [
  {
    id: 'overview',
    title: 'Dashboard & Quick Actions',
    icon: Sparkles,
    badge: 'Getting Started',
    summary: 'Your home command center for TUMCU announcements, spiritual themes, and quick access.',
    keyPoints: [
      'View the Spiritual Theme of the Year and weekly scripture verses.',
      'Check upcoming Sunday services, mid-week fellowships, and committee meetings.',
      'Super Admins can edit dashboard writings and announcement banners with live audit logs.',
    ],
  },
  {
    id: 'membership',
    title: 'Membership & Registration',
    icon: Users,
    badge: 'Constitutional',
    summary: 'Apply for official TUMCU membership, download your digital membership ID, or browse members.',
    keyPoints: [
      'Full Members: TUM Christian students affirming the doctrinal basis (voting eligible).',
      'Associate & Special Members: Alumni, faculty, and visiting brethren.',
      'Track your membership status: Pending review → Approved by Secretary/Chair → Active.',
      'Super Admin can manage the full member register, filter by year/school, and track standing.',
    ],
  },
  {
    id: 'attendance',
    title: 'Sunday Service & QR Attendance',
    icon: QrCode,
    badge: 'Check-In',
    summary: 'Fast, contact-free check-in for Sunday services, prayer vigils (kesha), and fellowship meetings.',
    keyPoints: [
      'Scan the Sunday Service QR code displayed at the entrance or on screens.',
      'Self Check-In: Use your admission number or guest details in 10 seconds.',
      'Leaders can launch full-screen Projector mode or manual register entry.',
      'Instant attendance tallies and CSV exports for church reporting.',
    ],
  },
  {
    id: 'elections',
    title: 'Elections & Constitutional Voting',
    icon: Vote,
    badge: 'Democratic & Secure',
    summary: 'Elect your TUMCU student leaders for the spiritual year securely.',
    keyPoints: [
      'Nomination: Eligible full members in good standing can apply for executive posts.',
      'Vetting: Electoral commission vets testimonies, academic standing, and eligibility.',
      'Voting: Cryptographically verified single-ballot voting with instant secret tallies.',
      'Real-time voter turnout and candidate manifesto inspection.',
    ],
  },
  {
    id: 'ministries',
    title: 'Ministries & Leader Hub',
    icon: Church,
    badge: 'Service & Discipleship',
    summary: 'Join and serve in any of the 12 constitutional ministries (Intercessory, Worship, Media, Ushering, etc.).',
    keyPoints: [
      'Browse all 12 ministries, meeting times, and leadership contacts.',
      'Submit an application to join your ministry of calling.',
      'Ministry Leaders can manage member rosters, record trainings, and track attendance.',
    ],
  },
  {
    id: 'meetings',
    title: 'Meetings & Events Calendar',
    icon: CalendarDays,
    badge: 'Schedules & Minutes',
    summary: 'Central hub for all CU calendar events, executive sessions, and committee summits.',
    keyPoints: [
      'View upcoming service times, venues, and guest speakers.',
      'Generate session-specific QR codes for leadership and committee meetings.',
      'Log meeting agendas, action points, and official minutes digitally.',
    ],
  },
  {
    id: 'sermons',
    title: 'Sermons & Online Giving',
    icon: Headphones,
    badge: 'Media & Stewardship',
    summary: 'Listen to recorded sermon audio messages and give tithes or missions support easily.',
    keyPoints: [
      'Search sermons by speaker, scripture reference, series, or date.',
      'Stream sermon audio directly with built-in playback controls.',
      'Give Tithes, Missions support, or Choir donations via M-Pesa Paybill (247247) with confirmation.',
    ],
  },
  {
    id: 'prayer',
    title: 'Prayer Requests & Intercession',
    icon: HandHeart,
    badge: 'Spiritual Care',
    summary: 'Submit prayer burdens and stand in the gap with fellow brethren in prayer.',
    keyPoints: [
      'Public Requests: Shared with the entire fellowship for collective prayer.',
      'Confidential Requests: Directed exclusively to the Pastoral Care & Intercessory team.',
      'Anonymous Option: Keep your name private whenever desired.',
    ],
  },
  {
    id: 'finance',
    title: 'Finance & Requisitions',
    icon: WalletCards,
    badge: 'Accountability',
    summary: 'Transparent management of income, expenses, and committee requisition approvals.',
    keyPoints: [
      'Ministry leaders can create expense requisitions with budget justifications.',
      'Multi-stage approval workflow: Chair Review → Treasurer Review → Disbursed.',
      'Audit-ready financial ledgers and transparency reports.',
    ],
  },
];

export function PortalGuideModal({ isOpen, onClose }: PortalGuideModalProps) {
  const [selectedId, setSelectedId] = useState('overview');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredModules = GUIDE_MODULES.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.summary.toLowerCase().includes(search.toLowerCase()) ||
      m.keyPoints.some((p) => p.toLowerCase().includes(search.toLowerCase()))
  );

  const activeModule = GUIDE_MODULES.find((m) => m.id === selectedId) || GUIDE_MODULES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      {/* Dialog */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/90 bg-white/95 shadow-2xl overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-primary-950 to-primary-900 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white">
              <HelpCircle size={20} />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight">TUMCU Portal Guide & Help</h2>
              <p className="text-xs text-primary-200">
                Simple, straightforward overview of how everything works
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-slate-100 px-6 py-3 bg-slate-50/70">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guide (e.g., voting, check-in, membership, requisitions)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/10"
            />
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Module List */}
          <div className="md:col-span-5 p-3 overflow-y-auto max-h-[55vh] space-y-1.5 bg-slate-50/40">
            {filteredModules.map((mod) => {
              const Icon = mod.icon;
              const isSelected = mod.id === activeModule.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedId(mod.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-primary-900 text-white shadow-md shadow-primary-900/15'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                      isSelected ? 'bg-white/15 text-white' : 'bg-slate-100 text-primary-900'
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black truncate">{mod.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {mod.badge}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] line-clamp-1 mt-0.5 ${
                        isSelected ? 'text-primary-200' : 'text-slate-500'
                      }`}
                    >
                      {mod.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Module Detail */}
          <div className="md:col-span-7 p-6 overflow-y-auto max-h-[55vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-primary-900 uppercase tracking-wider mb-2">
                <activeModule.icon size={16} />
                <span>{activeModule.title}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{activeModule.title}</h3>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed bg-primary-50/50 border border-primary-100/60 p-3.5 rounded-2xl">
                {activeModule.summary}
              </p>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Key Rules & How it Operates:
                </h4>
                <div className="space-y-2.5">
                  {activeModule.keyPoints.map((point, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-700 shadow-xs"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Have more questions? Ask the AI Spiritual Companion anytime!</span>
              <button
                onClick={onClose}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 font-bold hover:bg-slate-800 transition"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
