import { api, type ApiResponse } from '@/services/api';

export type ExpenseStatus =
  | 'requested'
  | 'treasurer_reviewed'
  | 'secretary_verified'
  | 'chairperson_approved'
  | 'paid'
  | 'receipted'
  | 'audited'
  | 'rejected';

export interface ExpenseRequest {
  id: string;
  expense_type: string;
  amount: number;
  currency: string;
  description: string;
  requested_by: string;
  status: ExpenseStatus;
  rejection_reason: string | null;
  receipt_number: string | null;
  created_at: string;
}

export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  ministry: 'Ministry',
  welfare: 'Welfare',
  equipment: 'Equipment',
  speaker_support: 'Speaker Support',
  missions: 'Missions',
  administration: 'Administration',
};

// Ordered so the UI can render a progress trail.
export const APPROVAL_STEPS: { status: ExpenseStatus; label: string }[] = [
  { status: 'requested', label: 'Requested' },
  { status: 'treasurer_reviewed', label: 'Treasurer Review' },
  { status: 'secretary_verified', label: 'Secretary Verification' },
  { status: 'chairperson_approved', label: 'Chairperson Approval' },
  { status: 'paid', label: 'Paid' },
  { status: 'receipted', label: 'Receipted' },
  { status: 'audited', label: 'Audited' },
];

export async function fetchExpenses() {
  const { data } = await api.get<ApiResponse<ExpenseRequest[]>>('/expenses');
  return data.data;
}

export async function createExpense(payload: {
  expense_type: string;
  amount: number;
  description: string;
}) {
  const { data } = await api.post<ApiResponse<ExpenseRequest>>('/expenses', payload);
  return data.data;
}

async function action(id: string, path: string, body: Record<string, unknown> = {}) {
  const { data } = await api.post<ApiResponse<ExpenseRequest>>(`/expenses/${id}/${path}`, body);
  return data.data;
}

export const treasurerReview = (id: string) => action(id, 'treasurer-review');
export const secretaryVerify = (id: string) => action(id, 'secretary-verify');
export const chairpersonApprove = (id: string) => action(id, 'chairperson-approve');
export const markPaid = (id: string) => action(id, 'mark-paid');
export const recordReceipt = (id: string, receiptNumber: string) =>
  action(id, 'receipt', { receiptNumber });
export const markAudited = (id: string) => action(id, 'mark-audited');
export const rejectExpense = (id: string, reason: string) => action(id, 'reject', { reason });
