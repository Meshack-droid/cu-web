import { Request, Response } from 'express';
import { BaseController } from '../../../core/base.controller';
import { ExpenseRequest } from '../interfaces/expenses.interface';
import { ExpensesService } from '../services/expenses.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';

const service = new ExpensesService();

class ExpensesController extends BaseController<ExpenseRequest> {
  constructor() {
    super(service, 'Expense request');
  }

  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const expense = await service.createRequest({ ...req.body, requested_by: req.user.sub });
    return sendSuccess(res, expense, 'Expense request submitted', 201);
  });

  treasurerReview = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const expense = await service.treasurerReview(req.params.id, req.user.sub);
    return sendSuccess(res, expense, 'Expense reviewed by treasurer');
  });

  secretaryVerify = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const expense = await service.secretaryVerify(req.params.id, req.user.sub);
    return sendSuccess(res, expense, 'Expense verified by secretary');
  });

  chairpersonApprove = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const expense = await service.chairpersonApprove(req.params.id, req.user.sub);
    return sendSuccess(res, expense, 'Expense approved by chairperson');
  });

  markPaid = asyncHandler(async (req: Request, res: Response) => {
    const expense = await service.markPaid(req.params.id);
    return sendSuccess(res, expense, 'Expense marked as paid');
  });

  recordReceipt = asyncHandler(async (req: Request, res: Response) => {
    const expense = await service.recordReceipt(req.params.id, req.body.receiptNumber);
    return sendSuccess(res, expense, 'Receipt recorded');
  });

  markAudited = asyncHandler(async (req: Request, res: Response) => {
    const expense = await service.markAudited(req.params.id);
    return sendSuccess(res, expense, 'Expense marked as audited');
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    const expense = await service.reject(req.params.id, req.body.reason);
    return sendSuccess(res, expense, 'Expense request rejected');
  });
}

export const expensesController = new ExpensesController();
