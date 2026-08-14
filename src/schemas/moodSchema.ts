import { z } from 'zod';

export const createMoodCheckInSchema = z.object({
  mood: z.enum(['happy', 'neutral', 'anxious', 'scared', 'sad']),
  anxietyLevel: z
    .number()
    .int('anxietyLevel must be an integer')
    .min(1, 'anxietyLevel minimum value is 1')
    .max(5, 'anxietyLevel maximum value is 5'),
  notes: z.string().optional(),
});

export type CreateMoodCheckInDTO = z.infer<typeof createMoodCheckInSchema>;
