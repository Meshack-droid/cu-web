import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HandHeart, Lock, Plus, Sparkles } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import {
  PRIVACY_LABELS,
  STATUS_LABELS,
  fetchPrayerRequests,
  submitPrayerRequest,
  updatePrayerRequestStatus,
  type PrayerPrivacyLevel,
  type PrayerStatus,
} from '@/features/prayer/prayer.api';

const STATUS_COLORS: Record<PrayerStatus, string> = {
  open: 'bg-gold-100 text-gold-600',
  being_prayed_for: 'bg-primary-50 text-primary-700',
  answered: 'bg-primary-100 text-primary-800',
  closed: 'bg-slate-100 text-slate-500',
};

function NewRequestForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [privacy, setPrivacy] = useState<PrayerPrivacyLevel>('public');
  const [anonymous, setAnonymous] = useState(false);

  const mutation = useMutation({
    mutationFn: submitPrayerRequest,
    onSuccess: () => {
      setOpen(false);
      setTitle('');
      setDetails('');
      onSubmitted();
    },
  });

  if (!open) {
    return (
      <Button variant="primary" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus size={16} /> Submit Prayer Request
      </Button>
    );
  }

  return (
    <Card variant="flat">
      <div className="mb-3 text-sm font-medium text-primary-900">Submit a Prayer Request</div>
      <div className="flex flex-col gap-3">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        />
        <textarea
          rows={3}
          placeholder="Share as much or as little as you're comfortable with..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        />
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as PrayerPrivacyLevel)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        >
          {Object.entries(PRIVACY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Submit anonymously — your name won't be attached to this request at all
        </label>
        <div className="flex gap-2">
          <Button
            disabled={!title.trim() || !details.trim()}
            loading={mutation.isPending}
            onClick={() => mutation.mutate({ title, details, privacyLevel: privacy, anonymous })}
          >
            Submit
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function PrayerPage() {
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('prayer.view_confidential');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['prayer-requests'],
    queryFn: fetchPrayerRequests,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PrayerStatus }) => updatePrayerRequestStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer-requests'] }),
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">Prayer</h1>
          <p className="text-sm text-slate-500">Prayer requests and how they're being carried</p>
        </div>
        <NewRequestForm
          onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['prayer-requests'] })}
        />
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-[var(--radius-card)] bg-slate-100" />
          ))}
        </div>
      )}

      {!isLoading && requests?.length === 0 && (
        <Card className="text-center text-sm text-slate-500">
          No prayer requests yet. Be the first to share one.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {requests?.map((req) => (
          <Card key={req.id} variant="clay">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <HandHeart size={16} className="text-primary-600" />
                  <h3 className="font-medium text-primary-900">{req.title}</h3>
                  {req.privacy_level !== 'public' && (
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      <Lock size={10} /> {PRIVACY_LABELS[req.privacy_level]}
                    </span>
                  )}
                  {!req.requested_by && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      Anonymous
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">{req.details}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[req.status]}`}>
                {STATUS_LABELS[req.status]}
              </span>
            </div>

            {canManage && req.status !== 'closed' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {req.status === 'open' && (
                  <Button
                    variant="ghost"
                    className="gap-1.5 border border-primary-200 px-3 py-1.5 text-xs"
                    loading={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: req.id, status: 'being_prayed_for' })}
                  >
                    Mark as being prayed for
                  </Button>
                )}
                {req.status !== 'answered' && (
                  <Button
                    variant="ghost"
                    className="gap-1.5 border border-primary-200 px-3 py-1.5 text-xs"
                    loading={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: req.id, status: 'answered' })}
                  >
                    <Sparkles size={13} /> Mark as answered
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="border border-slate-200 px-3 py-1.5 text-xs text-slate-500"
                  loading={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: req.id, status: 'closed' })}
                >
                  Close
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
