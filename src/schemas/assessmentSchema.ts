import { z } from 'zod';

export const createAssessmentSchema = z.object({
  anxietyScore: z
    .number()
    .int('anxietyScore must be an integer')
    .min(0, 'anxietyScore minimum value is 0')
    .max(100, 'anxietyScore maximum value is 100'),
  mutismSeverity: z.enum(['mild', 'moderate', 'severe']),
  primaryTriggers: z
    .array(z.string())
    .min(1, 'At least one primary trigger must be specified'),
  answersPayload: z.record(z.string(), z.unknown()),
});

export type CreateAssessmentDTO = z.infer<typeof createAssessmentSchema>;
