import { Request, Response } from 'express';
import { BaseController } from '../../../core/base.controller';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { Ministries } from '../interfaces/ministries.interface';
import { MinistriesService } from '../services/ministries.service';

const service = new MinistriesService();

export const ministriesController = new BaseController<Ministries>(service, 'Ministries');

export const ministryDetailsController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const details = await service.getDetails(req.params.id);
    return sendSuccess(res, details, 'Ministry details retrieved');
  }),
};
