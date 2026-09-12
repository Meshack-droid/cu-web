import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  HandHeart,
  Church,
  ArrowRight,
  Sparkles,
  QrCode,
  Users,
  Camera,
  Info,
  Award,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { useViewAsStore, type SimulatedRole } from '@/store/viewAs.store';
import { fetchMyMembershipStatus } from '@/features/membership/membership.api';
import { fetchMyMinistries } from '@/features/ministries/ministries.api';
import { fetchDashboardSummary } from '@/features/admin/admin.api';
import { MemberDashboardView } from '@/components/dashboards/MemberDashboardView';
import { MinistryLeaderDashboardView } from '@/components/dashboards/MinistryLeaderDashboardView';
import { SecretaryDashboardView } from '@/components/dashboards/SecretaryDashboardView';
import { TreasurerDashboardView } from '@/components/dashboards/TreasurerDashboardView';
import { ExecutiveDashboardView } from '@/components/dashboards/ExecutiveDashboardView';
import { RoleAssignmentWizardModal } from '@/components/RoleAssignmentWizardModal';
import { SundayServiceQrModal } from '@/components/SundayServiceQrModal';
import { AcademicYearSelector } from '@/components/AcademicYearSelector';

export function DashboardOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isSimulating, simulatedRole, simulatedMinistryName, setSimulation, clearSimulation } =
    useViewAsStore();

  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [sanctuaryCodeInput, setSanctuaryCodeInput] = useState('');
  const [isAssignWizardOpen, setIsAssignWizardOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Queries
  const { data: membership } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: fetchMyMembershipStatus,
  });

  const { data: myMinistries = [] } = useQuery({
    queryKey: ['my-ministries'],
    queryFn: fetchMyMinistries,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: fetchDashboardSummary,
  });

  // Calculate user's effective role
  const effectiveRole = useMemo<SimulatedRole>(() => {
    if (isSimulating) {
      return simulatedRole;
    }
    const roleCode = String(user?.role || '');
    if (roleCode === 'super_admin' || roleCode === 'chairperson' || roleCode === 'system_admin') {
      return 'super_admin';
    }
    if (roleCode === 'secretary' || roleCode === 'vice_secretary') {
      return 'secretary';
    }
    if (roleCode === 'treasurer') {
      return 'treasurer';
    }
    if (roleCode.includes('ministry_') || roleCode.includes('_chairperson')) {
      return 'ministry_leader';
    }
    return 'member';
  }, [isSimulating, simulatedRole, user]);

  const isSuperAdminOrChair =
    user?.role === 'super_admin' ||
    user?.role === 'system_admin' ||
    user?.role === 'chairperson' ||
    isSimulating;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Top Controls Bar: Academic Year & Administrative View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <AcademicYearSelector />
        </div>

        {/* View As Role Preview Selector (visible to Super Admins & Chairs) */}
        {isSuperAdminOrChair && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Eye size={13} className="text-slate-400" /> View As:
            </span>
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
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 outline-none hover:bg-slate-100 cursor-pointer transition"
            >
              <option value="super_admin">Super Admin / Executive</option>
              <option value="chairperson">Chairperson</option>
              <option value="secretary">Secretary</option>
              <option value="treasurer">Treasurer</option>
              <option value="ministry_leader">Ministry Leader (Media)</option>
              <option value="member">Regular Member</option>
            </select>
          </div>
        )}
      </div>

      {/* Render Dynamic Role-Based Dashboard */}
      {effectiveRole === 'member' && (
        <MemberDashboardView
          user={user}
          membership={membership}
          myMinistries={myMinistries}
          onOpenCheckIn={() => setIsScannerModalOpen(true)}
        />
      )}

      {effectiveRole === 'ministry_leader' && (
        <MinistryLeaderDashboardView
          user={user}
          ministryName={isSimulating ? simulatedMinistryName : myMinistries[0]?.ministry_name || 'Media Ministry'}
        />
      )}

      {effectiveRole === 'secretary' && (
        <SecretaryDashboardView user={user} pendingApplicationsCount={17} />
      )}

      {effectiveRole === 'treasurer' && (
        <TreasurerDashboardView user={user} pendingRequestsCount={7} />
      )}

      {(effectiveRole === 'super_admin' || effectiveRole === 'chairperson') && (
        <ExecutiveDashboardView
          user={user}
          summaryData={summaryData}
          applicationsCount={17}
          vacantPositionsCount={3}
          financeApprovalsCount={2}
          onOpenAssignWizard={() => setIsAssignWizardOpen(true)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
        />
      )}

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

      {/* Role Assignment Wizard */}
      <RoleAssignmentWizardModal
        isOpen={isAssignWizardOpen}
        onClose={() => setIsAssignWizardOpen(false)}
      />

      {/* Sunday Service QR Modal */}
      <SundayServiceQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
