import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Download,
  FileText,
  ShieldCheck,
  Users,
  Scale,
  DollarSign,
  HeartHandshake,
  Church,
  Vote,
  AlertCircle,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface ArticleItem {
  id: string;
  articleNumber: string;
  title: string;
  chapter: string;
  summary: string;
  keyPoints: string[];
  fullText: string;
  tags: string[];
}

const CONSTITUTION_ARTICLES: ArticleItem[] = [
  {
    id: 'preamble',
    articleNumber: 'Preamble',
    title: 'Preamble & Foundation',
    chapter: 'Foundations',
    summary: 'Affirming faith in the Triune God, the supremacy of the Holy Bible as the inspired Word of God, and our calling as Christian students at Technical University of Mombasa.',
    keyPoints: [
      'Non-political, non-denominational, non-profit making Christian student fellowship.',
      'Commitment to spiritual growth, biblical discipleship, unity, and evangelism.',
    ],
    fullText: `We, the Christian students of The Technical University of Mombasa (TUM), acknowledging the Lordship of Jesus Christ, affirming the authority and supremacy of the Holy Scriptures as the inspired Word of God, and seeking to foster Christian fellowship, spiritual growth, and the proclamation of the Gospel of Jesus Christ in the University and society, do hereby make, enact, and give to ourselves this Constitution.`,
    tags: ['preamble', 'foundation', 'bible', 'faith'],
  },
  {
    id: 'art-1',
    articleNumber: 'Article 1',
    title: 'Name and Identification',
    chapter: 'Chapter 1: General Provisions',
    summary: 'Establishes the official name as Technical University of Mombasa Christian Union (TUMCU).',
    keyPoints: [
      'Official Name: Technical University of Mombasa Christian Union (TUMCU).',
      'Headquarters located at the Technical University of Mombasa Main Campus.',
      'Operates under the umbrella of Christian university student movements in Kenya.',
    ],
    fullText: `1.1 The Union shall be called "The Technical University of Mombasa Christian Union" hereinafter referred to as "T.U.M.C.U." or "the Union".
1.2 The registered headquarters and main office of the Union shall be situated at the Technical University of Mombasa Main Campus, Tudor, Mombasa County.`,
    tags: ['name', 'identification', 'tumcu', 'office'],
  },
  {
    id: 'art-2',
    articleNumber: 'Article 2',
    title: 'Doctrinal Basis',
    chapter: 'Chapter 1: General Provisions',
    summary: 'Defines the essential biblical truths and non-denominational nature of TUMCU.',
    keyPoints: [
      'Unity of the Father, Son, and Holy Spirit in the Godhead.',
      'Sovereignty of God in creation, revelation, redemption, and final judgment.',
      'Divine inspiration, truthfulness, and supreme authority of Holy Scripture.',
      'Universal sinfulness and guilt of fallen humanity.',
      'Redemption from the guilt, penalty, and power of sin solely through the sacrificial death of Jesus Christ.',
      'Bodily resurrection of Jesus Christ and His ascension to the right hand of God.',
      'Work of the Holy Spirit in regeneration and sanctification.',
    ],
    fullText: `The Union shall be founded on the fundamental biblical doctrines of the Christian faith, including:
(a) The unity of the Father, Son, and Holy Spirit in the Godhead.
(b) The sovereignty of God in creation, revelation, redemption, and final judgment.
(c) The divine inspiration and entire trustworthiness of Holy Scripture, as originally given, and its supreme authority in all matters of faith and conduct.
(d) The universal sinfulness and guilt of all men since the Fall, rendering them subject to God's wrath and condemnation.
(e) Redemption from the guilt, penalty, and power of sin only through the sacrificial death of Jesus Christ, the incarnate Son of God.
(f) The bodily resurrection of Jesus Christ from the dead and His ascension to the right hand of God.
(g) The justification of the sinner by the grace of God through faith alone.
(h) The presence and power of the Holy Spirit in the work of regeneration and indwelling the believer.
(i) The expectation of the personal return of the Lord Jesus Christ.`,
    tags: ['doctrine', 'faith', 'bible', 'salvation', 'jesus christ'],
  },
  {
    id: 'art-3',
    articleNumber: 'Article 3',
    title: 'Aims, Mission, Vision and Core Values',
    chapter: 'Chapter 1: General Provisions',
    summary: 'The guiding mandate, mission statement, vision, and the 6 core values.',
    keyPoints: [
      'Mission: "Reaching every student of The Technical University of Mombasa and equipping them through Bible-study, Prayer, and Fellowship."',
      'Vision: "To raise mature Christians committed to the service for Christ both in campus and society."',
      'Core Values: Prayer, Unity, Excellence, Integrity, The Word, Fellowship.',
    ],
    fullText: `3.1 AIMS: To reach every student in the university with the Gospel of Jesus Christ; to build up Christian students in biblical faith; to equip members for Christian service in the campus and society.
3.2 MISSION: Reaching every student of The Technical University of Mombasa and equipping them through Bible-study, Prayer, and Fellowship.
3.3 VISION: To raise mature Christians committed to the service for Christ both in campus and society.
3.4 CORE VALUES:
1. Prayer - Consistent intercession and communion with God.
2. Unity - Promoting biblical harmony across diverse backgrounds.
3. Excellence - Giving our best in spiritual, academic, and practical pursuits.
4. Integrity - Living blamelessly in accordance with the Word of God.
5. The Word - Grounding all faith, practice, and doctrine in the Holy Scriptures.
6. Fellowship - Nurturing mutual love, accountability, and edification.`,
    tags: ['aims', 'mission', 'vision', 'core values', 'prayer', 'unity', 'excellence', 'integrity', 'word', 'fellowship'],
  },
  {
    id: 'art-4',
    articleNumber: 'Article 4',
    title: 'Affiliation',
    chapter: 'Chapter 1: General Provisions',
    summary: 'Affiliation with Fellowship of Christian Unions (FOCUS Kenya).',
    keyPoints: [
      'Affiliated with FOCUS Kenya (Fellowship of Christian Unions).',
      'Collaborates with evangelical student bodies sharing the same doctrinal basis.',
    ],
    fullText: `4.1 The Union shall be affiliated to the Fellowship of Christian Unions (FOCUS Kenya).
4.2 The Union may associate or cooperate with other Christian organizations whose doctrinal basis and objectives conform to those of TUMCU.`,
    tags: ['affiliation', 'focus kenya', 'fellowship'],
  },
  {
    id: 'art-5',
    articleNumber: 'Article 5',
    title: 'Membership & Declarations',
    chapter: 'Chapter 2: Membership',
    summary: 'Three distinct constitutional categories of membership and mandatory declaration.',
    keyPoints: [
      '1. Full Member: Bona-fide registered undergraduate/diploma/certificate full-time student who consciously signs the membership declaration.',
      '2. Special Member: Postgraduate/part-time students who cannot cope with regular CU schedule and sign the declaration.',
      '3. Associate Member: Former TUMCU students (alumni) who are born-again Christians concerned with TUMCU objectives.',
      'Constitutional Declaration: "In joining Technical University of Mombasa Christian Union, (T.U.M.C.U.), I declare Jesus Christ as my Lord and Savior and it is my desire, by the grace of God, to live a life worthy of my Christian calling. I am also determined to follow the Constitution and support the C.U as it seeks to fulfill its aims."',
      'Membership renewal required annually and during the AGM.',
    ],
    fullText: `5.1 CATEGORIES OF MEMBERSHIP:
(a) Full Member: Open to any registered full-time student of Technical University of Mombasa who has accepted Jesus Christ as Lord and Savior and has signed the declaration of membership. Full members have voting rights and eligibility for office.
(b) Special Member: Open to postgraduate, evening, or weekend students who agree with the doctrinal basis and declaration.
(c) Associate Member: Open to alumni of TUMCU and former students who subscribe to the doctrinal basis and desire to support the Union.
5.2 DECLARATION OF MEMBERSHIP:
Every applicant shall consciously affirm: "In joining Technical University of Mombasa Christian Union, (T.U.M.C.U.), I declare Jesus Christ as my Lord and Savior and it is my desire, by the grace of God, to live a life worthy of my Christian calling. I am also determined to follow the Constitution and support the C.U as it seeks to fulfill its aims."`,
    tags: ['membership', 'full member', 'special member', 'associate member', 'declaration', 'renewal'],
  },
  {
    id: 'art-6',
    articleNumber: 'Article 6',
    title: 'Cessation of Membership & Disciplinary Process',
    chapter: 'Chapter 2: Membership',
    summary: 'Procedural discipline workflow for misconduct or doctrinal deviation under Article 6.2.',
    keyPoints: [
      'Timeline: COMPLAINT → REVIEW → INVESTIGATION → DECISION → ACTION → CLOSED.',
      'Written complaint submitted to the Executive Committee through the Secretary.',
      'Executive Committee appoints an ad hoc disciplinary/inquiry committee.',
      'Ad hoc committee investigates, accords fair hearing, and submits findings.',
      'Executive Committee evaluates report and records verdict (warning, suspension, or deregistration).',
      'Deregistered member may appeal in writing for restoration and re-registration.',
      'All disciplinary files remain strictly confidential.',
    ],
    fullText: `6.1 CESSATION: Membership ceases upon completion of studies, voluntary written resignation, or disciplinary deregistration.
6.2 DISCIPLINARY WORKFLOW (Article 6.2):
(a) Submission of written complaint to the Secretary.
(b) Executive Committee forms an ad hoc committee of inquiry.
(c) The member is given full opportunity to be heard (natural justice).
(d) Ad hoc committee submits a written report to the Executive Committee.
(e) Executive Committee makes a deliberate decision: warning, counseling, temporary suspension, or deregistration.
(f) Right of Appeal: A member may submit a written request for reinstatement to the Executive Committee.`,
    tags: ['discipline', 'cessation', 'deregistration', 'investigation', 'complaint', 'ad hoc committee'],
  },
  {
    id: 'art-7',
    articleNumber: 'Article 7',
    title: 'Rights and Duties of Members',
    chapter: 'Chapter 2: Membership',
    summary: 'Privileges, participation, voting rights, and duties of all members.',
    keyPoints: [
      'Right to participate in fellowships, Bible studies, and general meetings.',
      'Voting rights in General Meetings reserved strictly for Full Members.',
      'Duty to uphold Christian testimony and support the Union through prayer, giving, and service.',
    ],
    fullText: `7.1 Rights of Full Members:
(a) To attend and vote in all General Meetings (AGM, SGM, RGM).
(b) To be nominated for leadership positions subject to constitutional eligibility.
(c) To participate in ministries, committees, and spiritual activities.
7.2 Duties: To live a life worthy of the Gospel, uphold the Constitution, attend meetings, pray, and give financially.`,
    tags: ['rights', 'duties', 'voting', 'participation'],
  },
  {
    id: 'art-8',
    articleNumber: 'Article 8',
    title: 'Governing Organs of the Union',
    chapter: 'Chapter 3: Governance & Leadership',
    summary: 'The three constitutional governing bodies and hierarchical structure.',
    keyPoints: [
      '1. General Meetings - Supreme governing body of TUMCU.',
      '2. Executive Committee - Main policy-making and administrative body.',
      '3. Advisory Board - Advisory and pastoral oversight role.',
    ],
    fullText: `The governing organs of TUMCU in order of constitutional authority shall be:
1. The General Meetings (Supreme Governing Organ)
2. The Executive Committee (Executive and Administrative Organ)
3. The Advisory Board (Advisory and Custodial Organ)`,
    tags: ['governance', 'organs', 'general meetings', 'executive committee', 'advisory board'],
  },
  {
    id: 'art-9',
    articleNumber: 'Article 9',
    title: 'General Meetings (AGM, SGM, RGM)',
    chapter: 'Chapter 3: Governance & Leadership',
    summary: 'Specifications for Annual, Special, and Regular General Meetings.',
    keyPoints: [
      'Annual General Meeting (AGM): Held once per academic spiritual year; requires 21 days written notice.',
      'Special General Meeting (SGM): Called by Executive Committee or petitioned by 2/3 of Full Members; requires 7 days notice.',
      'Quorum requirement for SGM and constitutional decisions is 25% of registered Full Members.',
      'Regular General Meeting (RGM): Held at least once per semester for updates.',
    ],
    fullText: `9.1 ANNUAL GENERAL MEETING (AGM):
- Held annually before the close of the spiritual year.
- Requires minimum 21 days written notice to all members.
- Business: Annual reports, audited accounts, budget approval, confirmation of Executive Committee, and announcement of committee leaders.
9.2 SPECIAL GENERAL MEETING (SGM):
- Convened by Executive Committee or upon written petition signed by at least 2/3 of Full Members.
- Requires 7 days written notice with specific agenda.
- Quorum: 25% of registered Full Members.`,
    tags: ['meetings', 'agm', 'sgm', 'rgm', 'quorum', 'notice period', 'resolutions'],
  },
  {
    id: 'art-10',
    articleNumber: 'Article 10',
    title: 'The Executive Committee & Gender Rule',
    chapter: 'Chapter 3: Governance & Leadership',
    summary: '13 Constitutional executive positions and the gender balance constraint.',
    keyPoints: [
      '13 Executive Positions: Chairperson, First Vice Chairperson, Second Vice Chairperson, Secretary, Vice Secretary, Treasurer, Prayer Committee Chairperson, Worship Committee Chairperson, Mission Committee Chairperson, Discipleship Committee Chairperson, Assets Committee Chairperson, Publicity Committee Chairperson, Non-Residents Committee Chairperson.',
      'GENDER BALANCE RULE: The Chairperson and First Vice Chairperson SHALL NOT be of the same gender.',
      'Term of office is one spiritual year.',
    ],
    fullText: `10.1 COMPOSITION OF EXECUTIVE COMMITTEE:
1. Chairperson
2. First Vice Chairperson
3. Second Vice Chairperson
4. Secretary
5. Vice Secretary
6. Treasurer
7. Prayer Committee Chairperson
8. Worship Committee Chairperson
9. Mission Committee Chairperson
10. Discipleship Committee Chairperson
11. Assets Committee Chairperson
12. Publicity Committee Chairperson
13. Non-Residents Committee Chairperson

10.2 CONSTITUTIONAL GENDER RULE:
"The Chairperson and the First Vice Chairperson shall not be of the same gender." (Article 10.2). This is a mandatory constitutional requirement to ensure inclusive leadership representation.`,
    tags: ['leadership', 'executive committee', 'chairperson', 'secretary', 'treasurer', 'gender rule'],
  },
  {
    id: 'art-11',
    articleNumber: 'Article 11',
    title: 'Duties of Executive Committee Members',
    chapter: 'Chapter 3: Governance & Leadership',
    summary: 'Constitutional responsibilities of individual executive office bearers.',
    keyPoints: [
      'Chairperson: Overall spiritual head and official representative of TUMCU.',
      'First Vice Chairperson: Deputizes chairperson, coordinates committees and welfare.',
      'Second Vice Chairperson: Coordinates discipleship, Bible study, and non-resident fellowships.',
      'Secretary: Official records, minutes, correspondence, member registry, and certificates.',
      'Treasurer: Custodian of funds, financial reporting, budgeting, and bookkeeping.',
    ],
    fullText: `Detailed duties for each of the 13 executive committee members in upholding the vision, administering ministry budgets, ensuring spiritual vitality, and submitting audited reports.`,
    tags: ['duties', 'responsibilities', 'chairperson', 'secretary', 'treasurer'],
  },
  {
    id: 'art-12',
    articleNumber: 'Article 12',
    title: 'Standing and Ad Hoc Committees',
    chapter: 'Chapter 3: Governance & Leadership',
    summary: 'Standing committees corresponding to core operational pillars.',
    keyPoints: [
      'Standing committees: Prayer, Worship, Missions, Discipleship, Assets, Hospitality, Publicity, Treasury, Non-Residents, and Welfare.',
      'Ad hoc committees created by Executive Committee for specific tasks and disbanded upon completion.',
    ],
    fullText: `Standing committees shall assist the Executive Committee in executing specific mandates under the oversight of respective committee chairpersons.`,
    tags: ['committees', 'standing committee', 'ad hoc committee'],
  },
  {
    id: 'art-13',
    articleNumber: 'Article 13',
    title: 'Advisory Board and Patron',
    chapter: 'Chapter 3: Governance & Leadership',
    summary: 'Custodial and advisory oversight structure.',
    keyPoints: [
      'Advisory Board: FOCUS Kenya staff member, two Christian professionals, Patron, and two Associate Members.',
      'Patron: A Christian academic/administrative staff member of TUM appointed by Executive Committee in consultation with University.',
      'Role is strictly advisory and custodial without executive administrative veto.',
    ],
    fullText: `13.1 THE ADVISORY BOARD:
Composed of: (a) FOCUS Kenya Staff, (b) Patron, (c) Two Christian Professionals, (d) Two Associate Members.
Role: Provides spiritual guidance, counsel during crises, and custodial continuity.
13.2 THE PATRON:
Must be a born-again Christian staff member of TUM, acts as the primary liaison between TUMCU and the University Administration.`,
    tags: ['advisory board', 'patron', 'focus', 'associate', 'professionals'],
  },
  {
    id: 'art-14',
    articleNumber: 'Article 14',
    title: 'Nomination and Leadership Appointment',
    chapter: 'Chapter 4: Nomination & Transition',
    summary: 'Nomination College workflow, member recommendations, eligibility, and objections window.',
    keyPoints: [
      'Nomination College: Outgoing Chairperson, Secretary, Advisory Board rep, FOCUS staff, and vetted Full Members.',
      'Eligibility Requirements (Article 14.3): Registered TUMCU member for at least two academic semesters; demonstrated spiritual maturity and leadership; active commitment to activities; clear academic standing.',
      'Candidate consent is mandatory.',
      'Objections must be submitted in writing with biblical justification at least 7 days before the AGM.',
      'Final confirmation and commission takes place at the AGM.',
    ],
    fullText: `14.1 NOMINATION PROCESS:
(a) Member notification 21 days before the nomination exercise.
(b) Recommendation of candidates by members.
(c) Nomination College vets candidates against Article 14.3 eligibility criteria.
(d) Vetted candidate list published to members.
(e) Written objections window closes 7 days before the AGM.
(f) Official confirmation of incoming Executive Committee at the AGM.`,
    tags: ['nomination', 'elections', 'eligibility', 'nomination college', 'objections', 'agm confirmation'],
  },
  {
    id: 'art-16',
    articleNumber: 'Article 16',
    title: 'The 10 Constitutional Ministries',
    chapter: 'Chapter 5: Ministries & Operations',
    summary: 'Exhaustive list and mandates of the 10 constitutional ministries.',
    keyPoints: [
      '1. Intercessory Ministry: Prayer chains, Keshas, fasting, dedication services.',
      '2. Praise and Worship Ministry: Leading praise and worship, vocal training, Sunday services.',
      '3. Instrumentalists Ministry: Instruments coordination, training, equipment maintenance.',
      '4. Ushering Ministry: Hospitality, venue preparation, orderliness, collections.',
      '5. Catering Ministry: Food services, catering for guest speakers and CU events.',
      '6. Media Ministry: Livestreaming, publications, photography, website, and digital outreach.',
      '7. Creative Ministry: Christian drama, poetry, spoken word, dance, and creative arts.',
      '8. Technicians Ministry: Sound engineering, PA systems, lighting, and technical repairs.',
      '9. High School Ministry: Secondary school evangelism, mentorship, and weekend challenges.',
      '10. Hospital Ministry: Hospital and prison visitation, prayer, compassion, and welfare packages.',
    ],
    fullText: `Article 16.1 defines the 10 official ministries of TUMCU. Every ministry is led by a Ministry Leader appointed through the constitutional leadership process and assisted by an executive subcommittee.`,
    tags: ['ministries', 'intercessory', 'worship', 'instrumentalists', 'ushering', 'catering', 'media', 'creative', 'technicians', 'high school', 'hospital'],
  },
  {
    id: 'art-18',
    articleNumber: 'Article 18',
    title: 'Finances, Bank Accounts & Asset Custody',
    chapter: 'Chapter 6: Stewardship & Finance',
    summary: 'Financial management, 2-signatory rule, and asset registers.',
    keyPoints: [
      'TUMCU maintains approved bank accounts in reputable financial institutions.',
      'Mandatory Signatories: All withdrawals must be authorized by Executive Committee resolution and signed by two designated signatories (Treasurer + Chairperson/Secretary).',
      'Annual Budget must be presented and approved by the AGM.',
      'Assets Register maintained by Assets Committee Chairperson; equipment lending must record the responsible technician.',
    ],
    fullText: `18.1 BANK ACCOUNTS & SIGNATORIES:
All Union funds shall be deposited in approved bank accounts. Withdrawals require prior Executive Committee approval and two authorized signatures.
18.2 ASSETS & AUDIT:
An annual financial audit shall be conducted before the AGM. All Union properties and audio-visual gear shall be entered into the permanent Asset Register.`,
    tags: ['finance', 'finances', 'bank account', 'signatories', 'budget', 'assets', 'audit'],
  },
  {
    id: 'art-19',
    articleNumber: 'Article 19',
    title: 'Welfare, Guidance and Benevolence',
    chapter: 'Chapter 7: Member Welfare',
    summary: 'Support for members facing emergencies, bereavement, or financial distress.',
    keyPoints: [
      'Welfare Kitty allocated to support needy students and emergency interventions.',
      'Guidance and counselling administered with strict confidentiality and pastoral care.',
      'Welfare requests vetted by First Vice Chairperson and Welfare Committee.',
    ],
    fullText: `TUMCU shall maintain a dedicated Welfare Fund to provide compassionate support, food assistance, emergency medical support, and pastoral guidance to students in distress.`,
    tags: ['welfare', 'benevolence', 'guidance', 'counselling', 'financial aid'],
  },
  {
    id: 'art-21',
    articleNumber: 'Article 21',
    title: 'Constitutional Review and Amendments',
    chapter: 'Chapter 8: Amendments & Dissolution',
    summary: 'Strict procedure for constitutional amendments.',
    keyPoints: [
      'Constitutional Review Committee (CRC) appointed by Executive Committee when review is due.',
      'Proposed amendments published to members at least 21 days before the AGM.',
      'Adoption requires a 2/3 majority vote of Full Members present at a quorate AGM.',
    ],
    fullText: `No amendment to this Constitution shall be made except at an Annual General Meeting or Special General Meeting called for that purpose, and approved by a two-thirds (2/3) majority of Full Members present and voting.`,
    tags: ['amendments', 'constitutional review', 'crc', 'voting threshold'],
  },
  {
    id: 'art-23',
    articleNumber: 'Article 23',
    title: 'Dissolution and Asset Disposal',
    chapter: 'Chapter 8: Amendments & Dissolution',
    summary: 'Dissolution terms and transfer of assets to evangelical Christian bodies.',
    keyPoints: [
      'Dissolution requires a Special General Meeting with 4/5 majority vote.',
      'Remaining assets cannot be distributed to individual members, but handed over to FOCUS Kenya or an evangelical body with identical objectives.',
    ],
    fullText: `In the event of dissolution of the Union, any remaining assets after settlement of liabilities shall be transferred to the Fellowship of Christian Unions (FOCUS Kenya) or a similar Christian organization with the same doctrinal basis.`,
    tags: ['dissolution', 'assets disposal', 'focus kenya'],
  },
];

const QUICK_SEARCH_TAGS = [
  { label: 'All Articles', query: '' },
  { label: 'Membership (Art. 5)', query: 'membership' },
  { label: 'Leadership (Art. 10)', query: 'leadership' },
  { label: 'Gender Rule (Art. 10.2)', query: 'gender rule' },
  { label: 'Nomination (Art. 14)', query: 'nomination' },
  { label: 'Discipline (Art. 6.2)', query: 'discipline' },
  { label: 'Ministries (Art. 16)', query: 'ministries' },
  { label: 'Finance (Art. 18)', query: 'finance' },
  { label: 'AGM & Quorum (Art. 9)', query: 'agm' },
  { label: 'Welfare (Art. 19)', query: 'welfare' },
];

export function ConstitutionPage() {
  const [search, setSearch] = useState('');
  const [activeChapter, setActiveChapter] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

  const chapters = useMemo(() => {
    const list = Array.from(new Set(CONSTITUTION_ARTICLES.map((a) => a.chapter)));
    return ['all', ...list];
  }, []);

  const filteredArticles = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CONSTITUTION_ARTICLES.filter((item) => {
      const matchChapter = activeChapter === 'all' || item.chapter === activeChapter;
      if (!q) return matchChapter;
      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        item.articleNumber.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.fullText.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchChapter && matchSearch;
    });
  }, [search, activeChapter]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <section className="mesh-hero-bg px-5 pt-12 pb-16 sm:px-6 lg:pt-16 lg:pb-20 border-b border-slate-200/70">
        <div className="page-shell">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="eyebrow flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary-700" />
                <span>OFFICIAL GOVERNING CHARTER</span>
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-primary-950 sm:text-5xl lg:text-6xl">
                TUMCU Constitution <span className="text-primary-600">2024</span>
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                The governing functional specification of the Technical University of Mombasa Christian Union, establishing our doctrinal basis, membership covenants, governance organs, and operational ministries.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 size={13} /> Active & Ratified 2024
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3.5 py-1.5 text-xs font-bold text-primary-800">
                  <BookOpen size={13} /> 24 Constitutional Articles
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-bold text-amber-800">
                  <Scale size={13} /> Supreme Legal Authority
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 shadow-xs hover:bg-white hover:text-primary-900 transition active:scale-98"
              >
                <Printer size={16} /> Print Constitution
              </button>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-900/15 hover:bg-primary-800 transition active:scale-98"
              >
                Sign Declaration & Join <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* Constitutional Precedence Disclaimer */}
          <div className="mt-8 rounded-2xl border border-amber-300/80 bg-amber-50/90 p-4 text-xs font-medium text-amber-900 shadow-xs flex items-start gap-3">
            <AlertCircle size={17} className="shrink-0 text-amber-700 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Constitutional Disclaimer:</strong> Where there is any conflict between this website system and the official TUMCU Constitution 2024, the Constitution shall take absolute precedence.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Search & Filter Bar */}
      <section className="page-shell pt-10">
        <Card variant="glass" className="p-5 shadow-lg border border-white/80">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search constitution by article, term, or keyword..."
                className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary-600 focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Chapter Selector */}
            <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-500 shrink-0">Chapter:</span>
              <select
                value={activeChapter}
                onChange={(e) => setActiveChapter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-primary-600"
              >
                {chapters.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch === 'all' ? 'All Chapters' : ch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick-Search Tags */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Topics:</span>
            {QUICK_SEARCH_TAGS.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => setSearch(tag.query)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition active:scale-95 ${
                  search.toLowerCase() === tag.query.toLowerCase() && (tag.query !== '' || search === '')
                    ? 'bg-primary-900 text-white'
                    : 'border border-slate-200 bg-white/60 text-slate-600 hover:bg-primary-50 hover:text-primary-900'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Articles Grid / List */}
      <section className="page-shell pt-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            Showing {filteredArticles.length} constitutional section{filteredArticles.length === 1 ? '' : 's'}
          </span>
          {search && (
            <span className="text-xs font-medium text-primary-700">
              Matching query: &ldquo;{search}&rdquo;
            </span>
          )}
        </div>

        {filteredArticles.length === 0 ? (
          <Card variant="glass" className="text-center py-12">
            <BookOpen size={36} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-bold text-slate-700">No constitutional articles found</h3>
            <p className="text-xs text-slate-500 mt-1">Try another keyword like &ldquo;leadership&rdquo;, &ldquo;finance&rdquo;, or &ldquo;discipline&rdquo;.</p>
            <Button variant="secondary" onClick={() => { setSearch(''); setActiveChapter('all'); }} className="mt-4 text-xs">
              Reset Search Filters
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                variant="glass"
                className="p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-200 border border-white/80"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-xl bg-primary-100/70 text-primary-900 px-3 py-1 text-xs font-black">
                      {article.articleNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">{article.chapter}</span>
                  </div>

                  <h3 className="text-lg font-black text-primary-950 mt-1">{article.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{article.summary}</p>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Core Highlights</span>
                    {article.keyPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                        <span className="leading-snug">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedArticle(article)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-900 hover:underline"
                  >
                    Read Full Text <ChevronRight size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Full Article Text Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded-lg bg-primary-100 px-2.5 py-1 text-xs font-black text-primary-900">
                  {selectedArticle.articleNumber}
                </span>
                <h2 className="text-xl font-bold text-primary-950 mt-2">{selectedArticle.title}</h2>
                <p className="text-xs text-slate-500">{selectedArticle.chapter}</p>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {selectedArticle.fullText}
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">TUMCU Constitution 2024</span>
              <Button variant="secondary" onClick={() => setSelectedArticle(null)}>
                Close Article
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
