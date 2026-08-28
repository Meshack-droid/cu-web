import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Church,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Layers,
  Sparkles,
  Users,
  AlertCircle,
  X,
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
  leader_name?: string;
  active_members_count?: number;
}

const DEFAULT_CONSTITUTIONAL_MINISTRIES: Ministry[] = [
  {
    id: 'min-pw',
    name: 'Praise & Worship Ministry',
    code: 'min_worship',
    category: 'worship',
    description: 'Leading the congregation in vibrant, Spirit-filled praise, worship, and vocal ministry.',
    meeting_day: 'Friday & Saturday',
    meeting_time: '4:30 PM - 7:00 PM',
    meeting_venue: 'Main Sanctuary',
    leader_name: 'Kelvin Mwangi',
    active_members_count: 42,
  },
  {
    id: 'min-intercessory',
    name: 'Intercessory & Prayer Ministry',
    code: 'min_prayer',
    category: 'prayer',
    description: 'Standing in the gap for the Christian Union, the university administration, the nation, and revival.',
    meeting_day: 'Daily & Wednesday Kesha',
    meeting_time: '6:00 AM - 7:00 AM / 9:00 PM',
    meeting_venue: 'Upper Prayer Room',
    leader_name: 'Grace Wambui',
    active_members_count: 38,
  },
  {
    id: 'min-media',
    name: 'Media, IT & Communications Ministry',
    code: 'min_media',
    category: 'media',
    description: 'Audio engineering, livestreaming, graphic design, social media ministry, and IT infrastructure.',
    meeting_day: 'Thursday',
    meeting_time: '5:00 PM - 6:30 PM',
    meeting_venue: 'Media Studio / AV Booth',
    leader_name: 'Samuel M. Maina',
    active_members_count: 24,
  },
  {
    id: 'min-discipleship',
    name: 'Discipleship & Bible Study Ministry',
    code: 'min_discipleship',
    category: 'discipleship',
    description: 'Nurturing believers in foundational Christian doctrines, BEST classes, and weekly Bible studies.',
    meeting_day: 'Tuesday',
    meeting_time: '5:00 PM - 6:30 PM',
    meeting_venue: 'LH 01 & LH 02',
    leader_name: 'David Kiprotich',
    active_members_count: 65,
  },
  {
    id: 'min-evangelism',
    name: 'Missions & Evangelism Ministry',
    code: 'min_evangelism',
    category: 'evangelism',
    description: 'Campus evangelism, door-to-door hospital outreach, annual mission trips, and street ministry.',
    meeting_day: 'Saturday & Sunday',
    meeting_time: '2:00 PM - 5:00 PM',
    meeting_venue: 'Assembly Point',
    leader_name: 'Faith Mutua',
    active_members_count: 50,
  },
  {
    id: 'min-creative',
    name: 'Creative Arts & Drama Ministry',
    code: 'min_creative',
    category: 'creative',
    description: 'Presenting the Gospel through spoken word, choreography, skits, and theatrical presentations.',
    meeting_day: 'Wednesday',
    meeting_time: '4:30 PM - 6:30 PM',
    meeting_venue: 'Amphitheatre',
    leader_name: 'Brian Omondi',
    active_members_count: 28,
  },
  {
    id: 'min-hospitality',
    name: 'Hospitality & Ushering Ministry',
    code: 'min_service',
    category: 'service',
    description: 'Warmly welcoming visitors, orderly sanctuary arrangement, and catering for fellowship events.',
    meeting_day: 'Saturday',
    meeting_time: '3:00 PM - 5:00 PM',
    meeting_venue: 'Main Sanctuary',
    leader_name: 'Joy Chebet',
    active_members_count: 35,
  },
  {
    id: 'min-instruments',
    name: 'Instrumentalists & Sound Ministry',
    code: 'min_instruments',
    category: 'worship',
    description: 'Keyboardists, guitarists, drummers, and live acoustic management.',
    meeting_day: 'Friday',
    meeting_time: '4:00 PM - 7:00 PM',
    meeting_venue: 'Sanctuary Stage',
    leader_name: 'Dennis Kimani',
    active_members_count: 18,
  },
  {
    id: 'min-highschool',
    name: 'High School & Outreach Ministry',
    code: 'min_highschool',
    category: 'evangelism',
    description: 'Ministering in secondary schools across the Coast region for mentorship and Sunday services.',
    meeting_day: 'Sunday Afternoon',
    meeting_time: '1:30 PM - 5:30 PM',
    meeting_venue: 'CU Boardroom',
    leader_name: 'Eunice Njeri',
    active_members_count: 30,
  },
  {
    id: 'min-welfare',
    name: 'Welfare & Benevolence Ministry',
    code: 'min_welfare',
    category: 'service',
    description: 'Student benevolence, hospital visitation, food drives, and emergency welfare support.',
    meeting_day: 'Monday',
    meeting_time: '5:00 PM - 6:00 PM',
    meeting_venue: 'CU Office',
    leader_name: 'Mercy Achieng',
    active_members_count: 22,
  },
  {
    id: 'min-brothers',
    name: "Brothers' Fellowship (Men of Valor)",
    code: 'min_brothers',
    category: 'fellowship',
    description: 'Mentorship, godly brotherhood, accountability, and spiritual leadership for male students.',
    meeting_day: 'Every 2nd Saturday',
    meeting_time: '7:00 AM - 9:30 AM',
    meeting_venue: 'Dining Hall Rooftop',
    leader_name: 'Peter Kioko',
    active_members_count: 85,
  },
  {
    id: 'min-sisters',
    name: "Sisters' Fellowship (Daughters of Zion)",
    code: 'min_sisters',
    category: 'fellowship',
    description: 'Virtuous womanhood, purity, spiritual empowerment, and peer counseling for female students.',
    meeting_day: 'Every 2nd Saturday',
    meeting_time: '7:00 AM - 9:30 AM',
    meeting_venue: 'Main Sanctuary',
    leader_name: 'Dorcas Akinyi',
    active_members_count: 110,
  },
];

export function AdminMinistriesPage() {
  const { user } = useAuthStore();
  const [ministries, setMinistries] = useState<Ministry[]>(DEFAULT_CONSTITUTIONAL_MINISTRIES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Edit / Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('worship');
  const [formDesc, setFormDesc] = useState('');
  const [formDay, setFormDay] = useState('Friday');
  const [formTime, setFormTime] = useState('4:30 PM - 7:00 PM');
  const [formVenue, setFormVenue] = useState('Main Sanctuary');
  const [submitting, setSubmitting] = useState(false);

  // Assign Leader modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetMinistry, setTargetMinistry] = useState<Ministry | null>(null);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([
    {
      id: 'usr-101',
      full_name: 'John K. Mwangi',
      email: 'john.mwangi@students.tum.ac.ke',
      admission_number: 'BENG/2023/044',
      year_of_study: 'Year 3',
      spiritual_standing: 'Active Full Member (Baptized)',
      is_eligible: true,
    },
    {
      id: 'usr-102',
      full_name: 'Esther Nekesa',
      email: 'esther.nekesa@students.tum.ac.ke',
      admission_number: 'CIT/2022/105',
      year_of_study: 'Year 4',
      spiritual_standing: 'Active Full Member (Baptized)',
      is_eligible: true,
    },
    {
      id: 'usr-103',
      full_name: 'Michael Otieno',
      email: 'michael.otieno@students.tum.ac.ke',
      admission_number: 'CIT/2025/012',
      year_of_study: 'Year 1',
      spiritual_standing: 'Probation / New Member',
      is_eligible: false,
      ineligibility_reason: 'Article 14.3 requires minimum Year 2 for Leadership',
    },
  ]);
  const [submittingLeader, setSubmittingLeader] = useState(false);

  useEffect(() => {
    fetchMinistries();
  }, []);

  async function fetchMinistries() {
    try {
      setLoading(true);
      const res = await api.get<any>('/ministries');
      if (res.data?.data && res.data.data.length > 0) {
        setMinistries(res.data.data);
      }
    } catch (err) {
      console.warn('Using default constitutional ministries list', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingMinistry(null);
    setFormName('');
    setFormCode('');
    setFormCategory('worship');
    setFormDesc('');
    setFormDay('Friday');
    setFormTime('4:30 PM - 7:00 PM');
    setFormVenue('Main Sanctuary');
    setIsModalOpen(true);
  }

  function handleOpenEdit(m: Ministry) {
    setEditingMinistry(m);
    setFormName(m.name);
    setFormCode(m.code);
    setFormCategory(m.category);
    setFormDesc(m.description || '');
    setFormDay(m.meeting_day || 'Friday');
    setFormTime(m.meeting_time || '4:30 PM - 7:00 PM');
    setFormVenue(m.meeting_venue || 'Main Sanctuary');
    setIsModalOpen(true);
  }

  async function handleSaveMinistry(e: React.FormEvent) {
    e.preventDefault();
    if (!formName) return;
    setSubmitting(true);
    try {
      if (editingMinistry) {
        setMinistries((prev) =>
          prev.map((item) =>
            item.id === editingMinistry.id
              ? {
                  ...item,
                  name: formName,
                  category: formCategory,
                  description: formDesc,
                  meeting_day: formDay,
                  meeting_time: formTime,
                  meeting_venue: formVenue,
                }
              : item
          )
        );
      } else {
        const newMin: Ministry = {
          id: `min-${Date.now()}`,
          name: formName,
          code: formCode || formName.toLowerCase().replace(/\s+/g, '_'),
          category: formCategory,
          description: formDesc,
          meeting_day: formDay,
          meeting_time: formTime,
          meeting_venue: formVenue,
          active_members_count: 1,
        };
        setMinistries((prev) => [...prev, newMin]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save ministry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignLeader(member: any) {
    if (!targetMinistry) return;
    if (!member.is_eligible) {
      alert(`Constitutional Ineligibility: ${member.ineligibility_reason}`);
      return;
    }
    setSubmittingLeader(true);
    try {
      setMinistries((prev) =>
        prev.map((m) =>
          m.id === targetMinistry.id ? { ...m, leader_name: member.full_name, leader_id: member.id } : m
        )
      );
      setIsAssignModalOpen(false);
    } catch (err) {
      alert('Failed to assign leader');
    } finally {
      setSubmittingLeader(false);
    }
  }

  const filtered = ministries.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.leader_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="mesh-hero-bg overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold-100 px-3 py-1 text-xs font-black text-gold-900 border border-gold-300">
              <Church size={14} /> TUMCU Constitution Article 16.1
            </div>
            <h1 className="mt-2 text-3xl font-black text-primary-950 sm:text-4xl">
              Constitutional Ministries Hub
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage the 10 constitutional ministries and fellowships, verify leader qualifications under Article 14.3, and organize schedules.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleOpenCreate}
            className="gap-1.5 bg-primary-900 text-white font-bold shadow-lg"
          >
            <Plus size={16} /> Add Ministry / Fellowship
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md w-full">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search ministry name, leader, or calling..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:outline-none"
          />
        </div>
        <span className="text-xs font-bold text-slate-500">{filtered.length} Active Ministries</span>
      </div>

      {/* Ministries Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <Card key={m.id} className="p-5 border border-slate-200 bg-white shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-gold-950 border border-gold-300">
                  {m.category}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-1 rounded-lg text-slate-400 hover:text-primary-900 hover:bg-slate-50"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-primary-950">{m.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              {/* Meeting Schedule */}
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary-800 shrink-0" />
                  <span>{m.meeting_day} ({m.meeting_time})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary-800 shrink-0" />
                  <span>{m.meeting_venue}</span>
                </div>
              </div>

              {/* Leader & Assignment */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Ministry Leader</div>
                  <div className="text-xs font-black text-primary-950">
                    {m.leader_name || <span className="text-amber-600 font-normal">Unassigned</span>}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTargetMinistry(m);
                    setIsAssignModalOpen(true);
                  }}
                  className="text-[11px] font-bold border-primary-200 text-primary-900 hover:bg-primary-50 py-1 px-2.5 h-auto"
                >
                  <UserCheck size={12} className="mr-1" /> Assign / Vet
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit / Create Ministry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-black text-primary-950">
                    {editingMinistry ? 'Edit Ministry Details' : 'Add Constitutional Ministry'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure TUMCU ministry details and schedule</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveMinistry} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ministry Name *</label>
                  <Input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Praise & Worship Ministry"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800"
                    >
                      <option value="worship">Worship & Music</option>
                      <option value="prayer">Intercessory & Prayer</option>
                      <option value="media">Media & IT</option>
                      <option value="discipleship">Discipleship & Nurture</option>
                      <option value="evangelism">Missions & Outreach</option>
                      <option value="creative">Creative & Drama</option>
                      <option value="service">Hospitality & Catering</option>
                      <option value="fellowship">Fellowship & Mentorship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Identifier Code</label>
                    <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="min_code" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mission & Purpose</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Ministry description and spiritual objectives..."
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Day</label>
                    <Input value={formDay} onChange={(e) => setFormDay(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                    <Input value={formTime} onChange={(e) => setFormTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Venue</label>
                    <Input value={formVenue} onChange={(e) => setFormVenue(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary-900 text-white font-bold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Leader Modal with Eligibility Checking */}
      <AnimatePresence>
        {isAssignModalOpen && targetMinistry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-black text-primary-950">
                    Assign Leader: {targetMinistry.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Constitutional vetting & eligibility validation (Article 14.3)
                  </p>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>

              {/* Constitutional Check Info Box */}
              <div className="rounded-2xl bg-gold-50 p-3 text-xs text-gold-950 border border-gold-200">
                <div className="font-black flex items-center gap-1 mb-1">
                  <Shield size={13} /> Article 14.3 Qualification Criteria:
                </div>
                <p>• Must be at least in Year 2 of undergraduate/diploma study.</p>
                <p>• Must be an active, baptized Full Member with exemplary Christian conduct.</p>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700">Eligible Member Candidates:</div>
                {searchResults.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-2xl p-3.5 border transition flex items-center justify-between gap-3 ${
                      m.is_eligible
                        ? 'bg-slate-50 border-slate-200 hover:border-primary-900'
                        : 'bg-red-50/50 border-red-200 opacity-80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-primary-950">{m.full_name}</span>
                        <span className="font-mono text-[10px] text-slate-500">({m.admission_number})</span>
                        {m.is_eligible ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                            Eligible
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-800">
                            Ineligible
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {m.year_of_study} • {m.spiritual_standing}
                      </div>
                      {!m.is_eligible && (
                        <div className="text-[10px] text-red-700 font-semibold">{m.ineligibility_reason}</div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      disabled={!m.is_eligible || submittingLeader}
                      onClick={() => handleAssignLeader(m)}
                      className="text-xs bg-primary-900 text-white font-bold shrink-0"
                    >
                      Assign as Leader
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
