import { Request, Response } from 'express';
import { BaseService } from './base.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Generic controller. Receives requests, delegates to the service, returns
 * standardized responses. Controllers contain no business logic (Chapter 64).
 */
export class BaseController<T extends { id: string }> {
  constructor(
    protected readonly service: BaseService<T>,
    protected readonly resourceName: string
  ) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const { page: _p, pageSize: _ps, ...filters } = req.query as Record<string, unknown>;
    const result = await this.service.list(filters, { page, pageSize });
    return sendSuccess(res, result.rows, `${this.resourceName} list retrieved`, 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.getById(req.params.id);
    return sendSuccess(res, record, `${this.resourceName} retrieved`);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.create(req.body);
    return sendSuccess(res, record, `${this.resourceName} created successfully`, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.update(req.params.id, req.body);
    return sendSuccess(res, record, `${this.resourceName} updated successfully`);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.service.remove(req.params.id);
    return sendSuccess(res, null, `${this.resourceName} deleted successfully`);
  });
}
