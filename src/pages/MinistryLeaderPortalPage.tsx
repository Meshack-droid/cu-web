import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Church,
  CalendarDays,
  QrCode,
  Users,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  MapPin,
  FileSpreadsheet,
  RefreshCw,
  Search,
  UserCheck,
  Sparkles,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';

interface Ministry {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_venue?: string;
  leader_id?: string;
}

interface MinistrySession {
  id: string;
  code: string;
  title: string;
  session_type: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  venue: string;
  theme?: string;
  attendees_count?: number;
}

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  admission_number: string;
  course: string;
  year_of_study: number;
  role: string;
  join_date: string;
}

export function MinistryLeaderPortalPage() {
  const { user, hasPermission, roles } = useAuthStore();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>('');
  const [sessions, setSessions] = useState<MinistrySession[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalSession, setQrModalSession] = useState<MinistrySession | null>(null);

  // New session modal state
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('16:30');
  const [newEndTime, setNewEndTime] = useState('18:30');
  const [newVenue, setNewVenue] = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [sessionType, setSessionType] = useState('ministry_practice');
  const [submittingSession, setSubmittingSession] = useState(false);

  // Filter state
  const [searchMember, setSearchMember] = useState('');

  const activeMinistry = ministries.find((m) => m.id === selectedMinistryId) || ministries[0];

  useEffect(() => {
    fetchLeaderMinistries();
  }, []);

  useEffect(() => {
    if (selectedMinistryId) {
      fetchMinistryData(selectedMinistryId);
    }
  }, [selectedMinistryId]);

  async function fetchLeaderMinistries() {
    try {
      setLoading(true);
      const res = await api.get<any>('/ministries/leader-portal');
      const minList = res.data?.data || [];
      setMinistries(minList);
      if (minList.length > 0) {
        setSelectedMinistryId(minList[0].id);
      }
    } catch (err) {
      console.error('Failed to load leader ministries', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMinistryData(ministryId: string) {
    try {
      const [sessionsRes, membersRes] = await Promise.all([
        api.get<any>(`/ministries/${ministryId}/sessions`),
        api.get<any>(`/ministries/${ministryId}/members`),
      ]);
      setSessions(sessionsRes.data?.data || []);
      setMembers(membersRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load ministry details', err);
    }
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMinistryId || !newTitle || !newDate || !newStartTime) return;

    setSubmittingSession(true);
    try {
      const res = await api.post<any>(`/ministries/${selectedMinistryId}/sessions`, {
        title: newTitle,
        session_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        venue: newVenue || activeMinistry?.meeting_venue || 'LT B',
        theme: newTheme,
        session_type: sessionType,
      });

      setIsCreatingSession(false);
      // Reset form
      setNewTitle('');
      setNewTheme('');
      await fetchMinistryData(selectedMinistryId);

      // Open QR code for the new session immediately
      if (res.data?.data) {
        setQrModalSession(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create practice session');
    } finally {
      setSubmittingSession(false);
    }
  }

  const filteredMembers = members.filter((m) =>
    (m.full_name || '').toLowerCase().includes(searchMember.toLowerCase()) ||
    (m.admission_number || '').toLowerCase().includes(searchMember.toLowerCase()) ||
    (m.phone_number || '').includes(searchMember)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-black text-gold-800">
              Ministry Leader Portal
            </span>
            <span className="text-xs text-slate-500">TUMCU Operations & Practice Hub</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-primary-950 sm:text-3xl">
            {activeMinistry?.name || 'Ministry Leader Dashboard'}
          </h1>
          <p className="text-sm text-slate-600">
            Schedule practice sessions, generate dynamic attendance QR codes, and manage your team roster.
          </p>
        </div>

        {ministries.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Switch Ministry:</span>
            <select
              value={selectedMinistryId}
              onChange={(e) => setSelectedMinistryId(e.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-primary-950 focus:border-primary-900 focus:outline-none"
            >
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Ministry Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-900">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-primary-950">{members.length}</div>
            <div className="text-xs font-medium text-slate-500">Active Team Members</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-50 text-gold-700">
            <CalendarDays size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-primary-950">{sessions.length}</div>
            <div className="text-xs font-medium text-slate-500">Practice / Meetings Scheduled</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <MapPin size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-primary-950 truncate max-w-[150px]">
              {activeMinistry?.meeting_venue || 'Sanctuary / LT B'}
            </div>
            <div className="text-xs font-medium text-slate-500">
              {activeMinistry?.meeting_day || 'Fridays 4:30 PM'}
            </div>
          </div>
        </Card>

        <Card className="flex items-center justify-between p-5">
          <div>
            <div className="text-xs font-bold text-slate-500">Practice QR Check-In</div>
            <div className="text-sm font-black text-primary-900">Dynamic Attendance</div>
          </div>
          <Button
            onClick={() => setIsCreatingSession(true)}
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus size={16} /> Schedule Practice
          </Button>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Practice Sessions List (2 Columns) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-primary-950">Practice & Meeting Sessions</h2>
            <Button
              onClick={() => setIsCreatingSession(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Plus size={15} /> New Session & QR Code
            </Button>
          </div>

          {sessions.length === 0 ? (
            <Card className="p-8 text-center">
              <Church size={36} className="mx-auto text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-primary-950">No practice sessions scheduled yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                Create a practice or fellowship session to generate a dynamic attendance QR code for your members.
              </p>
              <Button
                onClick={() => setIsCreatingSession(true)}
                className="mt-4 inline-flex items-center gap-1.5"
              >
                <Plus size={16} /> Schedule First Practice
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3.5">
              {sessions.map((sess) => (
                <Card key={sess.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-primary-100 px-2 py-0.5 text-[10px] font-black uppercase text-primary-800">
                          {sess.session_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">{sess.code}</span>
                      </div>
                      <h3 className="text-base font-bold text-primary-950">{sess.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={13} className="text-slate-400" />
                          {sess.session_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-slate-400" />
                          {sess.start_time} {sess.end_time ? `- ${sess.end_time}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" />
                          {sess.venue}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setQrModalSession(sess)}
                        size="sm"
                        className="flex items-center gap-1.5 bg-gold-500 font-bold text-primary-950 hover:bg-gold-400"
                      >
                        <QrCode size={15} /> Show QR Code
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Member Roster (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-primary-950">Team Roster ({members.length})</h2>
            <button
              onClick={() => fetchMinistryData(selectedMinistryId)}
              className="text-xs text-slate-500 hover:text-primary-900"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <Card className="p-4 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search member name or adm..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-primary-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
              {filteredMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No members matched your search.
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.id || member.user_id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-white transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-primary-950 truncate">
                        {member.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {member.admission_number} • Year {member.year_of_study || 1}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {member.phone_number || member.email}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Active
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Create Practice Session Modal */}
      {isCreatingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-primary-950">Schedule Ministry Session</h3>
                <p className="text-xs text-slate-500">Generates instant dynamic attendance QR code</p>
              </div>
              <button
                onClick={() => setIsCreatingSession(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Session Title *</label>
                <Input
                  required
                  placeholder="e.g. Friday Choir Rehearsal / Band Practice"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <Input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="ministry_practice">Ministry Practice</option>
                    <option value="ministry_meeting">Committee Meeting</option>
                    <option value="ministry_fellowship">Ministry Fellowship</option>
                    <option value="training">Skills Training</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time *</label>
                  <Input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <Input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Venue *</label>
                <Input
                  required
                  placeholder="e.g. TUM Main Sanctuary / LT B"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Practice Theme / Notes</label>
                <Input
                  placeholder="e.g. Sunday Service Worship Songs Set Rehearsal"
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatingSession(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingSession}>
                  {submittingSession ? 'Generating QR...' : 'Create & Generate QR'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dynamic QR Code Modal with Download */}
      {qrModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="rounded-full bg-primary-100 px-3 py-0.5 text-[10px] font-black uppercase text-primary-900">
                {activeMinistry?.name}
              </span>
              <button
                onClick={() => setQrModalSession(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-primary-950">{qrModalSession.title}</h3>
              <p className="text-xs text-slate-500">
                {qrModalSession.session_date} • {qrModalSession.start_time} • {qrModalSession.venue}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="mx-auto rounded-2xl border-4 border-primary-900 p-4 bg-white shadow-inner max-w-[220px]">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `${window.location.origin}/attendance/check-in?code=${qrModalSession.code}&session=${qrModalSession.id}`
                )}`}
                alt="Ministry Attendance QR Code"
                className="h-48 w-48 object-contain mx-auto"
              />
            </div>

            <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 font-mono font-bold">
              Check-in Code: <span className="text-primary-900">{qrModalSession.code}</span>
            </div>

            <p className="text-[11px] text-slate-500">
              Members can scan this QR code using their smartphone camera or the TUMCU portal to record their practice attendance.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/attendance/check-in?code=${qrModalSession.code}&session=${qrModalSession.id}`;
                  navigator.clipboard.writeText(url);
                  alert('Check-in link copied to clipboard!');
                }}
              >
                Copy Link
              </Button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                  `${window.location.origin}/attendance/check-in?code=${qrModalSession.code}&session=${qrModalSession.id}`
                )}`}
                target="_blank"
                rel="noreferrer"
                download={`TUMCU-${qrModalSession.code}-QR.png`}
                className="inline-flex items-center justify-center gap-1 rounded-2xl bg-primary-900 px-3 py-2 text-xs font-bold text-white shadow hover:bg-primary-950"
              >
                <Download size={14} /> Download QR
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
