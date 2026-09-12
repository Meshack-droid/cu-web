import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowLeft, CalendarDays, CheckCircle2, Church, Clock3, LogIn, Users, UserPlus, UserMinus, Sparkles, Home } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { fetchMyMembershipStatus } from '@/features/membership/membership.api';
import {
  fetchMinistryDetails,
  fetchMyMinistryMembership,
  getMinistryBackground,
  joinMinistry,
  leaveMinistry,
} from '@/features/ministries/ministries.api';

const FALLBACK: Record<string, { focus: string; blurb: string }> = {
  intercessory: { focus: 'Prayer & spiritual growth', blurb: 'A place to pray, intercede and strengthen the spiritual life of the Union.' },
  worship: { focus: 'Praise & worship', blurb: 'Serving through music and creating spaces for people to encounter God.' },
  instrumentalists: { focus: 'Music & instruments', blurb: 'Skillfully ministering with musical instruments to support worship services.' },
  ushering: { focus: 'Hospitality & welcome', blurb: 'Welcoming members and visitors, helping people connect and keeping gatherings orderly.' },
  catering: { focus: 'Hospitality & care', blurb: 'Serving through hospitality at fellowships, conferences, retreats and special gatherings.' },
  media: { focus: 'Media & storytelling', blurb: 'Telling the TUMCU story through photography, video, design, livestream and digital communication.' },
  creative: { focus: 'Arts & creativity', blurb: 'Using design, drama and creative arts to communicate the Gospel in fresh ways.' },
  technicians: { focus: 'Technology & production', blurb: 'Keeping sound, lighting and technical systems ready for every service.' },
  high_school: { focus: 'Mentorship & outreach', blurb: 'Reaching high school students through discipleship, mentorship and Christ-centred community.' },
  hospital: { focus: 'Compassion & outreach', blurb: 'Visiting and ministering to patients, bringing prayer, compassion, comfort and the Gospel.' },
  brothers: { focus: 'Brotherhood & growth', blurb: 'Building Christ-centred brotherhood through fellowship, mentorship and accountability.' },
  sisters: { focus: 'Sisterhood & growth', blurb: 'Building a caring sisterhood through fellowship, mentorship, prayer and practical support.' },
};

export function MinistryDetailsPage() {
  const { id = '' } = useParams();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['ministry', id], queryFn: () => fetchMinistryDetails(id), enabled: !!id });
  const { data: membership } = useQuery({
    queryKey: ['membership', 'me'], queryFn: fetchMyMembershipStatus,
    enabled: isAuthenticated,
  });

  const resolvedMinistryId = data?.ministry?.id || id;

  // Listen for admin background updates to update this view immediately
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['ministry', id] });
    };
    window.addEventListener('tumcu_ministry_image_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tumcu_ministry_image_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [queryClient, id]);

  const { data: ministryMembership } = useQuery({
    queryKey: ['ministry-membership', resolvedMinistryId],
    queryFn: () => fetchMyMinistryMembership(resolvedMinistryId),
    enabled: isAuthenticated && !!resolvedMinistryId,
  });

  const activeMember = useMemo(() => membership?.memberships.some((m) => m.status === 'active') ?? false, [membership]);

  const joinMutation = useMutation({
    mutationFn: () => joinMinistry(resolvedMinistryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministry-membership', resolvedMinistryId] });
      queryClient.invalidateQueries({ queryKey: ['ministry-membership', id] });
      queryClient.invalidateQueries({ queryKey: ['ministry', id] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveMinistry(resolvedMinistryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministry-membership', resolvedMinistryId] });
      queryClient.invalidateQueries({ queryKey: ['ministry-membership', id] });
      queryClient.invalidateQueries({ queryKey: ['ministry', id] });
    },
  });

  if (isLoading) return <div className="page-shell section-pad"><Card variant="glass" className="animate-pulse"><div className="h-10 w-2/3 rounded bg-slate-200"/><div className="mt-4 h-5 w-full rounded bg-slate-100"/><div className="mt-2 h-5 w-5/6 rounded bg-slate-100"/></Card></div>;
  if (isError || !data) return <div className="page-shell section-pad"><Card variant="glass" className="text-center"><Church className="mx-auto text-slate-300"/><h1 className="mt-3 text-xl font-black text-primary-950">Ministry unavailable</h1><p className="mt-2 text-sm text-slate-500">We could not load this ministry. Please try again.</p><Link to="/ministries" className="mt-5 inline-flex text-sm font-bold text-primary-700">Back to ministries</Link></Card></div>;

  const { ministry, stats, trainings } = data;
  const fallback = FALLBACK[ministry.code] ?? { focus: 'Service & community', blurb: 'A place to serve, connect and grow in Christ-centred community.' };
  const isLeader = ministryMembership?.position === 'leader' || ministryMembership?.position === 'deputy_leader';
  const bgImage = ministry.image_url || getMinistryBackground(ministry);

  const connectionContent = !isAuthenticated ? (
    <>
      <p className="mt-3 text-sm leading-6 text-slate-600">Sign in as an admitted member to connect with this ministry.</p>
      <Link to="/login" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-900 px-4 py-3 text-sm font-bold text-white"><LogIn size={16}/> Sign in</Link>
    </>
  ) : !activeMember ? (
    <div className="mt-4 rounded-2xl bg-amber-50/80 p-4"><p className="font-bold text-primary-900">Membership approval required</p><p className="mt-1 text-xs leading-5 text-slate-500">Your account must be an active admitted member before you can join a ministry.</p></div>
  ) : ministryMembership ? (
    <>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary-50/80 p-4"><CheckCircle2 className="text-primary-700"/><div><p className="font-black text-primary-950">You are connected</p><p className="text-xs capitalize text-slate-500">{ministryMembership.position.replace('_', ' ')}</p></div></div>
      {!isLeader && <Button variant="ghost" className="mt-4 w-full text-red-600" loading={leaveMutation.isPending} onClick={() => leaveMutation.mutate()}><UserMinus size={16}/> Leave ministry</Button>}
    </>
  ) : (
    <>
      <p className="mt-3 text-sm leading-6 text-slate-600">You are an admitted member. Connect with this ministry to receive its opportunities and take part in its activities.</p>
      <Button className="mt-5 w-full" loading={joinMutation.isPending} onClick={() => joinMutation.mutate()}><UserPlus size={16}/> Join this ministry</Button>
    </>
  );

  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
    <section className="relative overflow-hidden px-5 pb-16 pt-8 sm:px-6 lg:pb-20 lg:pt-12 bg-slate-950 text-white">
      {/* Dynamic Ministry Background with overlay */}
      <img
        src={bgImage}
        alt={ministry.name}
        className="absolute inset-0 h-full w-full object-cover opacity-35 object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/90" />

      <div className="page-shell relative z-10">
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-300">
          <Link to="/" className="inline-flex items-center gap-1.5 hover:text-white transition"><Home size={15}/> Home</Link>
          <span className="text-slate-600 font-normal">/</span>
          <Link to="/ministries" className="inline-flex items-center gap-1 hover:text-white transition">All ministries</Link>
          <span className="text-slate-600 font-normal">/</span>
          <span className="text-gold-400">{ministry.name}</span>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/20 border border-gold-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-gold-300">
              <Sparkles size={14}/> {fallback.focus}
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl drop-shadow-sm">{ministry.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">{ministry.description || fallback.blurb}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
                <Users size={16} className="text-gold-400"/> {stats.activeMembers} active member{stats.activeMembers === 1 ? '' : 's'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
                <Church size={16} className="text-gold-400"/> TUMCU ministry
              </div>
            </div>
          </div>
          <Card variant="glass" className="p-6 bg-white/95 text-slate-900 border-white/40 shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-gold-700">Your connection</p>
            {connectionContent}
          </Card>
        </div>
      </div>
    </section>

    <section className="page-shell section-pad">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Card variant="glass">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-50 text-primary-700"><Users size={19}/></span><div><h2 className="font-black text-primary-950">How to get involved</h2><p className="text-xs text-slate-500">Grow through consistent service</p></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">{['Connect with the team','Attend ministry activities','Serve with your gifts'].map((x, i) => <div key={x} className="rounded-2xl border border-white/70 bg-white/55 p-4"><div className="text-xs font-black text-gold-600">0{i+1}</div><p className="mt-2 text-sm font-bold text-primary-900">{x}</p></div>)}</div>
        </Card>
        <Card variant="glass">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-50 text-gold-700"><Clock3 size={19}/></span><div><h2 className="font-black text-primary-950">Training & growth</h2><p className="text-xs text-slate-500">Ministry development</p></div></div>
          <div className="mt-5 space-y-3">{trainings.length ? trainings.map((training) => <div key={training.id} className="rounded-2xl bg-white/55 p-4"><div className="flex items-start justify-between gap-3"><p className="font-bold text-primary-900">{training.title}</p><span className="text-xs text-slate-400">{new Date(training.training_date).toLocaleDateString('en-KE')}</span></div>{training.facilitator && <p className="mt-1 text-xs text-slate-500">Facilitator: {training.facilitator}</p>}</div>) : <p className="rounded-2xl bg-slate-50/70 p-4 text-sm text-slate-500">No upcoming training has been published yet.</p>}</div>
        </Card>
      </div>
      <Card variant="glass" className="mt-6"><div className="flex items-center gap-3"><CalendarDays className="text-primary-700"/><div><h2 className="font-black text-primary-950">Your ministry journey</h2><p className="text-sm text-slate-500">Connected members can access ministry-specific activities as those features are published.</p></div></div></Card>
    </section>
  </motion.div>;
}
