import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  CheckCircle2,
  Users,
  Church,
  Shield,
  Layers3,
  DollarSign,
  FileCheck,
  Megaphone,
  ServerCog,
  ArrowRight,
  ArrowLeft,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchUsers,
  fetchRoles,
  fetchMinistries,
  fetchCommittees,
  assignRole,
  type AdminUser,
} from '@/features/admin/admin.api';

interface RoleAssignmentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedUser?: AdminUser | null;
}

type ManagementDomain =
  | 'church_leadership'
  | 'ministry'
  | 'committee'
  | 'finance'
  | 'membership'
  | 'communications'
  | 'technical_admin';

const DOMAIN_CONFIG: Record<
  ManagementDomain,
  {
    title: string;
    description: string;
    icon: typeof Church;
    defaultRoleCodes: string[];
    capabilities: string[];
  }
> = {
  church_leadership: {
    title: 'Church Leadership',
    description: 'Executive governance across the Union (Chairperson, Vice Chairpersons, Secretary).',
    icon: Crown,
    defaultRoleCodes: ['chairperson', 'first_vice_chairperson', 'second_vice_chairperson', 'secretary', 'vice_secretary'],
    capabilities: [
      'Executive governance over Union operations',
      'Preside over executive and general meetings',
      'Institutional correspondence & coordination',
      'Sign and ratify official Union resolutions',
      'High-level reporting and oversight',
    ],
  },
  ministry: {
    title: 'Ministry Management',
    description: 'Direct leadership, fellowship coordination, attendance, and member care within a specific ministry.',
    icon: Church,
    defaultRoleCodes: ['ministry_leader', 'ministry_secretary', 'ministry_treasurer'],
    capabilities: [
      'View & manage ministry members',
      'Record attendance at ministry rehearsals and meetings',
      'Schedule ministry meetings & activities',
      'Submit ministry semester reports & budget requests',
      'Manage ministry public background and notices',
    ],
  },
  committee: {
    title: 'Committee Leadership',
    description: 'Lead a constitutional or special committee (Worship, Missions, Discipleship, Assets, etc.).',
    icon: Layers3,
    defaultRoleCodes: [
      'worship_chairperson',
      'missions_chairperson',
      'discipleship_chairperson',
      'prayer_chairperson',
      'assets_chairperson',
      'non_residents_chairperson',
      'publicity_chairperson',
    ],
    capabilities: [
      'Coordinate committee programs and agendas',
      'Lead committee members & strategic initiatives',
      'Track committee asset & attendance logs',
      'Draft committee evaluations and reports',
    ],
  },
  finance: {
    title: 'Finance & Stewardship',
    description: 'Treasury oversight, requisition tracking, offering accounting, and financial reports.',
    icon: DollarSign,
    defaultRoleCodes: ['treasurer'],
    capabilities: [
      'Review and process finance requests',
      'Record collections, offerings, and donations',
      'Manage bank disbursements and vouchers',
      'Generate semester financial audit reports',
    ],
  },
  membership: {
    title: 'Membership & Records',
    description: 'Membership applications, admissions, member registers, and spiritual records.',
    icon: FileCheck,
    defaultRoleCodes: ['secretary', 'vice_secretary'],
    capabilities: [
      'Review & approve new membership applications',
      'Maintain the official Union register',
      'Track member status and spiritual standings',
      'Export CRM records for official audits',
    ],
  },
  communications: {
    title: 'Communications & Media',
    description: 'Announcements, website management, photography, livestreaming, and digital ministry.',
    icon: Megaphone,
    defaultRoleCodes: ['publicity_chairperson'],
    capabilities: [
      'Post Union-wide official announcements',
      'Manage public gallery and media releases',
      'Oversee sound, streaming, and display teams',
      'Coordinate digital marketing and campaigns',
    ],
  },
  technical_admin: {
    title: 'Technical Administration',
    description: 'System settings, user roles, security, data backups, and technical audits.',
    icon: ServerCog,
    defaultRoleCodes: ['system_admin', 'it_admin'],
    capabilities: [
      'Configure academic years and semesters',
      'Manage system roles and permissions',
      'Monitor audit trails and security logs',
      'Perform data exports and system backups',
    ],
  },
};

export function RoleAssignmentWizardModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedUser,
}: RoleAssignmentWizardModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(preselectedUser ? 2 : 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(preselectedUser || null);
  const [selectedDomain, setSelectedDomain] = useState<ManagementDomain>('ministry');
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('ministry_leader');
  const [selectedScopeId, setSelectedScopeId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Queries
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['admin-search-users-wizard', searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.trim().length >= 2,
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ['admin-roles-wizard'],
    queryFn: fetchRoles,
    enabled: isOpen,
  });

  const { data: ministries = [] } = useQuery({
    queryKey: ['admin-ministries-wizard'],
    queryFn: fetchMinistries,
    enabled: isOpen,
  });

  const { data: committees = [] } = useQuery({
    queryKey: ['admin-committees-wizard'],
    queryFn: fetchCommittees,
    enabled: isOpen,
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['leadership-assignments'] });
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to assign role');
    },
  });

  const handleClose = () => {
    setStep(preselectedUser ? 2 : 1);
    setSelectedUser(preselectedUser || null);
    setSearchQuery('');
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  // Selected details
  const domainConfig = DOMAIN_CONFIG[selectedDomain];
  const domainRoles = allRoles.filter((r) => domainConfig.defaultRoleCodes.includes(r.code));
  const activeRoleObj = allRoles.find((r) => r.code === selectedRoleCode) || domainRoles[0];

  const needsMinistryScope = selectedDomain === 'ministry';
  const needsCommitteeScope = selectedDomain === 'committee';

  const selectedMinistryObj = ministries.find((m) => m.id === selectedScopeId);
  const selectedCommitteeObj = committees.find((c) => c.id === selectedScopeId);

  const handleDomainSelect = (domain: ManagementDomain) => {
    setSelectedDomain(domain);
    const available = allRoles.filter((r) => DOMAIN_CONFIG[domain].defaultRoleCodes.includes(r.code));
    if (available.length > 0) {
      setSelectedRoleCode(available[0].code);
    }
    if (domain === 'ministry' && ministries.length > 0) {
      setSelectedScopeId(ministries[0].id);
    } else if (domain === 'committee' && committees.length > 0) {
      setSelectedScopeId(committees[0].id);
    } else {
      setSelectedScopeId('');
    }
  };

  const handleExecuteAssign = () => {
    if (!selectedUser || !activeRoleObj) return;
    setErrorMsg(null);

    let scopeType: 'global' | 'ministry' | 'committee' = 'global';
    let scopeId: string | null = null;

    if (needsMinistryScope) {
      scopeType = 'ministry';
      scopeId = selectedScopeId || (ministries[0]?.id ?? null);
    } else if (needsCommitteeScope) {
      scopeType = 'committee';
      scopeId = selectedScopeId || (committees[0]?.id ?? null);
    }

    assignMutation.mutate({
      userId: selectedUser.id,
      roleId: activeRoleObj.id,
      scopeType,
      scopeId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <Shield size={13} className="text-emerald-700" /> Role Assignment Wizard
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">Assign Leadership & Responsibility</h2>
            <p className="text-xs text-slate-500">Assign what this member will manage in 4 easy steps.</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="mt-4 flex items-center justify-between px-2 sm:px-6">
          {[
            { num: 1, label: 'Person' },
            { num: 2, label: 'Responsibility' },
            { num: 3, label: 'Scope & Role' },
            { num: 4, label: 'Confirm' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition ${
                    step === s.num
                      ? 'bg-primary-900 text-white shadow-md'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-1">{s.label}</span>
              </div>
              {idx < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="mt-6 min-h-[300px]">
          {errorMsg && (
            <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Who are you assigning? */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Step 1: Who are you assigning?</h3>
                  <p className="text-xs text-slate-500">Search for a registered TUMCU member by name or admission number.</p>
                </div>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search member name or admission number..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-primary-900 focus:bg-white transition"
                  autoFocus
                />
              </div>

              {selectedUser && (
                <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-700 text-white font-black text-sm">
                      {selectedUser.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selectedUser.full_name}</p>
                      <p className="text-xs text-slate-500">{selectedUser.email} • {selectedUser.admission_number || 'Member'}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-200 text-emerald-900 px-2.5 py-0.5 text-[10px] font-black uppercase">
                    Selected
                  </span>
                </div>
              )}

              <div className="max-h-52 overflow-y-auto space-y-2 divide-y divide-slate-100">
                {isSearching && (
                  <p className="text-center py-6 text-xs text-slate-400">Searching directory...</p>
                )}
                {!isSearching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                  <p className="text-center py-6 text-xs text-slate-400">No members found matching "{searchQuery}"</p>
                )}
                {searchResults.map((usr) => (
                  <div
                    key={usr.id}
                    onClick={() => setSelectedUser(usr)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                      selectedUser?.id === usr.id ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 font-bold text-xs text-slate-700">
                        {usr.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{usr.full_name}</p>
                        <p className="text-[11px] text-slate-500">{usr.email} • {usr.admission_number || 'N/A'}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedUser?.id === usr.id ? 'secondary' : 'outline'}
                      className="text-[11px] font-bold"
                    >
                      {selectedUser?.id === usr.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: What should they manage? */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Step 2: What should {selectedUser?.full_name?.split(' ')[0] || 'this member'} manage?
                </h3>
                <p className="text-xs text-slate-500">
                  Select the domain of service instead of individual permission codes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                {(Object.keys(DOMAIN_CONFIG) as ManagementDomain[]).map((domain) => {
                  const conf = DOMAIN_CONFIG[domain];
                  const Icon = conf.icon;
                  const isSelected = selectedDomain === domain;

                  return (
                    <div
                      key={domain}
                      onClick={() => handleDomainSelect(domain)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition text-left relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-xl ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{conf.title}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{conf.description}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 text-emerald-600">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Choose scope and specific role */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 3: Define Scope & Position</h3>
                <p className="text-xs text-slate-500">Specify the ministry, committee, or leadership title.</p>
              </div>

              {needsMinistryScope && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Choose Ministry</label>
                  <select
                    value={selectedScopeId || ministries[0]?.id || ''}
                    onChange={(e) => setSelectedScopeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-primary-900 focus:bg-white"
                  >
                    {ministries.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {needsCommitteeScope && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Choose Committee</label>
                  <select
                    value={selectedScopeId || committees[0]?.id || ''}
                    onChange={(e) => setSelectedScopeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-primary-900 focus:bg-white"
                  >
                    {committees.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Specific Role / Position</label>
                <div className="grid grid-cols-1 gap-2">
                  {domainRoles.map((role) => (
                    <label
                      key={role.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        selectedRoleCode === role.code
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="roleOption"
                          checked={selectedRoleCode === role.code}
                          onChange={() => setSelectedRoleCode(role.code)}
                          className="accent-emerald-700"
                        />
                        <span className="text-xs">{role.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{role.code}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Simple Confirmation with Human-Readable Capabilities */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 4: Confirm Role Assignment</h3>
                <p className="text-xs text-slate-500">Verify the member and granted administrative privileges.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assignee</span>
                    <p className="text-sm font-black text-slate-900">{selectedUser?.full_name}</p>
                    <p className="text-xs text-slate-500">{selectedUser?.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Role</span>
                    <p className="text-sm font-black text-emerald-900">{activeRoleObj?.name}</p>
                    <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.2 text-[10px] font-bold">
                      {needsMinistryScope
                        ? selectedMinistryObj?.name || 'Selected Ministry'
                        : needsCommitteeScope
                        ? selectedCommitteeObj?.name || 'Selected Committee'
                        : 'Union-Wide Scope'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-2">
                    Access & Capabilities Granted:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {domainConfig.capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={14} /> Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs font-bold">
              Cancel
            </Button>

            {step < 4 ? (
              <Button
                size="sm"
                disabled={step === 1 && !selectedUser}
                onClick={() => setStep((s) => (s + 1) as any)}
                className="gap-1.5 text-xs font-bold bg-primary-900 text-white hover:bg-primary-950"
              >
                Next <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                size="sm"
                loading={assignMutation.isPending}
                onClick={handleExecuteAssign}
                className="gap-1.5 text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800"
              >
                <CheckCircle2 size={14} /> Assign Role
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
