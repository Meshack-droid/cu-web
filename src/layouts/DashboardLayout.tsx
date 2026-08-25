import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { NotificationBell } from '@/components/NotificationBell';
import tumcuLogo from '@/assets/tumcu-logo.png';
import { logout as logoutApi } from '@/features/auth/auth.api';

const memberLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/membership', label: 'Membership', icon: Users },
  { to: '/dashboard/meetings', label: 'Meetings & Events', icon: CalendarDays },
  { to: '/dashboard/attendance', label: 'Attendance', icon: QrCode },
  { to: '/dashboard/prayer', label: 'Prayer', icon: HandHeart },
  { to: '/dashboard/finance', label: 'Finance', icon: WalletCards },
  { to: '/ministries', label: 'Ministries', icon: Church },
];

const adminLinks = [
  { to: '/dashboard/admin/applications', label: 'Membership Applications', icon: ClipboardCheck, permission: 'membership.review' },
  { to: '/dashboard/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, permission: ['leadership.assign', 'system.manage_roles'] },
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
        `group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
          isActive
            ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/15'
            : 'text-slate-600 hover:bg-white/70 hover:text-primary-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isActive ? 'bg-white/15' : 'bg-slate-100/70 group-hover:bg-primary-50'}`}>
            <Icon size={17} />
          </span>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {isActive && <ChevronRight size={15} className="opacity-70" />}
        </>
      )}
    </NavLink>
  );
}

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
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
    <aside className={`${mobile ? 'flex h-full w-[min(88vw,340px)]' : 'hidden w-[280px] lg:flex'} flex-col border-r border-white/70 bg-white/65 p-4 shadow-[12px_0_45px_rgba(15,23,42,.05)] backdrop-blur-2xl`}>
      <div className="mb-7 flex items-center gap-3 px-2">
        <img src={tumcuLogo} alt="TUMCU seal" className="h-11 w-11 rounded-full bg-white p-1 shadow-sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-black tracking-wide text-primary-950">TUMCU</div>
          <div className="truncate text-[11px] font-medium text-slate-500">Christian Union Portal</div>
        </div>
        {mobile && <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-white" aria-label="Close navigation"><X size={18} /></button>}
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
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white/60 p-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-900 font-black text-white">
            {String(user?.full_name ?? 'M').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-primary-950">{user?.full_name ?? 'Member'}</div>
            <div className="truncate text-[11px] text-slate-500">{user?.email ?? ''}</div>
          </div>
        </div>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100/70"><LogOut size={17} /></span>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gold-300/10 blur-3xl" />
      </div>

      <div className="flex min-h-screen">
        <Sidebar />

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
            <div className="relative h-full"><Sidebar mobile onClose={() => setMobileOpen(false)} /></div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/65 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary-900 shadow-sm lg:hidden" aria-label="Open navigation">
                <Menu size={20} />
              </button>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Member portal</p>
                <p className="text-sm font-bold text-primary-950">Welcome back, {String(user?.full_name ?? 'Member').split(/\s+/)[0]}</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <NotificationBell />
                <div className="hidden h-9 w-px bg-slate-200 sm:block" />
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-bold text-primary-950">{user?.full_name ?? 'Member'}</p>
                  <p className="text-[10px] text-slate-400">{user?.account_status ?? 'Active account'}</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-900 text-sm font-black text-white shadow-lg">
                  {String(user?.full_name ?? 'M').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-white/70 bg-white/90 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
        {memberLinks.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold ${isActive ? 'bg-primary-900 text-white' : 'text-slate-500'}`}>
            <Icon size={17} />
            <span className="truncate">{label === 'Meetings & Events' ? 'Events' : label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
