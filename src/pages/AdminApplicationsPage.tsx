import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, RefreshCw, Search, Users, XCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import {
  approveApplication,
  fetchPendingApplications,
  rejectApplication,
} from '@/features/membership/membership.api';

function getErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

export function AdminApplicationsPage() {
  const queryClient = useQueryClient();
  const canApprove = useAuthStore((s) => s.hasPermission('membership.approve'));
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: applications, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['membership', 'applications', 'pending'],
    queryFn: fetchPendingApplications,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const visibleApplications = (applications ?? []).filter((application) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${application.full_name} ${application.email} ${application.admission_number ?? ''}`
      .toLowerCase()
      .includes(q);
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['membership'] });
    await queryClient.invalidateQueries({ queryKey: ['membership', 'applications'] });
    await queryClient.invalidateQueries({ queryKey: ['membership', 'applications', 'pending'] });
    await queryClient.invalidateQueries({ queryKey: ['membership', 'all'] });
  };

  const approveMutation = useMutation({
    mutationFn: approveApplication,
    onSuccess: async (data, applicationId) => {
      const applicant = applications?.find((a) => a.id === applicationId);
      const name = applicant?.full_name || 'The applicant';
      setActionError(null);
      setActionSuccess(`${name} was approved, assigned membership number ${data?.membership_number || 'TUMCU-2026-XXXX'}, and moved to the Members List.`);
      await invalidate();
    },
    onError: (error) => {
      setActionSuccess(null);
      setActionError(getErrorMessage(error, 'The application could not be approved.'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectApplication(id, reason),
    onSuccess: async () => {
      setRejectingId(null);
      setRejectionReason('');
      setActionError(null);
      setActionSuccess('The application has been rejected and removed from the queue.');
      await invalidate();
    },
    onError: (error) => {
      setActionSuccess(null);
      setActionError(getErrorMessage(error, 'The application could not be rejected.'));
    },
  });

  const busyId = approveMutation.isPending ? approveMutation.variables : rejectMutation.variables?.id;

  return (
    <div className="space-y-6">
      <section className="mesh-hero-bg overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow"><CheckCircle2 size={14} /> MEMBERSHIP OPERATIONS</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-primary-950">Membership Applications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review new applications, approve eligible members and keep the membership queue current.
              Approved applicants are immediately transitioned from the waiting list to the official registered members list.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/membership"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-xs font-bold text-primary-950 shadow-sm backdrop-blur-xl transition hover:bg-white"
            >
              <Users size={15} className="text-primary-700" /> View Members List <ArrowRight size={14} />
            </Link>
            <div className="rounded-2xl bg-white/60 px-4 py-3 text-center backdrop-blur-xl">
              <div className="text-2xl font-black text-primary-950">{applications?.length ?? 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waiting List</div>
            </div>
            <Button variant="secondary" className="gap-2" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        </div>
      </section>

      {actionSuccess && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3.5 text-sm font-medium text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <Link
            to="/dashboard/membership"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
          >
            Go to Members List →
          </Link>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
          <XCircle size={18} className="shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      <Card variant="glass">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 backdrop-blur-xl sm:max-w-md">
            <Search size={17} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or admission number"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Clock3 size={14} /> Submitted and under review
          </span>
        </div>
      </Card>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-32 rounded-[var(--radius-card)] bg-slate-100" />)}
        </div>
      )}

      {isError && !isLoading && (
        <Card variant="glass" className="border-red-200/70 text-center">
          <XCircle className="mx-auto text-red-500" />
          <p className="mt-3 font-semibold text-primary-950">The application queue could not be loaded.</p>
          <p className="mt-1 text-sm text-slate-500">Check the API connection and try again.</p>
          <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>Try again</Button>
        </Card>
      )}

      {!isLoading && !isError && visibleApplications.length === 0 && (
        <Card variant="glass" className="text-center">
          <CheckCircle2 className="mx-auto text-primary-500" />
          <p className="mt-3 font-bold text-primary-950">{applications?.length ? 'No matching applications' : 'The queue is clear'}</p>
          <p className="mt-1 text-sm text-slate-500">
            {applications?.length ? 'Try another search term.' : 'There are no membership applications awaiting review.'}
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {visibleApplications.map((application) => (
          <Card key={application.id} variant="glass" className="overflow-hidden">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700">
                  {application.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-bold text-primary-950">{application.full_name}</h2>
                    <span className="rounded-full bg-gold-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700">
                      {application.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{application.email}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    {application.admission_number && <span>Admission: {application.admission_number}</span>}
                    <span>{application.membership_type_name}</span>
                    <span>Applied {new Date(application.created_at).toLocaleDateString('en-KE')}</span>
                  </div>
                </div>
              </div>

              {rejectingId === application.id ? (
                <div className="w-full lg:max-w-xl">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Reason for rejection</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      autoFocus
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Explain what the applicant needs to correct"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        className="px-3"
                        disabled={!rejectionReason.trim()}
                        loading={rejectMutation.isPending && rejectMutation.variables?.id === application.id}
                        onClick={() => rejectMutation.mutate({ id: application.id, reason: rejectionReason.trim() })}
                      >
                        Confirm
                      </Button>
                      <Button variant="ghost" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex shrink-0 gap-2">
                  {canApprove ? <><Button
                    variant="primary"
                    className="gap-1.5"
                    loading={approveMutation.isPending && busyId === application.id}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() => { setActionError(null); approveMutation.mutate(application.id); }}
                  >
                    <CheckCircle2 size={15} /> Approve
                  </Button>
                  <Button
                    variant="danger"
                    className="gap-1.5"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() => { setActionError(null); setRejectingId(application.id); }}
                  >
                    <XCircle size={15} /> Reject
                  </Button></> : <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">Review access only</span>}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
