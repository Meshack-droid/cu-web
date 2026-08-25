import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, XCircle } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
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
      <div className="flex items-center gap-1.5 text-xs font-medium text-danger">
        <XCircle size={14} /> Rejected
      </div>
    );
  }
  const currentIndex = APPROVAL_STEPS.findIndex((s) => s.status === status);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {APPROVAL_STEPS.map((step, i) => (
        <div key={step.status} className="flex items-center gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              i <= currentIndex ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {step.label}
          </span>
          {i < APPROVAL_STEPS.length - 1 && <span className="text-slate-300">›</span>}
        </div>
      ))}
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

  if (!open) {
    return (
      <Button variant="primary" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus size={16} /> New Expense Request
      </Button>
    );
  }

  return (
    <Card variant="flat">
      <div className="mb-3 text-sm font-medium text-primary-900">New Expense Request</div>
      <div className="flex flex-col gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
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
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        />
        <textarea
          placeholder="What is this expense for?"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm"
        />
        <div className="flex gap-2">
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
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">Finance</h1>
          <p className="text-sm text-slate-500">Expense requests and the approval chain</p>
        </div>
        {hasPermission('finance.request') && <NewExpenseForm onCreated={invalidate} />}
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 rounded-[var(--radius-card)] bg-slate-100" />
          ))}
        </div>
      )}

      {!isLoading && expenses?.length === 0 && (
        <Card className="text-center text-sm text-slate-500">No expense requests yet.</Card>
      )}

      <div className="flex flex-col gap-3">
        {expenses?.map((exp) => (
          <Card key={exp.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-medium text-gold-600">
                    {EXPENSE_TYPE_LABELS[exp.expense_type] ?? exp.expense_type}
                  </span>
                  <span className="text-sm font-semibold text-primary-900">
                    KES {Number(exp.amount).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">{exp.description}</p>
                {exp.rejection_reason && (
                  <p className="mt-1 text-xs text-danger">Rejected: {exp.rejection_reason}</p>
                )}
                {exp.receipt_number && (
                  <p className="mt-1 text-xs text-slate-400">Receipt: {exp.receipt_number}</p>
                )}
              </div>
            </div>

            <div className="mt-3">
              <ApprovalTrail status={exp.status} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {exp.status === 'requested' && hasPermission('finance.treasurer_review') && (
                <Button
                  className="gap-1.5 px-3 py-1.5 text-xs"
                  loading={treasurerMutation.isPending}
                  onClick={() => treasurerMutation.mutate(exp.id)}
                >
                  <CheckCircle2 size={14} /> Treasurer Review
                </Button>
              )}
              {exp.status === 'treasurer_reviewed' && hasPermission('finance.secretary_verify') && (
                <Button
                  className="gap-1.5 px-3 py-1.5 text-xs"
                  loading={secretaryMutation.isPending}
                  onClick={() => secretaryMutation.mutate(exp.id)}
                >
                  <CheckCircle2 size={14} /> Secretary Verify
                </Button>
              )}
              {exp.status === 'secretary_verified' && hasPermission('finance.approve') && (
                <Button
                  className="gap-1.5 px-3 py-1.5 text-xs"
                  loading={chairpersonMutation.isPending}
                  onClick={() => chairpersonMutation.mutate(exp.id)}
                >
                  <CheckCircle2 size={14} /> Chairperson Approve
                </Button>
              )}
              {exp.status === 'chairperson_approved' && hasPermission('finance.pay') && (
                <Button
                  className="gap-1.5 px-3 py-1.5 text-xs"
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
                        className="rounded-[var(--radius-input)] border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                      <Button
                        className="px-3 py-1.5 text-xs"
                        disabled={!receiptNumber.trim()}
                        loading={receiptMutation.isPending}
                        onClick={() => receiptMutation.mutate({ id: exp.id, receiptNumber })}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="gap-1.5 px-3 py-1.5 text-xs"
                      onClick={() => setReceiptDraftId(exp.id)}
                    >
                      <CheckCircle2 size={14} /> Record Receipt
                    </Button>
                  )}
                </>
              )}
              {exp.status === 'receipted' && hasPermission('finance.audit') && (
                <Button
                  className="gap-1.5 px-3 py-1.5 text-xs"
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
                      className="rounded-[var(--radius-input)] border border-slate-200 px-2.5 py-1.5 text-xs"
                    />
                    <Button
                      variant="danger"
                      className="px-3 py-1.5 text-xs"
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
                    className="gap-1.5 px-3 py-1.5 text-xs"
                    onClick={() => setRejectingId(exp.id)}
                  >
                    <XCircle size={14} /> Reject
                  </Button>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
