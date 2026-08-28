import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Info, ArrowRight } from 'lucide-react';

export interface GuideStep {
  title: string;
  description: string;
  badge?: string;
}

export interface PageHeaderGuideProps {
  title: string;
  badge?: string;
  subtitle: string;
  summarySteps?: GuideStep[];
  quickTips?: string[];
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
  };
}

export function PageHeaderGuide({
  title,
  badge,
  subtitle,
  summarySteps,
  quickTips,
  actionButton,
}: PageHeaderGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6 rounded-3xl border border-white/80 bg-white/70 p-5 sm:p-6 shadow-sm backdrop-blur-xl transition-all">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {badge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100/80 px-2.5 py-0.5 text-[11px] font-black text-primary-900">
                <Sparkles size={11} className="text-primary-700" />
                {badge}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary-950 truncate">
              {title}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {(summarySteps || quickTips) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary-900 transition shadow-sm active:scale-95"
              aria-expanded={isExpanded}
            >
              <HelpCircle size={15} className="text-primary-600" />
              <span>{isExpanded ? 'Hide Guide' : 'How this works'}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary-900 hover:bg-primary-800 text-white px-4 py-2 text-xs font-bold shadow-md shadow-primary-900/15 transition active:scale-95"
            >
              {actionButton.icon && <actionButton.icon size={15} />}
              <span>{actionButton.label}</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (summarySteps || quickTips) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-100 mt-4 pt-4"
          >
            {summarySteps && summarySteps.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Info size={13} className="text-primary-600" />
                  <span>Simple Step-by-Step Flow</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {summarySteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="flex items-center gap-1.5 text-xs font-black text-primary-900">
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-900 text-white text-[10px]">
                              {idx + 1}
                            </span>
                            {step.title}
                          </span>
                          {step.badge && (
                            <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 shadow-xs border border-slate-100">
                              {step.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quickTips && quickTips.length > 0 && (
              <div className="rounded-2xl bg-amber-50/60 border border-amber-200/60 p-3 text-xs text-amber-950 flex items-start gap-2.5">
                <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Helpful Tips:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    {quickTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
