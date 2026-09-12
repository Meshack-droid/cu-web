import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Home,
  Church,
  Users,
  HandHeart,
  MoreHorizontal,
  ShieldCheck,
  LogOut,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '@/store/auth.store';
import { NotificationBell } from '@/components/NotificationBell';
import tumcuLogo from '@/assets/tumcu-logo.png';
import { logout as logoutApi } from '@/features/auth/auth.api';
import { PortalGuideModal } from '@/components/PortalGuideModal';
import { ViewAsRoleBanner } from '@/components/ViewAsRoleBanner';
import { NavigationDirectoryModal } from '@/components/NavigationDirectoryModal';
import { useQuery } from '@tanstack/react-query';
import { fetchPendingApplications } from '@/features/membership/membership.api';

// Core 5 member navigation items as requested
const coreNavItems = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/dashboard/tumcu', label: 'TUMCU', icon: Church },
  { to: '/dashboard/membership', label: 'Membership', icon: Users },
  { to: '/dashboard/prayer', label: 'Prayer', icon: HandHeart },
  { to: '/dashboard/more', label: 'More', icon: MoreHorizontal },
];

export function DashboardLayout() {
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, roles, permissions } = useAuthStore();
  const isSuperAdminState = useAuthStore((s) => s.isSuperAdmin());

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

  const { data: pendingApps = [] } = useQuery({
    queryKey: ['membership', 'applications', 'pending'],
    queryFn: fetchPendingApplications,
    enabled: Boolean(isSuperAdmin),
  });

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function signOut() {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) await logoutApi(refreshToken);
    } catch {
      // Local session cleared regardless
    } finally {
      logout();
      navigate('/login');
    }
  }

  const userInitial = String(user?.full_name ?? 'M').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F9F7] text-[#17201B] flex flex-col">
      {/* Simulation Banner when previewing as other roles */}
      <ViewAsRoleBanner />

      {/* Top Desktop & Mobile Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all shadow-xs">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="group flex items-center gap-2.5 transition active:scale-95">
              <img
                src={tumcuLogo}
                alt="TUMCU Seal"
                className="h-10 w-10 rounded-full bg-white p-0.5 shadow-xs ring-1 ring-emerald-900/10 transition group-hover:scale-105"
              />
              <div className="leading-tight">
                <span className="text-base font-black tracking-tight text-[#006633]">TUMCU</span>
                <span className="hidden sm:block text-[10px] font-medium uppercase tracking-wider text-[#68736C]">
                  Christian Union
                </span>
              </div>
            </Link>

            {/* Desktop Horizontal Navigation (The 5 Core Links) */}
            <nav className="hidden md:flex items-center gap-1.5 ml-2">
              {coreNavItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#006633] text-white shadow-xs'
                        : 'text-[#68736C] hover:bg-[#EAF5EF] hover:text-[#006633]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={isActive ? 'text-white' : 'text-[#68736C] group-hover:text-[#006633]'} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              {/* Comprehensive Directory Modal Button */}
              <button
                onClick={() => setIsNavModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-[#68736C] hover:bg-[#EAF5EF] hover:text-[#006633] transition"
                title="Open Modules Directory"
              >
                <Compass size={15} className="text-[#68736C]" />
                <span>Directory</span>
              </button>

              {/* Super Admin Center Quick Pill */}
              {isSuperAdmin && (
                <NavLink
                  to="/dashboard/admin"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/60'
                    }`
                  }
                >
                  <ShieldCheck size={14} className="text-amber-700" />
                  <span>Admin</span>
                  {pendingApps.length > 0 && (
                    <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-black text-white">
                      {pendingApps.length}
                    </span>
                  )}
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right Controls: How it works, Public Link, Notification Bell, User Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Website Home Shortcut */}
            <Link
              to="/"
              className="hidden lg:flex items-center gap-1 text-xs font-semibold text-[#68736C] hover:text-[#006633] px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
              title="Visit Public Website"
            >
              <span>Website</span>
              <ExternalLink size={12} />
            </Link>

            {/* How it works */}
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-[#68736C] shadow-2xs transition active:scale-95"
            >
              <HelpCircle size={14} className="text-[#006633]" />
              <span>Guide</span>
            </button>

            {/* Notification Bell with unread counter badge */}
            <NotificationBell />

            {/* Profile Avatar & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-1 pr-2 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white shadow-xs">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#17201B] truncate max-w-[110px]">
                    {String(user?.full_name ?? 'Member').split(/\s+/)[0]}
                  </p>
                </div>
                <ChevronDown size={14} className="text-[#68736C] hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl backdrop-blur-md z-50 text-xs"
                  >
                    <div className="border-b border-slate-100 p-2.5">
                      <p className="font-bold text-[#17201B] truncate">{user?.full_name ?? 'Member'}</p>
                      <p className="text-[11px] text-[#68736C] truncate">{user?.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#EAF5EF] px-2 py-0.5 text-[10px] font-bold text-[#006633]">
                        ✓ Active Account
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/dashboard/membership"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-semibold text-[#17201B] hover:bg-slate-50 transition"
                      >
                        <Users size={14} className="text-[#68736C]" />
                        <span>My Membership Card</span>
                      </Link>

                      <Link
                        to="/dashboard/more"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-semibold text-[#17201B] hover:bg-slate-50 transition"
                      >
                        <MoreHorizontal size={14} className="text-[#68736C]" />
                        <span>More Settings & Finance</span>
                      </Link>

                      {isSuperAdmin && (
                        <div className="mt-1 pt-1 border-t border-amber-200/60 bg-amber-50/60 rounded-xl p-1.5 space-y-1">
                          <div className="flex items-center justify-between px-1.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                            <span>Super Admin Console</span>
                            <span className="bg-amber-400 text-slate-950 px-1 py-0.2 rounded text-[9px]">Executive</span>
                          </div>
                          <Link
                            to="/dashboard/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-bold text-amber-950 hover:bg-amber-100 transition"
                          >
                            <ShieldCheck size={14} className="text-amber-700" />
                            <span>Super Admin Center</span>
                          </Link>
                          <Link
                            to="/dashboard/admin?tab=ministries"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-bold text-amber-950 hover:bg-amber-100 transition text-[11px]"
                          >
                            <Church size={14} className="text-amber-700" />
                            <span>Ministry Backgrounds</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 font-bold text-red-600 hover:bg-red-50 transition text-left"
                      >
                        <LogOut size={14} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main App Canvas */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:pb-12 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed 5-item touch navigation) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-lg px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-around">
          {coreNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-bold transition active:scale-95 ${
                  isActive
                    ? 'text-[#006633]'
                    : 'text-[#68736C] hover:text-[#17201B]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-lg transition ${
                      isActive ? 'bg-[#EAF5EF] text-[#006633]' : 'text-[#68736C]'
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="tracking-tight">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {isSuperAdmin && (
            <NavLink
              to="/dashboard/admin"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition active:scale-95 ${
                  isActive
                    ? 'text-amber-600'
                    : 'text-amber-800 hover:text-amber-950'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-lg transition relative ${
                      isActive ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <ShieldCheck size={16} />
                    {pendingApps.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 text-[9px] font-black text-white grid place-items-center">
                        {pendingApps.length}
                      </span>
                    )}
                  </span>
                  <span className="tracking-tight font-black">Admin</span>
                </>
              )}
            </NavLink>
          )}
        </div>
      </nav>

      {/* Portal Guide Modal */}
      <PortalGuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} />

      {/* Navigation Directory Modal */}
      <NavigationDirectoryModal isOpen={isNavModalOpen} onClose={() => setIsNavModalOpen(false)} />
    </div>
  );
}
