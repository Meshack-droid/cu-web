import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  BookOpen,
  HeartHandshake,
  GraduationCap,
  Compass,
  Copy,
  Check,
  RotateCcw,
  Bot,
  User,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/services/api';

export type CompanionPersona = 'prayer_comfort' | 'doctrinal_scholar' | 'campus_mentor' | 'fast_navigator';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  persona?: CompanionPersona;
}

const PERSONAS: Array<{
  id: CompanionPersona;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeColor: string;
  description: string;
  suggestions: string[];
}> = [
  {
    id: 'prayer_comfort',
    title: 'Biblical Comfort & Prayer',
    subtitle: 'Pastoral care & Scripture-grounded prayers',
    icon: HeartHandshake,
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Scripture-grounded prayers, comfort in anxiety, peace in Christ, and encouraging biblical promises.',
    suggestions: [
      'Pray for my upcoming exam anxiety',
      'Comfort for financial strain and tuition fees',
      'A prayer of thanksgiving for God’s faithfulness',
      'Scriptures on peace and trusting God',
    ],
  },
  {
    id: 'doctrinal_scholar',
    title: 'Doctrinal & Hermeneutics',
    subtitle: 'Biblical theology & orthodox truth',
    icon: BookOpen,
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Rigorous explanations of Scripture, hermeneutical context, Greek/Hebrew terms, and Christian doctrines.',
    suggestions: [
      'Explain Justification by Faith in Romans 5',
      'What is the biblical basis for the Trinity?',
      'How do I interpret Old Testament covenants?',
      'The deity of Christ in John 1',
    ],
  },
  {
    id: 'campus_mentor',
    title: 'Campus & Academic Mentor',
    subtitle: 'Balancing university life & ministry',
    icon: GraduationCap,
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Practical Christ-centered guidance for TUM studies, CATs, hostel life, time management, and purity.',
    suggestions: [
      'How to balance ministry service with engineering CATs?',
      'Dealing with negative peer pressure in student hostels',
      'Creating a disciplined morning devotional timetable',
      'Career calling and Christian stewardship',
    ],
  },
  {
    id: 'fast_navigator',
    title: 'TUMCU Campus Navigator',
    subtitle: 'Service times, venues & ministry contacts',
    icon: Compass,
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Instant answers for Sunday services, Bible study timings, ministry leaders, giving Paybill info, and venues.',
    suggestions: [
      'What are the Sunday service timings and venue?',
      'How do I join the Worship or Intercessory ministry?',
      'How do I give tithes and offerings via M-Pesa?',
      'When is the next monthly Kesha?',
    ],
  },
];

export function GeminiCompanionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePersona, setActivePersona] = useState<CompanionPersona>('prayer_comfort');
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Record<CompanionPersona, Message[]>>({
    prayer_comfort: [
      {
        id: 'msg-init-1',
        sender: 'bot',
        text: `Grace and peace to you in the name of our Lord Jesus Christ! 🕊️\n\nI am your **TUMCU Biblical Prayer & Spiritual Care Companion**. Whether you are carrying academic worries, personal trials, or seeking God's peace, I am here to share Scripture and lift prayers with you. How can we pray together today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persona: 'prayer_comfort',
      },
    ],
    doctrinal_scholar: [
      {
        id: 'msg-init-2',
        sender: 'bot',
        text: `Welcome to the **TUMCU Doctrinal & Hermeneutics Desk**! 📖\n\n"Do your best to present yourself to God as one approved, a worker who does not need to be ashamed and who correctly handles the word of truth." (2 Timothy 2:15)\n\nAsk any question regarding biblical exposition, systematic theology, or biblical doctrines.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persona: 'doctrinal_scholar',
      },
    ],
    campus_mentor: [
      {
        id: 'msg-init-3',
        sender: 'bot',
        text: `Praise God, fellow comrade! 🎓\n\nAs a Christian student at the Technical University of Mombasa, you are called to glorify God both in the sanctuary and in your lecture halls and labs. What academic, spiritual, or campus life situation would you like guidance on?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persona: 'campus_mentor',
      },
    ],
    fast_navigator: [
      {
        id: 'msg-init-4',
        sender: 'bot',
        text: `Hello and welcome! 🧭\n\nI'm your **Fast TUMCU & Campus Navigator**. I can instantly provide information on weekly fellowship programs, ministry schedules, Sunday service details, M-Pesa Giving Paybills, and university locations. What information do you need?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persona: 'fast_navigator',
      },
    ],
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activePersona, isOpen]);

  const activePersonaConfig = PERSONAS.find((p) => p.id === activePersona)!;
  const currentChatHistory = messages[activePersona];

  async function handleSend(textToSend?: string) {
    const queryText = (textToSend || inputPrompt).trim();
    if (!queryText || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      persona: activePersona,
    };

    setMessages((prev) => ({
      ...prev,
      [activePersona]: [...prev[activePersona], userMessage],
    }));
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await api.post<any>('/gemini/chat', {
        prompt: queryText,
        persona: activePersona,
        conversationHistory: currentChatHistory.map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
      });

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.data?.data?.response || 'May the Lord bless you and keep you.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persona: activePersona,
      };

      setMessages((prev) => ({
        ...prev,
        [activePersona]: [...prev[activePersona], botMessage],
      }));
    } catch (err: any) {
      const errorMessage: Message = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: `Peace be with you. "Cast all your anxiety on him because he cares for you." (1 Peter 5:7).\n\nMay God grant you strength and wisdom in this moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persona: activePersona,
      };
      setMessages((prev) => ({
        ...prev,
        [activePersona]: [...prev[activePersona], errorMessage],
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleResetChat() {
    const initMsg = messages[activePersona][0];
    setMessages((prev) => ({
      ...prev,
      [activePersona]: initMsg ? [initMsg] : [],
    }));
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        id="btn-gemini-companion-trigger"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950 px-4 py-3.5 text-white shadow-2xl ring-2 ring-gold-400/40 hover:ring-gold-400"
        title="Open TUMCU Spiritual Companion & AI Assistant"
      >
        <div className="relative grid h-8 w-8 place-items-center rounded-full bg-gold-500 text-primary-950">
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div className="text-left">
          <div className="text-xs font-black tracking-wide text-gold-400">TUMCU Companion</div>
          <div className="text-[10px] font-medium text-slate-300">Spiritual & Campus AI</div>
        </div>
      </motion.button>

      {/* Modal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-end sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 flex h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-700/30 bg-white shadow-2xl sm:max-h-[720px] sm:max-w-xl sm:rounded-3xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-500 text-primary-950 shadow-md">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-wide text-white">TUMCU Spiritual Companion</h3>
                      <p className="text-xs text-gold-300/90">Powered by Gemini AI • Technical University of Mombasa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleResetChat}
                      className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                      title="Reset chat"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Persona Selector Tabs */}
                <div className="mt-3.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {PERSONAS.map((persona) => {
                    const Icon = persona.icon;
                    const isActive = activePersona === persona.id;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => setActivePersona(persona.id)}
                        className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all ${
                          isActive
                            ? 'bg-gold-500 font-bold text-primary-950 shadow-md ring-1 ring-gold-300'
                            : 'bg-white/10 text-slate-200 hover:bg-white/20'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-primary-950' : 'text-gold-400'} />
                        <span className="mt-1 text-[11px] leading-tight font-semibold">{persona.title.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Persona Description Banner */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                <span className="font-semibold text-primary-900">{activePersonaConfig.title}:</span>
                <span className="truncate text-slate-500">{activePersonaConfig.subtitle}</span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 space-y-3.5 overflow-y-auto p-4 bg-slate-50/50">
                {currentChatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-900 text-gold-400 shadow-sm">
                        <Bot size={16} />
                      </div>
                    )}

                    <div
                      className={`group relative max-w-[85%] rounded-2xl p-3.5 text-sm shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary-900 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                        {msg.text}
                      </div>

                      <div
                        className={`mt-1.5 flex items-center justify-between text-[10px] ${
                          msg.sender === 'user' ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'bot' && (
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="ml-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-100"
                            title="Copy text"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={12} className="text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.sender === 'user' && (
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-500 text-primary-950 shadow-sm font-bold text-xs">
                        <User size={15} />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-900 text-gold-400">
                      <Bot size={16} />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 border border-slate-200 shadow-sm">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-900 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gold-500 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary-900" />
                      <span className="ml-2 text-xs font-semibold text-slate-500">Searching Scripture & Wisdom...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div className="border-t border-slate-200/80 bg-white p-2">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Suggested Prompts:
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {activePersonaConfig.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s)}
                      disabled={loading}
                      className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-gold-500 hover:bg-gold-50 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Box */}
              <div className="border-t border-slate-200 bg-white p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder={`Ask the ${activePersonaConfig.title}...`}
                    disabled={loading}
                    className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-900/10"
                  />
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || loading}
                    className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-900 text-gold-400 shadow-md transition hover:bg-primary-950 disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
