import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HandHeart, Lock, Plus, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PageHeaderGuide } from '@/components/PageHeaderGuide';
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
  open: 'bg-gold-100 text-gold-700 font-semibold',
  being_prayed_for: 'bg-primary-50 text-primary-700 font-semibold',
  answered: 'bg-emerald-50 text-emerald-700 font-semibold',
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

  return (
    <div>
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.div
            key="button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <Button variant="primary" className="gap-1.5 shadow-md hover:shadow-lg transition-all" onClick={() => setOpen(true)}>
              <Plus size={16} /> Submit Prayer Request
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-xl"
          >
            <Card variant="glass" className="border-primary-100/70 shadow-xl">
              <div className="mb-3 text-sm font-bold text-primary-950">Submit a Prayer Request</div>
              <div className="flex flex-col gap-3">
                <input
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm"
                />
                <textarea
                  rows={3}
                  placeholder="Share as much or as little as you're comfortable with..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm"
                />
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as PrayerPrivacyLevel)}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm outline-none"
                >
                  {Object.entries(PRIVACY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                  Submit anonymously — your name won't be attached to this request
                </label>
                <div className="flex gap-2 pt-1">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
    <div className="space-y-6 pb-12">
      {/* Header & Interactive Guide */}
      <PageHeaderGuide
        title="Prayer Ministry & Intercession"
        badge="1 Thessalonians 5:17"
        subtitle="Submit personal prayer requests, intercede for fellow brethren, and rejoice together in answered prayers."
        summarySteps={[
          {
            title: '1. Share Request',
            description: 'Submit your prayer request with tailored privacy settings (Public, Intercessors Only, or Pastoral Only).',
            badge: 'Submission',
          },
          {
            title: '2. Intercession',
            description: 'The intercessory team and church community pray fervently over your burdens.',
            badge: 'Intercession',
          },
          {
            title: '3. Testimony',
            description: 'Mark answered prayers as testimonies to encourage and build up faith across the fellowship.',
            badge: 'Answered',
          },
        ]}
        quickTips={[
          'You can post completely anonymously if you prefer confidentiality.',
          'Pastoral Only requests are exclusively visible to the Executive Patron and Chairperson.',
          'Click the "Praying" button on any request to let brethren know they are being upheld.',
        ]}
      />

      <div className="flex justify-end">
        <NewRequestForm
          onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['prayer-requests'] })}
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/50" />
          ))}
        </div>
      )}

      {!isLoading && requests?.length === 0 && (
        <Card variant="glass" className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-3 border border-emerald-100 bg-white/90 shadow-xs">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5EF] text-[#006633] mx-auto">
            <HandHeart size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#17201B]">Your prayer space is quiet.</h3>
            <p className="text-xs text-[#68736C] mt-1 leading-relaxed">
              When something is on your heart, we're here to pray with you.
            </p>
          </div>
          <div className="pt-2">
            <NewRequestForm
              onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['prayer-requests'] })}
            />
          </div>
        </Card>
      )}

      <motion.div
        layout
        className="flex flex-col gap-3"
      >
        <AnimatePresence mode="popLayout">
          {requests?.map((req, idx) => (
            <motion.div
              layout
              key={req.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              whileHover={{ y: -2 }}
            >
              <Card variant="glass" className="transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-50 text-primary-700">
                        <HandHeart size={15} />
                      </span>
                      <h3 className="font-bold text-primary-950">{req.title}</h3>
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
                    <p className="mt-2 text-sm leading-6 text-slate-600">{req.details}</p>
                  </div>
                  <motion.span
                    layout
                    className={`shrink-0 rounded-full px-3 py-1 text-xs ${STATUS_COLORS[req.status]}`}
                  >
                    {STATUS_LABELS[req.status]}
                  </motion.span>
                </div>

                {canManage && req.status !== 'closed' && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100/80 pt-3">
                    {req.status === 'open' && (
                      <Button
                        variant="ghost"
                        className="gap-1.5 border border-primary-200 bg-white/60 px-3 py-1.5 text-xs hover:bg-primary-50"
                        loading={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: req.id, status: 'being_prayed_for' })}
                      >
                        Mark as being prayed for
                      </Button>
                    )}
                    {req.status !== 'answered' && (
                      <Button
                        variant="ghost"
                        className="gap-1.5 border border-emerald-200 bg-emerald-50/50 px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100/60"
                        loading={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: req.id, status: 'answered' })}
                      >
                        <Sparkles size={13} /> Mark as answered
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="border border-slate-200 bg-white/50 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                      loading={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: req.id, status: 'closed' })}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
