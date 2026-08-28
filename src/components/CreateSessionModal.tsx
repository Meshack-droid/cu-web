import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Sparkles, X, BookOpen, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { createAttendanceSession, type AttendanceSession } from '@/features/attendance/attendance.api';

interface CreateSessionModalProps {
  onClose: () => void;
  onCreated: (newSession: AttendanceSession) => void;
}

export function CreateSessionModal({ onClose, onCreated }: CreateSessionModalProps) {
  const queryClient = useQueryClient();

  const nextSunday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
    return d.toISOString().substring(0, 10);
  };

  const [title, setTitle] = useState('Sunday Main Fellowship & Word Celebration');
  const [sessionType, setSessionType] = useState('sunday_service');
  const [sessionDate, setSessionDate] = useState(nextSunday());
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('12:30 PM');
  const [venue, setVenue] = useState('Assembly Hall / Main Sanctuary');
  const [theme, setTheme] = useState('Rooted and Built Up in Christ (Col 2:7)');
  const [preacher, setPreacher] = useState('Guest Speaker / CU Patron');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createAttendanceSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] });
      onCreated(data);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create attendance session');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !sessionDate || !startTime || !venue.trim()) {
      setError('Please fill in the required fields (Title, Date, Time, Venue)');
      return;
    }

    mutation.mutate({
      title: title.trim(),
      session_type: sessionType,
      session_date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      venue: venue.trim(),
      theme: theme.trim() || undefined,
      preacher: preacher.trim() || undefined,
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
                <div className="h-10 w-10 rounded-2xl bg-primary-100 text-primary-800 grid place-items-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary-950">Generate Sunday Service QR</h2>
                  <p className="text-xs text-slate-500">
                    Create a new service session and generate an instant scannable attendance code
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Service / Event Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Main Service & Word Feast"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs outline-none focus:border-primary-500"
                  >
                    <option value="sunday_service">Sunday Main Service</option>
                    <option value="bible_study">Midweek Bible Study</option>
                    <option value="kesha">Prayer Kesha / Night Vigil</option>
                    <option value="fellowship">Special Fellowship Gathering</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Service Date *</label>
                  <Input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Start Time *</label>
                  <Input
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">End Time</label>
                  <Input
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 12:30 PM"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Venue / Location *</label>
                <Input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Assembly Hall, TUM Main Campus"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Theme / Scripture Focus</label>
                <Input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Walking in Holiness (1 Peter 1:16)"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Speaker / Minister</label>
                <Input
                  value={preacher}
                  onChange={(e) => setPreacher(e.target.value)}
                  placeholder="e.g. Pastor John Mwangi"
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
                  <Sparkles size={16} /> Generate Service QR Code
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
