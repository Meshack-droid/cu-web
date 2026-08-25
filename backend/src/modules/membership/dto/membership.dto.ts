import { z } from 'zod';

export const approveApplicationSchema = z.object({
  reviewerNotes: z.string().max(1000).optional(),
});
export type ApproveApplicationDto = z.infer<typeof approveApplicationSchema>;

export const rejectApplicationSchema = z.object({
  rejectionReason: z.string().min(3, 'A rejection reason is required').max(1000),
});
export type RejectApplicationDto = z.infer<typeof rejectApplicationSchema>;

export const renewMembershipSchema = z.object({
  spiritualYearId: z.string().uuid(),
  declarationId: z.string().uuid(),
});
export type RenewMembershipDto = z.infer<typeof renewMembershipSchema>;
