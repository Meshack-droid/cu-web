import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUpRight,
  Church,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Mic2,
  Music,
  Palette,
  Search,
  Sparkles,
  Users,
  UtensilsCrossed,
  Video,
  Wrench,
} from 'lucide-react';
import { Card } from '@/components/Card';
import {
  fetchMinistries,
  getMinistryBackground,
  type Ministry,
} from '@/features/ministries/ministries.api';
import heroImage from '@/assets/hero.png';

interface MinistryMeta {
  icon: typeof Church;
  blurb: string;
  accent: string;
  focus: string;
}

const MINISTRY_META: Record<string, MinistryMeta> = {
  intercessory: { icon: HeartHandshake, blurb: 'Anchors TUMCU in prayer, intercession, prayer chains and spiritual covering.', accent: 'from-emerald-700 to-teal-500', focus: 'Prayer & spiritual growth' },
  worship: { icon: Music, blurb: 'Leads praise and worship and creates spaces where students encounter God through music.', accent: 'from-violet-700 to-fuchsia-500', focus: 'Praise & worship' },
  instrumentalists: { icon: Mic2, blurb: 'Provides keys, guitar, drums and other instrumental support for worship and special services.', accent: 'from-sky-700 to-cyan-500', focus: 'Music & instruments' },
  ushering: { icon: Users, blurb: 'Welcomes members and visitors, helps people connect and keeps gatherings warm and orderly.', accent: 'from-amber-600 to-orange-500', focus: 'Hospitality & welcome' },
  catering: { icon: UtensilsCrossed, blurb: 'Serves through hospitality at fellowships, conferences, retreats and special gatherings.', accent: 'from-rose-700 to-orange-500', focus: 'Hospitality & care' },
  media: { icon: Video, blurb: 'Captures, streams and shares the story of TUMCU through photography, video and digital media.', accent: 'from-blue-800 to-indigo-500', focus: 'Media & storytelling' },
  creative: { icon: Palette, blurb: 'Uses design, drama and creative arts to communicate the Gospel in fresh and memorable ways.', accent: 'from-fuchsia-700 to-pink-500', focus: 'Arts & creativity' },
  technicians: { icon: Wrench, blurb: 'Keeps sound, lighting and technical systems ready so every service can run smoothly.', accent: 'from-slate-800 to-slate-500', focus: 'Technology & production' },
  high_school: { icon: GraduationCap, blurb: 'Reaches high school students through discipleship, mentorship and Christ-centred community.', accent: 'from-green-800 to-lime-500', focus: 'Mentorship & outreach' },
  hospital: { icon: HeartPulse, blurb: 'Visits and ministers to patients, bringing prayer, compassion, comfort and the Gospel.', accent: 'from-red-700 to-rose-500', focus: 'Compassion & outreach' },
  brothers: { icon: Users, blurb: 'Builds Christ-centred brotherhood through mentorship, fellowship, accountability and service.', accent: 'from-indigo-800 to-blue-500', focus: 'Brotherhood & growth' },
  sisters: { icon: Users, blurb: 'Builds a caring sisterhood through fellowship, mentorship, prayer and practical support.', accent: 'from-pink-700 to-purple-500', focus: 'Sisterhood & growth' },
};

const DIRECTORY: Ministry[] = [
  ['intercessory', 'Intercessory Ministry'], ['worship', 'Praise & Worship Ministry'], ['instrumentalists', 'Instrumentalists Ministry'],
  ['ushering', 'Ushering Ministry'], ['catering', 'Catering Ministry'], ['media', 'Media Ministry'], ['creative', 'Creative Ministry'],
  ['technicians', 'Technicians Ministry'], ['high_school', 'High School Ministry'], ['hospital', 'Hospital Ministry'],
  ['brothers', "Brothers' Ministry"], ['sisters', "Sisters' Ministry"],
].map(([code, name], index) => ({
  id: `min-${index + 1}`,
  code,
  name,
  description: null,
  created_at: '',
  image_url: getMinistryBackground({ id: `min-${index + 1}`, code }),
}));

function MinistryCardSkeleton() {
  return <Card variant="glass" className="overflow-hidden p-0 animate-pulse"><div className="h-52 bg-slate-200/70"/><div className="p-6"><div className="h-5 w-2/3 rounded bg-slate-200/70"/><div className="mt-3 h-3 w-full rounded bg-slate-100/80"/><div className="mt-2 h-3 w-5/6 rounded bg-slate-100/80"/></div></Card>;
}

export function MinistriesPage() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({ queryKey: ['ministries'], queryFn: fetchMinistries });
  const ministries = data?.length ? data : DIRECTORY;

  // Re-sync immediately when admin updates a ministry background in another component or tab
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
    };
    window.addEventListener('tumcu_ministry_image_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tumcu_ministry_image_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [queryClient]);

  const filtered = useMemo(() => ministries.filter((ministry) => {
    const text = `${ministry.name} ${ministry.code} ${ministry.description ?? ''}`.toLowerCase();
    const matchesSearch = text.includes(query.toLowerCase().trim());
    const matchesFocus = active === 'all' || (MINISTRY_META[ministry.code]?.focus.toLowerCase().includes(active));
    return matchesSearch && matchesFocus;
  }), [ministries, query, active]);

  return <div className="min-h-screen overflow-hidden bg-transparent">
    <section className="ministry-hero relative px-5 pb-16 pt-12 sm:px-6 lg:pb-24 lg:pt-16">
      <div className="ministry-orb ministry-orb-one"/><div className="ministry-orb ministry-orb-two"/>
      <div className="page-shell relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="max-w-2xl">
          <div className="eyebrow"><Sparkles size={14}/> THE HEART OF TUMCU</div>
          <h1 className="mt-6 text-5xl font-black leading-[.98] tracking-[-.045em] text-primary-900 sm:text-7xl">There is a place<br/><span className="ministry-gradient-text">for your gift.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">TUMCU comes alive through people who pray, create, welcome, worship, serve and reach others. Discover a ministry where your faith can become action.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#directory" className="inline-flex items-center gap-2 rounded-full bg-primary-900 px-6 py-3 font-bold text-white shadow-xl shadow-primary-900/20 transition hover:-translate-y-0.5">Explore ministries <ArrowDown size={17}/></a>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-5 py-3 text-sm font-semibold text-primary-900 backdrop-blur-xl"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"/> 12 ministry spaces</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="ministry-photo-main surface-glass-dark">
            <img src={heroImage} alt="TUMCU fellowship" className="h-[430px] w-full object-cover object-center"/>
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-900/10 to-transparent"/>
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-white">
              <div><p className="text-xs font-bold uppercase tracking-[.2em] text-gold-300">ONE BODY • MANY GIFTS</p><p className="mt-1 text-2xl font-black">Serve. Connect. Grow.</p></div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/30 bg-white/15 backdrop-blur-xl"><ArrowUpRight/></div>
            </div>
          </div>
          <div className="ministry-float-card surface-glass"><Sparkles size={16} className="text-gold-600"/><div><p className="text-xs font-black uppercase tracking-widest text-primary-700">Your next step</p><p className="text-sm font-semibold text-slate-700">Find a ministry. Find community.</p></div></div>
        </div>
      </div>
    </section>

    <section id="directory" className="page-shell section-pad">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><span className="text-xs font-black tracking-[.22em] text-gold-600">THE COMMUNITY</span><h2 className="mt-2 text-4xl font-black tracking-tight text-primary-900 sm:text-5xl">Meet the ministries.</h2><p className="mt-3 max-w-2xl text-slate-500">Every ministry has its own rhythm, people and purpose. Browse the directory and discover where you can plug in.</p></div>
        <div className="surface-glass flex w-full items-center gap-3 rounded-full px-4 py-2.5 lg:max-w-sm"><Search size={18} className="text-slate-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ministries..." className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"/></div>
      </div>

      <div className="mb-10 flex gap-2 overflow-x-auto pb-2">
        {['all','prayer','worship','media','hospitality','outreach'].map((filter) => <button key={filter} onClick={() => setActive(filter)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold capitalize transition ${active === filter ? 'border-primary-900 bg-primary-900 text-white shadow-lg shadow-primary-900/15' : 'border-white/70 bg-white/45 text-slate-600 backdrop-blur-xl hover:bg-white/75'}`}>{filter === 'all' ? 'All ministries' : filter}</button>)}
      </div>

      {isError && <div className="mb-8 rounded-2xl border border-amber-300/50 bg-amber-50/70 px-5 py-3 text-sm text-amber-800 backdrop-blur-xl">Live ministry data is temporarily unavailable, so the ministry directory is being shown from the built-in site directory. Start the backend to restore live data.</div>}

      <div className="space-y-8">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <MinistryCardSkeleton key={i}/>)}
        {!isLoading && filtered.map((ministry, index) => {
          const meta = MINISTRY_META[ministry.code] ?? { icon: Church, blurb: ministry.description || 'A place to serve, connect and grow.', accent: 'from-primary-900 to-primary-500', focus: 'Service & community' };
          const Icon = meta.icon;
          const reverse = index % 2 === 1;
          const bgImg = ministry.image_url || getMinistryBackground(ministry) || heroImage;

          return <article key={ministry.id} className={`ministry-row group grid items-stretch overflow-hidden rounded-[32px] border border-white/70 bg-white/35 shadow-[0_25px_70px_rgba(6,44,23,.09)] backdrop-blur-xl lg:grid-cols-2 ${reverse ? 'lg:[&>div:first-child]:order-2' : ''}`}>
            <div className="relative min-h-[300px] overflow-hidden bg-slate-900">
              <img
                src={bgImg}
                alt={ministry.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = heroImage;
                }}
                className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${index % 3 === 0 ? 'object-left' : index % 3 === 1 ? 'object-center' : 'object-right'}`}
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-40 mix-blend-multiply transition duration-500 group-hover:opacity-25`}/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
              <div className="absolute left-6 top-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-black/30 text-white shadow-xl backdrop-blur-md"><Icon size={25}/></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="inline-block rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[.18em] text-gold-300 backdrop-blur-sm">{meta.focus}</span>
                <h3 className="mt-2 text-3xl font-black drop-shadow-sm">{ministry.name.replace(' Ministry', '')}</h3>
              </div>
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <div className="flex items-center justify-between"><span className="rounded-full bg-primary-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary-700">Ministry</span><ArrowUpRight className="text-slate-300 transition group-hover:text-primary-500"/></div>
              <h4 className="mt-6 text-2xl font-black text-primary-900">Make your gift useful.</h4>
              <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">{ministry.description || meta.blurb}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3"><span className="rounded-full border border-primary-100 bg-white/60 px-4 py-2 text-xs font-bold text-primary-800">Connect</span><span className="rounded-full border border-primary-100 bg-white/60 px-4 py-2 text-xs font-bold text-primary-800">Serve</span><span className="rounded-full border border-primary-100 bg-white/60 px-4 py-2 text-xs font-bold text-primary-800">Grow</span><Link to={`/ministries/${ministry.id}`} className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary-900 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5">Open ministry <ArrowUpRight size={14}/></Link></div>
            </div>
          </article>;
        })}
      </div>

      {!isLoading && filtered.length === 0 && <Card variant="glass" className="mt-10 text-center"><Search className="mx-auto text-slate-400"/><h3 className="mt-3 font-black text-primary-900">No ministry found</h3><p className="mt-1 text-sm text-slate-500">Try another search or choose “All ministries”.</p></Card>}
    </section>
  </div>;
}
