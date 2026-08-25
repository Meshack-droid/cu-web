import { ArrowRight, BookOpen, HeartHandshake, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeroCarousel } from '@/components/HeroCarousel';
import { PrayerArt } from '@/components/hero-art/PrayerArt';
import { BibleStudyArt } from '@/components/hero-art/BibleStudyArt';
import { CommunityArt } from '@/components/hero-art/CommunityArt';
import photo1 from '@/assets/community/community-1.jpg';
import photo2 from '@/assets/community/community-2.jpg';
import photo3 from '@/assets/community/community-3.jpg';
import photo4 from '@/assets/community/community-4.jpg';
import photo5 from '@/assets/community/community-5.jpg';

const stats = [
  { label: 'Active Ministries', value: '10', icon: Users },
  { label: 'Faith & Fellowship', value: '24/7', icon: HeartHandshake },
  { label: 'Word-Centred', value: '100%', icon: BookOpen },
];

const moments = [
  { title: 'Prayer that moves us', text: 'We gather to seek God, carry one another and intercede for our campus.', Art: PrayerArt, tag: 'PRAYER' },
  { title: 'The Word that forms us', text: 'Bible study, discipleship and honest conversations that take faith beyond Sunday.', Art: BibleStudyArt, tag: 'THE WORD' },
  { title: 'Community that sends us', text: 'We serve, reach out and build friendships that reflect the love of Christ.', Art: CommunityArt, tag: 'MISSION' },
];

export function HomePage() {
  return (
    <div className="overflow-hidden">
      <section className="mesh-hero-bg min-h-[calc(100vh-48px)] px-5 pb-16 pt-20 sm:px-6 lg:pt-24">
        <div className="page-shell relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
          <div className="relative z-10">
            <span className="eyebrow"><Sparkles size={14} /> A community on mission</span>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[.98] tracking-[-.045em] text-primary-900 sm:text-6xl lg:text-7xl">Faith that feels <span className="text-primary-500">alive.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">Welcome to TUMCU — a Christ-centred community where students discover purpose, grow in the Word, find family and learn to serve.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/register"><Button variant="primary" className="px-6 py-3.5 text-sm font-bold">Join the community <ArrowRight size={17} /></Button></Link>
              <Link to="/events"><Button variant="secondary" className="px-6 py-3.5 text-sm font-bold">Explore events</Button></Link>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-3">
              {stats.map(({ label, value, icon: Icon }) => <div key={label} className="surface-glass rounded-3xl p-4"><Icon size={18} className="text-primary-600" /><div className="mt-3 text-xl font-black text-primary-900">{value}</div><div className="mt-1 text-[11px] font-medium leading-4 text-slate-500">{label}</div></div>)}
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="absolute -right-4 top-10 h-28 w-28 rounded-full bg-gold-400/30 blur-3xl" />
            <div className="absolute -left-4 bottom-6 h-36 w-36 rounded-full bg-primary-500/20 blur-3xl" />
            <div className="surface-glass relative rounded-[36px] p-3 shadow-2xl shadow-primary-900/15">
              <div className="photo-frame rounded-[30px] bg-white/40 p-4 sm:p-6"><HeroCarousel /></div>
            </div>
            <div className="surface-glass float-soft absolute -bottom-7 -left-2 hidden max-w-[220px] rounded-3xl p-4 sm:block"><div className="text-xs font-bold uppercase tracking-[.16em] text-gold-600">Today</div><div className="mt-1 font-bold text-primary-900">Grow. Connect. Serve.</div><div className="mt-1 text-xs leading-5 text-slate-500">There is a place for you here.</div></div>
          </div>
        </div>
      </section>

      <section className="page-shell pt-16 sm:pt-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">Life at TUMCU</span>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-primary-900 sm:text-5xl">
              Real people. <span className="text-primary-500">Real moments.</span>
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              A glimpse into the worship, fellowship, creativity and friendships that make this community feel like home.
            </p>
          </div>
          <Link to="/about" className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-500">
            Discover TUMCU <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-4 sm:gap-4">
          <div className="photo-frame col-span-2 row-span-2">
            <img src={photo3} alt="TUMCU students sharing fellowship" className="h-full w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-5 text-sm font-bold text-white">Fellowship & belonging</div>
          </div>
          <div className="photo-frame">
            <img src={photo2} alt="TUMCU worship team" className="h-full w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
          </div>
          <div className="photo-frame">
            <img src={photo5} alt="TUMCU students in fellowship" className="h-full w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
          </div>
          <div className="photo-frame">
            <img src={photo1} alt="TUMCU prayer moment" className="h-full w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
          </div>
          <div className="photo-frame">
            <img src={photo4} alt="TUMCU music ministry" className="h-full w-full object-cover grayscale transition duration-700 hover:scale-105 hover:grayscale-0" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="max-w-2xl"><span className="eyebrow">The TUMCU rhythm</span><h2 className="mt-5 text-4xl font-black tracking-tight text-primary-900 sm:text-5xl">More than a programme. <span className="text-primary-500">A way of life.</span></h2><p className="mt-4 leading-7 text-slate-600">Different expressions. One family. Scroll through the moments that shape our community.</p></div>
        <div className="mt-14 space-y-10">
          {moments.map(({ title, text, Art, tag }, i) => <div key={title} className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
            <div className="surface-glass photo-frame min-h-[320px] p-8 sm:p-12"><Art className="mx-auto h-full w-full max-w-md" /></div>
            <div className="max-w-xl"><span className="text-xs font-black tracking-[.2em] text-gold-600">{tag}</span><h3 className="mt-3 text-3xl font-black tracking-tight text-primary-900 sm:text-4xl">{title}</h3><p className="mt-4 leading-7 text-slate-600">{text}</p><Link to={tag === 'MISSION' ? '/ministries' : '/about'} className="mt-7 inline-flex items-center gap-2 font-bold text-primary-700 hover:text-primary-500">Discover more <ArrowRight size={17} /></Link></div>
          </div>)}
        </div>
      </section>

      <section className="page-shell pb-24">
        <Card variant="glass" className="relative overflow-hidden border-primary-100/60 bg-primary-900/95 p-8 text-white sm:p-12">
          <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]"><div><span className="text-xs font-black uppercase tracking-[.2em] text-gold-400">Find your place</span><h2 className="mt-3 text-3xl font-black sm:text-4xl">Ready to be part of the story?</h2><p className="mt-3 max-w-2xl leading-7 text-white/65">Meet people, discover your gifts and grow in your walk with Christ.</p></div><Link to="/register"><Button variant="secondary" className="px-7 py-3.5 font-bold">Join TUMCU <ArrowRight size={17} /></Button></Link></div>
        </Card>
      </section>
    </div>
  );
}
