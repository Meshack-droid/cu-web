import { z } from 'zod';
import {
  approveApplicationSchema,
  rejectApplicationSchema,
  renewMembershipSchema,
} from '../dto/membership.dto';

export const membershipValidators = {
  approve: { body: approveApplicationSchema as unknown as z.AnyZodObject },
  reject: { body: rejectApplicationSchema as unknown as z.AnyZodObject },
  renew: { body: renewMembershipSchema as unknown as z.AnyZodObject },
};
