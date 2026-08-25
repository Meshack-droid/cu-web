import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, QrCode, XCircle } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import {
  ATTENDABLE_TYPE_LABELS,
  fetchMyAttendance,
  selfCheckIn,
  type AttendableType,
} from '@/features/attendance/attendance.api';
import { fetchMeetings } from '@/features/meetings/meetings.api';

const STATUS_META: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  present: { icon: CheckCircle2, color: 'text-primary-700 bg-primary-50' },
  late: { icon: Clock, color: 'text-gold-600 bg-gold-100' },
  excused: { icon: Clock, color: 'text-slate-500 bg-slate-100' },
  absent: { icon: XCircle, color: 'text-danger bg-red-50' },
};

function SelfCheckInForm({ onChecked }: { onChecked: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AttendableType>('training');
  const [id, setId] = useState('');

  const mutation = useMutation({
    mutationFn: () => selfCheckIn(type, id),
    onSuccess: () => {
      setOpen(false);
      setId('');
      onChecked();
    },
  });

  if (!open) {
    return (
      <Button variant="primary" className="gap-1.5" onClick={() => setOpen(true)}>
        <QrCode size={16} /> Check In
      </Button>
    );
  }

  return (
    <Card variant="flat" className="w-full max-w-sm">
      <div className="mb-3 text-sm font-medium text-primary-900">Check In</div>
      <p className="mb-3 text-xs text-slate-500">
        For meetings, use the "Confirm my attendance" button on the Meetings & Events page instead —
        this is for other sessions (training, outreach, programme) that don't have a dedicated
        screen yet.
      </p>
      <div className="flex flex-col gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AttendableType)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        >
          {(['training', 'outreach', 'programme'] as const).map((t) => (
            <option key={t} value={t}>
              {ATTENDABLE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <input
          placeholder="Session ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        />
        <div className="flex gap-2">
          <Button disabled={!id.trim()} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Confirm
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function AttendancePage() {
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: fetchMyAttendance,
  });

  // Cross-reference meeting IDs against the meetings list so history shows
  // a real title instead of a bare UUID — cheap since meetings are already
  // fetched elsewhere in the dashboard and cached by TanStack Query.
  const { data: meetings } = useQuery({ queryKey: ['meetings'], queryFn: fetchMeetings });
  const meetingTitle = (id: string) => meetings?.find((m) => m.id === id)?.title;

  const presentCount = records?.filter((r) => r.status === 'present').length ?? 0;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">Attendance</h1>
          <p className="text-sm text-slate-500">Your check-in history</p>
        </div>
        <SelfCheckInForm onChecked={() => queryClient.invalidateQueries({ queryKey: ['attendance', 'me'] })} />
      </div>

      <Card variant="clay" className="mb-6 w-fit">
        <div className="text-2xl font-semibold text-primary-700">{presentCount}</div>
        <div className="text-xs text-slate-500">Sessions attended</div>
      </Card>

      {isLoading && (
        <div className="animate-pulse space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-[var(--radius-card)] bg-slate-100" />
          ))}
        </div>
      )}

      {!isLoading && records?.length === 0 && (
        <Card className="text-center text-sm text-slate-500">
          No attendance recorded yet. Check in to a meeting or session to see it here.
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {records?.map((record) => {
          const meta = STATUS_META[record.status] ?? STATUS_META.present;
          const Icon = meta.icon;
          const title =
            record.attendable_type === 'meeting' ? meetingTitle(record.attendable_id) : undefined;
          return (
            <Card key={record.id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {ATTENDABLE_TYPE_LABELS[record.attendable_type]}
                  </span>
                  {title && <span className="text-sm font-medium text-primary-900">{title}</span>}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {record.checked_in_at
                    ? new Date(record.checked_in_at).toLocaleString('en-KE')
                    : 'Not yet checked in'}
                  {' · '}
                  {record.method.replace('_', ' ')}
                </div>
              </div>
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.color}`}>
                <Icon size={13} /> {record.status}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
