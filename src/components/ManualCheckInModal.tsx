import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, X, CheckCircle2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { manualLeaderCheckIn, type AttendanceSession } from '@/features/attendance/attendance.api';

interface ManualCheckInModalProps {
  session: AttendanceSession;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualCheckInModal({ session, onClose, onSuccess }: ManualCheckInModalProps) {
  const queryClient = useQueryClient();

  const [attendeeType, setAttendeeType] = useState<'member' | 'visitor'>('member');
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState('School of Applied & Health Sciences');
  const [visitorType, setVisitorType] = useState<'first_time' | 'returning'>('first_time');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: manualLeaderCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'roster', session.id] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] });
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to record check-in');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() && !identifier.trim()) {
      setError('Please provide at least a name, email, or admission number.');
      return;
    }

    mutation.mutate({
      sessionId: session.id,
      attendableType: 'sunday_service',
      fullName: fullName.trim() || undefined,
      email: email.trim() || (attendeeType === 'member' ? identifier.trim() : undefined),
      phoneNumber: phoneNumber.trim() || undefined,
      category: attendeeType === 'visitor' ? category : undefined,
      visitorType: attendeeType === 'visitor' ? visitorType : 'none',
      prayerRequest: prayerRequest.trim() || undefined,
    });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="w-full max-w-lg my-8"
        >
          <Card variant="glass" className="border-white/80 p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-800 grid place-items-center">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary-950">Manual Walk-in Check-in</h2>
                  <p className="text-xs text-slate-500">Record attendance for {session.title}</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Type Switch */}
              <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setAttendeeType('member')}
                  className={`flex-1 rounded-xl py-2 transition ${
                    attendeeType === 'member' ? 'bg-white text-primary-950 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Full Member
                </button>
                <button
                  type="button"
                  onClick={() => setAttendeeType('visitor')}
                  className={`flex-1 rounded-xl py-2 transition ${
                    attendeeType === 'visitor' ? 'bg-white text-primary-950 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Visitor / Guest
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Full Name *</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Samuel Mutua"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. samuel@tum.ac.ke"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Phone Number</label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0712345678"
                  />
                </div>
              </div>

              {attendeeType === 'visitor' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Visitor Classification</label>
                      <select
                        value={visitorType}
                        onChange={(e) => setVisitorType(e.target.value as any)}
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs outline-none focus:border-primary-500"
                      >
                        <option value="first_time">First-Time Visitor</option>
                        <option value="returning">Returning Guest</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Campus Faculty / School</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs outline-none focus:border-primary-500"
                      >
                        <option value="School of Applied & Health Sciences">School of Applied & Health Sciences</option>
                        <option value="School of Business & Social Sciences">School of Business & Social Sciences</option>
                        <option value="School of Computing & Informatics">School of Computing & Informatics</option>
                        <option value="School of Engineering & Technology">School of Engineering & Technology</option>
                        <option value="Non-Student / Guest">Non-Student / Guest</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Prayer Request / Remarks</label>
                <textarea
                  rows={2}
                  value={prayerRequest}
                  onChange={(e) => setPrayerRequest(e.target.value)}
                  placeholder="Optional prayer request or remarks..."
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2 text-xs outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200/60">
                <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 gap-2 shadow-lg"
                  loading={mutation.isPending}
                >
                  <CheckCircle2 size={16} /> Record Attendance
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
