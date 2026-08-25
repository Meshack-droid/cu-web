import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/Card';
import { fetchMyMembershipStatus } from '@/features/membership/membership.api';

const STATUS_META: Record<string, { label: string; color: string; icon: typeof BadgeCheck }> = {
  active: { label: 'Active', color: 'text-primary-700 bg-primary-50', icon: BadgeCheck },
  pending: { label: 'Pending', color: 'text-gold-600 bg-gold-100', icon: Clock },
  expired: { label: 'Expired', color: 'text-slate-500 bg-slate-100', icon: Clock },
  suspended: { label: 'Suspended', color: 'text-danger bg-red-50', icon: XCircle },
};

const APPLICATION_STATUS_META: Record<string, { label: string; color: string; icon: typeof BadgeCheck }> = {
  submitted: { label: 'Submitted — awaiting review', color: 'text-gold-600 bg-gold-100', icon: Clock },
  under_review: { label: 'Under review', color: 'text-gold-600 bg-gold-100', icon: Clock },
  approved: { label: 'Approved', color: 'text-primary-700 bg-primary-50', icon: BadgeCheck },
  rejected: { label: 'Not approved', color: 'text-danger bg-red-50', icon: XCircle },
};

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 rounded-[var(--radius-card)] bg-slate-100" />
      <div className="h-24 rounded-[var(--radius-card)] bg-slate-100" />
    </div>
  );
}

export function MembershipPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: fetchMyMembershipStatus,
  });

  const activeMembership = data?.memberships.find((m) => m.status === 'active') ?? data?.memberships[0];
  const latestApplication = data?.applications[0];

  return (
    <div>
      <h1 className="text-xl font-semibold text-primary-900">Membership</h1>
      <p className="mb-6 text-sm text-slate-500">Your membership record and renewal status</p>

      {isLoading && <PageSkeleton />}

      {isError && (
        <Card className="border-danger/30 text-center text-sm text-danger">
          Couldn't load your membership status right now.
        </Card>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-4">
          {activeMembership ? (
            <Card variant="clay">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-400">Membership Number</div>
                  <div className="mt-1 text-lg font-semibold text-primary-900">
                    {activeMembership.membership_number}
                  </div>
                </div>
                {(() => {
                  const meta = STATUS_META[activeMembership.status];
                  const Icon = meta.icon;
                  return (
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.color}`}
                    >
                      <Icon size={14} />
                      {meta.label}
                    </span>
                  );
                })()}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400">Registered</div>
                  <div className="text-slate-700">
                    {new Date(activeMembership.registration_date).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Renewal</div>
                  <div className="text-slate-700">
                    {activeMembership.renewal_date
                      ? new Date(activeMembership.renewal_date).toLocaleDateString('en-KE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not yet due'}
                  </div>
                </div>
              </div>
            </Card>
          ) : latestApplication ? (
            <Card>
              <div className="text-sm font-medium text-slate-700">Membership Application</div>
              {(() => {
                const meta = APPLICATION_STATUS_META[latestApplication.status];
                const Icon = meta.icon;
                return (
                  <span
                    className={`mt-3 flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.color}`}
                  >
                    <Icon size={14} />
                    {meta.label}
                  </span>
                );
              })()}
              {latestApplication.status === 'rejected' && latestApplication.rejection_reason && (
                <p className="mt-3 text-sm text-slate-600">
                  Reason: {latestApplication.rejection_reason}
                </p>
              )}
              {latestApplication.status === 'submitted' && (
                <p className="mt-3 text-sm text-slate-500">
                  A leader will review your application soon. You'll be able to log in fully once
                  it's approved.
                </p>
              )}
            </Card>
          ) : (
            <Card className="text-center text-sm text-slate-500">
              No membership application found.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
