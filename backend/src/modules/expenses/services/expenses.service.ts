import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '../../../core/base.service';
import { ExpenseRequest } from '../interfaces/expenses.interface';
import { ExpensesRepository } from '../repositories/expenses.repository';
import { BusinessRuleError } from '../../../utils/errors';
import { query } from '../../../config/database';
import { toMySQLDateTime } from '../../../utils/datetime';

/**
 * Expense approval workflow (Chapter 17):
 *   Request -> Treasurer Review -> Secretary Verification ->
 *   Chairperson Approval -> Payment -> Receipt -> Audit
 * Each step can only be taken from the correct preceding status, and any
 * step can reject the request with a reason.
 */
export class ExpensesService extends BaseService<ExpenseRequest> {
  constructor(repository: ExpensesRepository = new ExpensesRepository()) {
    super(repository);
  }

  private async transition(
    id: string,
    fromStatuses: ExpenseRequest['status'][],
    toStatus: ExpenseRequest['status'],
    extra: Record<string, unknown> = {}
  ) {
    const expense = await this.getById(id);
    if (!fromStatuses.includes(expense.status)) {
      throw new BusinessRuleError(
        `Cannot move expense from "${expense.status}" to "${toStatus}" — expected one of: ${fromStatuses.join(', ')}`
      );
    }
    return this.update(id, { status: toStatus, ...extra } as never);
  }

  async treasurerReview(id: string, reviewerId: string) {
    return this.transition(id, ['requested'], 'treasurer_reviewed', {
      treasurer_reviewed_by: reviewerId,
      treasurer_reviewed_at: toMySQLDateTime(),
    });
  }

  async secretaryVerify(id: string, verifierId: string) {
    return this.transition(id, ['treasurer_reviewed'], 'secretary_verified', {
      secretary_verified_by: verifierId,
      secretary_verified_at: toMySQLDateTime(),
    });
  }

  async chairpersonApprove(id: string, approverId: string) {
    return this.transition(id, ['secretary_verified'], 'chairperson_approved', {
      chairperson_approved_by: approverId,
      chairperson_approved_at: toMySQLDateTime(),
    });
  }

  async markPaid(id: string) {
    return this.transition(id, ['chairperson_approved'], 'paid', {
      paid_at: toMySQLDateTime(),
    });
  }

  async recordReceipt(id: string, receiptNumber: string) {
    return this.transition(id, ['paid'], 'receipted', { receipt_number: receiptNumber });
  }

  async markAudited(id: string) {
    return this.transition(id, ['receipted'], 'audited');
  }

  async reject(id: string, reason: string) {
    const expense = await this.getById(id);
    if (['paid', 'receipted', 'audited', 'rejected'].includes(expense.status)) {
      throw new BusinessRuleError(`Cannot reject an expense that is already ${expense.status}`);
    }
    return this.update(id, { status: 'rejected', rejection_reason: reason } as never);
  }

  /** Creates the request and links it to the requester's committee/ministry/event context. */
  async createRequest(data: Partial<ExpenseRequest>) {
    return this.create({ ...data, id: uuidv4(), status: 'requested' } as never);
  }

  async budgetSummaryBySpiritualYear(spiritualYearId: string) {
    return query(
      `SELECT expense_type, SUM(amount) as total, COUNT(*) as count
         FROM expense_requests er
         JOIN annual_budgets ab ON 1=1
        WHERE ab.spiritual_year_id = :spiritualYearId AND er.status != 'rejected'
        GROUP BY expense_type`,
      { spiritualYearId }
    );
  }
}
