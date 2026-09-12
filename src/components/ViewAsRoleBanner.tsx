import React from 'react';
import { Eye, X, Check, RefreshCw } from 'lucide-react';
import { useViewAsStore, type SimulatedRole } from '@/store/viewAs.store';

export function ViewAsRoleBanner() {
  const { isSimulating, simulatedRole, simulatedMinistryName, clearSimulation, setSimulation } =
    useViewAsStore();

  if (!isSimulating) return null;

  const roleLabels: Record<SimulatedRole, string> = {
    super_admin: 'Super Admin',
    chairperson: 'Chairperson',
    secretary: 'Secretary',
    treasurer: 'Treasurer',
    ministry_leader: `Ministry Leader (${simulatedMinistryName})`,
    member: 'Regular Member',
  };

  return (
    <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold shadow-sm sticky top-0 z-50 flex items-center justify-between border-b border-amber-500">
      <div className="flex items-center gap-2">
        <Eye size={15} className="text-slate-900 animate-pulse" />
        <span>
          <span className="font-black uppercase tracking-wider text-[11px] bg-slate-950 text-white px-2 py-0.5 rounded-full mr-2">
            Admin Preview
          </span>
          Simulating View as: <span className="underline decoration-slate-900 font-black">{roleLabels[simulatedRole]}</span>
        </span>
        <span className="hidden md:inline-block text-[11px] font-normal text-slate-800">
          (Previewing UI & workflow visibility for this role. Backend security remains active.)
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Switch Dropdown */}
        <select
          value={simulatedRole}
          onChange={(e) => setSimulation(e.target.value as SimulatedRole)}
          className="rounded-lg border border-slate-950/20 bg-amber-300 text-slate-950 px-2 py-1 text-[11px] font-bold outline-none cursor-pointer"
        >
          <option value="member">View as Member</option>
          <option value="ministry_leader">View as Ministry Leader</option>
          <option value="secretary">View as Secretary</option>
          <option value="treasurer">View as Treasurer</option>
          <option value="chairperson">View as Chairperson</option>
        </select>

        <button
          onClick={clearSimulation}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white hover:bg-slate-800 transition"
        >
          <X size={13} /> Exit Preview
        </button>
      </div>
    </div>
  );
}
