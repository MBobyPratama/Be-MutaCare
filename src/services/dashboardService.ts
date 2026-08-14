import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export interface DashboardResponseData {
  user: {
    nickname: string;
    currentStreak: number;
  };
  todayMood: {
    logged: boolean;
    mood: string | null;
    anxietyLevel: number | null;
  };
  aiCompanion: {
    message: string;
    recommendedMissionType: string;
  };
  weeklyProgress: {
    weekNumber: number;
    percentage: number;
    confidenceScore: number;
    anxietyAverage: number;
  };
  todayMissions: Array<{
    id: string;
    missionType: string;
    title: string;
    description: string | null;
    status: string;
    targetReferenceId: string | null;
  }>;
}

export class DashboardService {
  /**
   * Retrieves summary analytics and daily task cards for Therapy Home Dashboard.
   */
  public static async getDailyDashboard(userId: string): Promise<DashboardResponseData> {
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nickname, full_name, current_streak')
      .eq('id', userId)
      .maybeSingle();

    const nickname = profile?.nickname || profile?.full_name?.split(' ')[0] || 'Teman';
    const currentStreak = profile?.current_streak || 0;

    // 2. Fetch today's logged mood
    const { data: todayMoodRecord } = await supabaseAdmin
      .from('daily_moods')
      .select('mood, anxiety_level, notes')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    const todayMood = {
      logged: Boolean(todayMoodRecord),
      mood: todayMoodRecord?.mood || null,
      anxietyLevel: todayMoodRecord?.anxiety_level || null,
    };

    // 3. Fetch active therapy plan
    const { data: therapyPlan } = await supabaseAdmin
      .from('therapy_plans')
      .select('id, current_week')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const currentWeek = therapyPlan?.current_week || 1;

    // 4. Fetch or seed today's daily missions
    let { data: missions } = await supabaseAdmin
      .from('daily_missions')
      .select('id, mission_type, title, description, status, target_reference_id')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: true });

    if (!missions || missions.length === 0) {
      missions = await this.seedInitialDailyMissions(userId, therapyPlan?.id || null, today);
    }

    // 5. Calculate Weekly Progress & Psychological Metrics
    const completedCount = missions.filter((m) => m.status === 'completed').length;
    const totalCount = missions.length || 1;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);

    const confidenceScore = await this.calculateAverageConfidenceScore(userId);
    const anxietyAverage = await this.calculateAverageAnxietyLevel(userId);

    // 6. Generate AI Companion Message & Recommendation
    let aiCompanionMessage = `Halo ${nickname}! Mari luangkan 3 menit untuk grounding sebelum memulai misi hari ini.`;
    let recommendedMissionType = 'relaxation';

    if (todayMood.logged && todayMood.anxietyLevel) {
      if (todayMood.anxietyLevel >= 4) {
        aiCompanionMessage = `Hari ini kamu terlihat sedikit cemas, ${nickname}. Tidak apa-apa, mari mulai dengan relaksasi pernapasan singkat.`;
        recommendedMissionType = 'relaxation';
      } else {
        aiCompanionMessage = `Halo ${nickname}! Kondisimu sangat baik hari ini. Mari selesaikan misi latihan percakapan.`;
        recommendedMissionType = 'guided_practice';
      }
    }

    return {
      user: {
        nickname,
        currentStreak,
      },
      todayMood,
      aiCompanion: {
        message: aiCompanionMessage,
        recommendedMissionType,
      },
      weeklyProgress: {
        weekNumber: currentWeek,
        percentage: progressPercentage,
        confidenceScore,
        anxietyAverage,
      },
      todayMissions: missions.map((m) => ({
        id: m.id,
        missionType: m.mission_type,
        title: m.title,
        description: m.description,
        status: m.status,
        targetReferenceId: m.target_reference_id,
      })),
    };
  }

  /**
   * Seeds default daily missions for the user if none exist for today.
   */
  private static async seedInitialDailyMissions(
    userId: string,
    planId: string | null,
    today: string
  ) {
    const defaultMissions = [
      {
        user_id: userId,
        plan_id: planId,
        date: today,
        mission_type: 'relaxation',
        title: 'Relaksasi Pernapasan 4-6',
        description: 'Latihan pernapasan 3 menit untuk menenangkan sistem saraf.',
        status: 'pending',
      },
      {
        user_id: userId,
        plan_id: planId,
        date: today,
        mission_type: 'guided_practice',
        title: 'Latihan Menyapa Sederhana',
        description: 'Berlatih merespon sapaan "Halo" dari AI.',
        status: 'pending',
      },
      {
        user_id: userId,
        plan_id: planId,
        date: today,
        mission_type: 'reflection',
        title: 'Refleksi Harian Singkat',
        description: 'Catat perasaanmu setelah mencoba latihan suara.',
        status: 'pending',
      },
    ];

    const { data: insertedMissions, error } = await supabaseAdmin
      .from('daily_missions')
      .insert(defaultMissions)
      .select('id, mission_type, title, description, status, target_reference_id');

    if (error || !insertedMissions) {
      logger.error('Failed to seed initial daily missions:', error);
      return defaultMissions.map((m, index) => ({
        id: `temp-${index}`,
        mission_type: m.mission_type,
        title: m.title,
        description: m.description,
        status: m.status,
        target_reference_id: null,
      }));
    }

    return insertedMissions;
  }

  private static async calculateAverageConfidenceScore(userId: string): Promise<number> {
    try {
      const { data: sims } = await supabaseAdmin
        .from('simulations')
        .select('confidence_score')
        .eq('user_id', userId)
        .not('confidence_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!sims || sims.length === 0) return 60;

      const sum = sims.reduce((acc, curr) => acc + (curr.confidence_score || 0), 0);
      return Math.round(sum / sims.length);
    } catch {
      return 60;
    }
  }

  private static async calculateAverageAnxietyLevel(userId: string): Promise<number> {
    try {
      const { data: moods } = await supabaseAdmin
        .from('daily_moods')
        .select('anxiety_level')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(7);

      if (!moods || moods.length === 0) return 3.0;

      const sum = moods.reduce((acc, curr) => acc + curr.anxiety_level, 0);
      return Number((sum / moods.length).toFixed(1));
    } catch {
      return 3.0;
    }
  }
}
