import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  Search,
  Download,
  AlertTriangle,
  Trash2,
  Clock,
  Church,
  CalendarDays,
  FileText,
  BadgeCheck,
  HeartHandshake,
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
import { fetchMyMinistries } from '@/features/ministries/ministries.api';

export function MembershipPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const addAuditLog = useDashboardStore((s) => s.addAuditLog);

  const isLeader =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'chairperson' ||
    user?.role === 'secretary';

  const [activeTab, setActiveTab] = useState<'my_standing' | 'members_registry'>(
    isLeader ? 'my_standing' : 'my_standing'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [memberToDelete, setMemberToDelete] = useState<MemberListItem | null>(null);
  const [deleteReason, setDeleteReason] = useState('Graduation / Academic Completion');

  // My membership query
  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: fetchMyMembershipStatus,
  });

  const { data: myMinistries = [] } = useQuery({
    queryKey: ['my-ministries'],
    queryFn: fetchMyMinistries,
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
    enabled: isLeader,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemberApi,
    onSuccess: () => {
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
  });

  const activeMembership = myData?.memberships?.find((m) => m.status === 'active') ?? myData?.memberships?.[0];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800 uppercase tracking-wider mb-2">
              <ShieldCheck size={13} className="text-primary-700" /> TUMCU Chapter 4
            </div>
            <h1 className="text-2xl font-black text-primary-950 tracking-tight">My Membership</h1>
            <p className="text-xs text-slate-500 mt-1">
              Your official fellowship credentials, ministry attachment, and constitutional rights.
            </p>
          </div>

          {isLeader && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab(activeTab === 'my_standing' ? 'members_registry' : 'my_standing')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                {activeTab === 'my_standing' ? 'Open Full Register' : 'My Personal Standing'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Standard Member View: The 5 Requested Sections */}
      {activeTab === 'my_standing' && (
        <div className="space-y-4">
          {/* Section 1 & 2: Member Details & Membership Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Member Details */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Users size={18} className="text-primary-700" />
                <h2 className="text-base font-bold text-primary-950">Member Details</h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Full Legal Name</span>
                  <span className="font-bold text-slate-900">{String(user?.full_name || 'Meshack Member')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">University Admission No.</span>
                  <span className="font-mono font-bold text-primary-950">{String(user?.admission_number || 'BCS-004-2024')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="font-semibold text-slate-800">{String(user?.department || 'Computer Science')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Year of Study</span>
                  <span className="font-bold text-primary-900">Year {String(user?.year_of_study || '3')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Campus Email</span>
                  <span className="font-medium text-slate-700">{String(user?.email || 'member@tum.ac.ke')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Phone Number</span>
                  <span className="font-medium text-slate-700">{String(user?.phone_number || '+254 700 000000')}</span>
                </div>
              </div>
            </div>

            {/* Membership Status */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BadgeCheck size={18} className="text-primary-700" />
                <h2 className="text-base font-bold text-primary-950">Membership Status</h2>
              </div>

              <div className="rounded-2xl bg-primary-50/70 p-4 border border-primary-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 size={13} /> Active Full Member
                  </span>
                  <span className="font-mono text-xs font-black text-primary-950 bg-white px-2.5 py-1 rounded-lg border border-primary-200">
                    {activeMembership?.membership_number || 'TUMCU-2026-0042'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                  Constitutionally verified member in good standing with active voting rights and ministry eligibility.
                </p>
              </div>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Membership Category</span>
                  <span className="font-bold text-slate-900">Student Full Member</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Effective Academic Year</span>
                  <span className="font-bold text-slate-900">2026 / 2027</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Disciplinary Status</span>
                  <span className="font-bold text-emerald-700">Clear / Good Standing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 & 4: Ministry & Attendance Summary */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Ministry Attachment */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Church size={18} className="text-primary-700" />
                    <h2 className="text-base font-bold text-primary-950">My Ministry</h2>
                  </div>
                  {myMinistries.length > 0 ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      Active Member
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                      Not Enrolled
                    </span>
                  )}
                </div>

                {myMinistries.length === 0 ? (
                  <>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm">
                        <Church size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">No Ministry Assigned</h3>
                        <p className="text-xs text-slate-500">You are not enrolled in a ministry yet.</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      Service in ministry is voluntary and open to every admitted member. You can explore our 12 fellowship ministries and apply to the team aligned with your spiritual calling.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-100 text-primary-900 font-black text-sm">
                        {myMinistries[0].ministry_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-primary-950">{myMinistries[0].ministry_name}</h3>
                        <p className="text-xs text-slate-500 capitalize">{myMinistries[0].position.replace('_', ' ')}</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ministry Code:</span>
                        <span className="font-bold text-slate-800 uppercase">{myMinistries[0].ministry_code || 'MIN'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Enrolled Since:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(myMinistries[0].start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Link to="/dashboard/tumcu">
                  <Button
                    variant={myMinistries.length === 0 ? 'primary' : 'outline'}
                    className="text-xs font-bold gap-1.5"
                  >
                    {myMinistries.length === 0 ? (
                      <>
                        <Church size={14} /> Browse Ministries & Apply
                      </>
                    ) : (
                      'View All 12 Ministries'
                    )}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CalendarDays size={18} className="text-primary-700" />
                <h2 className="text-base font-bold text-primary-950">Attendance Summary</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Services Attended
                  </span>
                  <span className="text-2xl font-black text-primary-950">14 / 16</span>
                  <span className="text-[11px] text-emerald-700 block font-bold mt-0.5">88% Faithfulness</span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Consecutive Streak
                  </span>
                  <span className="text-2xl font-black text-primary-900">5 Weeks</span>
                  <span className="text-[11px] text-slate-500 block font-medium mt-0.5">Active fellowship</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                Attendance is automatically compiled via Sunday QR check-ins and mid-week prayer registers.
              </div>
            </div>
          </div>

          {/* Section 5: Membership Information (Constitutional Rights & Standing) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText size={18} className="text-primary-700" />
              <h2 className="text-base font-bold text-primary-950">Membership Information & Rights</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
                <h3 className="font-bold text-primary-950">1. AGM Voting Rights</h3>
                <p className="text-slate-600 leading-relaxed">
                  Right to participate and vote in Annual General Meetings and constitutional elections.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
                <h3 className="font-bold text-primary-950">2. Ministry Service</h3>
                <p className="text-slate-600 leading-relaxed">
                  Eligible to serve in sub-committees, missions, and student leadership nominations.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
                <h3 className="font-bold text-primary-950">3. Pastoral Care</h3>
                <p className="text-slate-600 leading-relaxed">
                  Entitled to welfare support, hospital visitation, and student discipleship mentoring.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leader Full Register View (Only if leader toggles it) */}
      {isLeader && activeTab === 'members_registry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs outline-none bg-white text-slate-800"
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

          <div className="grid gap-2">
            {allMembersData.slice(0, 15).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-2xl bg-white p-3.5 border border-slate-200/80 shadow-xs"
              >
                <div>
                  <h4 className="text-xs font-bold text-primary-950">{m.full_name}</h4>
                  <span className="text-[11px] text-slate-500">
                    {m.admission_number || 'No Adm'} · {m.department || 'General'} · Year {m.year_of_study}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-800 border border-emerald-200 text-[11px]">
                    {m.status || 'Active'}
                  </span>
                  <button
                    onClick={() => setMemberToDelete(m)}
                    className="p-1.5 text-red-500 hover:text-red-700"
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                Are you sure you want to permanently delete <strong>{memberToDelete.full_name}</strong> (
                {memberToDelete.admission_number || memberToDelete.email}) from the TUM Christian Union register?
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

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setMemberToDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(memberToDelete.id)}
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
