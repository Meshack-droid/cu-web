import { BaseController } from '../../../core/base.controller';
import { Assets } from '../interfaces/assets.interface';
import { AssetsService } from '../services/assets.service';

export const assetsController = new BaseController<Assets>(new AssetsService(), 'Assets');
