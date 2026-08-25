import { z } from 'zod';
import { loginSchema, refreshSchema, registerSchema } from '../dto/auth.dto';

export const authValidators = {
  register: { body: registerSchema as unknown as z.AnyZodObject },
  login: { body: loginSchema as unknown as z.AnyZodObject },
  refresh: { body: refreshSchema as unknown as z.AnyZodObject },
};
