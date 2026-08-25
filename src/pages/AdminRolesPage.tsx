import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ShieldCheck,
  X,
  Crown,
  ServerCog,
  UserCog,
  Users,
  Landmark,
  Layers3,
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import {
  assignRole,
  fetchCommittees,
  fetchMinistries,
  fetchRolePermissionMatrix,
  fetchRoles,
  fetchUserRoles,
  revokeRole,
  searchUsers,
  type AdminUser,
  type RolePermissionMatrixRow,
} from '@/features/admin/admin.api';

const MINISTRY_SCOPED_CODES = ['ministry_leader', 'ministry_secretary', 'ministry_treasurer'];
const COMMITTEE_SCOPED_CODES = [
  'prayer_chairperson',
  'worship_chairperson',
  'missions_chairperson',
  'discipleship_chairperson',
  'assets_chairperson',
  'non_residents_chairperson',
  'publicity_chairperson',
];

const categoryMeta: Record<string, { label: string; description: string; icon: typeof ShieldCheck }> = {
  system_admin: {
    label: 'System Administration',
    description: 'Technical control of roles, permissions, settings, security, backups and system recovery.',
    icon: ServerCog,
  },
  constitutional_leadership: {
    label: 'Executive Leadership',
    description: 'Constitutional leadership responsible for governance, coordination, records and finance.',
    icon: Crown,
  },
  committee: {
    label: 'Committee Leadership',
    description: 'Scoped leadership over a specific constitutional committee.',
    icon: Layers3,
  },
  ministry: {
    label: 'Ministry Leadership',
    description: 'Scoped ministry roles. Access follows the ministry assigned to the role.',
    icon: Users,
  },
  advisory: {
    label: 'Advisory',
    description: 'Pastoral and advisory oversight without unrestricted technical control.',
    icon: Landmark,
  },
  member: {
    label: 'Member',
    description: 'Ordinary member self-service access.',
    icon: UserCog,
  },
};

const roleDescriptions: Record<string, string> = {
  super_admin: 'Unrestricted platform authority. The only wildcard role.',
  system_admin: 'Manages system configuration, roles, permissions, backups, academic years and recovery.',
  it_admin: 'Technical operations, security visibility, backups and system maintenance.',
  chairperson: 'Leads the Union, coordinates activities and provides institutional oversight.',
  first_vice_chairperson: 'Assists the Chairperson and oversees welfare responsibilities.',
  second_vice_chairperson: 'Oversees associates/finalists and assigned Brothers/Sisters ministry logistics.',
  secretary: 'Owns records, correspondence, meetings, membership administration and ministry coordination.',
  vice_secretary: 'Assists the Secretary and oversees hospitality operations.',
  treasurer: 'Manages financial requests, payments, budgets and financial records.',
  prayer_chairperson: 'Leads prayer operations and confidential prayer oversight.',
  worship_chairperson: 'Leads the Worship Committee, song library and team operations.',
  missions_chairperson: 'Leads missions and evangelism activities.',
  discipleship_chairperson: 'Leads discipleship and member orientation activities.',
  assets_chairperson: 'Manages Union assets and asset records.',
  non_residents_chairperson: 'Manages non-resident member support and related attendance.',
  publicity_chairperson: 'Controls website, social media, gallery, publications, livestream and media.',
  ministry_leader: 'Leads one assigned ministry and manages its members, meetings and attendance.',
  ministry_secretary: 'Supports one assigned ministry with minutes, attendance and documentation.',
  ministry_treasurer: 'Handles financial requests and financial visibility for one assigned ministry.',
  patron: 'Provides advisory and pastoral oversight without technical administration privileges.',
  member: 'Standard member access for events, meetings, attendance, prayer and library.',
};

function prettyPermission(code: string) {
  return code
    .replace(/\./g, ' · ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleId, setRoleId] = useState('');
  const [scopeId, setScopeId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState('system_admin');

  const { data: searchResults } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => searchUsers(search),
    enabled: search.trim().length >= 2,
  });

  const { data: roles } = useQuery({ queryKey: ['admin', 'roles'], queryFn: fetchRoles });
  const { data: matrix = [], isLoading: matrixLoading } = useQuery({
    queryKey: ['admin', 'role-permissions'],
    queryFn: fetchRolePermissionMatrix,
  });
  const { data: ministries } = useQuery({ queryKey: ['admin', 'ministries'], queryFn: fetchMinistries });
  const { data: committees } = useQuery({ queryKey: ['admin', 'committees'], queryFn: fetchCommittees });

  const { data: userRoles } = useQuery({
    queryKey: ['admin', 'user-roles', selectedUser?.id],
    queryFn: () => fetchUserRoles(selectedUser!.id),
    enabled: !!selectedUser,
  });

  const groupedMatrix = useMemo(() => {
    const groups = new Map<string, Map<string, { row: RolePermissionMatrixRow; permissions: string[] }>>();
    for (const row of matrix) {
      if (!groups.has(row.category)) groups.set(row.category, new Map());
      const category = groups.get(row.category)!;
      if (!category.has(row.role_code)) category.set(row.role_code, { row, permissions: [] });
      if (row.permission_code) category.get(row.role_code)!.permissions.push(row.permission_code);
    }
    return groups;
  }, [matrix]);

  const selectedRole = roles?.find((r) => r.id === roleId);
  const needsMinistryScope = selectedRole && MINISTRY_SCOPED_CODES.includes(selectedRole.code);
  const needsCommitteeScope = selectedRole && COMMITTEE_SCOPED_CODES.includes(selectedRole.code);

  const assignMutation = useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      setRoleId('');
      setScopeId('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-roles', selectedUser?.id] });
    },
    onError: (err: unknown) => {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Could not assign role'
      );
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeRole,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-roles', selectedUser?.id] }),
  });

  function handleAssign() {
    if (!selectedUser || !roleId) return;
    setError(null);

    if (needsMinistryScope) {
      if (!scopeId) return setError('Select a ministry for this role');
      assignMutation.mutate({ userId: selectedUser.id, roleId, scopeType: 'ministry', scopeId });
    } else if (needsCommitteeScope) {
      if (!scopeId) return setError('Select a committee for this role');
      assignMutation.mutate({ userId: selectedUser.id, roleId, scopeType: 'committee', scopeId });
    } else {
      assignMutation.mutate({ userId: selectedUser.id, roleId, scopeType: 'global', scopeId: null });
    }
  }

  return (
    <div className="space-y-6">
      <section className="mesh-hero-bg overflow-hidden rounded-[2rem] border border-white/60 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 backdrop-blur-xl">
              <ShieldCheck size={14} /> Governance & RBAC
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-950">Roles & Permissions</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Assign constitutional, committee and ministry leadership while keeping technical administration separated by least privilege.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="surface-glass rounded-2xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-primary-900">{roles?.length ?? 0}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Roles</div>
            </div>
            <div className="surface-glass rounded-2xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-primary-900">{new Set(matrix.map((m) => m.permission_code)).size}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Permissions</div>
            </div>
            <div className="surface-glass col-span-2 rounded-2xl px-4 py-3 text-center sm:col-span-1">
              <div className="text-2xl font-bold text-primary-900">{userRoles?.filter((r) => r.is_current).length ?? '—'}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Selected roles</div>
            </div>
          </div>
        </div>
      </section>

      <Card variant="glass">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-primary-950">Role catalog</h2>
            <p className="text-sm text-slate-500">The live permission matrix below is read directly from the database.</p>
          </div>
        </div>

        {matrixLoading ? (
          <div className="rounded-2xl bg-white/50 p-6 text-sm text-slate-500">Loading role permissions…</div>
        ) : (
          <div className="space-y-3">
            {Array.from(groupedMatrix.entries()).map(([category, roleMap]) => {
              const meta = categoryMeta[category] ?? categoryMeta.member;
              const Icon = meta.icon;
              const isOpen = openCategory === category;
              return (
                <div key={category} className="overflow-hidden rounded-2xl border border-white/70 bg-white/45 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => setOpenCategory(isOpen ? '' : category)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-white/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-primary-900/10 p-2.5 text-primary-800"><Icon size={18} /></div>
                      <div>
                        <div className="font-semibold text-primary-950">{meta.label}</div>
                        <div className="text-xs text-slate-500">{roleMap.size} role{roleMap.size === 1 ? '' : 's'} · {meta.description}</div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {isOpen && (
                    <div className="grid gap-3 border-t border-white/60 p-4 lg:grid-cols-2">
                      {Array.from(roleMap.values()).map(({ row, permissions }) => (
                        <div key={row.role_code} className="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-primary-950">{row.role_name}</div>
                              <div className="mt-1 text-xs leading-5 text-slate-500">{roleDescriptions[row.role_code]}</div>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary-900/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                              {row.role_code === 'super_admin' ? 'Unrestricted' : category.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {permissions.length === 0 ? (
                              <span className="text-xs text-slate-400">No permissions assigned.</span>
                            ) : permissions.map((permission) => (
                              <span key={permission} className="rounded-full border border-primary-100 bg-primary-50/80 px-2 py-1 text-[10px] font-medium text-primary-800">
                                {prettyPermission(permission)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-primary-950">Assign roles</h2>
            <p className="text-sm text-slate-500">Search for a member and assign the appropriate scope.</p>
          </div>
        </div>

        {!selectedUser ? (
          <Card variant="glass">
            <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 backdrop-blur-xl">
              <Search size={16} className="text-slate-400" />
              <input
                autoFocus
                placeholder="Search by name, email, or admission number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            {search.trim().length >= 2 && (
              <div className="mt-4 flex flex-col gap-2">
                {searchResults?.length === 0 && <p className="py-3 text-sm text-slate-400">No members found.</p>}
                {searchResults?.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/80"
                  >
                    <div>
                      <div className="text-sm font-semibold text-primary-950">{user.full_name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-primary-700">{user.account_status}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card variant="glass">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-primary-950">{selectedUser.full_name}</div>
                  <div className="text-sm text-slate-500">{selectedUser.email}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSearch('');
                    setRoleId('');
                    setScopeId('');
                  }}
                  className="rounded-full p-2 text-slate-400 hover:bg-white/70"
                  aria-label="Change member"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary-900">
                  <BriefcaseBusiness size={16} /> Current roles
                </div>
                {userRoles?.filter((r) => r.is_current).length === 0 && (
                  <p className="text-sm text-slate-400">No additional roles — this person is a plain Member.</p>
                )}
                <div className="flex flex-col gap-2">
                  {userRoles?.filter((r) => r.is_current).map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-primary-50/80 px-3 py-2.5 text-sm">
                      <span className="text-primary-800">
                        {r.role_name}{r.scope_name && <span className="text-primary-500"> — {r.scope_name}</span>}
                      </span>
                      <button onClick={() => revokeMutation.mutate(r.id)} className="text-xs font-medium text-danger hover:underline">
                        End role
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card variant="glass">
              <div className="mb-4 text-sm font-semibold text-primary-900">Assign a new role</div>
              <div className="flex flex-col gap-3">
                <select
                  value={roleId}
                  onChange={(e) => { setRoleId(e.target.value); setScopeId(''); }}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-sm outline-none backdrop-blur-xl"
                >
                  <option value="">Select a role...</option>
                  {roles?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>

                {needsMinistryScope && (
                  <select value={scopeId} onChange={(e) => setScopeId(e.target.value)} className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-sm outline-none">
                    <option value="">Select a ministry...</option>
                    {ministries?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                )}

                {needsCommitteeScope && (
                  <select value={scopeId} onChange={(e) => setScopeId(e.target.value)} className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-sm outline-none">
                    <option value="">Select a committee...</option>
                    {committees?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}

                {selectedRole && (
                  <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-3 text-xs leading-5 text-primary-800">
                    <strong>{selectedRole.name}:</strong> {roleDescriptions[selectedRole.code] ?? 'Role access is controlled by the live permission matrix.'}
                    {needsMinistryScope && <div className="mt-1 font-medium">Scope required: one Ministry.</div>}
                    {needsCommitteeScope && <div className="mt-1 font-medium">Scope required: one Committee.</div>}
                  </div>
                )}

                {error && <p className="text-sm text-danger">{error}</p>}
                <Button onClick={handleAssign} disabled={!roleId} loading={assignMutation.isPending} className="self-start px-6">
                  Assign Role
                </Button>
              </div>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
