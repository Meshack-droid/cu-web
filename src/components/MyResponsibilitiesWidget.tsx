import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Scroll,
  AlertCircle,
  CheckCircle,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { fetchMyResponsibilities } from '@/features/leadership/leadership.api';
import { Link } from 'react-router-dom';

export function MyResponsibilitiesWidget() {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-responsibilities'],
    queryFn: fetchMyResponsibilities,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !data || data.positions.length === 0) {
    // If not currently holding an active leadership appointment, show clean constitutional role badge
    return (
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">
              TUMCU Fellowship Governance
            </div>
            <div className="text-xs text-slate-500">
              Constitutional Rights: Full Voting Member • General Assembly Participant
            </div>
          </div>
        </div>
        <Link to="/constitution">
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <Scroll className="w-3.5 h-3.5" />
            Constitution
          </Button>
        </Link>
      </div>
    );
  }

  const primaryPos = data.positions[0];

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 shadow-sm overflow-hidden mb-6">
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Constitutional Office
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {primaryPos.constitutional_reference || 'Article 12 • TUMCU Constitution'}
                </span>
                {primaryPos.assignment_type === 'acting' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Acting Appointment
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {primaryPos.position_name}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Holder: <span className="font-semibold text-slate-800">{data.user.name}</span> • Term: 2025/2026 Academic Spiritual Year
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard/admin">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5" />
                CU Administration
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs gap-1.5 text-slate-700 border-slate-300"
            >
              {expanded ? 'Hide Responsibilities' : 'My Responsibilities'}
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Attention Badges */}
        {(data.pending_attention.membership_applications > 0 ||
          data.pending_attention.leadership_vacancies > 0 ||
          data.pending_attention.meetings_awaiting_minutes > 0 ||
          data.pending_attention.finance_awaiting_action > 0) && (
          <div className="mt-4 pt-3 border-t border-indigo-100/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {data.pending_attention.membership_applications > 0 && (
              <div className="bg-blue-50/80 border border-blue-200/60 rounded-lg p-2.5">
                <div className="text-[11px] text-blue-700 font-medium">Pending Memberships</div>
                <div className="text-base font-bold text-blue-900">
                  {data.pending_attention.membership_applications} review required
                </div>
              </div>
            )}
            {data.pending_attention.leadership_vacancies > 0 && (
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-2.5">
                <div className="text-[11px] text-amber-700 font-medium">Constitutional Vacancies</div>
                <div className="text-base font-bold text-amber-900">
                  {data.pending_attention.leadership_vacancies} to co-opt
                </div>
              </div>
            )}
            {data.pending_attention.meetings_awaiting_minutes > 0 && (
              <div className="bg-indigo-50/80 border border-indigo-200/60 rounded-lg p-2.5">
                <div className="text-[11px] text-indigo-700 font-medium">Minutes Awaiting</div>
                <div className="text-base font-bold text-indigo-900">
                  {data.pending_attention.meetings_awaiting_minutes} meeting
                </div>
              </div>
            )}
            {data.pending_attention.finance_awaiting_action > 0 && (
              <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-lg p-2.5">
                <div className="text-[11px] text-emerald-700 font-medium">Finance Resolutions</div>
                <div className="text-base font-bold text-emerald-900">
                  {data.pending_attention.finance_awaiting_action} signatures
                </div>
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-slate-200 space-y-4 text-xs"
            >
              <div>
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  Mandated Constitutional Responsibilities
                </h4>
                <ul className="space-y-1.5 pl-5 list-disc text-slate-700">
                  {data.all_responsibilities.map((resp, i) => (
                    <li key={i} className="leading-relaxed">
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>

              {data.constitutional_restrictions.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <h4 className="font-semibold text-rose-900 flex items-center gap-1.5 mb-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    Constitutional Restrictions & Separation of Powers
                  </h4>
                  <ul className="space-y-1 pl-5 list-disc text-rose-800">
                    {data.constitutional_restrictions.map((restr, i) => (
                      <li key={i} className="leading-relaxed">
                        {restr}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
