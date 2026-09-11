import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  FileCheck,
  Award,
  BookOpen,
  Heart,
  Scale,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export function PublicMembershipPage() {
  const [selectedCategory, setSelectedCategory] = useState<'full' | 'special' | 'associate'>('full');

  const DECLARATION =
    'In joining Technical University of Mombasa Christian Union, (T.U.M.C.U.), I declare Jesus Christ as my Lord and Savior and it is my desire, by the grace of God, to live a life worthy of my Christian calling. I am also determined to follow the Constitution and support the C.U as it seeks to fulfill its aims.';

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="mesh-hero-bg px-5 py-16 sm:px-6 sm:py-24">
        <div className="page-shell grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="eyebrow">
              <Sparkles size={14} /> TUMCU Constitution 2024 • Article 4
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">
              Membership in <span className="text-primary-500">TUMCU</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Open to all born-again Christian students and alumni of the Technical University of Mombasa who subscribe to our Doctrinal Basis and consciously sign the Membership Declaration.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button variant="primary" className="px-6 py-3.5 text-sm font-bold">
                  Apply for Membership <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/constitution">
                <Button variant="secondary" className="px-6 py-3.5 text-sm font-bold">
                  View Constitution (Art. 4)
                </Button>
              </Link>
            </div>
          </div>

          <div className="surface-glass rounded-[32px] p-6 shadow-xl shadow-primary-900/10 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-500 text-primary-950">
                <FileCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-primary-900">The Constitutional Declaration</h3>
                <p className="text-xs text-slate-500">Required for all categories</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-white/80 p-5 text-sm italic leading-relaxed text-primary-950 ring-1 ring-black/5">
              "{DECLARATION}"
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Article 4.2 • Spiritual Commitment</span>
              <span className="font-semibold text-primary-700">TUMCU Constitution</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Categories Section */}
      <section className="page-shell section-pad">
        <div className="max-w-2xl">
          <span className="eyebrow">Article 4.1 Categories</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-primary-900 sm:text-4xl">
            Three Constitutional <span className="text-primary-500">Membership Types</span>
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            The TUMCU Constitution establishes three clear membership classes based on academic standing and engagement.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Full Member */}
          <Card
            variant="glass"
            className={`p-6 sm:p-8 transition-all duration-300 ${
              selectedCategory === 'full' ? 'ring-2 ring-primary-600 shadow-xl' : 'opacity-90'
            }`}
            onClick={() => setSelectedCategory('full')}
          >
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-900 text-white">
                <GraduationCap size={22} />
              </div>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800">
                Voting Member
              </span>
            </div>
            <h3 className="mt-5 text-2xl font-black text-primary-900">Full Member</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Available to bona-fide registered undergraduate, diploma, certificate, or other full-time students of Technical University of Mombasa who consciously sign the membership declaration.
            </p>
            <div className="mt-6 space-y-2 border-t border-slate-200/70 pt-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Full voting rights at General Meetings (AGM/SGM)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Eligible for Executive & Committee Leadership</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Active involvement in Union Ministries</span>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/register?type=full">
                <Button variant="primary" className="w-full text-xs font-bold py-2.5">
                  Apply as Full Member
                </Button>
              </Link>
            </div>
          </Card>

          {/* Special Member */}
          <Card
            variant="glass"
            className={`p-6 sm:p-8 transition-all duration-300 ${
              selectedCategory === 'special' ? 'ring-2 ring-primary-600 shadow-xl' : 'opacity-90'
            }`}
            onClick={() => setSelectedCategory('special')}
          >
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-500 text-primary-950">
                <Users size={22} />
              </div>
              <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-bold text-gold-800">
                Postgrad & Flexible
              </span>
            </div>
            <h3 className="mt-5 text-2xl font-black text-primary-900">Special Member</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Available to postgraduate students, evening-session students, or students who cannot cope with regular CU schedules but desire spiritual fellowship and affirm the declaration.
            </p>
            <div className="mt-6 space-y-2 border-t border-slate-200/70 pt-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Fellowship & Spiritual Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Participation in Services & Bible Studies</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Flexible engagement model</span>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/register?type=special">
                <Button variant="secondary" className="w-full text-xs font-bold py-2.5">
                  Apply as Special Member
                </Button>
              </Link>
            </div>
          </Card>

          {/* Associate Member */}
          <Card
            variant="glass"
            className={`p-6 sm:p-8 transition-all duration-300 ${
              selectedCategory === 'associate' ? 'ring-2 ring-primary-600 shadow-xl' : 'opacity-90'
            }`}
            onClick={() => setSelectedCategory('associate')}
          >
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-800 text-white">
                <Award size={22} />
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                Alumni / Associates
              </span>
            </div>
            <h3 className="mt-5 text-2xl font-black text-primary-900">Associate Member</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Available to former TUMCU students, alumni, and friends of the Union who are born-again Christians and actively concerned with TUMCU's objectives, mission, and welfare.
            </p>
            <div className="mt-6 space-y-2 border-t border-slate-200/70 pt-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Mentorship & Alumni Network</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Advisory Board representation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Partnership in Mission & Projects</span>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/register?type=associate">
                <Button variant="secondary" className="w-full text-xs font-bold py-2.5">
                  Apply as Associate Member
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Rights & Duties Overview */}
      <section className="page-shell pb-24">
        <div className="grid gap-8 md:grid-cols-2">
          <Card variant="glass" className="p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-100 text-primary-800">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-xl font-black text-primary-900">Rights of Members (Article 5)</h3>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Participate in all spiritual, fellowship, and academic activities of TUMCU.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Full members have the right to attend, speak, propose motions, and vote at General Meetings.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Access Christian resources, pastoral guidance, welfare support, and discipleship.</span>
              </li>
            </ul>
          </Card>

          <Card variant="glass" className="p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-100 text-gold-900">
                <Scale size={20} />
              </div>
              <h3 className="text-xl font-black text-primary-900">Duties of Members (Article 6)</h3>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-gold-600 mt-0.5 shrink-0" />
                <span>Live a life consistent with the biblical teachings and the Christian calling.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-gold-600 mt-0.5 shrink-0" />
                <span>Uphold the TUMCU Constitution, respect elected leadership, and attend General Meetings.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-gold-600 mt-0.5 shrink-0" />
                <span>Faithfully participate in prayer, Bible study, fellowship, giving, and ministry service.</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Link to="/register">
            <Button variant="primary" className="px-8 py-4 text-base font-bold shadow-lg shadow-primary-900/15">
              Start Your Membership Application Today <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
