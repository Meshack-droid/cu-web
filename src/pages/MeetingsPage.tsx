import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ClipboardList, Lock, Plus } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import {
  MEETING_TYPE_LABELS,
  addAgendaItem,
  approveMinutes,
  archiveMeeting,
  confirmAttendance,
  createMeeting,
  fetchAgenda,
  fetchMeetings,
  fetchMinutes,
  recordMinutes,
  type Meeting,
  type MeetingType,
} from '@/features/meetings/meetings.api';

function NewMeetingForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MeetingType>('executive');
  const [scheduledAt, setScheduledAt] = useState('');
  const [venue, setVenue] = useState('');

  const mutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      setOpen(false);
      setTitle('');
      setScheduledAt('');
      setVenue('');
      onCreated();
    },
  });

  if (!open) {
    return (
      <Button variant="primary" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus size={16} /> New Meeting
      </Button>
    );
  }

  return (
    <Card variant="flat">
      <div className="mb-3 text-sm font-medium text-primary-900">New Meeting</div>
      <div className="flex flex-col gap-3">
        <input
          placeholder="Meeting title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MeetingType)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        >
          {Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        />
        <input
          placeholder="Venue (optional)"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        />
        <div className="flex gap-2">
          <Button
            disabled={!title.trim() || !scheduledAt}
            loading={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                title,
                meeting_type: type,
                scheduled_at: scheduledAt.replace('T', ' ') + ':00',
                venue: venue || undefined,
              })
            }
          >
            Create Meeting
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MeetingDetail({ meeting }: { meeting: Meeting }) {
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [minutesDraft, setMinutesDraft] = useState('');

  const { data: agenda } = useQuery({
    queryKey: ['meetings', meeting.id, 'agenda'],
    queryFn: () => fetchAgenda(meeting.id),
  });
  const { data: minutes } = useQuery({
    queryKey: ['meetings', meeting.id, 'minutes'],
    queryFn: () => fetchMinutes(meeting.id),
  });

  const invalidateAgenda = () =>
    queryClient.invalidateQueries({ queryKey: ['meetings', meeting.id, 'agenda'] });
  const invalidateMinutes = () =>
    queryClient.invalidateQueries({ queryKey: ['meetings', meeting.id, 'minutes'] });
  const invalidateMeetings = () => queryClient.invalidateQueries({ queryKey: ['meetings'] });

  const addAgendaMutation = useMutation({
    mutationFn: (title: string) => addAgendaItem(meeting.id, title),
    onSuccess: () => {
      setNewAgendaItem('');
      invalidateAgenda();
    },
  });

  const recordMinutesMutation = useMutation({
    mutationFn: (content: string) => recordMinutes(meeting.id, content),
    onSuccess: invalidateMinutes,
  });

  const approveMinutesMutation = useMutation({
    mutationFn: () => approveMinutes(meeting.id),
    onSuccess: invalidateMinutes,
  });

  const attendanceMutation = useMutation({
    mutationFn: () => confirmAttendance(meeting.id),
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveMeeting(meeting.id),
    onSuccess: invalidateMeetings,
    onError: () => undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-medium text-gold-600">
              {MEETING_TYPE_LABELS[meeting.meeting_type]}
            </span>
            <h2 className="mt-2 text-lg font-semibold text-primary-900">{meeting.title}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <CalendarDays size={14} />
              {new Date(meeting.scheduled_at).toLocaleString('en-KE')}
              {meeting.venue && <span> · {meeting.venue}</span>}
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              meeting.status === 'archived'
                ? 'bg-slate-100 text-slate-500'
                : 'bg-primary-50 text-primary-700'
            }`}
          >
            {meeting.status}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            className="gap-1.5 border border-primary-200 px-3 py-1.5 text-xs"
            loading={attendanceMutation.isPending}
            onClick={() => attendanceMutation.mutate()}
          >
            <CheckCircle2 size={14} />
            {attendanceMutation.isSuccess ? 'Attendance confirmed' : 'Confirm my attendance'}
          </Button>
          {hasPermission('meetings.archive') && meeting.status !== 'archived' && (
            <Button
              variant="ghost"
              className="gap-1.5 border border-slate-200 px-3 py-1.5 text-xs"
              loading={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate()}
            >
              <Lock size={14} /> Archive meeting
            </Button>
          )}
        </div>
        {archiveMutation.isError && (
          <p className="mt-2 text-xs text-danger">
            {(archiveMutation.error as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Could not archive meeting'}
          </p>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary-900">
          <ClipboardList size={16} /> Agenda
        </div>
        <div className="flex flex-col gap-1.5">
          {agenda?.length === 0 && <p className="text-sm text-slate-400">No agenda items yet.</p>}
          {agenda?.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-slate-400">{i + 1}.</span>
              {item.title}
              {Boolean(item.is_voting_item) && (
                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-gold-600">
                  Voting item
                </span>
              )}
            </div>
          ))}
        </div>
        {hasPermission('meetings.edit') && meeting.status !== 'archived' && (
          <div className="mt-3 flex gap-2">
            <input
              placeholder="Add agenda item"
              value={newAgendaItem}
              onChange={(e) => setNewAgendaItem(e.target.value)}
              className="flex-1 rounded-[var(--radius-input)] border border-slate-200 px-3 py-1.5 text-sm"
            />
            <Button
              className="px-3 py-1.5 text-xs"
              disabled={!newAgendaItem.trim()}
              loading={addAgendaMutation.isPending}
              onClick={() => addAgendaMutation.mutate(newAgendaItem)}
            >
              Add
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 text-sm font-medium text-primary-900">Minutes</div>
        {minutes?.approved_at ? (
          <div>
            <span className="mb-2 inline-block rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              Approved
            </span>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{minutes.content}</p>
          </div>
        ) : hasPermission('meetings.manage_minutes') ? (
          <div className="flex flex-col gap-2">
            <textarea
              rows={4}
              placeholder="Record the minutes for this meeting..."
              defaultValue={minutes?.content ?? ''}
              onChange={(e) => setMinutesDraft(e.target.value)}
              className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
            />
            <div className="flex gap-2">
              <Button
                className="px-3 py-1.5 text-xs"
                disabled={!minutesDraft.trim() && !minutes?.content}
                loading={recordMinutesMutation.isPending}
                onClick={() => recordMinutesMutation.mutate(minutesDraft || minutes?.content || '')}
              >
                Save Minutes
              </Button>
              {minutes?.content && hasPermission('meetings.approve_minutes') && (
                <Button
                  variant="ghost"
                  className="gap-1.5 border border-primary-200 px-3 py-1.5 text-xs"
                  loading={approveMinutesMutation.isPending}
                  onClick={() => approveMinutesMutation.mutate()}
                >
                  <CheckCircle2 size={14} /> Approve Minutes
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {minutes?.content ? minutes.content : 'Minutes have not been recorded yet.'}
          </p>
        )}
      </Card>
    </div>
  );
}

export function MeetingsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
  });

  const selected = meetings?.find((m) => m.id === selectedId);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">Meetings & Events</h1>
          <p className="text-sm text-slate-500">Agenda, minutes, and attendance</p>
        </div>
        {hasPermission('meetings.create') && (
          <NewMeetingForm onCreated={() => queryClient.invalidateQueries({ queryKey: ['meetings'] })} />
        )}
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 rounded-[var(--radius-card)] bg-slate-100" />
          ))}
        </div>
      )}

      {!isLoading && meetings?.length === 0 && (
        <Card className="text-center text-sm text-slate-500">No meetings scheduled yet.</Card>
      )}

      {!selected ? (
        <div className="flex flex-col gap-3">
          {meetings?.map((meeting) => (
            <button key={meeting.id} onClick={() => setSelectedId(meeting.id)} className="text-left">
              <Card className="transition-colors hover:border-primary-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-medium text-gold-600">
                      {MEETING_TYPE_LABELS[meeting.meeting_type]}
                    </span>
                    <h3 className="mt-2 font-medium text-primary-900">{meeting.title}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays size={12} />
                      {new Date(meeting.scheduled_at).toLocaleString('en-KE')}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      meeting.status === 'archived'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-primary-50 text-primary-700'
                    }`}
                  >
                    {meeting.status}
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedId(null)}
            className="mb-4 text-sm font-medium text-primary-700 hover:underline"
          >
            ← Back to all meetings
          </button>
          <MeetingDetail meeting={selected} />
        </div>
      )}
    </div>
  );
}
