import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Printer,
  X,
  Sparkles,
  MapPin,
  Clock,
  BookOpen,
  UserCheck,
  ExternalLink,
  Edit2,
  Save,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { type AttendanceSession } from '@/features/attendance/attendance.api';
import { useDashboardStore } from '@/store/dashboard.store';

interface SundayServiceQrModalProps {
  isOpen?: boolean;
  session?: AttendanceSession;
  onClose: () => void;
  onSessionUpdated?: (updated: AttendanceSession) => void;
}

export function SundayServiceQrModal({
  isOpen,
  session: initialSession,
  onClose,
  onSessionUpdated,
}: SundayServiceQrModalProps) {
  if (isOpen === false) return null;
  const addAuditLog = useDashboardStore((s) => s.addAuditLog);

  // Fallback default Sunday service session if none passed
  const [session, setSession] = useState<AttendanceSession>(() => {
    if (initialSession) return initialSession;
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
    const dateStr = nextSunday.toISOString().split('T')[0];

    return {
      id: 'sunday-service-main',
      code: 'SUN-SERVICE-2026',
      title: 'Sunday Main Worship & Word Service',
      session_type: 'sunday_service',
      session_date: dateStr,
      start_time: '08:30 AM',
      end_time: '12:30 PM',
      venue: 'TUM Main Assembly Sanctuary / Hall 1',
      theme: 'Arise, Shine, for your Light has Come! (Isaiah 60:1)',
      preacher: 'TUMCU Ministry Team & Guest Ministers',
      is_active: 1,
      attendees_count: 0,
      members_count: 0,
      visitors_count: 0,
      created_at: new Date().toISOString(),
    };
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [simulatedCount, setSimulatedCount] = useState(session.attendees_count || 0);
  const [simulatedSuccess, setSimulatedSuccess] = useState<string | null>(null);

  // Editable fields
  const [editTitle, setEditTitle] = useState(session.title);
  const [editCode, setEditCode] = useState(session.code);
  const [editVenue, setEditVenue] = useState(session.venue);
  const [editTheme, setEditTheme] = useState(session.theme || '');
  const [editPreacher, setEditPreacher] = useState(session.preacher || '');
  const [editStartTime, setEditStartTime] = useState(session.start_time);
  const [editEndTime, setEditEndTime] = useState(session.end_time || '12:30 PM');
  const [editDate, setEditDate] = useState(session.session_date);
  const [editIsActive, setEditIsActive] = useState(Boolean(session.is_active));

  const checkInUrl = `${window.location.origin}/attendance/check-in?code=${session.code}`;

  useEffect(() => {
    QRCode.toDataURL(
      checkInUrl,
      {
        width: 700,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [checkInUrl, session.code]);

  function handleCopy() {
    navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownloadQr() {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `TUMCU_Sunday_Service_QR_${session.code}_${session.session_date}.png`;
    link.click();
  }

  function handlePrint() {
    window.print();
  }

  function handleSaveEdit() {
    const updated: AttendanceSession = {
      ...session,
      title: editTitle.trim() || session.title,
      code: editCode.trim().toUpperCase() || session.code,
      venue: editVenue.trim() || session.venue,
      theme: editTheme.trim() || undefined,
      preacher: editPreacher.trim() || undefined,
      start_time: editStartTime.trim() || session.start_time,
      end_time: editEndTime.trim() || session.end_time,
      session_date: editDate || session.session_date,
      is_active: editIsActive ? 1 : 0,
    };

    setSession(updated);
    setIsEditing(false);
    onSessionUpdated?.(updated);

    addAuditLog({
      module: 'Attendance & QR',
      action: 'Edited Sunday Service QR Code & Details',
      details: `Updated session code to ${updated.code}, venue to "${updated.venue}", active=${editIsActive}`,
      actor: 'Super Admin',
      role: 'Super Admin',
      previousValue: session.code,
      newValue: updated.code,
    });
  }

  function handleSimulateCheckIn(isMember: boolean) {
    const name = isMember ? 'Meshack Okoth (CIT/2023/044)' : 'First-time Visitor (Kevin Otieno)';
    setSimulatedCount((c) => c + 1);
    setSimulatedSuccess(`Checked in: ${name}`);
    setTimeout(() => setSimulatedSuccess(null), 3000);

    addAuditLog({
      module: 'Attendance & QR',
      action: isMember ? 'Member QR Check-in Recorded' : 'Visitor Check-in Recorded',
      details: `${name} checked in to ${session.title} (${session.code})`,
      actor: 'System Attendance Engine',
      role: isMember ? 'Member' : 'Guest',
    });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full transition-all duration-300 ${
            fullscreen
              ? 'fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 p-6 sm:p-10 text-white'
              : 'max-w-3xl my-6'
          }`}
        >
          {fullscreen ? (
            // Fullscreen Projector Presentation Mode for Church Screens
            <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-between h-full py-4 text-center">
              <div className="flex w-full items-center justify-between mb-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="h-12 w-12 rounded-2xl bg-amber-400 text-slate-950 grid place-items-center font-black text-xl shadow-lg">
                    TU
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-white">TECHNICAL UNIVERSITY OF MOMBASA</h2>
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">Christian Union · Sunday Service Attendance</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    <Users size={14} /> {simulatedCount} Attendees Checked In
                  </div>
                  <button
                    onClick={() => setFullscreen(false)}
                    className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition flex items-center gap-1.5 text-xs font-bold"
                    title="Exit Fullscreen"
                  >
                    <Minimize2 size={18} /> Exit Projector View
                  </button>
                </div>
              </div>

              <div className="my-auto flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-14 w-full py-2">
                {/* Large Projector QR */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl shadow-amber-500/10 max-w-sm flex flex-col items-center border-4 border-amber-400">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Attendance QR Code" className="w-64 h-64 sm:w-80 sm:h-80 object-contain" />
                  ) : (
                    <div className="w-64 h-64 sm:w-80 sm:h-80 animate-pulse bg-slate-200 rounded-2xl" />
                  )}
                  <div className="mt-4 text-center">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Service Check-in Code</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-wider">{session.code}</p>
                  </div>
                </div>

                {/* Service Details on Projector */}
                <div className="text-left max-w-lg space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3.5 py-1.5 text-xs font-bold text-amber-300 border border-amber-400/30">
                    <Sparkles size={14} /> Scan with Mobile Camera to Check In
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">{session.title}</h1>
                  {session.theme && (
                    <p className="text-base text-amber-200 italic border-l-4 border-amber-400 pl-4 py-1 bg-amber-400/10 rounded-r-xl">
                      "{session.theme}"
                    </p>
                  )}

                  <div className="space-y-2.5 text-sm text-slate-300 pt-2">
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-amber-400 shrink-0" />
                      <span className="font-semibold text-white">{session.venue}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-amber-400 shrink-0" />
                      <span>
                        {session.session_date} · {session.start_time} - {session.end_time || '12:30 PM'}
                      </span>
                    </div>
                    {session.preacher && (
                      <div className="flex items-center gap-3">
                        <BookOpen size={18} className="text-amber-400 shrink-0" />
                        <span>Preacher / Minister: <strong className="text-white">{session.preacher}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-2xl bg-white/10 border border-white/15 p-4 text-xs text-slate-200 space-y-2">
                    <p className="font-black text-white uppercase tracking-wider text-xs">Easy Check-in Steps:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs">
                      <li>Open your phone camera or QR scanner app</li>
                      <li>Point at the screen & tap the TUMCU check-in notification</li>
                      <li><strong>Members:</strong> Auto-verifies with your admission number</li>
                      <li><strong>First-time Visitors:</strong> Enter name & phone for fellowship welcome!</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="w-full text-center text-xs text-slate-400 pt-3 border-t border-white/10 flex flex-wrap justify-between items-center gap-2">
                <span>Manual web link: <strong className="font-mono text-amber-300">{checkInUrl}</strong></span>
                <span>Active Attendance Session: <strong>{session.code}</strong></span>
              </div>
            </div>
          ) : (
            // Standard Modal View with Full Editing and Management Controls
            <Card variant="glass" className="border-slate-200/80 p-6 sm:p-8 shadow-2xl relative bg-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-900 border border-amber-300 uppercase tracking-wider mb-2">
                    <Sparkles size={14} className="text-amber-600" /> Sunday Service Attendance Studio
                  </div>
                  <h2 className="text-2xl font-black text-primary-950">{session.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Official TUMCU Sunday attendance QR code for sanctuary projectors, bulletins, and digital check-ins.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Alert & Quick Simulation Bar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-500/10 border border-amber-200/80 p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-primary-950">
                    Live Check-in Engine Active: <strong className="font-mono text-amber-800">{session.code}</strong> ({simulatedCount} recorded)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulateCheckIn(true)}
                    className="rounded-xl bg-primary-900 px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-primary-800 transition"
                  >
                    + Test Member Check-In
                  </button>
                  <button
                    onClick={() => handleSimulateCheckIn(false)}
                    className="rounded-xl bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-900 border border-amber-300 hover:bg-amber-200 transition"
                  >
                    + Test Visitor Check-In
                  </button>
                </div>
              </div>

              {simulatedSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2"
                >
                  <CheckCircle2 size={15} /> {simulatedSuccess}
                </motion.div>
              )}

              {/* Edit Mode vs Display Mode */}
              {isEditing ? (
                <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-sm font-black text-primary-950 flex items-center gap-2">
                      <Edit2 size={16} /> Edit Service & QR Code Configuration
                    </span>
                    <span className="text-xs text-slate-500">Super Admin Controls</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Service Title</label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Check-in Code (QR Payload)</label>
                      <input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-mono font-bold text-primary-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sanctuary Venue</label>
                      <input
                        value={editVenue}
                        onChange={(e) => setEditVenue(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Service Date</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                      <input
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                      <input
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Spiritual Theme / Verse</label>
                      <input
                        value={editTheme}
                        onChange={(e) => setEditTheme(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none"
                        placeholder="e.g. Arise, Shine, for your Light has Come! (Isaiah 60:1)"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Guest Preacher / Minister</label>
                      <input
                        value={editPreacher}
                        onChange={(e) => setEditPreacher(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none"
                        placeholder="e.g. Rev. Dr. Joseph M. & TUMCU Ministry Team"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="rounded h-4 w-4 text-primary-900"
                      />
                      Session Active for Check-in
                    </label>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSaveEdit} className="gap-1.5 bg-primary-900 text-white font-bold">
                        <Save size={14} /> Save QR Code Configuration
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-[1.1fr_1fr] gap-6 items-center py-6">
                  {/* High Contrast QR Code Display */}
                  <div className="flex flex-col items-center">
                    <div className="rounded-3xl bg-white p-5 shadow-xl border-2 border-primary-900/20 flex flex-col items-center relative">
                      <div className="absolute -top-3 bg-primary-900 text-white font-black text-[10px] tracking-wider uppercase px-3 py-0.5 rounded-full shadow-sm">
                        Official TUMCU QR
                      </div>
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Sunday Service QR Code"
                          className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                        />
                      ) : (
                        <div className="w-56 h-56 sm:w-64 sm:h-64 animate-pulse bg-slate-100 rounded-2xl" />
                      )}
                      <div className="mt-3 text-center border-t border-slate-100 pt-2 w-full">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Attendance Code</span>
                        <p className="font-mono text-base font-black text-primary-950">{session.code}</p>
                      </div>
                    </div>
                  </div>

                  {/* Session Overview & Actions */}
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4 text-xs space-y-2 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary-950 text-sm">Service Details</span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 text-[10px]">
                          {session.is_active ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-slate-700">
                        <strong>Date:</strong> {session.session_date} ({session.start_time} - {session.end_time || '12:30 PM'})
                      </p>
                      <p className="text-slate-700">
                        <strong>Sanctuary:</strong> {session.venue}
                      </p>
                      {session.theme && (
                        <p className="text-slate-700 italic">
                          <strong>Theme:</strong> "{session.theme}"
                        </p>
                      )}
                      {session.preacher && (
                        <p className="text-slate-700">
                          <strong>Preacher:</strong> {session.preacher}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Direct Check-in URL
                      </label>
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                        <input
                          readOnly
                          value={checkInUrl}
                          className="w-full bg-transparent font-mono text-slate-700 outline-none text-xs"
                        />
                        <button
                          onClick={handleCopy}
                          className="shrink-0 rounded-lg p-1.5 text-primary-700 hover:bg-primary-50 transition"
                          title="Copy link"
                        >
                          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md"
                        onClick={() => setFullscreen(true)}
                      >
                        <Maximize2 size={14} /> Projector Mode
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="gap-1.5 bg-primary-900 text-white font-bold text-xs shadow-md"
                        onClick={handleDownloadQr}
                      >
                        <Download size={14} /> Download PNG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-slate-300 text-slate-800 text-xs font-bold"
                        onClick={handlePrint}
                      >
                        <Printer size={14} /> Print Bulletin
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-primary-300 text-primary-900 hover:bg-primary-50 text-xs font-bold"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 size={14} /> Edit QR / Code
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Automatic Visitor Welcoming Flow */}
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs leading-5 text-amber-950 flex items-start gap-3">
                <UserCheck size={20} className="text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900">Seamless Member & Visitor Experience:</span> Registered students are instantly verified by admission number, while first-time visitors are welcomed and prompted to connect with the Hospitality Ministry.
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                <a
                  href={checkInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-800 hover:underline"
                >
                  <ExternalLink size={14} /> Open Public Check-In Page
                </a>
                <Button variant="primary" onClick={onClose} className="bg-primary-900 text-white font-bold px-6">
                  Done
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
