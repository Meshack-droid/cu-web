import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Church,
  CalendarDays,
  QrCode,
  HandHeart,
  WalletCards,
  LogOut,
  ClipboardCheck,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Vote,
  Headphones,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '@/store/auth.store';
import { NotificationBell } from '@/components/NotificationBell';
import tumcuLogo from '@/assets/tumcu-logo.png';
import { logout as logoutApi } from '@/features/auth/auth.api';
import { SundayServiceQrModal } from '@/components/SundayServiceQrModal';
import { PortalGuideModal } from '@/components/PortalGuideModal';

const memberLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/membership', label: 'Membership', icon: Users },
  { to: '/dashboard/meetings', label: 'Meetings & Events', icon: CalendarDays },
  { to: '/dashboard/attendance', label: 'Attendance & QR', icon: QrCode },
  { to: '/dashboard/ministry-portal', label: 'Ministry Leader Hub', icon: Church },
  { to: '/dashboard/elections', label: 'Elections & Ballot', icon: Vote },
  { to: '/dashboard/sermons', label: 'Sermons & Giving', icon: Headphones },
  { to: '/dashboard/prayer', label: 'Prayer Requests', icon: HandHeart },
  { to: '/dashboard/finance', label: 'Finance & Requests', icon: WalletCards },
];

const adminLinks = [
  { to: '/dashboard/admin/applications', label: 'Membership Applications', icon: ClipboardCheck, permission: 'membership.review' },
  { to: '/dashboard/admin/ministries', label: 'Ministries Management', icon: Church, permission: ['leadership.assign', 'system.manage_roles'] },
  { to: '/dashboard/admin/roles', label: 'Roles & Leadership', icon: ShieldCheck, permission: ['leadership.assign', 'system.manage_roles'] },
  { to: '/dashboard/elections', label: 'Elections Oversight', icon: Vote, permission: ['leadership.assign', 'system.manage_roles'] },
];

function NavigationLink({
  to,
  label,
  icon: Icon,
  end,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/15'
            : 'text-slate-600 hover:bg-white/80 hover:text-primary-900 hover:shadow-sm'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <motion.span
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${
              isActive ? 'bg-white/15 text-white' : 'bg-slate-100/70 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-800'
            }`}
          >
            <Icon size={17} />
          </motion.span>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {isActive && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={15} className="opacity-80" />
            </motion.span>
          )}
        </>
      )}
    </NavLink>
  );
}

function Sidebar({
  mobile = false,
  onClose,
  onOpenSundayQr,
  onOpenGuide,
}: {
  mobile?: boolean;
  onClose?: () => void;
  onOpenSundayQr?: () => void;
  onOpenGuide?: () => void;
}) {
  const navigate = useNavigate();
  const { user, roles, logout, hasPermission } = useAuthStore();
  const visibleAdminLinks = adminLinks.filter(({ permission }) => Array.isArray(permission) ? permission.some((code) => hasPermission(code)) : hasPermission(permission));

  async function signOut() {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) await logoutApi(refreshToken);
    } catch {
      // The local session is still cleared if the server is unavailable.
    } finally {
      logout();
      navigate('/login');
      onClose?.();
    }
  }

  return (
    <aside className={`${mobile ? 'flex h-full w-[min(88vw,340px)]' : 'hidden w-[280px] lg:flex'} flex-col border-r border-white/70 bg-white/65 p-4 shadow-[12px_0_45px_rgba(15,23_42,.05)] backdrop-blur-2xl`}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex items-center gap-3 px-2"
      >
        <motion.img
          whileHover={{ rotate: 5, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
          src={tumcuLogo}
          alt="TUMCU seal"
          className="h-11 w-11 rounded-full bg-white p-1 shadow-sm"
        />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-black tracking-wide text-primary-950">TUMCU</div>
          <div className="truncate text-[11px] font-medium text-slate-500">Christian Union Portal</div>
        </div>
        {mobile && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-white"
            aria-label="Close navigation"
          >
            <X size={18} />
          </motion.button>
        )}
      </motion.div>

      {/* Quick Actions in Sidebar: Sunday QR + Guide */}
      <div className="mb-4 space-y-2 px-1">
        <button
          onClick={() => {
            onClose?.();
            onOpenSundayQr?.();
          }}
          className="w-full flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition active:scale-98"
        >
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-slate-950/10">
            <QrCode size={16} />
          </span>
          <span className="truncate">Sunday Service QR</span>
          <span className="ml-auto rounded-full bg-slate-950/15 px-2 py-0.5 text-[10px] font-bold">
            Live
          </span>
        </button>

        <button
          onClick={() => {
            onClose?.();
            onOpenGuide?.();
          }}
          className="w-full flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-primary-900 transition active:scale-98"
        >
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary-50 text-primary-700">
            <HelpCircle size={14} />
          </span>
          <span className="truncate">Portal Guide & Help</span>
          <span className="ml-auto text-[10px] font-medium text-slate-400">Easy steps</span>
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-1">
        <section>
          <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-[.2em] text-slate-400">My TUMCU</div>
          <div className="space-y-1">
            {memberLinks.map((link) => <NavigationLink key={link.to} to={link.to} label={link.label} icon={link.icon} end={link.end} onNavigate={onClose} />)}
          </div>
        </section>

        {visibleAdminLinks.length > 0 && (
          <section>
            <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Administration</div>
            <div className="space-y-1">
              {visibleAdminLinks.map((link) => <NavigationLink key={link.to} to={link.to} label={link.label} icon={link.icon} onNavigate={onClose} />)}
            </div>
          </section>
        )}
      </nav>

      <div className="mt-4 border-t border-slate-200/70 pt-4">
        {roles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5 px-1">
            {roles.slice(0, 3).map((role) => (
              <span key={`${role.code}-${role.scope_id ?? 'global'}`} className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-black capitalize text-primary-700">
                {role.name}{role.scope_type === 'ministry' ? ' · scoped' : ''}
              </span>
            ))}
          </div>
        )}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="mb-2 flex items-center gap-3 rounded-2xl bg-white/60 p-3 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-900 font-black text-white shadow-sm">
            {String(user?.full_name ?? 'M').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-primary-950">{user?.full_name ?? 'Member'}</div>
            <div className="truncate text-[11px] text-slate-500">{user?.email ?? ''}</div>
          </div>
        </motion.div>
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100/70 transition-colors group-hover:bg-red-100"><LogOut size={17} /></span>
          Sign out
        </motion.button>
      </div>
    </aside>
  );
}

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSundayQrOpen, setIsSundayQrOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            x: [0, 15, 0],
            y: [0, -10, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            x: [0, -15, 0],
            y: [0, 15, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gold-300/10 blur-3xl"
        />
      </div>

      <div className="flex min-h-screen">
        <Sidebar
          onOpenSundayQr={() => setIsSundayQrOpen(true)}
          onOpenGuide={() => setIsGuideModalOpen(true)}
        />

        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                className="relative h-full"
              >
                <Sidebar
                  mobile
                  onClose={() => setMobileOpen(false)}
                  onOpenSundayQr={() => setIsSundayQrOpen(true)}
                  onOpenGuide={() => setIsGuideModalOpen(true)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/65 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setMobileOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary-900 shadow-sm lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </motion.button>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Member portal</p>
                <p className="text-sm font-bold text-primary-950">Welcome back, {String(user?.full_name ?? 'Member').split(/\s+/)[0]}</p>
              </div>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                {/* Guide Button */}
                <button
                  onClick={() => setIsGuideModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-slate-50 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition active:scale-95"
                >
                  <HelpCircle size={15} className="text-primary-600" />
                  <span className="hidden sm:inline">How it works</span>
                </button>

                {/* Header Sunday Service QR Button */}
                <button
                  onClick={() => setIsSundayQrOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 px-3 py-1.5 text-xs font-black text-slate-950 shadow-sm transition active:scale-95"
                >
                  <QrCode size={15} />
                  <span className="hidden md:inline">Sunday Service QR</span>
                </button>

                <NotificationBell />
                <div className="hidden h-9 w-px bg-slate-200 sm:block" />
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-bold text-primary-950">{user?.full_name ?? 'Member'}</p>
                  <p className="text-[10px] text-slate-400">{user?.account_status ?? 'Active account'}</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  whileTap={{ scale: 0.95 }}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-primary-900 text-sm font-black text-white shadow-lg shadow-primary-900/20 cursor-pointer"
                >
                  {String(user?.full_name ?? 'M').charAt(0).toUpperCase()}
                </motion.div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Sunday Service QR Code Modal */}
      {isSundayQrOpen && (
        <SundayServiceQrModal onClose={() => setIsSundayQrOpen(false)} />
      )}

      {/* Portal Guide Modal */}
      <PortalGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-white/70 bg-white/90 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
        {memberLinks.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold transition-transform active:scale-95 ${isActive ? 'bg-primary-900 text-white shadow-md' : 'text-slate-500'}`}>
            <Icon size={17} />
            <span className="truncate">{label === 'Meetings & Events' ? 'Events' : label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
