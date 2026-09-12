import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useViewAsStore } from '@/store/viewAs.store';

export function AcademicYearSelector() {
  const { academicYear, semester, setAcademicYear, setSemester } = useViewAsStore();
  const [isOpen, setIsOpen] = useState(false);

  const academicYears = ['2026/2027', '2025/2026', '2024/2025'];
  const semesters = ['Semester 1', 'Semester 2', 'Special / Recess'];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
      >
        <Calendar size={14} className="text-[#006633]" />
        <span className="text-slate-400 font-normal">Term:</span>
        <span className="text-slate-900">{academicYear}</span>
        <span className="text-slate-300">•</span>
        <span className="text-emerald-700">{semester}</span>
        <ChevronDown size={13} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 text-xs">
          <div className="pb-2 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Academic Year</span>
            <div className="mt-1 space-y-1">
              {academicYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setAcademicYear(yr)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                    academicYear === yr ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{yr}</span>
                  {academicYear === yr && <Check size={14} className="text-emerald-700" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Semester Period</span>
            <div className="mt-1 space-y-1">
              {semesters.map((sem) => (
                <button
                  key={sem}
                  onClick={() => {
                    setSemester(sem);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                    semester === sem ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{sem}</span>
                  {semester === sem && <Check size={14} className="text-emerald-700" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
