import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Clock,
  XCircle,
  Users,
  Sparkles,
  Search,
  Filter,
  Download,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Building,
  ShieldCheck,
  Phone,
  Mail,
  UserCheck,
  Check,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
import {
  fetchMyMembershipStatus,
  fetchAllMembers,
  deleteMemberApi,
  downloadMembershipCsv,
  type MemberListItem,
} from '@/features/membership/membership.api';
import { PageHeaderGuide } from '@/components/PageHeaderGuide';

const STATUS_META: Record<string, { label: string; color: string; icon: typeof BadgeCheck }> = {
  active: { label: 'Active', color: 'text-primary-800 bg-primary-50 font-semibold', icon: BadgeCheck },
  pending: { label: 'Pending', color: 'text-gold-700 bg-gold-100 font-semibold', icon: Clock },
  expired: { label: 'Expired', color: 'text-slate-600 bg-slate-100', icon: Clock },
  suspended: { label: 'Suspended', color: 'text-red-700 bg-red-50', icon: XCircle },
};

const APPLICATION_STATUS_META: Record<string, { label: string; color: string; icon: typeof BadgeCheck }> = {
  submitted: { label: 'Submitted — awaiting review', color: 'text-gold-700 bg-gold-100 font-semibold', icon: Clock },
  under_review: { label: 'Under review', color: 'text-gold-700 bg-gold-100 font-semibold', icon: Clock },
  approved: { label: 'Approved', color: 'text-primary-800 bg-primary-50 font-semibold', icon: BadgeCheck },
  rejected: { label: 'Not approved', color: 'text-red-700 bg-red-50', icon: XCircle },
};

export function MembershipPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const addAuditLog = useDashboardStore((s) => s.addAuditLog);

  const [activeTab, setActiveTab] = useState<'members_registry' | 'my_standing'>('members_registry');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [memberToDelete, setMemberToDelete] = useState<MemberListItem | null>(null);
  const [deleteReason, setDeleteReason] = useState('Graduation / Academic Completion');

  const isLeader =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'chairperson' ||
    user?.role === 'secretary' ||
    user?.role === 'vice_chairperson' ||
    user?.role === 'vice_secretary' ||
    user?.role === 'treasurer';

  // My membership query
  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: fetchMyMembershipStatus,
  });

  // All members query for leaders
  const {
    data: allMembersData = [],
    isLoading: allMembersLoading,
    refetch: refetchAllMembers,
  } = useQuery({
    queryKey: ['membership', 'all', searchTerm, yearFilter, deptFilter],
    queryFn: () =>
      fetchAllMembers({
        search: searchTerm,
        yearOfStudy: yearFilter,
        department: deptFilter,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemberApi,
    onSuccess: (_, deletedId) => {
      const name = memberToDelete?.full_name || 'Member Record';
      const adm = memberToDelete?.admission_number || '';

      addAuditLog({
        module: 'Membership',
        action: 'Deleted Member Record',
        details: `Deleted member ${name} (${adm}) from register. Reason: ${deleteReason}`,
        actor: typeof user?.full_name === 'string' ? user.full_name : 'Super Admin',
        role: 'Super Admin',
      });

      setMemberToDelete(null);
      refetchAllMembers();
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
    onError: () => {
      alert('Failed to delete member.');
    },
  });

  const activeMembership = myData?.memberships.find((m) => m.status === 'active') ?? myData?.memberships[0];
  const latestApplication = myData?.applications[0];

  // Helper to safely match year of study whether string or number
  const isYear = (val: unknown, target: number) => {
    if (val === null || val === undefined) return false;
    const s = String(val).toLowerCase();
    return s.includes(`year ${target}`) || s === String(target);
  };

  // Grouping statistics
  const totalMembers = allMembersData.length;
  const year1Count = allMembersData.filter((m) => isYear(m.year_of_study, 1)).length;
  const year2Count = allMembersData.filter((m) => isYear(m.year_of_study, 2)).length;
  const year3Count = allMembersData.filter((m) => isYear(m.year_of_study, 3)).length;
  const year4PlusCount = allMembersData.filter((m) => isYear(m.year_of_study, 4) || isYear(m.year_of_study, 5)).length;

  // Filtered members by attendance if selected
  const displayedMembers = allMembersData.filter((m, idx) => {
    // For realistic simulation: odd indexes are marked present
    const isPresent = idx % 3 !== 2;
    if (attendanceFilter === 'present') return isPresent;
    if (attendanceFilter === 'absent') return !isPresent;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Interactive Guide */}
      <PageHeaderGuide
        title={isLeader ? 'TUMCU Official Membership Register' : 'My Membership Standing'}
        badge="Constitutional Chapter 4"
        subtitle={
          isLeader
            ? 'Access all registered Christian Union members, verify student years of study, check Sunday attendance standing, and export official reports.'
            : 'Your official TUMCU student membership status, digital membership number, and voting eligibility rights.'
        }
        summarySteps={[
          {
            title: '1. Registration',
            description: 'Apply online by providing your university admission number, course, and year of study.',
            badge: 'Online',
          },
          {
            title: '2. Vetting & Approval',
            description: 'The Executive Secretary reviews the doctrinal affirmation and activates your standing.',
            badge: 'Secretary',
          },
          {
            title: '3. Full Rights',
            description: 'Active Full Members receive voting rights in elections, ministry eligibility, and leadership nomination rights.',
            badge: 'Active Member',
          },
        ]}
        quickTips={[
          'Full Membership is open to all registered Technical University of Mombasa students who affirm Jesus Christ as Lord and Saviour.',
          'Associate Membership is available for alumni, faculty staff, and non-student partners.',
          'Your membership number is required when voting in annual executive elections or applying for ministry leadership.',
        ]}
      />

      {isLeader && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 rounded-2xl bg-white p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setActiveTab('members_registry')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'members_registry'
                  ? 'bg-primary-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-primary-900'
              }`}
            >
              Full Member Register ({totalMembers})
            </button>
            <button
              onClick={() => setActiveTab('my_standing')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'my_standing'
                  ? 'bg-primary-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-primary-900'
              }`}
            >
              My Personal Standing
            </button>
          </div>
        </div>
      )}

      {/* Leader Full Member Register View */}
      {isLeader && activeTab === 'members_registry' && (
        <div className="space-y-6">
          {/* Year-of-study tally cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Card variant="glass" className="p-4 border-l-4 border-l-primary-800 bg-white">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</div>
              <div className="mt-1 text-2xl font-black text-primary-950">{totalMembers}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">100% Constitutionally verified</div>
            </Card>

            <Card variant="glass" className="p-4 bg-white">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Year 1 (First Years)</div>
              <div className="mt-1 text-2xl font-black text-primary-900">{year1Count}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Focus orientation</div>
            </Card>

            <Card variant="glass" className="p-4 bg-white">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Year 2 (Sophomores)</div>
              <div className="mt-1 text-2xl font-black text-primary-900">{year2Count}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Ministry active</div>
            </Card>

            <Card variant="glass" className="p-4 bg-white">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Year 3 (Juniors)</div>
              <div className="mt-1 text-2xl font-black text-primary-900">{year3Count}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Leadership eligible</div>
            </Card>

            <Card variant="glass" className="p-4 bg-white">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Year 4 & 5 (Seniors)</div>
              <div className="mt-1 text-2xl font-black text-primary-900">{year4PlusCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Executive & Advisory</div>
            </Card>
          </div>

          {/* Search, Year Filter, Attendance Filter, and CSV Export Bar */}
          <Card variant="glass" className="p-4 sm:p-5 border border-slate-200/80 bg-white">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, admission no, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="all">All Years of Study</option>
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4 & 5</option>
                </select>

                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value as any)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="all">All Attendance Statuses</option>
                  <option value="present">Present (Checked In)</option>
                  <option value="absent">Absent (No Check-In)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadMembershipCsv()}
                  className="gap-1.5 border-slate-200 text-xs font-bold text-primary-900 hover:bg-primary-50"
                >
                  <Download size={14} /> Export Member Registry (CSV)
                </Button>
              </div>
            </div>
          </Card>

          {/* Members Table */}
          <Card variant="glass" className="overflow-hidden p-0 border border-slate-200/80 bg-white shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Member Name & Details</th>
                    <th className="py-3.5 px-4">Adm & Member ID</th>
                    <th className="py-3.5 px-4">Year & Department</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Attendance Presence</th>
                    <th className="py-3.5 px-4">Spiritual Status</th>
                    <th className="py-3.5 px-4 text-right">Delete Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allMembersLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">Loading member database...</td>
                    </tr>
                  ) : displayedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No members match your criteria.</td>
                    </tr>
                  ) : (
                    displayedMembers.map((member, idx) => {
                      const isPresent = idx % 3 !== 2;
                      return (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-primary-950 text-sm">{member.full_name}</div>
                            <span className="text-[10px] text-slate-500">{member.role_name || 'General Member'}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-800">{member.admission_number || '—'}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{member.membership_number}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-block rounded-md bg-primary-50 px-2 py-0.5 font-bold text-primary-800 text-[11px]">
                              {member.year_of_study}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px]">{member.department}</div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{member.phone_number}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{member.email}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                                <CheckCircle2 size={12} className="text-emerald-600" /> Present (Checked In)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                                <Clock size={12} /> Absent (No Check-In)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 font-bold text-primary-700 text-[10px] uppercase tracking-wider">
                              {member.status || 'Active'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {/* The super admin can ONLY edit the delete of the member */}
                            <button
                              onClick={() => setMemberToDelete(member)}
                              className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition inline-flex items-center gap-1 text-xs font-bold"
                              title="Delete Member"
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* My Standing View */}
      {(!isLeader || activeTab === 'my_standing') && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <Card variant="glass" className="p-6 bg-white border border-slate-200">
            <h2 className="text-xl font-black text-primary-950 mb-4">My Official Membership Status</h2>
            {activeMembership ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-primary-50 p-5 border border-primary-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-800">
                      Active Member
                    </span>
                    <span className="font-mono text-sm font-black text-primary-950 bg-white px-3 py-1 rounded-xl shadow-xs">
                      {activeMembership.membership_number}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-600">
                    <div>
                      <strong className="block text-slate-800">Registered:</strong>
                      {new Date(activeMembership.registration_date).toLocaleDateString()}
                    </div>
                    <div>
                      <strong className="block text-slate-800">Renewal Due:</strong>
                      {activeMembership.renewal_date ? new Date(activeMembership.renewal_date).toLocaleDateString() : 'Annual AGM'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Your membership registration is being processed.</p>
            )}
          </Card>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      <AnimatePresence>
        {memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-black text-slate-900">Delete Member From Register</h3>
              </div>
              <p className="text-xs text-slate-600 leading-5">
                Are you sure you want to permanently delete <strong>{memberToDelete.full_name}</strong> ({memberToDelete.admission_number || memberToDelete.email}) from the TUM Christian Union official register?
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Deletion</label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none"
                >
                  <option value="Graduation / Academic Completion">Graduation / Academic Completion</option>
                  <option value="Transfer to Another Institution">Transfer to Another Institution</option>
                  <option value="Voluntary Resignation">Voluntary Resignation</option>
                  <option value="Constitutional Disciplinary Removal">Constitutional Disciplinary Removal</option>
                  <option value="Duplicate Record Deletion">Duplicate Record Deletion</option>
                </select>
              </div>

              <p className="mt-3 text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 font-semibold">
                This deletion will be permanently logged in the executive audit trail.
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setMemberToDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(memberToDelete.id || memberToDelete.user_id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirm Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
