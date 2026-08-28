import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, XCircle, DollarSign, Receipt } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PageHeaderGuide } from '@/components/PageHeaderGuide';
import { useAuthStore } from '@/store/auth.store';
import {
  APPROVAL_STEPS,
  EXPENSE_TYPE_LABELS,
  chairpersonApprove,
  createExpense,
  fetchExpenses,
  markAudited,
  markPaid,
  recordReceipt,
  rejectExpense,
  secretaryVerify,
  treasurerReview,
  type ExpenseRequest,
} from '@/features/finance/finance.api';

function ApprovalTrail({ status }: { status: ExpenseRequest['status'] }) {
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
        <XCircle size={14} /> Rejected by Executive
      </div>
    );
  }
  const currentIndex = APPROVAL_STEPS.findIndex((s) => s.status === status);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {APPROVAL_STEPS.map((step, i) => {
        const isDoneOrCurrent = i <= currentIndex;
        return (
          <div key={step.status} className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                isDoneOrCurrent ? 'bg-primary-100/90 text-primary-800' : 'bg-slate-100/80 text-slate-400'
              }`}
            >
              {step.label}
            </span>
            {i < APPROVAL_STEPS.length - 1 && <span className="text-slate-300 text-xs">›</span>}
          </div>
        );
      })}
    </div>
  );
}

function NewExpenseForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('ministry');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      setOpen(false);
      setAmount('');
      setDescription('');
      onCreated();
    },
  });

  return (
    <div>
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.div
            key="btn"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <Button variant="primary" className="gap-1.5 shadow-md hover:shadow-lg transition-all" onClick={() => setOpen(true)}>
              <Plus size={16} /> New Expense Request
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-xl"
          >
            <Card variant="glass" className="border-primary-100/70 shadow-xl">
              <div className="mb-3 text-sm font-bold text-primary-950">New Expense Request</div>
              <div className="flex flex-col gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm"
                >
                  {Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount (KES)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm"
                />
                <textarea
                  placeholder="What is this expense for?"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm"
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    disabled={!amount || !description.trim()}
                    loading={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({ expense_type: type, amount: Number(amount), description })
                    }
                  >
                    Submit Request
                  </Button>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FinancePage() {
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [receiptDraftId, setReceiptDraftId] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['expenses'] });

  const makeMutation = (fn: (id: string) => Promise<ExpenseRequest>) =>
    useMutation({ mutationFn: fn, onSuccess: invalidate });

  const treasurerMutation = makeMutation(treasurerReview);
  const secretaryMutation = makeMutation(secretaryVerify);
  const chairpersonMutation = makeMutation(chairpersonApprove);
  const paidMutation = makeMutation(markPaid);
  const auditedMutation = makeMutation(markAudited);

  const receiptMutation = useMutation({
    mutationFn: ({ id, receiptNumber }: { id: string; receiptNumber: string }) =>
      recordReceipt(id, receiptNumber),
    onSuccess: () => {
      setReceiptDraftId(null);
      setReceiptNumber('');
      invalidate();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectExpense(id, reason),
    onSuccess: () => {
      setRejectingId(null);
      setReason('');
      invalidate();
    },
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Interactive Guide */}
      <PageHeaderGuide
        title="Financial Stewardship"
        badge="Constitutional Chapter 7 · 5-Stage Accountability"
        subtitle="Transparent church fund management, requisition tracking, multi-signature approvals, and digital audit reconciliation."
        summarySteps={[
          {
            title: '1. Requisition',
            description: 'Department heads submit itemized budget requests with supporting invoices or quotes.',
            badge: 'Requisition',
          },
          {
            title: '2. Multi-Sign Review',
            description: 'The Treasurer verifies line items, the Secretary checks authorization, and Chairperson grants final approval.',
            badge: 'Governance',
          },
          {
            title: '3. Disbursement & Audit',
            description: 'Funds are disbursed via bank transfer/M-Pesa, receipts are uploaded, and the Auditor reconciles the account.',
            badge: 'Audit Clear',
          },
        ]}
        quickTips={[
          'Every single shilling spent requires triple-tier authorization before disbursement.',
          'Always submit official receipts once purchases are finalized to complete the audit trail.',
          'Rejection notes are immediately visible to requestors for transparent feedback and correction.',
        ]}
      />

      <div className="flex justify-end">
        {hasPermission('finance.request') && <NewExpenseForm onCreated={invalidate} />}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/50" />
          ))}
        </div>
      )}

      {!isLoading && expenses?.length === 0 && (
        <Card variant="glass" className="p-8 text-center text-sm text-slate-500">
          <DollarSign size={32} className="mx-auto mb-2 text-slate-400" />
          No expense requests yet.
        </Card>
      )}

      <motion.div layout className="flex flex-col gap-3.5">
        <AnimatePresence mode="popLayout">
          {expenses?.map((exp, idx) => (
            <motion.div
              layout
              key={exp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
            >
              <Card variant="glass" className="p-5 transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-bold text-gold-700">
                        {EXPENSE_TYPE_LABELS[exp.expense_type] ?? exp.expense_type}
                      </span>
                      <span className="text-base font-black tracking-tight text-primary-950">
                        KES {Number(exp.amount).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{exp.description}</p>
                    {exp.rejection_reason && (
                      <p className="mt-1.5 text-xs font-bold text-red-600">Rejection Note: {exp.rejection_reason}</p>
                    )}
                    {exp.receipt_number && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Receipt size={13} className="text-primary-700" /> Receipt: {exp.receipt_number}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100/70 pt-3">
                  <ApprovalTrail status={exp.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {exp.status === 'requested' && hasPermission('finance.treasurer_review') && (
                    <Button
                      className="gap-1.5 px-3 py-1.5 text-xs font-bold"
                      loading={treasurerMutation.isPending}
                      onClick={() => treasurerMutation.mutate(exp.id)}
                    >
                      <CheckCircle2 size={14} /> Treasurer Review
                    </Button>
                  )}
                  {exp.status === 'treasurer_reviewed' && hasPermission('finance.secretary_verify') && (
                    <Button
                      className="gap-1.5 px-3 py-1.5 text-xs font-bold"
                      loading={secretaryMutation.isPending}
                      onClick={() => secretaryMutation.mutate(exp.id)}
                    >
                      <CheckCircle2 size={14} /> Secretary Verify
                    </Button>
                  )}
                  {exp.status === 'secretary_verified' && hasPermission('finance.approve') && (
                    <Button
                      className="gap-1.5 px-3 py-1.5 text-xs font-bold"
                      loading={chairpersonMutation.isPending}
                      onClick={() => chairpersonMutation.mutate(exp.id)}
                    >
                      <CheckCircle2 size={14} /> Chairperson Approve
                    </Button>
                  )}
                  {exp.status === 'chairperson_approved' && hasPermission('finance.pay') && (
                    <Button
                      className="gap-1.5 px-3 py-1.5 text-xs font-bold"
                      loading={paidMutation.isPending}
                      onClick={() => paidMutation.mutate(exp.id)}
                    >
                      <CheckCircle2 size={14} /> Mark Paid
                    </Button>
                  )}
                  {exp.status === 'paid' && hasPermission('finance.pay') && (
                    <>
                      {receiptDraftId === exp.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            placeholder="Receipt number"
                            value={receiptNumber}
                            onChange={(e) => setReceiptNumber(e.target.value)}
                            className="rounded-2xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs outline-none backdrop-blur-sm"
                          />
                          <Button
                            className="px-3 py-1.5 text-xs font-bold"
                            disabled={!receiptNumber.trim()}
                            loading={receiptMutation.isPending}
                            onClick={() => receiptMutation.mutate({ id: exp.id, receiptNumber })}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="gap-1.5 px-3 py-1.5 text-xs font-bold"
                          onClick={() => setReceiptDraftId(exp.id)}
                        >
                          <CheckCircle2 size={14} /> Record Receipt
                        </Button>
                      )}
                    </>
                  )}
                  {exp.status === 'receipted' && hasPermission('finance.audit') && (
                    <Button
                      className="gap-1.5 px-3 py-1.5 text-xs font-bold"
                      loading={auditedMutation.isPending}
                      onClick={() => auditedMutation.mutate(exp.id)}
                    >
                      <CheckCircle2 size={14} /> Mark Audited
                    </Button>
                  )}

                  {!['paid', 'receipted', 'audited', 'rejected'].includes(exp.status) &&
                    hasPermission('finance.approve') &&
                    (rejectingId === exp.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          placeholder="Rejection reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="rounded-2xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs outline-none backdrop-blur-sm"
                        />
                        <Button
                          variant="danger"
                          className="px-3 py-1.5 text-xs font-bold"
                          disabled={!reason.trim()}
                          loading={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate({ id: exp.id, reason })}
                        >
                          Confirm
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="danger"
                        className="gap-1.5 px-3 py-1.5 text-xs font-bold"
                        onClick={() => setRejectingId(exp.id)}
                      >
                        <XCircle size={14} /> Reject
                      </Button>
                    ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
