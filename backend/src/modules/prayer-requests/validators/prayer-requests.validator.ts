import { z } from 'zod';

export const createPrayerRequestSchema = z.object({
  title: z.string().min(3).max(200),
  details: z.string().min(3).max(2000),
  privacyLevel: z.enum(['public', 'prayer_team', 'executive_only', 'private']).default('public'),
  anonymous: z.boolean().default(false),
});

export const updatePrayerRequestSchema = z.object({
  status: z.enum(['open', 'being_prayed_for', 'answered', 'closed']).optional(),
  title: z.string().min(3).max(200).optional(),
  details: z.string().min(3).max(2000).optional(),
  privacy_level: z.enum(['public', 'prayer_team', 'executive_only', 'private']).optional(),
});

export const prayerRequestValidators = {
  create: { body: createPrayerRequestSchema as unknown as z.AnyZodObject },
  update: { body: updatePrayerRequestSchema as unknown as z.AnyZodObject },
};
