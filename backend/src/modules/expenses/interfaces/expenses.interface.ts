export type ExpenseType = 'ministry' | 'welfare' | 'equipment' | 'speaker_support' | 'missions' | 'administration';

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
  expense_type: ExpenseType;
  amount: number;
  currency: string;
  description: string;
  requested_by: string;
  linked_committee_id: string | null;
  linked_ministry_id: string | null;
  linked_event_id: string | null;
  status: ExpenseStatus;
  treasurer_reviewed_by: string | null;
  treasurer_reviewed_at: string | null;
  secretary_verified_by: string | null;
  secretary_verified_at: string | null;
  chairperson_approved_by: string | null;
  chairperson_approved_at: string | null;
  paid_at: string | null;
  receipt_number: string | null;
  rejection_reason: string | null;
  created_at: string;
}
