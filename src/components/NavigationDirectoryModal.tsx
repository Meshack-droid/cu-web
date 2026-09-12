import { Link } from 'react-router-dom';
import {
  X,
  Home,
  Users,
  Award,
  Church,
  Calendar,
  ClipboardCheck,
  HandHeart,
  DollarSign,
  HeartHandshake,
  Megaphone,
  BookOpen,
  FileText,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '@/store/auth.store';
import { useViewAsStore } from '@/store/viewAs.store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationDirectoryModal({ isOpen, onClose }: Props) {
  const { user, roles, permissions } = useAuthStore();
  const { isSimulating, simulatedRole } = useViewAsStore();

  const effectiveRole = isSimulating
    ? simulatedRole
    : user?.role === 'super_admin' || user?.role === 'system_admin'
    ? 'super_admin'
    : user?.role === 'chairperson'
    ? 'chairperson'
    : user?.role === 'secretary'
    ? 'secretary'
    : user?.role === 'treasurer'
    ? 'treasurer'
    : user?.role === 'ministry_leader'
    ? 'ministry_leader'
    : 'member';

  const isSuperAdminOrChairperson =
    effectiveRole === 'super_admin' || effectiveRole === 'chairperson';
  const isSecretary = effectiveRole === 'secretary' || isSuperAdminOrChairperson;
  const isTreasurer = effectiveRole === 'treasurer' || isSuperAdminOrChairperson;
  const isMinistryLeader = effectiveRole === 'ministry_leader' || isSuperAdminOrChairperson;

  // Categories per user requirement
  const categories = [
    {
      title: 'Home',
      items: [{ to: '/dashboard', label: 'Dashboard', icon: Home, desc: 'Your personalized overview' }],
    },
    {
      title: 'People',
      items: [
        { to: '/dashboard/membership', label: 'Members', icon: Users, desc: 'Directory & Membership Card' },
        ...(isSecretary
          ? [
              {
                to: '/dashboard/admin?tab=applications',
                label: 'Membership Applications',
                icon: ClipboardCheck,
                desc: 'Review incoming admission declarations',
              },
              {
                to: '/dashboard/admin?tab=leadership',
                label: 'Leadership Roster',
                icon: Award,
                desc: 'Constitutional positions & co-options',
              },
            ]
          : []),
      ],
    },
    {
      title: 'Ministries',
      items: [
        { to: '/dashboard/tumcu', label: 'Ministries Hub', icon: Church, desc: 'Sanctuary departments & boards' },
        ...(isMinistryLeader
          ? [
              {
                to: '/dashboard/ministry-portal',
                label: 'My Ministry Portal',
                icon: Sparkles,
                desc: 'Attendance & ministry roster',
              },
            ]
          : []),
      ],
    },
    {
      title: 'Activity',
      items: [
        { to: '/dashboard/calendar', label: 'Events & Programmes', icon: Calendar, desc: 'Services & fellowships' },
        { to: '/dashboard/meetings', label: 'Meetings & Minutes', icon: FileText, desc: 'Constitutional sittings' },
        { to: '/dashboard/attendance', label: 'Attendance & QR', icon: ClipboardCheck, desc: 'Weekly check-in logs' },
        { to: '/dashboard/prayer', label: 'Prayer Wall', icon: HandHeart, desc: 'Intercession & petitions' },
      ],
    },
    {
      title: 'Finance & Welfare',
      items: [
        {
          to: '/dashboard/finance',
          label: isTreasurer ? 'Treasury & Approvals' : 'My Giving & Tithes',
          icon: DollarSign,
          desc: isTreasurer ? 'Dual-signatory ratification' : 'Stewardship records',
        },
        { to: '/dashboard/more', label: 'Welfare & Support', icon: HeartHandshake, desc: 'Needy student benevolence' },
      ],
    },
    {
      title: 'Communication & Resources',
      items: [
        ...(isSecretary
          ? [
              {
                to: '/dashboard/admin?tab=communication',
                label: 'Broadcast Announcements',
                icon: Megaphone,
                desc: 'Send notifications to all members',
              },
            ]
          : []),
        { to: '/dashboard/resources', label: 'Sermons & Resources', icon: BookOpen, desc: 'Library, media & recordings' },
      ],
    },
    ...(isSuperAdminOrChairperson
      ? [
          {
            title: 'Administration',
            items: [
              {
                to: '/dashboard/admin',
                label: 'Administration Centre',
                icon: ShieldCheck,
                desc: 'Executive console, Action Center & RBAC',
              },
              {
                to: '/dashboard/admin?tab=reports',
                label: 'Reports & Register Exports',
                icon: FileText,
                desc: 'Official data exports & statistics',
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-700 text-white shadow-xs font-black">
                  TU
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">TUMCU Navigation Directory</h3>
                  <p className="text-xs text-slate-500">
                    Role-filtered modules for{' '}
                    <span className="font-bold text-slate-700 capitalize">
                      {effectiveRole.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Categorized Grid */}
            <div className="mt-6 space-y-6">
              {categories.map((cat) => (
                <div key={cat.title} className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                    {cat.title}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={onClose}
                          className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-emerald-50/50 hover:border-emerald-300 transition group"
                        >
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-white text-emerald-800 border border-slate-200/80 group-hover:scale-105 group-hover:bg-emerald-700 group-hover:text-white transition shrink-0 shadow-2xs">
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                                {item.label}
                              </span>
                              <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition" />
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
