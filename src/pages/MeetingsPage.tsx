import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Lock,
  Plus,
  ArrowLeft,
  ChevronRight,
  QrCode,
  Download,
  Users,
  Search,
  UserCheck,
  FileSpreadsheet,
  X,
  Edit2,
  Trash2,
  Sparkles,
  Save,
  RotateCcw,
  Maximize2,
  Printer,
  MapPin,
  Clock,
  BookOpen,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import QRCode from 'qrcode';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PageHeaderGuide } from '@/components/PageHeaderGuide';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
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

function NewMeetingModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const addAuditLog = useDashboardStore((s) => s.addAuditLog);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MeetingType>('executive');
  const [scheduledAt, setScheduledAt] = useState('');
  const [venue, setVenue] = useState('Main Sanctuary / CU Office');
  const [theme, setTheme] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [customQrCode, setCustomQrCode] = useState('');

  const mutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: (newM) => {
      addAuditLog({
        module: 'Meetings & Events',
        action: 'Created New Meeting / Event',
        details: `Scheduled ${title} (${MEETING_TYPE_LABELS[type]}) at ${venue}`,
        actor: typeof user?.full_name === 'string' ? user.full_name : 'Super Admin',
        role: 'Super Admin',
      });
      onClose();
      setTitle('');
      setScheduledAt('');
      setVenue('');
      setTheme('');
      setSpeaker('');
      setCustomQrCode('');
      onCreated();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-xl font-black text-primary-950">Add New Meeting or Event</h3>
            <p className="text-xs text-slate-500">Create scheduled sessions, services, executive meetings, or retreats</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Meeting / Event Title *</label>
            <input
              placeholder="e.g. Executive Committee Strategy & Revival Planning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none text-slate-900 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Classification *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MeetingType)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none text-slate-800"
              >
                {Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Venue</label>
              <input
                placeholder="e.g. Assembly Hall / Science Complex"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none text-slate-900 shadow-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Custom Attendance QR Code</label>
              <input
                placeholder="e.g. EXEC-2026-AUG"
                value={customQrCode}
                onChange={(e) => setCustomQrCode(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono outline-none text-slate-900 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Spiritual Theme / Agenda Note</label>
            <input
              placeholder="e.g. 'Arise, Shine, for your Light has Come!'"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none text-slate-900 shadow-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Speaker / Chairperson</label>
            <input
              placeholder="e.g. Chairperson & Executive Council"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none text-slate-900 shadow-xs"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim() || !scheduledAt}
            loading={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                title: title.trim(),
                meeting_type: type,
                scheduled_at: new Date(scheduledAt).toISOString(),
                venue: venue.trim() || undefined,
              })
            }
            className="bg-primary-900 text-white font-bold"
          >
            Create Meeting & Generate QR
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function MeetingDetail({ meeting }: { meeting: Meeting }) {
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const user = useAuthStore((s) => s.user);
  const addAuditLog = useDashboardStore((s) => s.addAuditLog);

  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [minutesDraft, setMinutesDraft] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [isQrEditing, setIsQrEditing] = useState(false);

  // Editable QR parameters
  const [qrCheckInCode, setQrCheckInCode] = useState(`MEET-${meeting.meeting_type.toUpperCase()}-${meeting.id.slice(0, 5)}`);
  const [qrExpirationHours, setQrExpirationHours] = useState('12');
  const [qrGeneratedSvg, setQrGeneratedSvg] = useState('');
  const [qrCopied, setQrCopied] = useState(false);

  // Attendees Roster
  const [manualName, setManualName] = useState('');
  const [manualAdm, setManualAdm] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterAttendees, setRosterAttendees] = useState<Array<{ name: string; adm: string; time: string; role: string; visitorType?: string }>>([]);

  const { data: agenda } = useQuery({
    queryKey: ['meetings', meeting.id, 'agenda'],
    queryFn: () => fetchAgenda(meeting.id),
  });
  const { data: minutes } = useQuery({
    queryKey: ['meetings', meeting.id, 'minutes'],
    queryFn: () => fetchMinutes(meeting.id),
  });

  const checkInUrl = `${window.location.origin}/attendance/check-in?meetingId=${meeting.id}&code=${qrCheckInCode}`;

  // Generate QR on load or update
  React.useEffect(() => {
    QRCode.toDataURL(
      checkInUrl,
      {
        width: 600,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      },
      (err, url) => {
        if (!err && url) setQrGeneratedSvg(url);
      }
    );
  }, [checkInUrl, qrCheckInCode]);

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
    onSuccess: () => {
      setRosterAttendees((prev) => [
        { name: typeof user?.full_name === 'string' ? user.full_name : 'Current User', adm: 'TUMCU/MEMBER', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), role: 'Member' },
        ...prev,
      ]);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveMeeting(meeting.id),
    onSuccess: invalidateMeetings,
  });

  const downloadMeetingAttendanceCsv = () => {
    let csv = 'Meeting Title,Date,Attendee Name,Admission Number,Role,Check-in Time\n';
    rosterAttendees.forEach((r) => {
      csv += `"${meeting.title}","${meeting.scheduled_at}","${r.name}","${r.adm}","${r.role}","${r.time}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TUMCU_Attendance_${meeting.title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    const newAttendee = {
      name: manualName.trim(),
      adm: manualAdm.trim() || 'GUEST',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      role: manualAdm.trim() ? 'Student Member' : 'Guest / Visitor',
    };

    setRosterAttendees((prev) => [newAttendee, ...prev]);

    addAuditLog({
      module: 'Attendance & QR',
      action: 'Recorded Manual Attendance Check-in',
      details: `Checked in ${newAttendee.name} (${newAttendee.adm}) for ${meeting.title}`,
      actor: typeof user?.full_name === 'string' ? user.full_name : 'Super Admin',
      role: 'Super Admin',
    });

    setManualName('');
    setManualAdm('');
  };

  function handleSaveQrSettings() {
    setIsQrEditing(false);
    addAuditLog({
      module: 'Attendance & QR',
      action: 'Edited Event Attendance QR Code',
      details: `Updated QR code to ${qrCheckInCode} with ${qrExpirationHours}h validity for ${meeting.title}`,
      actor: typeof user?.full_name === 'string' ? user.full_name : 'Super Admin',
      role: 'Super Admin',
    });
  }

  const filteredRoster = rosterAttendees.filter(
    (att) =>
      att.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      att.adm.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4"
    >
      <Card variant="glass" className="p-6 bg-white border border-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-900 border border-gold-300">
              {MEETING_TYPE_LABELS[meeting.meeting_type]}
            </span>
            <h2 className="mt-2.5 text-2xl font-black tracking-tight text-primary-950">{meeting.title}</h2>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays size={15} />
              {new Date(meeting.scheduled_at).toLocaleString('en-KE', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
              {meeting.venue && <span> · Venue: {meeting.venue}</span>}
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
              meeting.status === 'archived'
                ? 'bg-slate-100 text-slate-500'
                : 'bg-primary-50 text-primary-700'
            }`}
          >
            {meeting.status}
          </span>
        </div>

        {/* Action Controls for Leaders: Edit QR, View Attendance Roster, Export */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4">
          <Button
            variant="primary"
            className="gap-1.5 bg-primary-900 text-white font-bold px-4 py-2 text-xs shadow-sm"
            onClick={() => setShowQrModal(true)}
          >
            <QrCode size={15} /> Edit & View Event Attendance QR
          </Button>

          <Button
            variant="outline"
            className="gap-1.5 bg-white text-primary-900 font-bold border-primary-200 px-4 py-2 text-xs hover:bg-primary-50 shadow-sm"
            onClick={() => setShowRosterModal(true)}
          >
            <Users size={15} /> View Attendance Roster ({rosterAttendees.length})
          </Button>

          <Button
            variant="outline"
            className="gap-1.5 bg-white text-emerald-800 font-bold border-emerald-300 px-4 py-2 text-xs hover:bg-emerald-50 shadow-sm"
            onClick={downloadMeetingAttendanceCsv}
          >
            <FileSpreadsheet size={15} /> Download CSV Roster
          </Button>

          <Button
            variant="ghost"
            className="gap-1.5 border border-primary-200 bg-white/70 px-4 py-2 text-xs font-semibold hover:bg-primary-50 text-primary-800"
            loading={attendanceMutation.isPending}
            onClick={() => attendanceMutation.mutate()}
          >
            <CheckCircle2 size={15} className="text-primary-700" />
            {attendanceMutation.isSuccess ? 'Attendance recorded' : 'Confirm my attendance'}
          </Button>

          {hasPermission('meetings.archive') && meeting.status !== 'archived' && (
            <Button
              variant="ghost"
              className="gap-1.5 border border-slate-200 bg-white/50 px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 ml-auto"
              loading={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate()}
            >
              <Lock size={15} /> Archive meeting
            </Button>
          )}
        </div>
      </Card>

      {/* Agenda Items Card */}
      <Card variant="glass" className="p-6 bg-white border border-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-bold text-primary-950">
            <ClipboardList size={18} className="text-primary-700" /> Order of Business & Agenda Items
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {agenda?.length === 0 && <p className="text-sm text-slate-400">No agenda items added yet.</p>}
          {agenda?.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-800 border border-slate-200/80 shadow-xs"
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary-100 text-xs font-bold text-primary-900">
                {i + 1}
              </span>
              <span className="flex-1 font-semibold">{item.title}</span>
              {Boolean(item.is_voting_item) && (
                <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[10px] font-bold text-gold-900 border border-gold-300">
                  Voting item
                </span>
              )}
            </div>
          ))}
        </div>
        {hasPermission('meetings.edit') && meeting.status !== 'archived' && (
          <div className="mt-4 flex gap-2">
            <input
              placeholder="Add next agenda item..."
              value={newAgendaItem}
              onChange={(e) => setNewAgendaItem(e.target.value)}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none shadow-xs text-slate-900"
            />
            <Button
              className="px-4 py-2 text-xs bg-primary-900 text-white font-bold"
              disabled={!newAgendaItem.trim()}
              loading={addAgendaMutation.isPending}
              onClick={() => addAgendaMutation.mutate(newAgendaItem)}
            >
              Add Agenda Item
            </Button>
          </div>
        )}
      </Card>

      {/* Minutes & Deliberations */}
      <Card variant="glass" className="p-6 bg-white border border-slate-200">
        <div className="mb-3 text-base font-bold text-primary-950">Official Minutes & Records</div>
        {minutes?.approved_at ? (
          <div>
            <span className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={13} /> Approved Minutes (Signed by Secretary & Chairperson)
            </span>
            <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 border border-slate-200 shadow-xs">{minutes.content}</p>
          </div>
        ) : hasPermission('meetings.manage_minutes') ? (
          <div className="flex flex-col gap-3">
            <textarea
              rows={4}
              placeholder="Record deliberations, constitutional resolutions, and decisions..."
              defaultValue={minutes?.content ?? ''}
              onChange={(e) => setMinutesDraft(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 text-sm outline-none shadow-xs text-slate-900"
            />
            <div className="flex gap-2">
              <Button
                className="px-4 py-2 text-xs bg-primary-900 text-white font-bold"
                disabled={!minutesDraft.trim() && !minutes?.content}
                loading={recordMinutesMutation.isPending}
                onClick={() => recordMinutesMutation.mutate(minutesDraft || minutes?.content || '')}
              >
                Save Minutes Draft
              </Button>
              {minutes?.content && hasPermission('meetings.approve_minutes') && (
                <Button
                  variant="ghost"
                  className="gap-1.5 border border-primary-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-primary-50 text-primary-900"
                  loading={approveMinutesMutation.isPending}
                  onClick={() => approveMinutesMutation.mutate()}
                >
                  <CheckCircle2 size={14} className="text-primary-700" /> Formally Approve Minutes
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 border border-slate-200">
            {minutes?.content ? minutes.content : 'Minutes have not been officially recorded yet.'}
          </p>
        )}
      </Card>

      {/* EDIT & VIEW ATTENDANCE QR CODE MODAL */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-black uppercase text-primary-900 tracking-wider">Attendance QR Studio</span>
                  <h3 className="text-base font-black text-primary-950">{meeting.title}</h3>
                </div>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              {isQrEditing ? (
                <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div className="font-bold text-primary-950 flex items-center gap-1.5">
                    <Edit2 size={14} /> Customize Event Attendance QR Parameters
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Check-in Code (QR Payload)</label>
                    <input
                      value={qrCheckInCode}
                      onChange={(e) => setQrCheckInCode(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono font-bold text-primary-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">QR Code Expiration (Hours)</label>
                    <select
                      value={qrExpirationHours}
                      onChange={(e) => setQrExpirationHours(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                    >
                      <option value="2">Active for 2 Hours (Standard Meeting)</option>
                      <option value="6">Active for 6 Hours (Half-Day Session)</option>
                      <option value="12">Active for 12 Hours (Full Day Event)</option>
                      <option value="24">Active for 24 Hours</option>
                      <option value="72">Active for 3 Days (Camp/Retreat)</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsQrEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveQrSettings} className="bg-primary-900 text-white font-bold">
                      <Save size={14} /> Save QR Code
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                    {qrGeneratedSvg ? (
                      <img src={qrGeneratedSvg} alt="Meeting QR Code" className="h-52 w-52 rounded-2xl shadow-md border-2 border-primary-900/10" />
                    ) : (
                      <div className="h-52 w-52 animate-pulse bg-slate-200 rounded-2xl" />
                    )}
                    <div className="mt-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Attendance Code</span>
                      <p className="font-mono text-base font-black text-primary-950">{qrCheckInCode}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-xl bg-slate-100 p-2.5">
                      <span className="font-mono text-slate-600 truncate mr-2">{checkInUrl}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(checkInUrl);
                          setQrCopied(true);
                          setTimeout(() => setQrCopied(false), 2000);
                        }}
                        className="font-bold text-primary-800 text-xs shrink-0"
                      >
                        {qrCopied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQrEditing(true)}
                      className="gap-1.5 border-slate-300 font-bold text-xs"
                    >
                      <Edit2 size={14} /> Edit QR Parameters
                    </Button>

                    <a
                      href={qrGeneratedSvg}
                      download={`TUMCU_Event_QR_${qrCheckInCode}.png`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary-900 py-2 text-xs font-bold text-white text-center hover:bg-primary-950 shadow-md"
                    >
                      <Download size={14} /> Download QR PNG
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ATTENDANCE ROSTER MODAL */}
      <AnimatePresence>
        {showRosterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xl font-black text-primary-950">Event Attendance Roster</h3>
                  <p className="text-xs text-slate-500">{meeting.title} • {rosterAttendees.length} total attendees verified</p>
                </div>
                <button
                  onClick={() => setShowRosterModal(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Fast Manual Check-In Form */}
              <form onSubmit={handleManualCheckIn} className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-800">Super Admin Fast Check-In</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Attendee Full Name *"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none"
                  />
                  <input
                    placeholder="Admission No (or 'GUEST')"
                    value={manualAdm}
                    onChange={(e) => setManualAdm(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none font-mono"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary-900 text-white font-bold py-2 text-xs shadow-xs">
                  Mark Present on Roster
                </Button>
              </form>

              {/* Search Attendee */}
              <div className="mt-4">
                <input
                  placeholder="Search attendee by name or admission number..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none"
                />
              </div>

              {/* Attendance Table */}
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredRoster.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <div className="font-bold text-primary-950 text-sm">{att.name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{att.adm} · <span className="text-primary-800">{att.role}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">{att.time}</span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 text-[10px]">
                        Present
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={downloadMeetingAttendanceCsv}
                  className="text-xs font-bold text-primary-900 border-primary-200"
                >
                  <FileSpreadsheet size={14} className="mr-1.5" /> Download Full CSV Roster
                </Button>
                <Button variant="ghost" onClick={() => setShowRosterModal(false)}>
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MeetingsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
  });

  const selected = meetings?.find((m) => m.id === selectedId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Interactive Guide */}
      <PageHeaderGuide
        title="Meetings & Events Governance"
        badge="Constitutional Chapter 6"
        subtitle="Schedule sessions, customize attendance QR codes, record digital minutes, and download live attendee rosters."
        summarySteps={[
          {
            title: '1. Create Event/Meeting',
            description: 'Define meeting type (Executive, Leaders Summit, Fellowship, AGM), date, and venue.',
            badge: 'Scheduling',
          },
          {
            title: '2. Generate Event QR',
            description: 'Members scan the session QR code upon arrival to be marked present in the digital roster.',
            badge: 'Live QR',
          },
          {
            title: '3. Minutes & Approvals',
            description: 'The Secretary records official minutes and the Chairperson formally approves them.',
            badge: 'Governance',
          },
        ]}
        quickTips={[
          'Click on any meeting to open its full dashboard, manage agenda items, and view live attendees.',
          'Export attendance rosters directly to CSV for administrative and archivist records.',
          'Admins and Leaders can add manual attendees for members without mobile devices.',
        ]}
        actionButton={
          hasPermission('meetings.create')
            ? {
                label: 'Add Event / Meeting',
                onClick: () => setIsNewModalOpen(true),
                icon: Plus,
              }
            : undefined
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/60" />
          ))}
        </div>
      )}

      {!isLoading && meetings?.length === 0 && (
        <Card variant="glass" className="p-8 text-center text-sm text-slate-500">
          <CalendarDays size={32} className="mx-auto mb-2 text-slate-400" />
          No meetings or events scheduled yet. Click &quot;Add Event / Meeting&quot; above to create one.
        </Card>
      )}

      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {meetings?.map((meeting, idx) => (
              <motion.button
                key={meeting.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ y: -2, scale: 1.004 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedId(meeting.id)}
                className="group text-left"
              >
                <Card variant="glass" className="transition-shadow hover:shadow-md border border-slate-200/80 bg-white">
                  <div className="flex items-center justify-between gap-4 p-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-bold text-gold-900 border border-gold-300">
                          {MEETING_TYPE_LABELS[meeting.meeting_type]}
                        </span>
                        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-800">
                          QR Active
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-bold text-primary-950 group-hover:text-primary-800">
                        {meeting.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays size={13} />
                        {new Date(meeting.scheduled_at).toLocaleString('en-KE', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                        {meeting.venue && <span> · {meeting.venue}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          meeting.status === 'archived'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-primary-50 text-primary-700'
                        }`}
                      >
                        {meeting.status}
                      </span>
                      <ChevronRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Card>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedId(null)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-900"
            >
              <ArrowLeft size={16} /> Back to all meetings & events
            </motion.button>
            <MeetingDetail meeting={selected} />
          </motion.div>
        )}
      </AnimatePresence>

      <NewMeetingModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['meetings'] })}
      />
    </div>
  );
}
