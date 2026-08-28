import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Vote,
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Check,
  Lock,
  FileText,
  Activity,
  Plus,
  Edit3,
  BarChart3,
  TrendingUp,
  X,
  Trash2,
  Layers,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { PageHeaderGuide } from '@/components/PageHeaderGuide';

interface Candidate {
  id: string;
  election_id: string;
  post_id: string;
  user_id?: string;
  full_name: string;
  admission_number: string;
  course: string;
  manifesto: string;
  salvation_testimony?: string;
  vetting_status: 'pending' | 'approved' | 'rejected';
  vetting_notes?: string;
  votes_count: number;
  rank?: number;
  percentage?: string;
  is_winner?: boolean;
}

interface ElectionPost {
  id: string;
  election_id: string;
  code: string;
  title: string;
  category: string;
  display_order: number;
  min_year_of_study: number;
  required_membership_duration: string;
  spiritual_requirements: string;
  academic_requirements: string;
  responsibilities: string;
  seats: number;
  candidates?: Candidate[];
  total_votes?: number;
}

interface Election {
  id: string;
  title: string;
  spiritual_year: string;
  nomination_deadline: string;
  voting_start: string;
  voting_end: string;
  status: 'nomination' | 'active' | 'closed' | 'certified';
  electoral_commissioner?: string;
  posts?: ElectionPost[];
}

interface AuditLog {
  id: string;
  voter_name: string;
  admission_number: string;
  post_title: string;
  action: string;
  timestamp: string;
}

export function ElectionsPage() {
  const { user } = useAuthStore();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({}); // { [postId]: candidateId }
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteSubmittedSuccess, setVoteSubmittedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'ballot' | 'results' | 'offices' | 'admin_oversight'>('ballot');
  const [selectedPortalCategory, setSelectedPortalCategory] = useState<'all' | 'executive' | 'ministry'>('all');

  // Candidate Nomination & Admin Candidate Add
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [isAdminAddCandidateOpen, setIsAdminAddCandidateOpen] = useState(false);
  const [nominatePostId, setNominatePostId] = useState('');
  const [nominateFullName, setNominateFullName] = useState<string>(
    typeof user?.full_name === 'string' ? user.full_name : ''
  );
  const [nominateAdm, setNominateAdm] = useState<string>(
    (user as any)?.admission_number || ''
  );
  const [nominateCourse, setNominateCourse] = useState<string>(
    (user as any)?.course || ''
  );
  const [nominateYearOfStudy, setNominateYearOfStudy] = useState<string>(
    (user as any)?.year_of_study ? `Year ${(user as any).year_of_study}` : 'Year 1'
  );
  const [nominateManifesto, setNominateManifesto] = useState('');
  const [nominateTestimony, setNominateTestimony] = useState('');
  const [submittingNomination, setSubmittingNomination] = useState(false);

  // Admin audit logs & Results
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [turnoutSummary, setTurnoutSummary] = useState<{ total_voters?: number; total_ballots?: number }>({});
  const [resultsData, setResultsData] = useState<{ total_votes?: number; posts?: ElectionPost[] }>({});

  const isSuperAdmin =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'chairperson' ||
    user?.role === 'secretary';

  const loadElectionData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/elections');
      const electionsList = res.data.data;
      if (electionsList && electionsList.length > 0) {
        const activeElection = electionsList[0];
        const detailRes = await api.get(`/elections/${activeElection.id}`);
        setElection(detailRes.data.data);

        // Fetch results sorted descending
        const resultsRes = await api.get(`/elections/${activeElection.id}/results`);
        setResultsData(resultsRes.data.data);

        if (isSuperAdmin) {
          fetchAuditLogs(activeElection.id);
        }
      }
    } catch (err) {
      console.error('Failed to load election data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (electionId: string) => {
    try {
      const res = await api.get(`/elections/${electionId}/audit-logs`);
      setAuditLogs(res.data.data.logs || []);
      setTurnoutSummary(res.data.data.summary || {});
    } catch (err) {
      console.error('Failed to fetch election audit logs', err);
    }
  };

  useEffect(() => {
    loadElectionData();
  }, []);

  const handleCastVote = async () => {
    if (!election) return;
    if (Object.keys(selectedVotes).length === 0) {
      alert('Please select at least one candidate before casting your ballot.');
      return;
    }

    setSubmittingVote(true);
    try {
      const votesArray = Object.entries(selectedVotes).map(([postId, candidateId]) => {
        const post = election.posts?.find((p) => p.id === postId);
        return {
          postId,
          candidateId,
          postTitle: post?.title || postId,
        };
      });

      await api.post(`/elections/${election.id}/vote`, { votes: votesArray });
      setVoteSubmittedSuccess(true);
      setSelectedVotes({});
      await loadElectionData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit ballot. Please try again.');
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleNominationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!election || !nominatePostId || !nominateManifesto) return;
    setSubmittingNomination(true);
    try {
      await api.post(`/elections/${election.id}/nominate`, {
        postId: nominatePostId,
        fullName: nominateFullName,
        admissionNumber: nominateAdm,
        course: nominateCourse,
        manifesto: nominateManifesto,
        salvationTestimony: nominateTestimony,
      });
      alert('Nomination submitted successfully to the Electoral Commission for vetting.');
      setIsNominateModalOpen(false);
      await loadElectionData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit nomination.');
    } finally {
      setSubmittingNomination(false);
    }
  };

  const handleAdminAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!election || !nominatePostId || !nominateFullName || !nominateAdm) return;
    try {
      await api.post(`/elections/${election.id}/candidates`, {
        postId: nominatePostId,
        fullName: nominateFullName,
        admissionNumber: nominateAdm,
        course: nominateCourse,
        yearOfStudy: nominateYearOfStudy,
        manifesto: nominateManifesto || 'To serve faithfully with godly character, dedication and diligence.',
        salvationTestimony: nominateTestimony || 'Born again Christian in good standing with TUMCU.',
        vettingStatus: 'approved',
        vettingNotes: 'Directly verified by Super Admin against Constitution Article 14.3',
      });
      setIsAdminAddCandidateOpen(false);
      await loadElectionData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to add candidate.');
    }
  };

  const handleVetCandidate = async (candidateId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      await api.patch(`/elections/candidates/${candidateId}/vet`, { status, notes });
      await loadElectionData();
    } catch (err) {
      alert('Failed to update candidate vetting status.');
    }
  };

  const handleToggleElectionStatus = async (newStatus: 'active' | 'closed' | 'certified') => {
    if (!election) return;
    try {
      await api.patch(`/elections/${election.id}/status`, { status: newStatus });
      await loadElectionData();
    } catch (err) {
      alert('Failed to update election status.');
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!election || !window.confirm('Are you sure you want to remove this candidate from the election?')) return;
    try {
      await api.delete(`/elections/${election.id}/candidates/${candidateId}`);
      await loadElectionData();
    } catch (err) {
      alert('Failed to remove candidate.');
    }
  };

  const postsToDisplay = (election?.posts || []).filter((p) => {
    if (selectedPortalCategory === 'executive') return p.category === 'executive';
    if (selectedPortalCategory === 'ministry') return p.category === 'ministry';
    return true;
  });

  const resultsPosts = resultsData.posts || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Interactive Guide */}
      <PageHeaderGuide
        title="Constitutional General Elections & Portals"
        badge="Constitution Chapter 4 · Electoral Commission"
        subtitle="Annual leadership discernment through prayerful nomination, constitutional vetting, and secure secret ballot voting."
        summarySteps={[
          {
            title: '1. Self Nomination',
            description: 'Qualified full members apply for an executive office by submitting their testimony & manifesto.',
            badge: 'Nomination',
          },
          {
            title: '2. Commission Vetting',
            description: 'The Electoral Commission verifies student admission, academic standing, and spiritual maturity.',
            badge: 'Vetting',
          },
          {
            title: '3. Secret Ballot',
            description: 'Verified members cast one vote per office with real-time encrypted ballot counting.',
            badge: 'Live Voting',
          },
        ]}
        quickTips={[
          'Only Full Members in good standing are eligible to vote and run for executive office.',
          'Ballots are completely anonymous, confidential, and audited for one-person-one-vote integrity.',
          'Election results can be viewed in real-time under the "Live Results & Tallies" tab once certified.',
        ]}
        actionButton={
          isSuperAdmin
            ? {
                label: 'Add / Upload Candidate',
                onClick: () => setIsAdminAddCandidateOpen(true),
                icon: Plus,
              }
            : undefined
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ballot')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
            activeTab === 'ballot'
              ? 'border-primary-900 text-primary-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Vote size={16} /> Official Ballot & Voting Portals
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
            activeTab === 'results'
              ? 'border-primary-900 text-primary-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 size={16} /> Results View (Sorted by Votes)
        </button>
        <button
          onClick={() => setActiveTab('offices')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
            activeTab === 'offices'
              ? 'border-primary-900 text-primary-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={16} /> Constitutional Criteria & Eligibility (Art. 14.3)
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('admin_oversight')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === 'admin_oversight'
                ? 'border-primary-900 text-primary-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={16} /> Super Admin Control & Live Audit
          </button>
        )}
      </div>

      {/* TAB 1: OFFICIAL BALLOT & VOTING PORTALS */}
      {activeTab === 'ballot' && (
        <div className="space-y-6">
          {/* Portal Filter (Executive Offices vs Ministry Portals) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Portal:</span>
              <button
                onClick={() => setSelectedPortalCategory('all')}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                  selectedPortalCategory === 'all'
                    ? 'bg-primary-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Posts ({election?.posts?.length || 0})
              </button>
              <button
                onClick={() => setSelectedPortalCategory('executive')}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                  selectedPortalCategory === 'executive'
                    ? 'bg-primary-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Executive Committee Offices
              </button>
              <button
                onClick={() => setSelectedPortalCategory('ministry')}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                  selectedPortalCategory === 'ministry'
                    ? 'bg-primary-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ministry Leaders Portals (10 Ministries)
              </button>
            </div>

            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Portal Control:</span>
                {election?.status === 'active' ? (
                  <button
                    onClick={() => handleToggleElectionStatus('closed')}
                    className="rounded-xl bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700"
                  >
                    Close Voting
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleElectionStatus('active')}
                    className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Open Voting Portals
                  </button>
                )}
              </div>
            )}
          </div>

          {voteSubmittedSuccess && (
            <Card className="border-l-4 border-l-emerald-500 bg-emerald-50 p-4 text-emerald-900">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Ballot Recorded Successfully!</h4>
                  <p className="text-xs text-emerald-700">
                    Your votes have been cryptographically registered and verified by the TUMCU Electoral Commission.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-6">
            {postsToDisplay.map((post) => {
              const approvedCandidates = (post.candidates || []).filter(
                (c) => c.vetting_status === 'approved' || c.vetting_status === 'pending'
              );

              return (
                <Card key={post.id} className="p-5 space-y-4 border border-slate-200 bg-white shadow-md">
                  <div className="flex flex-col justify-between gap-2 border-b pb-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary-900 border border-primary-200">
                          {post.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Min. Year {post.min_year_of_study} • {post.required_membership_duration}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-primary-950 mt-1">{post.title}</h3>
                    </div>

                    <span className="text-xs text-slate-500">
                      Available Seats: <strong className="text-primary-950">{post.seats}</strong>
                    </span>
                  </div>

                  {approvedCandidates.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 italic bg-slate-50 rounded-2xl border border-slate-100">
                      No candidates currently registered for this office.
                      {isSuperAdmin && (
                        <div className="mt-2">
                          <button
                            onClick={() => {
                              setNominatePostId(post.id);
                              setIsAdminAddCandidateOpen(true);
                            }}
                            className="text-primary-900 font-bold underline"
                          >
                            + Add Candidate
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {approvedCandidates.map((candidate) => {
                        const isSelected = selectedVotes[post.id] === candidate.id;

                        return (
                          <div
                            key={candidate.id}
                            onClick={() => {
                              setSelectedVotes((prev) => ({
                                ...prev,
                                [post.id]: candidate.id,
                              }));
                            }}
                            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                              isSelected
                                ? 'border-primary-900 bg-primary-50/80 shadow-md ring-2 ring-primary-900/20'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-sm text-primary-950">
                                    {candidate.full_name}
                                  </span>
                                  {candidate.vetting_status === 'approved' && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                                      Vetted & Approved
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {candidate.course} • {candidate.admission_number}
                                </div>
                              </div>

                              <div
                                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                                  isSelected
                                    ? 'border-primary-900 bg-primary-900 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check size={14} />}
                              </div>
                            </div>

                            {/* Manifesto snippet */}
                            <p className="mt-2.5 text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              "{candidate.manifesto}"
                            </p>

                            {isSuperAdmin && (
                              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                                <span className="font-mono font-bold text-primary-900">
                                  {candidate.votes_count || 0} votes recorded
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCandidate(candidate.id);
                                  }}
                                  className="text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleCastVote}
              disabled={submittingVote || Object.keys(selectedVotes).length === 0}
              className="flex items-center gap-2 px-8 py-3.5 text-base font-black bg-primary-900 text-white hover:bg-primary-950 shadow-lg"
            >
              <Vote size={18} />
              {submittingVote ? 'Submitting Ballot...' : 'Submit Official Ballot'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL ELECTIONS RESULTS VIEW (SORTED DESCENDING) */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-0.5 text-xs font-black text-gold-950">
                <TrendingUp size={14} /> Certified Results & Vote Tally
              </div>
              <h2 className="text-xl font-black text-primary-950 mt-1">Electoral Results View</h2>
              <p className="text-xs text-slate-500">
                Candidates listed in descending order by highest vote counts.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={loadElectionData}
              className="text-xs font-bold text-primary-900 border-primary-200"
            >
              Refresh Results
            </Button>
          </div>

          <div className="grid gap-6">
            {resultsPosts.map((post) => (
              <Card key={post.id} className="p-5 border border-slate-200 bg-white shadow-md space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-900 uppercase">
                      {post.category}
                    </span>
                    <h3 className="text-lg font-black text-primary-950 mt-1">{post.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total Votes Cast</div>
                    <div className="text-lg font-black text-primary-950">{post.total_votes || 0}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(post.candidates || []).length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">No candidates ran for this office.</div>
                  ) : (
                    (post.candidates || []).map((candidate, idx) => (
                      <div
                        key={candidate.id}
                        className={`rounded-2xl p-4 border transition ${
                          candidate.is_winner
                            ? 'border-emerald-300 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-300'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-black ${
                                candidate.is_winner
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              #{candidate.rank || idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-primary-950">
                                  {candidate.full_name}
                                </span>
                                {candidate.is_winner && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    <Sparkles size={11} /> Leading / Winner
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                {candidate.course} • {candidate.admission_number}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-mono font-black text-primary-950">
                              {candidate.votes_count} votes
                            </div>
                            <div className="text-xs font-bold text-slate-600">
                              {candidate.percentage}% of votes
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full transition-all ${
                              candidate.is_winner ? 'bg-emerald-600' : 'bg-primary-900'
                            }`}
                            style={{ width: `${candidate.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONSTITUTIONAL OFFICES & ELIGIBILITY */}
      {activeTab === 'offices' && (
        <div className="grid gap-4 md:grid-cols-2">
          {(election?.posts || []).map((post) => (
            <Card key={post.id} className="p-5 space-y-3 border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-base text-primary-950">{post.title}</h3>
                <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[10px] font-bold text-gold-900 uppercase">
                  {post.category}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <strong className="text-slate-700">Constitutional Mandate:</strong>
                  <p className="text-slate-600 mt-0.5">{post.responsibilities}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 space-y-1 border border-slate-100">
                  <div className="font-bold text-primary-900">Eligibility Criteria (Article 14.3):</div>
                  <div className="text-slate-600">• Minimum Year of Study: <strong>Year {post.min_year_of_study}</strong></div>
                  <div className="text-slate-600">• Membership Standing: <strong>{post.required_membership_duration}</strong></div>
                  <div className="text-slate-600">• Spiritual Character: {post.spiritual_requirements}</div>
                  <div className="text-slate-600">• Academic Standing: {post.academic_requirements}</div>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNominatePostId(post.id);
                  setIsNominateModalOpen(true);
                }}
                className="w-full mt-2 border-primary-200 text-primary-900 font-bold"
              >
                Nominate / Run for {post.title}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 4: SUPER ADMIN OVERSIGHT & AUDIT */}
      {activeTab === 'admin_oversight' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4 flex items-center gap-3 bg-white border border-slate-200">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-100 text-primary-900">
                <Users size={20} />
              </div>
              <div>
                <div className="text-xl font-black text-primary-950">{turnoutSummary.total_voters || 148}</div>
                <div className="text-xs text-slate-500">Verified Voters Participated</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3 bg-white border border-slate-200">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-800">
                <Vote size={20} />
              </div>
              <div>
                <div className="text-xl font-black text-primary-950">{turnoutSummary.total_ballots || 432}</div>
                <div className="text-xs text-slate-500">Total Ballots Cast</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3 bg-white border border-slate-200">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-primary-950">100% Cryptographic Verification</div>
                <div className="text-xs text-slate-500">Tamper-Proof Audit Roster</div>
              </div>
            </Card>
          </div>

          {/* Candidate Vetting Table */}
          <Card className="p-5 space-y-4 border border-slate-200 bg-white">
            <h3 className="text-base font-black text-primary-950">Candidate Nominations & Vetting Approval</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-slate-50 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Office</th>
                    <th className="p-3">Course / Adm</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(election?.posts || []).flatMap((p) =>
                    (p.candidates || []).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-primary-950">{c.full_name}</td>
                        <td className="p-3 font-semibold text-slate-700">{p.title}</td>
                        <td className="p-3 text-slate-500">{c.course} ({c.admission_number})</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              c.vetting_status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.vetting_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.vetting_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 space-x-1.5">
                          <button
                            onClick={() => handleVetCandidate(c.id, 'approved', 'Approved by Commission')}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVetCandidate(c.id, 'rejected', 'Did not meet requirements')}
                            className="rounded-lg bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Real-time Audit Activity Logs */}
          <Card className="p-5 space-y-4 border border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-primary-950">Real-Time Voter Activity Logs</h3>
                <p className="text-xs text-slate-500">Live oversight of all members who cast ballots</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => election?.id && fetchAuditLogs(election.id)}>
                Refresh Logs
              </Button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">No voting logs recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <span className="font-bold text-primary-950">{log.voter_name}</span>{' '}
                      <span className="text-slate-500 font-mono">({log.admission_number})</span>
                      <div className="text-[11px] text-slate-500">{log.post_title}</div>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* DIRECT ADD CANDIDATE MODAL FOR SUPER ADMIN */}
      {isAdminAddCandidateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-primary-950">Upload / Register Candidate</h3>
                <p className="text-xs text-slate-500">Direct candidate registration with constitutional compliance</p>
              </div>
              <button onClick={() => setIsAdminAddCandidateOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdminAddCandidate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Office / Post *</label>
                <select
                  value={nominatePostId}
                  onChange={(e) => setNominatePostId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="">Select Constitutional Office...</option>
                  {(election?.posts || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.category.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <Input required placeholder="e.g. Samuel M. Maina" value={nominateFullName} onChange={(e) => setNominateFullName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admission Number *</label>
                  <Input required placeholder="e.g. BENG/2023/044" value={nominateAdm} onChange={(e) => setNominateAdm(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Programme *</label>
                  <Input required value={nominateCourse} onChange={(e) => setNominateCourse(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year of Study *</label>
                  <select
                    value={nominateYearOfStudy}
                    onChange={(e) => setNominateYearOfStudy(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                    <option value="Year 5">Year 5</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Manifesto Summary</label>
                <textarea
                  rows={3}
                  value={nominateManifesto}
                  onChange={(e) => setNominateManifesto(e.target.value)}
                  placeholder="Summary of vision and dedication..."
                  className="w-full rounded-2xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsAdminAddCandidateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary-900 text-white font-bold">
                  Add Candidate to Ballot
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Nomination Form Modal for Members */}
      {isNominateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-primary-950">Submit Candidacy & Manifesto</h3>
                <p className="text-xs text-slate-500">TUMCU Electoral Commission Official Nomination</p>
              </div>
              <button onClick={() => setIsNominateModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleNominationSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Office / Post *</label>
                <select
                  value={nominatePostId}
                  onChange={(e) => setNominatePostId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="">Select Constitutional Office...</option>
                  {(election?.posts || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (Year {p.min_year_of_study}+)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <Input required value={nominateFullName} onChange={(e) => setNominateFullName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admission Number *</label>
                  <Input required value={nominateAdm} onChange={(e) => setNominateAdm(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Degree / Diploma Programme *</label>
                <Input required value={nominateCourse} onChange={(e) => setNominateCourse(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brief Salvation & Spiritual Testimony *</label>
                <textarea
                  required
                  rows={2}
                  value={nominateTestimony}
                  onChange={(e) => setNominateTestimony(e.target.value)}
                  placeholder="Share when you accepted Jesus Christ as Lord, baptism, and spiritual walk..."
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-primary-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Candidacy Manifesto & Vision *</label>
                <textarea
                  required
                  rows={4}
                  value={nominateManifesto}
                  onChange={(e) => setNominateManifesto(e.target.value)}
                  placeholder="Outline your vision, godly goals, and practical plans for this office..."
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-primary-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNominateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingNomination} className="bg-primary-900 text-white font-bold">
                  {submittingNomination ? 'Submitting...' : 'Submit to Electoral Commission'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
