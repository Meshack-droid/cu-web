import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  WalletCards,
  Bell,
  Phone,
  User,
  LogOut,
  Scale,
  Headphones,
  Vote,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { logout as logoutApi } from '@/features/auth/auth.api';

export function MorePage() {
  const navigate = useNavigate();
  const { user, roles, logout } = useAuthStore();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  async function handleSignOut() {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) await logoutApi(refreshToken);
    } catch {
      // Clear session even if network fails
    } finally {
      logout();
      navigate('/login');
    }
  }

  const navSections = [
    {
      title: 'Stewardship & Finance',
      items: [
        {
          to: '/dashboard/finance',
          label: 'Finance & Requisitions',
          icon: WalletCards,
          description: 'Submit expense requests, check treasurer approvals, and view receipts.',
        },
      ],
    },
    {
      title: 'Spiritual Resources & Governance',
      items: [
        {
          to: '/dashboard/sermons',
          label: 'Sermons & Spiritual Media',
          icon: Headphones,
          description: 'Access audio sermons, songbooks, study guides, and digital materials.',
        },
        {
          to: '/dashboard/constitution',
          label: 'Constitution 2024 & Bylaws',
          icon: Scale,
          description: 'Official TUMCU constitution, governance articles, and membership standards.',
        },
        {
          to: '/dashboard/elections',
          label: 'Elections & Ballot',
          icon: Vote,
          description: 'Cast annual electoral votes and view verified candidate profiles.',
        },
      ],
    },
    {
      title: 'Contact & Support',
      items: [
        {
          to: '/contact',
          label: 'Contact & CU Office',
          icon: Phone,
          description: 'Speak with executive leaders, pastoral counseling, and office hours.',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-primary-950 tracking-tight">More Services & Settings</h1>
            <p className="text-xs text-slate-500 mt-1">
              Finance, resources, constitutional documents, profile, and communications
            </p>
          </div>
        </div>
      </div>

      {/* User Account Card */}
      <Card variant="glass" className="p-6 bg-white border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-900 text-xl font-black text-white shadow-md">
              {String(user?.full_name ?? 'M').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-950">{user?.full_name ?? 'TUMCU Member'}</h2>
              <p className="text-xs text-slate-500">{user?.email ?? ''}</p>
              <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-800 border border-emerald-200">
                  {user?.account_status === 'active' ? 'Active Member' : (user?.account_status || 'Member')}
                </span>
                {user?.admission_number && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-slate-600">
                    {String(user.admission_number)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setProfileModalOpen(true)}
              className="text-xs font-bold gap-1.5"
            >
              <User size={14} /> View Profile
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5"
            >
              <LogOut size={14} /> Sign out
            </Button>
          </div>
        </div>
      </Card>

      {/* Organized Resource Sections */}
      {navSections.map((sec) => (
        <div key={sec.title} className="space-y-2">
          <h3 className="px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">{sec.title}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {sec.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-start gap-3.5 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs hover:border-primary-300 hover:shadow-sm transition"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-800">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary-950">{item.label}</span>
                      <ChevronRight size={15} className="text-slate-400" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-primary-950">My Profile Details</h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                  <span className="text-sm font-bold text-slate-800">{user?.full_name ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="text-xs font-medium text-slate-700">{user?.email ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Admission Number</span>
                  <span className="text-xs font-mono font-medium text-slate-700">{String(user?.admission_number ?? 'Not provided')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="text-xs font-bold text-emerald-800">
                    {user?.account_status === 'active' ? 'Active Certified Member' : (user?.account_status || 'Member')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button variant="primary" onClick={() => setProfileModalOpen(false)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
