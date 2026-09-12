import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  UserCheck,
  Shield,
  Search,
  CheckCircle,
  AlertCircle,
  Award,
} from 'lucide-react';
import { Button } from '@/components/Button';
import {
  fetchLeadershipPositions,
  assignLeader,
  type LeadershipPosition,
} from '@/features/leadership/leadership.api';
import { searchUsers } from '@/features/admin/admin.api';

interface LeaderAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPositionId?: string;
  selectedPositionId?: string;
  leadershipPositions?: LeadershipPosition[];
}

export function LeaderAppointmentModal({
  isOpen,
  onClose,
  defaultPositionId,
  selectedPositionId: incomingSelectedPosId,
  leadershipPositions: initialPositions,
}: LeaderAppointmentModalProps) {
  const queryClient = useQueryClient();
  const [selectedPositionId, setSelectedPositionId] = useState(
    incomingSelectedPosId || defaultPositionId || ''
  );
  const [assignmentType, setAssignmentType] = useState<'permanent' | 'acting' | 'co-opted' | 'temporary'>('permanent');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [notes, setNotes] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: positions = [] } = useQuery<LeadershipPosition[]>({
    queryKey: ['leadership-positions'],
    queryFn: fetchLeadershipPositions,
    enabled: isOpen,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['admin-user-search', userSearch],
    queryFn: () => searchUsers(userSearch),
    enabled: userSearch.trim().length >= 2,
  });

  const selectedPosition = positions.find((p) => p.id === selectedPositionId);

  const mutation = useMutation({
    mutationFn: () =>
      assignLeader({
        positionId: selectedPositionId,
        userId: selectedUserId,
        assignmentType,
        academicYear,
        notes,
      }),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['leadership-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['leadership-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['my-responsibilities'] });
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setSelectedUserId('');
        setSelectedUserName('');
        setUserSearch('');
        setNotes('');
      }, 1500);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Constitutional Leader Appointment</h2>
              <p className="text-xs text-slate-500">Derives system permissions and constitutional authority</p>
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
            <h3 className="text-base font-bold text-slate-900">Leader Appointed Successfully!</h3>
            <p className="text-xs text-slate-500">
              {selectedUserName} now holds the constitutional office with all delegated responsibilities.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="py-4 space-y-3.5"
          >
            {/* 1. Position Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Constitutional Position *
              </label>
              <select
                required
                value={selectedPositionId}
                onChange={(e) => setSelectedPositionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Select Constitutional Office --</option>
                <optgroup label="Executive Committee (Article 12)">
                  {positions
                    .filter((p) => p.category === 'executive')
                    .map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name} ({pos.code})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Constitutional Committees (Article 13)">
                  {positions
                    .filter((p) => p.category === 'committee')
                    .map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name} ({pos.code})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Position Requirements & Reference Info */}
            {selectedPosition && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>{selectedPosition.name}</span>
                  <span className="text-indigo-600">{selectedPosition.constitutional_reference}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{selectedPosition.description}</p>
                {selectedPosition.responsibilities && selectedPosition.responsibilities.length > 0 && (
                  <div className="pt-1 text-[11px] text-slate-700">
                    <span className="font-medium text-slate-900">Key Duties: </span>
                    {selectedPosition.responsibilities.slice(0, 2).join('; ')}...
                  </div>
                )}
              </div>
            )}

            {/* 2. User Search & Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Candidate / Member *
              </label>
              {selectedUserId ? (
                <div className="flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs">
                  <div className="font-semibold text-indigo-900">{selectedUserName}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId('');
                      setSelectedUserName('');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type name, email or admission number to search..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                      {searchResults.map((usr) => (
                        <button
                          type="button"
                          key={usr.id}
                          onClick={() => {
                            setSelectedUserId(usr.id);
                            setSelectedUserName(`${usr.full_name} (${usr.admission_number || usr.email})`);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-800">{usr.full_name}</span>
                          <span className="text-[11px] text-slate-400">{usr.admission_number || usr.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Appointment Type & Academic Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Appointment Type
                </label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="permanent">Substantive (Permanent)</option>
                  <option value="acting">Acting Appointment (Article 9.4)</option>
                  <option value="co-opted">Co-opted Member (Article 9.2)</option>
                  <option value="temporary">Temporary Assignment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tenure Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 4. Notes / Constitutional Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Appointment Notes / Resolution Reference
              </label>
              <input
                type="text"
                placeholder="e.g. Approved pursuant to Executive Committee Resolution #12"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!selectedPositionId || !selectedUserId || mutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                {mutation.isPending ? 'Appointing...' : 'Confirm Appointment'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
