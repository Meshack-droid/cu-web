import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ClipboardList,
  Lock,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchMeetings,
  fetchAgenda,
  fetchMinutes,
  confirmAttendance,
  approveMinutes,
  recordMinutes,
  type Meeting,
} from '@/features/meetings/meetings.api';
import { fetchPublicEvents, type PublicEvent } from '@/features/events/events.api';

export function CalendarPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'events' | 'meetings'>('all');
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
  const [minutesDraft, setMinutesDraft] = useState('');

  // Fetch both events and meetings
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'public'],
    queryFn: fetchPublicEvents,
  });

  const attendanceMutation = useMutation({
    mutationFn: (meetingId: string) => confirmAttendance(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  const approveMinutesMutation = useMutation({
    mutationFn: (meetingId: string) => approveMinutes(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['minutes'] });
    },
  });

  const recordMinutesMutation = useMutation({
    mutationFn: ({ meetingId, content }: { meetingId: string; content: string }) =>
      recordMinutes(meetingId, content),
    onSuccess: () => {
      setMinutesDraft('');
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['minutes'] });
    },
  });

  // Calculate items
  const totalMeetings = meetings.length;
  const totalEvents = events.length;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800 uppercase tracking-wider mb-2">
              <CalendarDays size={13} className="text-primary-700" /> TUMCU Master Calendar
            </div>
            <h1 className="text-2xl font-black text-primary-950 tracking-tight">Calendar</h1>
            <p className="text-xs text-slate-500 mt-1">
              Unified calendar for fellowship events, services, and official committee meetings
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-primary-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Calendar Items ({totalEvents + totalMeetings})
          </button>
          <button
            onClick={() => setFilter('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === 'events'
                ? 'bg-primary-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Events ({totalEvents})
          </button>
          <button
            onClick={() => setFilter('meetings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === 'meetings'
                ? 'bg-primary-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Meetings ({totalMeetings})
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {/* Events Section */}
        {(filter === 'all' || filter === 'events') && (
          <div className="space-y-3">
            {filter === 'all' && (
              <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Fellowship Events & Outreaches
              </h2>
            )}
            {eventsLoading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-white" />
            ) : events.length === 0 ? (
              filter === 'events' && (
                <Card variant="glass" className="p-8 text-center text-xs text-slate-500 bg-white">
                  No upcoming events scheduled.
                </Card>
              )
            ) : (
              events.map((evt) => (
                <Card
                  key={evt.id}
                  variant="glass"
                  className="p-5 border border-slate-200/80 bg-white hover:border-primary-200 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-gold-100 px-2.5 py-0.5 text-xs font-bold text-gold-900">
                          {evt.event_type}
                        </span>
                        <h3 className="font-bold text-primary-950 text-base">{evt.title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 max-w-2xl">{evt.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-semibold text-primary-900">
                          <Clock size={13} className="text-primary-700" />
                          {new Date(evt.start_at).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" /> {evt.location || 'TUM Campus'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Button
                        variant="outline"
                        className="text-xs font-bold px-3.5 py-1.5"
                        onClick={() => alert(`Attendance confirmed for: ${evt.title}`)}
                      >
                        <CheckCircle2 size={14} className="text-emerald-600" /> Confirm Attendance
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Meetings Section — simplified meeting presentation */}
        {(filter === 'all' || filter === 'meetings') && (
          <div className="space-y-3 pt-2">
            {filter === 'all' && (
              <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Committee Meetings
              </h2>
            )}

            {meetingsLoading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-white" />
            ) : meetings.length === 0 ? (
              filter === 'meetings' && (
                <Card variant="glass" className="p-8 text-center text-xs text-slate-500 bg-white">
                  No upcoming meetings scheduled.
                </Card>
              )
            ) : (
              meetings.map((meeting) => {
                const isExpanded = expandedMeetingId === meeting.id;
                const formattedDate = new Date(meeting.scheduled_at).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const formattedTime = new Date(meeting.scheduled_at).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                });

                // Status mapping
                let statusLabel = 'Scheduled';
                let statusColor = 'bg-blue-50 text-blue-800 border-blue-200';
                if (meeting.status === 'held') {
                  statusLabel = 'Minutes awaiting approval';
                  statusColor = 'bg-purple-50 text-purple-800 border-purple-200';
                } else if (meeting.status === 'archived') {
                  statusLabel = 'Minutes approved & archived';
                  statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                } else if (meeting.status === 'notice_sent') {
                  statusLabel = 'Notice Dispatched';
                  statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
                }

                return (
                  <Card
                    key={meeting.id}
                    variant="glass"
                    className="p-5 border border-slate-200/80 bg-white hover:border-primary-200 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-primary-950 text-base">{meeting.title}</h3>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="font-semibold text-primary-950">
                            {formattedDate} · {formattedTime}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400" />
                            {meeting.venue || 'TUMCU Boardroom'}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusColor}`}
                          >
                            Status: {statusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Single Contextual Action Button */}
                      <div className="flex items-center gap-2">
                        {hasPermission('meetings.approve_minutes') && meeting.status === 'held' ? (
                          <Button
                            className="text-xs font-bold px-3.5 py-1.5 bg-primary-900 text-white"
                            loading={approveMinutesMutation.isPending}
                            onClick={() => approveMinutesMutation.mutate(meeting.id)}
                          >
                            Approve Minutes
                          </Button>
                        ) : hasPermission('meetings.manage_minutes') && meeting.status !== 'archived' ? (
                          <Button
                            variant="outline"
                            className="text-xs font-bold px-3.5 py-1.5"
                            onClick={() => setExpandedMeetingId(isExpanded ? null : meeting.id)}
                          >
                            <FileText size={14} /> Record Minutes
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="text-xs font-bold px-3.5 py-1.5"
                            loading={attendanceMutation.isPending}
                            onClick={() => attendanceMutation.mutate(meeting.id)}
                          >
                            <CheckCircle2 size={14} className="text-emerald-600" /> Confirm Attendance
                          </Button>
                        )}

                        <button
                          onClick={() => setExpandedMeetingId(isExpanded ? null : meeting.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Meeting Details: Agenda, Attendance, Minutes */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 border-t border-slate-100 pt-4 space-y-4 text-xs"
                        >
                          {/* Agenda */}
                          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px] mb-2">
                              Agenda
                            </h4>
                            <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium">
                              <li>Weekly programme & service debrief</li>
                              <li>Upcoming campus fellowship preparations</li>
                              <li>Welfare cases & student support</li>
                            </ol>
                          </div>

                          {/* Minutes Drafting Area for Secretary */}
                          {hasPermission('meetings.manage_minutes') && meeting.status !== 'archived' && (
                            <div className="space-y-2">
                              <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                                Minutes & Deliberations
                              </h4>
                              <textarea
                                rows={3}
                                placeholder="Record official resolutions and decisions..."
                                value={minutesDraft}
                                onChange={(e) => setMinutesDraft(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs outline-none text-slate-800 shadow-xs"
                              />
                              <Button
                                className="text-xs font-bold px-3.5 py-1.5 bg-primary-900 text-white"
                                disabled={!minutesDraft.trim()}
                                loading={recordMinutesMutation.isPending}
                                onClick={() =>
                                  recordMinutesMutation.mutate({ meetingId: meeting.id, content: minutesDraft })
                                }
                              >
                                Save Minutes Draft
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
