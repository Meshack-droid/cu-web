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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
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
  terminateRole,
  searchUsers,
  fetchDashboardSummary,
  fetchCustomCommittees,
  fetchFinanceResolutions,
  signFinanceResolution,
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

export function AdminCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const addAuditLog = useDashboardStore((s) => s.addAuditLog);

  // Tab management: default to 'attention' (What needs my attention?)
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
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
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

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  });

  // Calculate dynamic stats
  const activeAssignments = leadershipAssignments.filter((a) => a.status === 'active');
  const actingAssignments = leadershipAssignments.filter((a) => a.status === 'active' && a.assignment_type === 'acting');
  const vacantPositions = leadershipAssignments.filter((a) => a.status === 'vacant');

  // Application approval / rejection
  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, rejectionReason }: { id: string; decision: 'approve' | 'reject'; rejectionReason?: string }) => {
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

  // Finance resolution sign mutation
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

  // State for search and filter in People tab
  const [memberSearch, setMemberSearch] = useState('');
  const filteredMembers = allMembers.filter(
    (m) =>
      m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.admission_number && m.admission_number.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  // State for announcement in Communication tab
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // Greeting logic
  const currentHour = new Date().getHours();
  const greetingTime = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const userGreetingName = user?.full_name || 'Chairperson';

  // Navigation tabs
  const tabs = [
    { id: 'attention', label: 'Action Center', badge: applications.length + vacantPositions.length },
    { id: 'leadership', label: 'Leadership & Governance', badge: vacantPositions.length > 0 ? `${vacantPositions.length} vacant` : undefined },
    { id: 'applications', label: 'Applications', badge: applications.length },
    { id: 'finance', label: 'Finance & Resolutions', badge: financeResolutions.filter((r) => r.status === 'awaiting_signatories').length },
    { id: 'committees', label: 'Committees', badge: customCommittees.length },
    { id: 'ministries', label: 'Ministries & Backgrounds', badge: ministries.length },
    { id: 'people', label: 'People' },
    { id: 'communication', label: 'Communication' },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Top Banner: Presidential CU Administration Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              <ShieldCheck size={14} className="text-indigo-700" /> TUMCU ADMINISTRATION
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {greetingTime}, {userGreetingName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Here's what needs your attention across the Christian Union fellowship.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notification Bell with unread counter */}
            <button
              onClick={() => handleTabChange('attention')}
              className="relative p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              title="Action items pending"
            >
              <Bell className="w-4 h-4" />
              {(applications.length > 0 || vacantPositions.length > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {applications.length + vacantPositions.length}
                </span>
              )}
            </button>

            {/* Sunday Service QR */}
            <Button
              variant="outline"
              onClick={() => setQrModalOpen(true)}
              className="text-xs font-bold gap-1.5 bg-amber-400 border-amber-400 text-slate-950 hover:bg-amber-500 shadow-xs"
            >
              <QrCode size={14} /> Sunday Service QR
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    activeTab === tab.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-800'
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
      {/* TAB: ATTENTION / ACTION CENTER (What Needs My Attention)                   */}
      {/* ========================================================================= */}
      {activeTab === 'attention' && (
        <div className="space-y-6">
          {/* Action-Oriented Attention Box */}
          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Action Center · Priority Attention
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Live Constitutional Monitor
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1: Applications awaiting review */}
              {applications.length > 0 ? (
                <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-indigo-300 transition shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      {applications.length}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {applications.length} Applications for membership awaiting review
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Students have signed faith declarations and need official certification.
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTabChange('applications')}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                  >
                    Review <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All membership applications are currently up to date.</span>
                </div>
              )}

              {/* Item 2: Leadership Vacancies needing appointment */}
              {vacantPositions.length > 0 ? (
                <div className="flex items-center justify-between p-3.5 bg-white border border-amber-200 rounded-xl hover:border-amber-300 transition shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                      {vacantPositions.length}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-950">
                        {vacantPositions.length} Constitutional position{vacantPositions.length > 1 ? 's' : ''} vacant or requiring co-option
                      </div>
                      <div className="text-[11px] text-amber-700">
                        {vacantPositions.map((v) => v.position_name).join(', ')}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPositionIdForAppointment(vacantPositions[0]?.position_id);
                      setAppointmentModalOpen(true);
                    }}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Appoint
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All 15 constitutional leadership positions are currently staffed.</span>
                </div>
              )}

              {/* Item 3: Committee meetings minutes */}
              <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-indigo-300 transition shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      3 Committee meetings need minutes uploaded
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Missions Committee (14th Mar), Choir Executive (18th Mar), Devotions Sitting (20th Mar)
                    </div>
                  </div>
                </div>
                <Link to="/dashboard/meetings">
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    Upload Minutes <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Item 4: Finance resolutions pending dual-signatory executive authorization */}
              {financeResolutions.filter((r) => r.status === 'awaiting_signatories').length > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-white border border-emerald-200 rounded-xl hover:border-emerald-300 transition shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {financeResolutions.filter((r) => r.status === 'awaiting_signatories').length}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950">
                        {financeResolutions.filter((r) => r.status === 'awaiting_signatories').length} Finance resolution awaiting dual-signatory authorization
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Article 15.3 enforcement: Both Chairperson & Treasurer authorization required.
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTabChange('finance')}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    Authorize <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions Bar */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setCallMeetingModalOpen(true)}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-sm text-left transition flex flex-col justify-between group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Call Executive Meeting</div>
                  <div className="text-[10px] text-slate-500">Convene official sitting</div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('communication')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-sm text-left transition flex flex-col justify-between group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Send Announcement</div>
                  <div className="text-[10px] text-slate-500">Broadcast to all members</div>
                </div>
              </button>

              <button
                onClick={() => setCommissionModalOpen(true)}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:shadow-sm text-left transition flex flex-col justify-between group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Commission Committee</div>
                  <div className="text-[10px] text-slate-500">Ad-hoc terms of reference</div>
                </div>
              </button>

              <button
                onClick={() => setHealthModalOpen(true)}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-sm text-left transition flex flex-col justify-between group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">System Health</div>
                  <div className="text-[10px] text-slate-500">Diagnostics & audit engine</div>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 my-4" />

          {/* Two-Column: Executive Committee Status & This Week in TUMCU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Executive Committee Status */}
            <Card className="p-5 border-slate-200 bg-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Executive Committee Status
                  </h3>
                </div>
                <button
                  onClick={() => handleTabChange('leadership')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View Full Roster &rarr;
                </button>
              </div>

              <div className="py-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">• Active Constitutional Offices:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {activeAssignments.length} of 15 positions active
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">• Acting Appointments:</span>
                  <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {actingAssignments.length > 0 ? `${actingAssignments.length} Acting (${actingAssignments.map(a => a.position_name).join(', ')})` : 'None (All substantive)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">• Tenure & Mandate:</span>
                  <span className="font-semibold text-slate-800">
                    2025/2026 Academic Spiritual Year (7 months remaining)
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Article 12 & 13 TUMCU Constitution</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPositionIdForAppointment(undefined);
                    setAppointmentModalOpen(true);
                  }}
                  className="text-xs gap-1"
                >
                  <UserPlus className="w-3 h-3" /> Appoint Leader
                </Button>
              </div>
            </Card>

            {/* This Week in TUMCU */}
            <Card className="p-5 border-slate-200 bg-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    This Week in TUMCU
                  </h3>
                </div>
                <Link to="/dashboard/tumcu" className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold">
                  Full Calendar &rarr;
                </Link>
              </div>

              <div className="py-3 space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Wednesday: Midweek Fellowship</div>
                    <div className="text-[11px] text-slate-500">5:00 PM – 7:00 PM · Assembly Hall / Online Hybrid</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Friday: Kesha & Night of Worship</div>
                    <div className="text-[11px] text-slate-500">9:00 PM – Dawn · TUMCU Chapel Sanctuary</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Sunday: Main Services</div>
                    <div className="text-[11px] text-slate-500">1st Service: 8:30 AM · 2nd Service: 10:30 AM</div>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Sanctuary & Campus Ministry Operations</span>
                <span className="font-semibold text-emerald-700">All Venues Reserved</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: LEADERSHIP & GOVERNANCE (Dynamic RBAC & Positions)                   */}
      {/* ========================================================================= */}
      {activeTab === 'leadership' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-900 mb-1">
                <Award size={11} className="text-indigo-600" /> Dynamic Role-Based Access Control
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Constitutional Offices & Leadership Assignments ({leadershipPositions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Permissions and dashboard views are derived dynamically from constitutional position assignments.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelectedPositionIdForAppointment(undefined);
                setAppointmentModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              <UserPlus size={14} /> Appoint or Co-opt Leader
            </Button>
          </div>

          {/* Table of Constitutional Positions & Assignees */}
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

                  {/* Constitutional Responsibilities and Restrictions */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-800">Key Duties: </span>
                      {pos.responsibilities.slice(0, 2).join('; ')}
                    </div>
                    {pos.constitutional_restrictions.length > 0 && (
                      <div className="text-rose-700 bg-rose-50/60 p-1.5 rounded-lg border border-rose-100">
                        <span className="font-semibold">Restriction: </span>
                        {pos.constitutional_restrictions[0]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: MEMBERSHIP APPLICATIONS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Pending Membership Applications
              </h2>
              <p className="text-xs text-slate-500">Review student registrations and grant certified full membership</p>
            </div>
            <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {applications.length} Pending Review
            </span>
          </div>

          {appsLoading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-white" />
          ) : applications.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-slate-500 bg-white">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
              All membership applications have been reviewed and approved!
            </Card>
          ) : (
            <div className="grid gap-3">
              {applications.map((app) => (
                <Card
                  key={app.id}
                  variant="glass"
                  className="p-5 border border-slate-200/80 bg-white hover:border-indigo-200 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{app.full_name}</h3>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {app.admission_number || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {app.membership_type_name || 'Regular'} · {app.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        className="text-xs font-bold px-3.5 py-1.5 bg-slate-900 text-white gap-1"
                        loading={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: app.id, decision: 'approve' })}
                      >
                        <Check size={14} /> Approve Member
                      </Button>
                      <Button
                        variant="outline"
                        className="text-xs font-bold px-3 py-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
                        onClick={() => {
                          const reason = prompt('Enter rejection reason (optional):') || 'Requirements not met';
                          reviewMutation.mutate({ id: app.id, decision: 'reject', rejectionReason: reason });
                        }}
                      >
                        <X size={14} /> Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: FINANCE & RESOLUTIONS (Article 15.3 Dual-Signatory Controls)          */}
      {/* ========================================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-1">
                <WalletCards size={11} className="text-emerald-700" /> Constitutional Financial Controls
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Finance Resolutions & Dual-Signatory Mandates
              </h2>
              <p className="text-xs text-slate-500">
                Pursuant to Article 15.3, disbursements require co-authorization from both the Chairperson and Treasurer.
              </p>
            </div>
            <Link to="/dashboard/finance">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5">
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
                    Signatory 1: <span className="font-semibold text-slate-700">{res.signatory_1}</span> • Signatory 2: <span className="font-semibold text-slate-700">{res.signatory_2 || 'Pending Executive Authorization'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {res.status === 'awaiting_signatories' ? (
                    <Button
                      size="sm"
                      loading={signResolutionMutation.isPending}
                      onClick={() => signResolutionMutation.mutate(res.id)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
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
      {/* TAB: AD-HOC COMMITTEES                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'committees' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Ad-Hoc & Commissioned Committees ({customCommittees.length})
              </h2>
              <p className="text-xs text-slate-500">Committees commissioned pursuant to Article 14 of the TUMCU Constitution</p>
            </div>
            <Button
              size="sm"
              onClick={() => setCommissionModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
            >
              <Users size={14} /> Commission New Committee
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
                  <span>Chair: <strong className="text-slate-800">{comm.chairperson_name}</strong></span>
                  <span>{comm.member_count} Members</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: MINISTRIES & BACKGROUND PHOTOGRAPHS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'ministries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200/80 mb-1">
                <Camera size={11} className="text-amber-600" /> Super Admin Ministry Media Controls
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Constitutional Ministries & Tab Backgrounds ({ministries.length})
              </h2>
              <p className="text-xs text-slate-500">
                Click "Change Background Photo" on any ministry to upload a photograph from your device, choose from curated Christian sanctuary presets, or enter an image link.
              </p>
            </div>
            <Link
              to="/dashboard/tumcu"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              <ExternalLink size={13} />
              <span>Preview Hub View</span>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ministries.map((min) => {
              const bgUrl = min.image_url || 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80';
              return (
                <div
                  key={min.id}
                  className="group relative rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
                >
                  {/* Photo Header Thumbnail */}
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
                        <h3 className="font-black text-white text-sm leading-snug drop-shadow-sm line-clamp-1">
                          {min.name}
                        </h3>
                        <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                          {min.meeting_venue || 'Main Sanctuary'} · {min.meeting_day || 'Weekly'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body Content & Actions */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-white">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {min.description || 'Equipping students in Christ-centered discipleship and campus evangelism.'}
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
      {/* TAB: PEOPLE & REGISTRY                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'people' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                People & Registry ({allMembers.length} Members)
              </h2>
              <p className="text-xs text-slate-500">Official registry of certified believers and servant leaders</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs outline-none bg-white text-slate-800"
                />
              </div>
              <Button
                variant="outline"
                className="text-xs font-bold px-3 py-1.5 gap-1.5"
                onClick={downloadMembershipCsv}
              >
                <Download size={13} /> Export CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            {filteredMembers.slice(0, 15).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-2xl bg-white p-3.5 border border-slate-200/80 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-800 font-bold text-xs">
                    {m.full_name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{m.full_name}</h4>
                    <span className="text-[11px] text-slate-500">
                      {m.admission_number || 'No Adm'} · {m.department || 'General'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-800 border border-emerald-200 text-[11px]">
                    {m.status || 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: COMMUNICATION & BROADCASTS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'communication' && (
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Campus Broadcast & Announcements
            </h2>
            <p className="text-xs text-slate-500">Publish notices to the member portal dashboard</p>
          </div>

          <Card variant="glass" className="p-6 border border-slate-200/80 bg-white space-y-3">
            <label className="block text-xs font-bold text-slate-700">New Announcement / Pastoral Message</label>
            <textarea
              rows={3}
              placeholder="e.g. Remember to join us this Friday for the Worship Night at Main Sanctuary..."
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs outline-none text-slate-900"
            />
            <div className="flex items-center justify-between pt-1">
              <Button
                className="text-xs font-bold px-4 py-2 bg-slate-900 text-white gap-1.5"
                disabled={!announcementText.trim()}
                onClick={() => {
                  setAnnouncementSuccess(true);
                  setAnnouncementText('');
                  setTimeout(() => setAnnouncementSuccess(false), 3000);
                }}
              >
                <Send className="w-3.5 h-3.5" /> Publish Broadcast
              </Button>
              {announcementSuccess && (
                <span className="text-xs font-bold text-emerald-700">Announcement broadcasted successfully!</span>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      {qrModalOpen && <SundayServiceQrModal onClose={() => setQrModalOpen(false)} />}
      
      {healthModalOpen && <SystemHealthModal isOpen={healthModalOpen} onClose={() => setHealthModalOpen(false)} />}

      {commissionModalOpen && (
        <CommissionCommitteeModal
          isOpen={commissionModalOpen}
          onClose={() => setCommissionModalOpen(false)}
        />
      )}

      {callMeetingModalOpen && (
        <CallExecutiveMeetingModal
          isOpen={callMeetingModalOpen}
          onClose={() => setCallMeetingModalOpen(false)}
        />
      )}

      {appointmentModalOpen && (
        <LeaderAppointmentModal
          isOpen={appointmentModalOpen}
          onClose={() => setAppointmentModalOpen(false)}
          defaultPositionId={selectedPositionIdForAppointment}
        />
      )}

      {selectedMinistryForBg && (
        <MinistryBackgroundModal
          isOpen={Boolean(selectedMinistryForBg)}
          onClose={() => setSelectedMinistryForBg(null)}
          ministry={selectedMinistryForBg}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
          }}
        />
      )}
    </div>
  );
}
