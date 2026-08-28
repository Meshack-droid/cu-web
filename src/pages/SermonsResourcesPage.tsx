import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Headphones,
  Play,
  Pause,
  Download,
  Calendar,
  User,
  HeartHandshake,
  CheckCircle2,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Building,
  ShieldCheck,
  Music,
  Info,
  X,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PageHeaderGuide } from '@/components/PageHeaderGuide';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchSermons,
  createSermon,
  updateSermon,
  deleteSermon,
  fetchGivingList,
  recordGiving,
  downloadGivingReportCsv,
  type Sermon,
  type GivingRecord,
} from '@/features/sermons/sermons.api';

export function SermonsResourcesPage() {
  const { user } = useAuthStore();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Giving state
  const [givingList, setGivingList] = useState<GivingRecord[]>([]);
  const [givingAmount, setGivingAmount] = useState('');
  const [givingCategory, setGivingCategory] = useState<'Tithe' | 'Offering' | 'Missions' | 'Welfare' | 'Music' | 'Building'>('Tithe');
  const [mpesaCode, setMpesaCode] = useState('');
  const [donorName, setDonorName] = useState<string>(
    typeof user?.full_name === 'string' ? user.full_name : ''
  );
  const [givingSubmitted, setGivingSubmitted] = useState(false);
  const [givingSearch, setGivingSearch] = useState('');

  // Admin Sermon Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSpeaker, setFormSpeaker] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formSeries, setFormSeries] = useState('');
  const [formScripture, setFormScripture] = useState('');
  const [formAudioUrl, setFormAudioUrl] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canManageSermons =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'chairperson' ||
    user?.role === 'secretary' ||
    user?.role === 'discipleship_chairperson';

  // Load Sermons and Giving data
  const loadData = async () => {
    try {
      setLoading(true);
      const [sermonData, givings] = await Promise.all([
        fetchSermons(),
        fetchGivingList(),
      ]);
      setSermons(sermonData);
      setGivingList(givings);
      if (sermonData.length > 0 && !activeSermon) {
        setActiveSermon(sermonData[0]);
      }
    } catch (err) {
      console.error('Failed to load sermons/giving', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Audio Playback
  useEffect(() => {
    if (audioElement) {
      audioElement.pause();
    }
    setIsPlaying(false);

    if (activeSermon?.audio_url) {
      const audio = new Audio(activeSermon.audio_url);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
    } else {
      setAudioElement(null);
    }

    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [activeSermon]);

  function togglePlay() {
    if (!audioElement || !activeSermon?.audio_url) return;
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('Audio play simulated or blocked', err);
        setIsPlaying(true);
      });
    }
  }

  // Open Modal for Create or Edit
  function openAddModal() {
    setEditingSermon(null);
    setFormTitle('');
    setFormSpeaker('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormSeries('Unshakeable Faith');
    setFormScripture('');
    setFormAudioUrl('');
    setFormDuration('45:00');
    setFormDescription('');
    setIsModalOpen(true);
  }

  function openEditModal(sermon: Sermon) {
    setEditingSermon(sermon);
    setFormTitle(sermon.title);
    setFormSpeaker(sermon.speaker);
    setFormDate(sermon.date);
    setFormSeries(sermon.series);
    setFormScripture(sermon.scripture);
    setFormAudioUrl(sermon.audio_url || '');
    setFormDuration(sermon.duration || '');
    setFormDescription(sermon.description);
    setIsModalOpen(true);
  }

  async function handleSaveSermon(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle || !formSpeaker || !formScripture) return;
    setIsSaving(true);
    try {
      if (editingSermon) {
        await updateSermon(editingSermon.id, {
          title: formTitle,
          speaker: formSpeaker,
          date: formDate,
          series: formSeries,
          scripture: formScripture,
          audio_url: formAudioUrl.trim() || null,
          duration: formDuration,
          description: formDescription,
        });
      } else {
        await createSermon({
          title: formTitle,
          speaker: formSpeaker,
          date: formDate,
          series: formSeries,
          scripture: formScripture,
          audio_url: formAudioUrl.trim() || null,
          duration: formDuration,
          description: formDescription,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Failed to save sermon. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSermon(id: string) {
    if (!window.confirm('Are you sure you want to delete this sermon from the vault?')) return;
    try {
      await deleteSermon(id);
      if (activeSermon?.id === id) {
        setActiveSermon(null);
      }
      await loadData();
    } catch (err) {
      alert('Failed to delete sermon.');
    }
  }

  async function handleRecordGiving(e: React.FormEvent) {
    e.preventDefault();
    if (!givingAmount || !mpesaCode) return;
    try {
      await recordGiving({
        donor_name: donorName || 'TUMCU Supporter',
        category: givingCategory,
        amount: Number(givingAmount),
        mpesa_code: mpesaCode,
      });
      setGivingSubmitted(true);
      setGivingAmount('');
      setMpesaCode('');
      await loadData();
      setTimeout(() => setGivingSubmitted(false), 5000);
    } catch (err) {
      alert('Failed to record contribution.');
    }
  }

  const filteredSermons = sermons.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.speaker.toLowerCase().includes(search.toLowerCase()) ||
      s.scripture.toLowerCase().includes(search.toLowerCase()) ||
      s.series.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGiving = givingList.filter(
    (g) =>
      g.donor_name.toLowerCase().includes(givingSearch.toLowerCase()) ||
      g.mpesa_code.toLowerCase().includes(givingSearch.toLowerCase()) ||
      g.category.toLowerCase().includes(givingSearch.toLowerCase())
  );

  const totalGivingKES = givingList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Interactive Guide */}
      <PageHeaderGuide
        title="Sermons, Teachings & Giving Vault"
        badge="Word & Stewardship Hub"
        subtitle="Expositions of God's Word preached at Sunday Services, Keshas, and Bible Study conferences, with transparent stewardship tracking."
        summarySteps={[
          {
            title: '1. Listen & Study',
            description: 'Stream or download audio messages, view sermon scripture references, and review message themes.',
            badge: 'Audio Vault',
          },
          {
            title: '2. Cheerful Giving',
            description: 'Give tithes, offerings, missions, and love gifts securely via M-Pesa Paybill (247247).',
            badge: 'M-Pesa 247247',
          },
          {
            title: '3. Ministry Records',
            description: 'Track contribution entries with confirmation codes and export audited reports to CSV.',
            badge: 'Transparency',
          },
        ]}
        quickTips={[
          'Click the play icon on any sermon card to start listening immediately in the audio player.',
          'Always include your M-Pesa confirmation code when recording a contribution for instant receipting.',
          'Leaders can upload new audio recordings, slides, and study handouts using the "Add Sermon" button.',
        ]}
        actionButton={
          canManageSermons
            ? {
                label: 'Add Sermon / Audio',
                onClick: openAddModal,
                icon: Plus,
              }
            : undefined
        }
      />

      {/* Main Audio / Sermon Spotlight Card */}
      {activeSermon && (
        <Card className="border-2 border-primary-900/10 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950 p-6 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gold-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary-950">
                  {activeSermon.series}
                </span>
                <span className="text-xs text-slate-300">
                  {activeSermon.date} • {activeSermon.duration || 'Full Session'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">{activeSermon.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gold-300">
                <span className="flex items-center gap-1 font-semibold">
                  <User size={13} /> {activeSermon.speaker}
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <BookOpen size={13} /> {activeSermon.scripture}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-2">
                {activeSermon.description}
              </p>

              {/* Admin controls for active sermon */}
              {canManageSermons && (
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => openEditModal(activeSermon)}
                    className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-gold-300 hover:bg-white/20 transition"
                  >
                    <Edit2 size={12} /> Edit Sermon & Audio
                  </button>
                  <button
                    onClick={() => handleDeleteSermon(activeSermon.id)}
                    className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>

            {/* CONDITIONAL AUDIO CONTROLS */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              {activeSermon.audio_url && activeSermon.audio_url.trim() !== '' ? (
                <>
                  <button
                    onClick={togglePlay}
                    title={isPlaying ? 'Pause Sermon' : 'Play Sermon Audio'}
                    className="grid h-16 w-16 place-items-center rounded-full bg-gold-500 text-primary-950 shadow-2xl transition hover:scale-105 active:scale-95"
                  >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={activeSermon.audio_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-slate-100 hover:bg-white/25 transition shadow-sm"
                    >
                      <Download size={13} /> Download MP3
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/5 p-4 text-center">
                  <FileText className="text-gold-400 mb-1.5" size={24} />
                  <span className="text-xs font-bold text-white">Study Notes Only</span>
                  <span className="text-[11px] text-slate-300 mt-0.5">No audio uploaded for this session</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Sermons Archive & Giving Hub Columns */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sermons Archive (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-black text-primary-950">Recent Teachings & Messages</h2>
            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search speaker, topic, or scripture..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="grid gap-3">
            {filteredSermons.map((s) => {
              const hasAudio = !!(s.audio_url && s.audio_url.trim() !== '');
              return (
                <Card
                  key={s.id}
                  onClick={() => setActiveSermon(s)}
                  className={`cursor-pointer p-4 transition-all hover:shadow-md ${
                    activeSermon?.id === s.id
                      ? 'border-2 border-primary-900 bg-primary-50/60 ring-1 ring-primary-900/10'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-gold-100 px-2 py-0.5 text-[10px] font-black text-gold-900">
                          {s.series}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">{s.date}</span>
                        {hasAudio ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <Headphones size={10} /> Audio Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            <FileText size={10} /> Notes Only
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-primary-950">{s.title}</h3>
                      <div className="text-xs text-slate-600">
                        {s.speaker} • <strong className="text-primary-900 font-semibold">{s.scripture}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* CONDITIONAL PLAY & DOWNLOAD BUTTONS */}
                      {hasAudio && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSermon(s);
                              togglePlay();
                            }}
                            className="grid h-9 w-9 place-items-center rounded-xl bg-primary-900 text-gold-400 shadow-sm hover:bg-primary-950 transition"
                            title="Play Audio"
                          >
                            <Play size={15} className="ml-0.5" />
                          </button>
                          <a
                            href={s.audio_url!}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-sm"
                            title="Download MP3"
                          >
                            <Download size={14} />
                          </a>
                        </>
                      )}

                      {canManageSermons && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(s);
                          }}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-primary-900 hover:bg-slate-50 transition shadow-sm"
                          title="Edit Sermon"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Giving & M-Pesa Portal (1 col) */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-primary-950">Giving & Stewardship</h2>

          <Card className="p-5 space-y-4 border-l-4 border-l-gold-500 bg-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-800">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-primary-950">M-Pesa Giving</h3>
                <p className="text-xs text-slate-500">"God loves a cheerful giver." (2 Cor 9:7)</p>
              </div>
            </div>

            {/* Official Constitution Banking Details */}
            <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2 text-xs border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">M-Pesa Paybill:</span>
                <span className="font-mono font-black text-primary-950 text-sm">247247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Account Number:</span>
                <span className="font-mono font-black text-primary-950 text-sm">TUMCU-GIVING</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Bank Name:</span>
                <span className="font-semibold text-slate-800">Equity Bank (Mombasa Main)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Account Name:</span>
                <span className="font-semibold text-slate-800 text-[11px]">Tech Univ of Mombasa Christian Union</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 leading-tight">
                * Constitutional Signatories: Chairperson, Treasurer, Secretary (Article 18).
              </div>
            </div>

            {givingSubmitted ? (
              <div className="rounded-2xl bg-emerald-50 p-4 text-center text-xs text-emerald-800 space-y-1 border border-emerald-200">
                <CheckCircle2 size={26} className="mx-auto text-emerald-600" />
                <div className="font-bold text-sm">Contribution Recorded!</div>
                <div className="text-[11px] text-emerald-700">
                  God bless you! Your M-Pesa contribution has been reflected in the Treasury register.
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecordGiving} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name / Title</label>
                  <Input
                    placeholder="e.g. Samuel Maina or Anonymous"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giving Purpose</label>
                  <select
                    value={givingCategory}
                    onChange={(e) => setGivingCategory(e.target.value as any)}
                    className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Tithe">Tithe (10%)</option>
                    <option value="Offering">Sunday Main Offering</option>
                    <option value="Missions">Annual Missions & Outreach Fund</option>
                    <option value="Welfare">Benevolence & Welfare Support</option>
                    <option value="Music">Instruments & Sound Development</option>
                    <option value="Building">Sanctuary & Assets Fund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (KES)</label>
                  <Input
                    type="number"
                    required
                    placeholder="e.g. 1000"
                    value={givingAmount}
                    onChange={(e) => setGivingAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">M-Pesa Transaction Code</label>
                  <Input
                    required
                    placeholder="e.g. QKH893J2KL"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                  />
                </div>

                <Button type="submit" className="w-full bg-primary-900 text-white font-bold py-2.5">
                  Submit Contribution Record
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>

      {/* M-PESA GIVING TRANSPARENCY REGISTER & DOWNLOAD SECTION */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
              <ShieldCheck size={14} /> Constitutional Treasury Transparency
            </div>
            <h2 className="mt-1 text-2xl font-black text-primary-950">M-Pesa Contributions Register</h2>
            <p className="text-xs text-slate-600">
              Total Recorded Collections: <strong className="text-emerald-700 font-black">KES {totalGivingKES.toLocaleString()}</strong> across {givingList.length} verified transactions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name, code, purpose..."
                value={givingSearch}
                onChange={(e) => setGivingSearch(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <Button
              variant="outline"
              onClick={downloadGivingReportCsv}
              className="gap-1.5 bg-white text-primary-900 font-bold border-primary-200 hover:bg-primary-50 shadow-sm"
            >
              <FileSpreadsheet size={15} /> Download Giving Report (CSV)
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border border-slate-200 bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Donor Name</th>
                  <th className="py-3 px-4">Category / Fund</th>
                  <th className="py-3 px-4">Amount (KES)</th>
                  <th className="py-3 px-4">M-Pesa Reference</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredGiving.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No matching giving records found.
                    </td>
                  </tr>
                ) : (
                  filteredGiving.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-primary-950">{g.donor_name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-md bg-gold-50 px-2 py-0.5 font-bold text-gold-900 border border-gold-200">
                          {g.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">KES {Number(g.amount).toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-primary-900">{g.mpesa_code}</td>
                      <td className="py-3 px-4 text-slate-500">{g.payment_method}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(g.created_at).toLocaleString('en-KE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ADMIN ADD / EDIT SERMON MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-primary-950">
                    {editingSermon ? 'Edit Sermon & Audio Details' : 'Add New Sermon to Vault'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Authorized for Super Admin, Chairperson, and Discipleship Committee Chair.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveSermon} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sermon Title *</label>
                  <Input
                    required
                    placeholder="e.g. Walking in Unwavering Faith on Campus"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Speaker / Preacher *</label>
                    <Input
                      required
                      placeholder="e.g. Rev. Dr. Peter Mwangangi"
                      value={formSpeaker}
                      onChange={(e) => setFormSpeaker(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date Preached</label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sermon Series / Theme</label>
                    <Input
                      placeholder="e.g. Unshakeable Kingdom"
                      value={formSeries}
                      onChange={(e) => setFormSeries(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Scripture Reading *</label>
                    <Input
                      required
                      placeholder="e.g. Hebrews 11:1-6, Proverbs 3:5"
                      value={formScripture}
                      onChange={(e) => setFormScripture(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Audio MP3 Direct URL / Audio Upload Link
                  </label>
                  <Input
                    placeholder="e.g. https://domain.com/sermons/sample-sermon.mp3 (Leave blank if notes only)"
                    value={formAudioUrl}
                    onChange={(e) => setFormAudioUrl(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    * If left empty, the Play button and Download MP3 button will automatically be hidden on the viewer page.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                    <Input
                      placeholder="e.g. 48:22 or Notes Only"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sermon Summary / Key Points</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the sermon and life application..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSaving} className="bg-primary-900 text-white font-bold">
                    {editingSermon ? 'Save Changes' : 'Publish Sermon'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
