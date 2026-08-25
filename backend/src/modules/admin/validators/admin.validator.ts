import { z } from 'zod';

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  scopeType: z.enum(['global', 'committee', 'ministry', 'executive']),
  scopeId: z.string().uuid().nullable().optional().default(null),
});
export type AssignRoleDto = z.infer<typeof assignRoleSchema>;

export const adminValidators = {
  assignRole: { body: assignRoleSchema as unknown as z.AnyZodObject },
};
