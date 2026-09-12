import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ClipboardCheck,
  Users,
  CalendarDays,
  WalletCards,
  Megaphone,
  BarChart3,
  Sliders,
  Check,
  X,
  Clock,
  Download,
  Search,
  Building,
  QrCode,
  Sparkles,
  Layers,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Church,
  ExternalLink,
  Bell,
  AlertTriangle,
  Award,
  Lock,
  Activity,
  FileText,
  UserPlus,
  Send,
  Calendar,
  ChevronRight,
  Shield,
  FileCheck,
  Eye,
  KeyRound,
  Filter,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
import { useViewAsStore, type SimulatedRole } from '@/store/viewAs.store';
import {
  fetchPendingApplications,
  approveApplication,
  rejectApplication,
  fetchAllMembers,
  downloadMembershipCsv,
} from '@/features/membership/membership.api';
import { fetchMinistries, type Ministry } from '@/features/ministries/ministries.api';
import {
  fetchRoles,
  fetchRoleAssignments,
  assignRole,
  revokeRole,
  searchUsers,
  fetchDashboardSummary,
  fetchCustomCommittees,
  fetchFinanceResolutions,
  signFinanceResolution,
  fetchRolePermissionMatrix,
  fetchUserRoles,
  type AdminUser,
} from '@/features/admin/admin.api';
import {
  fetchLeadershipPositions,
  fetchLeadershipAssignments,
  revokeLeadershipAssignment,
} from '@/features/leadership/leadership.api';
import { fetchExpenses } from '@/features/finance/finance.api';
import { SundayServiceQrModal } from '@/components/SundayServiceQrModal';
import { MinistryBackgroundModal } from '@/components/MinistryBackgroundModal';
import { SystemHealthModal } from '@/components/SystemHealthModal';
import { CommissionCommitteeModal } from '@/components/CommissionCommitteeModal';
import { CallExecutiveMeetingModal } from '@/components/CallExecutiveMeetingModal';
import { LeaderAppointmentModal } from '@/components/LeaderAppointmentModal';
import { RoleAssignmentWizardModal } from '@/components/RoleAssignmentWizardModal';
import { MemberProfileDrawer } from '@/components/MemberProfileDrawer';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { AcademicYearSelector } from '@/components/AcademicYearSelector';

export function AdminCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const addAuditLog = useDashboardStore((s) => s.addAuditLog);
  const { isSimulating, simulatedRole, setSimulation, clearSimulation } = useViewAsStore();

  // Tab management: default to 'attention'
  const tabParam = searchParams.get('tab') || 'attention';
  const [activeTab, setActiveTab] = useState(tabParam);

  // Modals state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [commissionModalOpen, setCommissionModalOpen] = useState(false);
  const [callMeetingModalOpen, setCallMeetingModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedPositionIdForAppointment, setSelectedPositionIdForAppointment] = useState<string | undefined>(undefined);
  const [selectedMinistryForBg, setSelectedMinistryForBg] = useState<Ministry | null>(null);

  // Wizard & Profile Drawer State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPreselectedUser, setWizardPreselectedUser] = useState<AdminUser | null>(null);
  const [drawerMember, setDrawerMember] = useState<AdminUser | null>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Advanced RBAC Accordion
  const [showAdvancedRbac, setShowAdvancedRbac] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Queries
  const { data: summaryData } = useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: fetchDashboardSummary,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: fetchPendingApplications,
  });

  const { data: leadershipPositions = [] } = useQuery({
    queryKey: ['leadership-positions'],
    queryFn: fetchLeadershipPositions,
  });

  const { data: leadershipAssignments = [], refetch: refetchLeadership } = useQuery({
    queryKey: ['leadership-assignments'],
    queryFn: () => fetchLeadershipAssignments(),
  });

  const { data: allMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['membership', 'all'],
    queryFn: () => fetchAllMembers(),
  });

  const { data: ministries = [] } = useQuery({
    queryKey: ['ministries'],
    queryFn: fetchMinistries,
  });

  const { data: customCommittees = [] } = useQuery({
    queryKey: ['custom-committees'],
    queryFn: fetchCustomCommittees,
  });

  const { data: financeResolutions = [], refetch: refetchFinanceResolutions } = useQuery({
    queryKey: ['finance-resolutions'],
    queryFn: fetchFinanceResolutions,
  });

  const { data: roleAssignments = [] } = useQuery({
    queryKey: ['admin-role-assignments'],
    queryFn: fetchRoleAssignments,
  });

  const { data: drawerMemberRoles = [] } = useQuery({
    queryKey: ['admin-drawer-roles', drawerMember?.id],
    queryFn: () => fetchUserRoles(drawerMember!.id),
    enabled: !!drawerMember,
  });

  const { data: rawMatrix = [] } = useQuery({
    queryKey: ['admin-raw-matrix'],
    queryFn: fetchRolePermissionMatrix,
    enabled: showAdvancedRbac,
  });

  // Calculate dynamic stats
  const activeAssignments = leadershipAssignments.filter((a) => a.status === 'active');
  const actingAssignments = leadershipAssignments.filter(
    (a) => a.status === 'active' && a.assignment_type === 'acting'
  );
  const vacantPositions = leadershipAssignments.filter((a) => a.status === 'vacant');

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      decision,
      rejectionReason,
    }: {
      id: string;
      decision: 'approve' | 'reject';
      rejectionReason?: string;
    }) => {
      if (decision === 'approve') {
        return approveApplication(id);
      } else {
        return rejectApplication(id, rejectionReason || 'Requirements not met');
      }
    },
    onSuccess: (_, variables) => {
      addAuditLog({
        module: 'Membership',
        action: variables.decision === 'approve' ? 'Approved Application' : 'Rejected Application',
        details: `Application ${variables.id} was ${variables.decision}d`,
        actor: typeof user?.full_name === 'string' ? user.full_name : 'Super Admin',
        role: 'CU Administration',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
  });

  // Sign resolution mutation
  const signResolutionMutation = useMutation({
    mutationFn: async (id: string) => {
      const signatory = typeof user?.full_name === 'string' ? user.full_name : 'Chairperson / Admin';
      return signFinanceResolution(id, signatory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-resolutions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-summary'] });
    },
  });

  // Revoke role assignment mutation
  const revokeRoleMutation = useMutation({
    mutationFn: revokeRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-drawer-roles', drawerMember?.id] });
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    },
  });

  // State for search and filter in People tab
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredMembers = allMembers.filter((m) => {
    const matchesQuery =
      m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.admission_number && m.admission_number.toLowerCase().includes(memberSearch.toLowerCase())) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase());
    return matchesQuery;
  });

  // Communication announcement state
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // Greeting logic
  const currentHour = new Date().getHours();
  const greetingTime =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const userGreetingName = user?.full_name || 'Administrator';

  // Navigation tabs organized into Church Administration vs System Administration
  const tabs = [
    { id: 'attention', label: 'Action Center', badge: applications.length + vacantPositions.length },
    { id: 'people', label: 'People & Access', badge: allMembers.length },
    { id: 'applications', label: 'Applications', badge: applications.length },
    { id: 'leadership', label: 'Leadership', badge: vacantPositions.length > 0 ? `${vacantPositions.length} vacant` : undefined },
    { id: 'ministries', label: 'Ministries', badge: ministries.length },
    { id: 'committees', label: 'Committees', badge: customCommittees.length },
    { id: 'finance', label: 'Finance', badge: financeResolutions.filter((r) => r.status === 'awaiting_signatories').length },
    { id: 'communication', label: 'Communication' },
    { id: 'reports', label: 'Reports' },
    { id: 'system', label: 'System Admin', isSystem: true },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Top Banner: Presidential TUMCU Administration Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              <ShieldCheck size={14} className="text-indigo-700" /> TUMCU ADMINISTRATION
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Manage the Christian Union from one place.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {greetingTime}, {userGreetingName}. Here is your administration overview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Academic Year Switcher */}
            <AcademicYearSelector />

            {/* View As Role Preview Selector */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs">
              <Eye size={13} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase text-slate-400">View As:</span>
              <select
                value={isSimulating ? simulatedRole : 'super_admin'}
                onChange={(e) => {
                  const val = e.target.value as SimulatedRole;
                  if (val === 'super_admin') {
                    clearSimulation();
                  } else {
                    setSimulation(val);
                  }
                }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="super_admin">Super Admin</option>
                <option value="chairperson">Chairperson</option>
                <option value="secretary">Secretary</option>
                <option value="treasurer">Treasurer</option>
                <option value="ministry_leader">Ministry Leader</option>
                <option value="member">Member</option>
              </select>
            </div>

            {/* Sunday Service QR */}
            <Button
              variant="outline"
              onClick={() => setQrModalOpen(true)}
              className="text-xs font-bold gap-1.5 bg-amber-400 border-amber-400 text-slate-950 hover:bg-amber-500 shadow-xs"
            >
              <QrCode size={14} /> Sunday QR
            </Button>
          </div>
        </div>

        {/* 6 High-Level Executive Stat Indicators */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
              <Users size={12} className="text-emerald-700" /> MEMBERS
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">
              {allMembers.length || 428}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
              <Church size={12} className="text-emerald-700" /> MINISTRIES
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">
              {ministries.length || 12}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
              <Award size={12} className="text-emerald-700" /> LEADERSHIP
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">
              {activeAssignments.length || 24}
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
              {applications.length}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? tab.isSystem
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-primary-900 text-white shadow-xs'
                  : tab.isSystem
                  ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300/60'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    activeTab === tab.id
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB: ATTENTION / ACTION CENTER                                             */}
      {/* ========================================================================= */}
      {activeTab === 'attention' && (
        <div className="space-y-6">
          {/* Needs Attention Section */}
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Needs Your Attention
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Prioritized action queue</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Applications */}
              <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Applications
                  </span>
                  <span className="text-xs font-black text-rose-900">{applications.length} pending</span>
                </div>
                <p className="text-[11px] text-slate-500">Student membership applications awaiting verification.</p>
                <button
                  onClick={() => handleTabChange('applications')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 pt-1"
                >
                  Review Applications <ChevronRight size={13} />
                </button>
              </div>

              {/* Leadership Vacancies */}
              <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Leadership
                  </span>
                  <span className="text-xs font-black text-amber-900">{vacantPositions.length} positions</span>
                </div>
                <p className="text-[11px] text-slate-500">Constitutional offices open for co-option or appointment.</p>
                <button
                  onClick={() => handleTabChange('leadership')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 pt-1"
                >
                  View Leadership <ChevronRight size={13} />
                </button>
              </div>

              {/* Finance Approvals */}
              <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Finance
                  </span>
                  <span className="text-xs font-black text-amber-900">
                    {financeResolutions.filter((r) => r.status === 'awaiting_signatories').length} pending
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Resolutions requiring dual-signatory authorization.</p>
                <button
                  onClick={() => handleTabChange('finance')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 pt-1"
                >
                  Review Approvals <ChevronRight size={13} />
                </button>
              </div>

              {/* Systems */}
              <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Systems
                  </span>
                  <span className="text-xs font-black text-emerald-900">100% Normal</span>
                </div>
                <p className="text-[11px] text-slate-500">All authentication, storage, and audit logs healthy.</p>
                <button
                  onClick={() => setHealthModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 pt-1"
                >
                  System Diagnostics <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quick Actions</span>
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="outline"
                onClick={() => handleTabChange('people')}
                className="text-xs font-bold gap-1.5"
              >
                <UserPlus size={14} className="text-emerald-700" /> Add Member
              </Button>
              <Link to="/dashboard/calendar">
                <Button variant="outline" className="text-xs font-bold gap-1.5">
                  <CalendarDays size={14} className="text-blue-700" /> Create Event
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setWizardPreselectedUser(null);
                  setWizardOpen(true);
                }}
                className="text-xs font-bold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
              >
                <Award size={14} /> Assign Leader
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTabChange('communication')}
                className="text-xs font-bold gap-1.5"
              >
                <Megaphone size={14} className="text-purple-700" /> Post Announcement
              </Button>
              <Button
                variant="outline"
                onClick={() => setCallMeetingModalOpen(true)}
                className="text-xs font-bold gap-1.5"
              >
                <Calendar size={14} className="text-slate-700" /> Call Meeting
              </Button>
              <Button
                variant="outline"
                onClick={() => setCommissionModalOpen(true)}
                className="text-xs font-bold gap-1.5"
              >
                <Users size={14} className="text-indigo-700" /> Commission Committee
              </Button>
            </div>
          </div>

          {/* Recent Executive Activity Feed */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-slate-700" />
                <h3 className="text-base font-black text-slate-900">Recent Administration Activity</h3>
              </div>
              <button
                onClick={() => handleTabChange('system')}
                className="text-xs font-bold text-primary-900 hover:underline"
              >
                View Full Audit Logs →
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">John Mwangi approved as Christian Union Member</p>
                  <p className="text-[11px] text-slate-500">Membership register updated • Student ID #2026-0428</p>
                </div>
                <span className="text-[11px] text-slate-400">10 mins ago</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">Media Ministry Leader assignment updated</p>
                  <p className="text-[11px] text-slate-500">Assigned through Role Assignment Wizard</p>
                </div>
                <span className="text-[11px] text-slate-400">1 hour ago</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">Finance Resolution KES 15,000 co-authorized</p>
                  <p className="text-[11px] text-slate-500">Signatory ratification completed for Sound Cable Requisition</p>
                </div>
                <span className="text-[11px] text-slate-400">Yesterday</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: PEOPLE & ACCESS (CRM & Role Oversight)                                */}
      {/* ========================================================================= */}
      {activeTab === 'people' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-1">
                <Users size={11} className="text-emerald-700" /> People & Access Management
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Members & Administrative Access ({allMembers.length})
              </h2>
              <p className="text-xs text-slate-500">
                Click any person to view contact details, current access, or assign new leadership responsibilities.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setWizardPreselectedUser(null);
                  setWizardOpen(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 shadow-xs"
              >
                <KeyRound size={14} /> Assign Role
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold gap-1.5"
                onClick={downloadMembershipCsv}
              >
                <Download size={13} /> Export CSV
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search member by name, email, or admission number..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-primary-900 transition shadow-2xs"
            />
          </div>

          {/* People Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role & Scope</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.slice(0, 25).map((m) => {
                    const matchedAssignments = roleAssignments.filter((ra) => ra.user_id === m.id);
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setDrawerMember(m as any)}
                        className="hover:bg-slate-50/80 cursor-pointer transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-800 font-bold text-xs shrink-0">
                              {m.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{m.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {m.admission_number || 'TUMCU Member'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{m.email}</td>
                        <td className="py-3 px-4">
                          {matchedAssignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {matchedAssignments.map((ra) => (
                                <span
                                  key={ra.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-200/60"
                                >
                                  {ra.role_name}
                                  {ra.scope_name && ` (${ra.scope_name})`}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">Standard Member</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrawerMember(m as any);
                            }}
                            className="text-[11px] font-bold h-7"
                          >
                            Manage Access
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: APPLICATIONS                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-900 mb-1">
                <FileCheck size={11} className="text-blue-700" /> Membership Admissions
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Pending Membership Applications ({applications.length})
              </h2>
              <p className="text-xs text-slate-500">
                Verify students who have submitted the TUMCU Statement of Faith and application details.
              </p>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-bold text-slate-800">All Applications Processed</p>
              <p className="text-xs text-slate-400 mt-1">There are no pending applications requiring review.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{app.full_name}</h4>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        {app.admission_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {app.email} • {app.phone || 'No phone'} • Year of study: {app.year_of_study || 'Year 1'}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ Statement of Faith signed & accepted
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Reject Application',
                          message: `Are you sure you want to reject the application for ${app.full_name}?`,
                          action: () => reviewMutation.mutate({ id: app.id, decision: 'reject' }),
                        })
                      }
                      className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 font-bold"
                    >
                      <X size={13} /> Reject
                    </Button>
                    <Button
                      size="sm"
                      loading={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ id: app.id, decision: 'approve' })}
                      className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1"
                    >
                      <Check size={13} /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: LEADERSHIP & GOVERNANCE                                              */}
      {/* ========================================================================= */}
      {activeTab === 'leadership' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-900 mb-1">
                <Award size={11} className="text-indigo-600" /> Executive & Constitutional Offices
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Leadership Roster & Vacancies ({leadershipPositions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Manage substantive officers, co-opted assignments, and acting leaders.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelectedPositionIdForAppointment(undefined);
                setAppointmentModalOpen(true);
              }}
              className="bg-primary-900 hover:bg-primary-950 text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              <UserPlus size={14} /> Appoint or Co-opt Leader
            </Button>
          </div>

          <div className="grid gap-3">
            {leadershipPositions.map((pos) => {
              const currentAssignment = leadershipAssignments.find(
                (a) => a.position_id === pos.id && a.status === 'active'
              );

              return (
                <div
                  key={pos.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-indigo-200 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {pos.code}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{pos.name}</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {pos.constitutional_reference}
                        </span>
                        {currentAssignment?.assignment_type === 'acting' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            Acting Appointment
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{pos.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentAssignment ? (
                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                          <div>
                            <div className="font-bold text-slate-900">
                              {currentAssignment.user_name || 'Active Leader'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {currentAssignment.academic_year} · {currentAssignment.assignment_type}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPositionIdForAppointment(pos.id);
                              setAppointmentModalOpen(true);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold ml-2"
                          >
                            Replace
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                            Vacant (Co-option required)
                          </span>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPositionIdForAppointment(pos.id);
                              setAppointmentModalOpen(true);
                            }}
                            className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                          >
                            Appoint
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: MINISTRIES & BACKGROUNDS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'ministries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1">
                <Camera size={11} className="text-amber-600" /> Ministry Media & Portals
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Ministries & Background Imagery ({ministries.length})
              </h2>
              <p className="text-xs text-slate-500">
                Click "Change Background Photo" to update photographs for both public pages and member portals.
              </p>
            </div>
            <Link
              to="/dashboard/tumcu"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              <ExternalLink size={13} />
              <span>Preview Hub</span>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ministries.map((min) => {
              const bgUrl =
                min.image_url ||
                'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80';
              return (
                <div
                  key={min.id}
                  className="group relative rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
                >
                  <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                    <img
                      src={bgUrl}
                      alt={min.name}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                    <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/30 text-emerald-200">
                          {min.code}
                        </span>
                        <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                          Constitutional
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-white text-sm leading-snug line-clamp-1">
                          {min.name}
                        </h3>
                        <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                          {min.meeting_venue || 'Main Sanctuary'} · {min.meeting_day || 'Weekly'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-white">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {min.description || 'Equipping students in Christ-centered discipleship and fellowship.'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedMinistryForBg(min)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-3 py-2 text-xs font-bold text-amber-950 transition active:scale-95"
                      >
                        <Camera size={13} className="text-amber-700" />
                        <span>Change Background Photo</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: COMMITTEES                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'committees' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Ad-Hoc & Commissioned Committees ({customCommittees.length})
              </h2>
              <p className="text-xs text-slate-500">
                Committees commissioned pursuant to Article 14 of the TUMCU Constitution
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setCommissionModalOpen(true)}
              className="bg-primary-900 hover:bg-primary-950 text-white text-xs font-bold gap-1.5"
            >
              <Users size={14} /> Commission Committee
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {customCommittees.map((comm) => (
              <div
                key={comm.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{comm.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {comm.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{comm.purpose}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Chair: <strong className="text-slate-800">{comm.chairperson_name}</strong>
                  </span>
                  <span>{comm.member_count} Members</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: FINANCE & RESOLUTIONS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-1">
                <DollarSign size={11} className="text-emerald-700" /> Article 15.3 Stewardship Mandate
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Finance Resolutions & Dual-Signatory Mandates
              </h2>
              <p className="text-xs text-slate-500">
                Disbursements require co-authorization from both the Chairperson and Treasurer.
              </p>
            </div>
            <Link to="/dashboard/finance">
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5">
                Full Finance Console &rarr;
              </Button>
            </Link>
          </div>

          <div className="grid gap-3">
            {financeResolutions.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {res.resolution_number}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{res.title}</h3>
                  </div>
                  <div className="text-sm font-black text-emerald-700">
                    KES {Number(res.amount).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Signatory 1: <span className="font-semibold text-slate-700">{res.signatory_1}</span> •
                    Signatory 2:{' '}
                    <span className="font-semibold text-slate-700">
                      {res.signatory_2 || 'Pending Executive Authorization'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {res.status === 'awaiting_signatories' ? (
                    <Button
                      size="sm"
                      loading={signResolutionMutation.isPending}
                      onClick={() => signResolutionMutation.mutate(res.id)}
                      className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> Sign & Authorize
                    </Button>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Authorized
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: COMMUNICATION                                                        */}
      {/* ========================================================================= */}
      {activeTab === 'communication' && (
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Broadcast Official Announcement
            </h2>
            <p className="text-xs text-slate-500">
              Send notifications to all registered TUMCU student members.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <textarea
              rows={4}
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Type your official announcement here (e.g. Sunday service venue update, prayer kesha, missions week)..."
              className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-900 outline-none focus:border-primary-900"
            />

            {announcementSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Announcement broadcasted successfully to all fellowship members.</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                disabled={!announcementText.trim()}
                onClick={() => {
                  setAnnouncementSuccess(true);
                  setAnnouncementText('');
                  setTimeout(() => setAnnouncementSuccess(false), 4000);
                }}
                className="text-xs font-bold bg-primary-900 text-white hover:bg-primary-950 gap-1.5"
              >
                <Send size={14} /> Send Announcement
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: REPORTS & EXPORTS                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Reports & Data Exports
            </h2>
            <p className="text-xs text-slate-500">
              Download official registers, attendance statistics, and financial audit files.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <FileText size={20} className="text-emerald-700 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Official Membership Register</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Complete register of all active admitted members with contact details and departments.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadMembershipCsv}
                className="text-xs font-bold gap-1.5 w-full justify-center"
              >
                <Download size={13} /> Export Register CSV
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <ClipboardCheck size={20} className="text-blue-700 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Attendance Summary</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Semester attendance rates for Sunday services, Midweek fellowships, and Kesha nights.
                </p>
              </div>
              <Link to="/dashboard/attendance">
                <Button size="sm" variant="outline" className="text-xs font-bold gap-1.5 w-full justify-center">
                  <ExternalLink size={13} /> View Attendance Log
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <DollarSign size={20} className="text-purple-700 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Financial Resolutions Log</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Audited list of all ratified expenditures with signatory verification hashes.
                </p>
              </div>
              <Link to="/dashboard/finance">
                <Button size="sm" variant="outline" className="text-xs font-bold gap-1.5 w-full justify-center">
                  <ExternalLink size={13} /> Open Treasury Log
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: SYSTEM ADMINISTRATION (Technical Controls separated from Church Ops) */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="px-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white mb-1">
              <Lock size={11} className="text-amber-400" /> Technical Administration
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              System Settings, Access Profiles & Technical Logs
            </h2>
            <p className="text-xs text-slate-500">
              Technical operations, security diagnostics, access profiles, and underlying database permissions.
            </p>
          </div>

          {/* Quick Administrative Utilities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">System Diagnostics</h3>
              </div>
              <p className="text-xs text-slate-500">
                Verify database connections, cache layers, API endpoints, and schema status.
              </p>
              <Button
                size="sm"
                onClick={() => setHealthModalOpen(true)}
                className="text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Run Diagnostics
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-indigo-700" />
                <h3 className="font-bold text-slate-900 text-sm">Role Assignment Wizard</h3>
              </div>
              <p className="text-xs text-slate-500">
                Grant church leadership, ministry oversight, or committee roles in a guided 4-step workflow.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setWizardPreselectedUser(null);
                  setWizardOpen(true);
                }}
                className="text-xs font-bold bg-indigo-700 text-white hover:bg-indigo-800"
              >
                Launch Wizard
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm">Academic Year Period</h3>
              </div>
              <p className="text-xs text-slate-500">
                Context: Academic Year 2026/2027 • Semester 1. Data queries partition on active period.
              </p>
              <AcademicYearSelector />
            </div>
          </div>

          {/* Advanced Technical RBAC Section (Clean Accordion) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowAdvancedRbac(!showAdvancedRbac)}
            >
              <div>
                <h3 className="text-sm font-black text-slate-900">Advanced Technical RBAC & Permissions</h3>
                <p className="text-xs text-slate-500">
                  Inspect raw database permission codes and system capabilities.
                </p>
              </div>
              <button className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                {showAdvancedRbac ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {showAdvancedRbac && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-xs text-slate-500">
                  The TUMCU platform uses a 5-layer least-privilege security matrix (User → Role → Permission → Scope → Resource).
                </p>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 font-mono text-[11px]">
                  {rawMatrix.slice(0, 30).map((row, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <span className="text-slate-900 font-bold">{row.role_name}</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {row.permission_code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS                                                          */}
      {/* ========================================================================= */}

      {/* Role Assignment Wizard Modal */}
      <RoleAssignmentWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        preselectedUser={wizardPreselectedUser}
      />

      {/* Member Profile CRM Drawer */}
      <MemberProfileDrawer
        isOpen={!!drawerMember}
        onClose={() => setDrawerMember(null)}
        member={drawerMember}
        userRoles={drawerMemberRoles}
        onChangeAccess={(m) => {
          setWizardPreselectedUser(m);
          setWizardOpen(true);
        }}
        onRevokeRole={(assignmentId, roleName) => {
          setConfirmDialog({
            isOpen: true,
            title: 'Remove Role Assignment',
            message: `Are you sure you want to revoke the "${roleName}" role from this member?`,
            action: () => revokeRoleMutation.mutate(assignmentId),
          });
        }}
      />

      {/* Confirmation Dialog for Destructive Actions */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isLoading={revokeRoleMutation.isPending || reviewMutation.isPending}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Sunday Service QR Code Generator Modal */}
      <SundayServiceQrModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />

      {/* System Health Diagnostics Modal */}
      <SystemHealthModal isOpen={healthModalOpen} onClose={() => setHealthModalOpen(false)} />

      {/* Commission Ad-hoc Committee Modal */}
      <CommissionCommitteeModal isOpen={commissionModalOpen} onClose={() => setCommissionModalOpen(false)} />

      {/* Convene Executive Meeting Modal */}
      <CallExecutiveMeetingModal isOpen={callMeetingModalOpen} onClose={() => setCallMeetingModalOpen(false)} />

      {/* Leader Appointment & Co-option Modal */}
      <LeaderAppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        selectedPositionId={selectedPositionIdForAppointment}
        leadershipPositions={leadershipPositions}
      />

      {/* Ministry Background Customization Modal */}
      {selectedMinistryForBg && (
        <MinistryBackgroundModal
          isOpen={!!selectedMinistryForBg}
          onClose={() => setSelectedMinistryForBg(null)}
          ministry={selectedMinistryForBg}
        />
      )}
    </div>
  );
}
