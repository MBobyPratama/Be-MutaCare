import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  SUPABASE_URL: z
    .string()
    .min(1, { message: 'SUPABASE_URL is required' })
    .url({ message: 'SUPABASE_URL must be a valid URL' }),
  SUPABASE_ANON_KEY: z
    .string()
    .min(1, { message: 'SUPABASE_ANON_KEY is required' }),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required' }),
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, { message: 'ANTHROPIC_API_KEY is required' }),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
