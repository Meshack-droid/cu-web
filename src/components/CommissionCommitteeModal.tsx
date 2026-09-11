import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Users, Calendar, Award, CheckCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { createCustomCommittee } from '@/features/admin/admin.api';

interface CommissionCommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommissionCommitteeModal({ isOpen, onClose }: CommissionCommitteeModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [chairpersonName, setChairpersonName] = useState('');
  const [secretaryName, setSecretaryName] = useState('');
  const [memberCount, setMemberCount] = useState(5);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('2026-06-30');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createCustomCommittee({
        name,
        purpose,
        chairpersonName,
        secretaryName,
        memberCount: Number(memberCount),
        startDate,
        endDate,
      }),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['custom-committees'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-summary'] });
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setName('');
        setPurpose('');
        setChairpersonName('');
        setSecretaryName('');
      }, 1500);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Commission Ad-Hoc Committee</h2>
              <p className="text-xs text-slate-500">Pursuant to Article 14 of the TUMCU Constitution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Committee Commissioned!</h3>
            <p className="text-xs text-slate-500">The ad-hoc committee has been registered in the CU directory.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="py-4 space-y-3.5"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Committee Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Missions Outreach Planning Committee 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mandate & Purpose *</label>
              <textarea
                required
                rows={2}
                placeholder="Specific terms of reference and constitutional objectives"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chairperson *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={chairpersonName}
                  onChange={(e) => setChairpersonName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Secretary</label>
                <input
                  type="text"
                  placeholder="Full Name (optional)"
                  value={secretaryName}
                  onChange={(e) => setSecretaryName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Members</label>
                <input
                  type="number"
                  min={2}
                  max={25}
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={mutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                {mutation.isPending ? 'Commissioning...' : 'Commission Committee'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
