import { anthropicClient } from '../config/anthropic.js';
import { supabaseAdmin } from '../config/supabase.js';
import { CreateMoodCheckInDTO } from '../schemas/moodSchema.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

export interface MoodCheckInResult {
  date: string;
  mood: string;
  anxietyLevel: number;
  aiCompanionMessage: string;
  recommendedAction: 'relaxation' | 'guided_practice' | 'simulation' | 'reflection';
}

interface LLMCompanionResponse {
  aiCompanionMessage: string;
  recommendedAction: 'relaxation' | 'guided_practice' | 'simulation' | 'reflection';
}

export class MoodService {
  /**
   * Logs daily mood & anxiety level, calculates adaptive streak,
   * calls Claude 3.5 Sonnet API for empathetic companion response, and updates database.
   */
  public static async logDailyMood(
    userId: string,
    data: CreateMoodCheckInDTO
  ): Promise<MoodCheckInResult> {
    const today = new Date().toISOString().split('T')[0];

    // Step 1: Fetch user profile to get nickname & streak stats
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nickname, full_name, current_streak, longest_streak, last_active_date')
      .eq('id', userId)
      .maybeSingle();

    const nickname = profile?.nickname || profile?.full_name?.split(' ')[0] || 'Teman';
    const currentStreak = profile?.current_streak || 0;

    // Step 2: Upsert daily mood into Supabase
    const { data: moodRecord, error: moodError } = await supabaseAdmin
      .from('daily_moods')
      .upsert(
        {
          user_id: userId,
          date: today,
          mood: data.mood,
          anxiety_level: data.anxietyLevel,
          notes: data.notes || null,
        },
        { onConflict: 'user_id,date' }
      )
      .select('date, mood, anxiety_level')
      .single();

    if (moodError || !moodRecord) {
      logger.error('Failed to log daily mood in Supabase:', moodError);
      throw AppError.internal('Failed to record daily mood check-in', moodError);
    }

    // Step 3: Update user streak & active date
    await this.updateUserStreak(userId, profile, today);

    // Step 4: Generate adaptive AI Companion response via Claude 3.5 Sonnet
    const aiResponse = await this.generateAICompanionResponse(
      nickname,
      currentStreak,
      data
    );

    return {
      date: moodRecord.date,
      mood: moodRecord.mood,
      anxietyLevel: moodRecord.anxiety_level,
      aiCompanionMessage: aiResponse.aiCompanionMessage,
      recommendedAction: aiResponse.recommendedAction,
    };
  }

  /**
   * Updates current_streak and longest_streak in user profiles based on activity dates.
   */
  private static async updateUserStreak(
    userId: string,
    profile: { current_streak?: number; longest_streak?: number; last_active_date?: string | null } | null,
    today: string
  ): Promise<void> {
    try {
      const lastActive = profile?.last_active_date;
      let newStreak = profile?.current_streak || 0;
      let longestStreak = profile?.longest_streak || 0;

      if (!lastActive) {
        newStreak = 1;
      } else if (lastActive !== today) {
        const lastDate = new Date(lastActive);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      }

      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }

      await supabaseAdmin
        .from('profiles')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_active_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      logger.warn('Failed to update streak stats for user:', error);
    }
  }

  /**
   * Calls Claude 3.5 Sonnet for dynamic companion responses per AI_PROMPTS.md 2.2.
   */
  private static async generateAICompanionResponse(
    nickname: string,
    currentStreak: number,
    data: CreateMoodCheckInDTO
  ): Promise<LLMCompanionResponse> {
    const isHighAnxiety = data.anxietyLevel >= 4 || ['scared', 'anxious', 'sad'].includes(data.mood);
    const defaultAction: LLMCompanionResponse['recommendedAction'] = isHighAnxiety
      ? 'relaxation'
      : 'guided_practice';

    const fallbackMessage = isHighAnxiety
      ? `Hari ini kamu terlihat sedikit cemas, ${nickname}. Tidak apa-apa, kita tidak perlu latihan yang berat. Yuk mulai dengan relaksasi pernapasan singkat.`
      : `Halo ${nickname}! Senang melihat kondisimu hari ini. Mari melangkah perlahan untuk latihan harianmu.`;

    try {
      const systemPrompt = `You are "Muta", an empathetic AI Therapy Companion for someone working through Selective Mutism.
Your goal is to respond to their daily mood check-in.

Tone & Behavior Rules:
- If anxiety is high (level 4-5) or mood is scared/anxious/sad: Validate their feelings, reduce pressure completely, and suggest gentle relaxation/breathing first.
- If anxiety is moderate/low (level 1-3) or mood is happy/neutral: Cheer them on warmly and encourage them to tackle today's gentle step.
- Maximum length: 2 short sentences.
- Language: Indonesian.`;

      const userPrompt = `User Profile:
- Name/Nickname: ${nickname}
- Current Streak: ${currentStreak} days

Today's Check-in:
- Mood: ${data.mood} (happy | neutral | anxious | scared | sad)
- Anxiety Level: ${data.anxietyLevel} (1: Calm to 5: Severe)
- User Note: ${data.notes || 'None'}

Return a supportive companion message and the recommended action type. Return strictly valid JSON:
{
  "aiCompanionMessage": "string",
  "recommendedAction": "relaxation" | "guided_practice" | "simulation" | "reflection"
}`;

      const response = await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const responseText = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: LLMCompanionResponse = JSON.parse(jsonMatch[0]);
        if (parsed.aiCompanionMessage && parsed.recommendedAction) {
          return {
            aiCompanionMessage: parsed.aiCompanionMessage.trim(),
            recommendedAction: parsed.recommendedAction,
          };
        }
      }

      return {
        aiCompanionMessage: fallbackMessage,
        recommendedAction: defaultAction,
      };
    } catch (error) {
      logger.warn('Claude API call failed for mood check-in companion, using fallback:', error);
      return {
        aiCompanionMessage: fallbackMessage,
        recommendedAction: defaultAction,
      };
    }
  }
}
