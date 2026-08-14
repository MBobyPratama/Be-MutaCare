import { supabaseAdmin, supabaseClient } from '../config/supabase.js';
import { RegisterDTO, LoginDTO, UpdateProfileDTO } from '../schemas/authSchema.js';
import { AppError } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/http.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { logger } from '../utils/logger.js';

export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSuccessResponse {
  user: AuthUserResponse;
  session: AuthSessionResponse | null;
}

export interface UserProfileResponse {
  id: string;
  fullName: string;
  nickname: string | null;
  avatarUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  currentStreak: number;
  longestStreak: number;
  hasCompletedAssessment: boolean;
}

export class AuthService {
  /**
   * Registers a new user via Supabase Auth Admin API (bypasses SMTP rate limits & auto-confirms email)
   * and initializes profile record in public.profiles.
   */
  public static async registerUser(data: RegisterDTO): Promise<AuthSuccessResponse> {
    // 1. Create user using Admin API to bypass email rate limits & auto-confirm email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
      },
    });

    if (authError || !authData.user) {
      logger.warn('Registration failed in Supabase Auth:', authError);

      const errorMessage = authError?.message?.toLowerCase() || '';
      const errorCode = authError?.code || '';

      if (
        errorMessage.includes('already registered') ||
        errorMessage.includes('email_exists') ||
        errorCode === 'email_exists'
      ) {
        throw AppError.badRequest('Email sudah terdaftar. Silakan gunakan email lain atau login.');
      }

      if (
        errorCode === 'over_email_send_rate_limit' ||
        authError?.status === 429 ||
        errorMessage.includes('rate limit')
      ) {
        throw new AppError(
          'Terlalu banyak permintaan registrasi. Silakan coba beberapa saat lagi.',
          HTTP_STATUS.TOO_MANY_REQUESTS,
          ERROR_CODES.RATE_LIMIT_EXCEEDED
        );
      }

      throw AppError.badRequest(authError?.message || 'Registrasi gagal');
    }

    const user = authData.user;

    // 2. Initialize profile in public.profiles table
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: user.id,
        full_name: data.fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      logger.error('Failed to create user profile record in Supabase:', profileError);
    }

    // 3. Immediately sign in user to generate session access token
    let session: AuthSessionResponse | null = null;
    try {
      const { data: loginData } = await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (loginData?.session) {
        session = {
          accessToken: loginData.session.access_token,
          refreshToken: loginData.session.refresh_token,
          expiresIn: loginData.session.expires_in,
        };
      }
    } catch (loginErr) {
      logger.warn('Auto sign-in after registration skipped:', loginErr);
    }

    return {
      user: {
        id: user.id,
        email: user.email || data.email,
        fullName: data.fullName,
        nickname: null,
        avatarUrl: null,
      },
      session,
    };
  }

  /**
   * Authenticates user credentials via Supabase Auth and fetches/provisions profile details.
   */
  public static async loginUser(data: LoginDTO): Promise<AuthSuccessResponse> {
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError || !authData.user || !authData.session) {
      logger.warn(`Login failed for email ${data.email}: ${authError?.message}`);
      throw AppError.unauthorized('Email atau kata sandi tidak valid');
    }

    const user = authData.user;

    // Fetch or provision user profile from public.profiles
    let { data: profile, error: queryError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, nickname, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (queryError?.code === 'PGRST205' || queryError?.message?.includes('Could not find the table')) {
      throw AppError.internal("Tabel database 'public.profiles' belum dibuat di Supabase. Silakan jalankan script file schema.sql di Supabase SQL Editor.");
    }

    if (!profile) {
      const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna MutaCare';
      const { data: newProfile } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name: fallbackName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('full_name, nickname, avatar_url')
        .single();

      profile = newProfile;
    }

    const fullName = profile?.full_name || user.user_metadata?.full_name || 'Pengguna MutaCare';

    return {
      user: {
        id: user.id,
        email: user.email || data.email,
        fullName,
        nickname: profile?.nickname || null,
        avatarUrl: profile?.avatar_url || null,
      },
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresIn: authData.session.expires_in,
      },
    };
  }

  /**
   * Retrieves profile details and assessment completion status for authenticated user.
   * Auto-provisions missing profile records from auth.users if needed.
   */
  public static async getCurrentUserProfile(userId: string): Promise<UserProfileResponse> {
    let { data: profile, error: queryError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, nickname, avatar_url, gender, date_of_birth, current_streak, longest_streak')
      .eq('id', userId)
      .maybeSingle();

    if (queryError?.code === 'PGRST205' || queryError?.message?.includes('Could not find the table')) {
      throw AppError.internal("Tabel database 'public.profiles' belum dibuat di proyek Supabase Anda. Silakan jalankan script file schema.sql di Supabase SQL Editor.");
    }

    // Auto-provision profile from Auth user metadata if missing in public.profiles table
    if (!profile) {
      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const fallbackName =
        authUserData?.user?.user_metadata?.full_name ||
        authUserData?.user?.email?.split('@')[0] ||
        'Pengguna MutaCare';

      const { data: newProfile, error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: userId,
            full_name: fallbackName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('id, full_name, nickname, avatar_url, gender, date_of_birth, current_streak, longest_streak')
        .single();

      if (upsertError) {
        if (upsertError.code === 'PGRST205' || upsertError.message?.includes('Could not find the table')) {
          throw AppError.internal("Tabel database 'public.profiles' belum dibuat di Supabase. Silakan jalankan script schema.sql di Supabase SQL Editor.");
        }
        logger.error('Failed to auto-provision profile for user:', upsertError);
        throw AppError.notFound('Profil pengguna tidak ditemukan');
      }

      profile = newProfile;
    }

    // Check if initial assessment exists
    const { data: assessment } = await supabaseAdmin
      .from('assessments')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    return {
      id: profile.id,
      fullName: profile.full_name,
      nickname: profile.nickname,
      avatarUrl: profile.avatar_url,
      gender: profile.gender,
      dateOfBirth: profile.date_of_birth,
      currentStreak: profile.current_streak || 0,
      longestStreak: profile.longest_streak || 0,
      hasCompletedAssessment: Boolean(assessment),
    };
  }

  /**
   * Updates user profile attributes (nickname, gender, dateOfBirth, avatarUrl).
   */
  public static async updateUserProfile(
    userId: string,
    data: UpdateProfileDTO
  ): Promise<UserProfileResponse> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, full_name, nickname, avatar_url, gender, date_of_birth, current_streak, longest_streak')
      .single();

    if (error || !updatedProfile) {
      logger.error('Failed to update user profile in Supabase:', error);
      throw AppError.internal('Gagal memperbarui profil pengguna', error);
    }

    const { data: assessment } = await supabaseAdmin
      .from('assessments')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    return {
      id: updatedProfile.id,
      fullName: updatedProfile.full_name,
      nickname: updatedProfile.nickname,
      avatarUrl: updatedProfile.avatar_url,
      gender: updatedProfile.gender,
      dateOfBirth: updatedProfile.date_of_birth,
      currentStreak: updatedProfile.current_streak || 0,
      longestStreak: updatedProfile.longest_streak || 0,
      hasCompletedAssessment: Boolean(assessment),
    };
  }
}
