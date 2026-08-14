import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Storage Bucket Constants defined in DB_SCHEMA.md
 */
export const STORAGE_BUCKETS = {
  AUDIO_SESSIONS: 'audio-sessions',
  AVATARS: 'avatars',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Supabase Admin Client
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS)
 * for administrative server-side operations, STT audio management, and background tasks.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Supabase Anon Client
 * Uses SUPABASE_ANON_KEY for public or non-privileged operations.
 */
export const supabaseClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

/**
 * Helper factory to create a user-scoped Supabase Client with JWT token.
 * Enforces Row Level Security (RLS) policies defined in DB_SCHEMA.md for the authenticated user.
 */
export const createScopedSupabaseClient = (accessToken: string): SupabaseClient => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
