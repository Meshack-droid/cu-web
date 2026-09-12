import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Church,
  Shield,
  CheckCircle2,
  AlertTriangle,
  UserX,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { type AdminUser, type UserRoleAssignment } from '@/features/admin/admin.api';

interface MemberProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: AdminUser | null;
  userRoles?: UserRoleAssignment[];
  onChangeAccess: (member: AdminUser) => void;
  onRevokeRole: (assignmentId: string, roleName: string) => void;
}

export function MemberProfileDrawer({
  isOpen,
  onClose,
  member,
  userRoles = [],
  onChangeAccess,
  onRevokeRole,
}: MemberProfileDrawerProps) {
  if (!isOpen || !member) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-900 text-white font-black text-lg shadow-sm">
                {member.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{member.full_name}</h3>
                <p className="text-xs text-slate-500 font-mono">{member.admission_number || 'TUMCU Member'}</p>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 size={11} className="text-emerald-600" /> Active TUMCU Member
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Contact Details */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Contact & Profile Information
              </span>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span>Year: {member.year_of_study || 'Year 1'} • Member since 2026</span>
                </div>
              </div>
            </div>

            {/* Current Assigned Access & Roles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Current Administrative Access
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChangeAccess(member)}
                  className="text-[11px] font-bold h-7 gap-1 bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100"
                >
                  <KeyRound size={12} /> Assign New Role
                </Button>
              </div>

              {userRoles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                  <Shield size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Standard Member</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    This user holds standard member self-service permissions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userRoles.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{assignment.role_name}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-bold text-slate-700">
                              {assignment.scope_type === 'ministry'
                                ? assignment.scope_name || 'Ministry'
                                : assignment.scope_type === 'committee'
                                ? assignment.scope_name || 'Committee'
                                : 'Union-Wide'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            Scope: {assignment.scope_type}
                          </p>
                        </div>

                        <button
                          onClick={() => onRevokeRole(assignment.id, assignment.role_name)}
                          className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Remove this role"
                        >
                          <UserX size={15} />
                        </button>
                      </div>

                      {/* Human-readable capabilities */}
                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Capabilities in this scope:
                        </span>
                        <div className="space-y-1 text-xs text-slate-600">
                          {assignment.scope_type === 'ministry' ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> View & manage ministry members
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Record rehearsal & service attendance
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Schedule ministry meetings
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Submit reports & requisitions
                              </div>
                            </>
                          ) : assignment.role_code === 'treasurer' ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Process financial requests
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Manage accounts & receipts
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Financial reporting
                              </div>
                            </>
                          ) : assignment.role_code === 'secretary' ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Review membership applications
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Manage general meetings & minutes
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Official announcements
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Executive governance
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Program oversight & reporting
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-bold">
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => onChangeAccess(member)}
              className="text-xs font-bold bg-primary-900 text-white hover:bg-primary-950"
            >
              Modify Access
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
