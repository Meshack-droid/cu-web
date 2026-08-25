import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ExpensesService } from './expenses.service';
import { ExpenseRequest } from '../interfaces/expenses.interface';
import { ExpensesRepository } from '../repositories/expenses.repository';

function makeExpense(overrides: Partial<ExpenseRequest> = {}): ExpenseRequest {
  return {
    id: 'expense-1',
    expense_type: 'ministry',
    amount: 5000,
    currency: 'KES',
    description: 'Test expense',
    requested_by: 'user-1',
    linked_committee_id: null,
    linked_ministry_id: null,
    linked_event_id: null,
    status: 'requested',
    treasurer_reviewed_by: null,
    treasurer_reviewed_at: null,
    secretary_verified_by: null,
    secretary_verified_at: null,
    chairperson_approved_by: null,
    chairperson_approved_at: null,
    paid_at: null,
    receipt_number: null,
    rejection_reason: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('ExpensesService approval state machine', () => {
  let repository: {
    findById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let service: ExpensesService;
  let currentExpense: ExpenseRequest;

  beforeEach(() => {
    currentExpense = makeExpense();
    repository = {
      findById: vi.fn(() => Promise.resolve(currentExpense)),
      update: vi.fn((id: string, data: Partial<ExpenseRequest>) => {
        currentExpense = { ...currentExpense, ...data };
        return Promise.resolve(currentExpense);
      }),
    };
    service = new ExpensesService(repository as unknown as ExpensesRepository);
  });

  it('allows treasurer review from "requested"', async () => {
    const result = await service.treasurerReview('expense-1', 'treasurer-1');
    expect(result.status).toBe('treasurer_reviewed');
    expect(result.treasurer_reviewed_by).toBe('treasurer-1');
  });

  it('blocks treasurer review if not in "requested" status', async () => {
    currentExpense = makeExpense({ status: 'paid' });
    repository.findById.mockResolvedValue(currentExpense);
    await expect(service.treasurerReview('expense-1', 'treasurer-1')).rejects.toThrow(/Cannot move expense/);
  });

  it('walks the full approval chain in order', async () => {
    await service.treasurerReview('expense-1', 'treasurer-1');
    expect(currentExpense.status).toBe('treasurer_reviewed');

    await service.secretaryVerify('expense-1', 'secretary-1');
    expect(currentExpense.status).toBe('secretary_verified');

    await service.chairpersonApprove('expense-1', 'chair-1');
    expect(currentExpense.status).toBe('chairperson_approved');

    await service.markPaid('expense-1');
    expect(currentExpense.status).toBe('paid');

    await service.recordReceipt('expense-1', 'RCT-001');
    expect(currentExpense.status).toBe('receipted');
    expect(currentExpense.receipt_number).toBe('RCT-001');

    await service.markAudited('expense-1');
    expect(currentExpense.status).toBe('audited');
  });

  it('rejects skipping a step (e.g. requested straight to chairperson_approved)', async () => {
    await expect(service.chairpersonApprove('expense-1', 'chair-1')).rejects.toThrow(/Cannot move expense/);
  });

  it('rejects going backward (e.g. paid back to requested-equivalent action)', async () => {
    currentExpense = makeExpense({ status: 'paid' });
    repository.findById.mockResolvedValue(currentExpense);
    await expect(service.treasurerReview('expense-1', 'treasurer-1')).rejects.toThrow(/Cannot move expense/);
  });

  it('allows rejection from any open state', async () => {
    const result = await service.reject('expense-1', 'Insufficient budget');
    expect(result.status).toBe('rejected');
    expect(result.rejection_reason).toBe('Insufficient budget');
  });

  it('blocks rejecting an already-paid expense', async () => {
    currentExpense = makeExpense({ status: 'paid' });
    repository.findById.mockResolvedValue(currentExpense);
    await expect(service.reject('expense-1', 'too late')).rejects.toThrow(/already paid/);
  });

  it('blocks re-rejecting an already-rejected expense', async () => {
    currentExpense = makeExpense({ status: 'rejected' });
    repository.findById.mockResolvedValue(currentExpense);
    await expect(service.reject('expense-1', 'again')).rejects.toThrow(/already rejected/);
  });});
