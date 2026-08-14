import { anthropicClient } from '../config/anthropic.js';
import { supabaseAdmin } from '../config/supabase.js';
import { CreateAssessmentDTO } from '../schemas/assessmentSchema.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

export interface AssessmentResultResponse {
  assessmentId: string;
  mutismSeverity: string;
  aiAnalysisSummary: string;
  therapyPlan: {
    planId: string;
    currentWeek: number;
    status: string;
  };
}

interface LLMAssessmentAnalysis {
  aiAnalysisSummary: string;
  recommendedStartingPace?: 'slow' | 'moderate' | 'steady';
  focusAreas?: string[];
}

export class AssessmentService {
  /**
   * Evaluates user's initial assessment questionnaire using Claude 3.5 Sonnet LLM,
   * persists assessment record to Supabase, and initializes user's weekly Therapy Plan.
   */
  public static async evaluateInitialAssessment(
    userId: string,
    data: CreateAssessmentDTO
  ): Promise<AssessmentResultResponse> {
    // Step 1: Generate AI Analysis Summary via Anthropic Claude 3.5 Sonnet
    const aiAnalysisSummary = await this.generateAIAnalysisSummary(data);

    // Step 2: Save Assessment Record to Supabase
    const { data: assessmentRecord, error: assessmentError } = await supabaseAdmin
      .from('assessments')
      .insert({
        user_id: userId,
        type: 'initial',
        anxiety_score: data.anxietyScore,
        mutism_severity: data.mutismSeverity,
        primary_triggers: data.primaryTriggers,
        answers_payload: data.answersPayload,
        ai_analysis_summary: aiAnalysisSummary,
      })
      .select('id, mutism_severity, ai_analysis_summary')
      .single();

    if (assessmentError || !assessmentRecord) {
      logger.error('Failed to insert assessment record into Supabase:', assessmentError);
      throw AppError.internal('Failed to save assessment data', assessmentError);
    }

    // Step 3: Check for existing active therapy plan or create a new one
    const { data: existingPlan } = await supabaseAdmin
      .from('therapy_plans')
      .select('id, current_week, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    let planRecord = existingPlan;

    if (!planRecord) {
      const { data: newPlan, error: planError } = await supabaseAdmin
        .from('therapy_plans')
        .insert({
          user_id: userId,
          current_week: 1,
          status: 'active',
        })
        .select('id, current_week, status')
        .single();

      if (planError || !newPlan) {
        logger.error('Failed to initialize therapy plan in Supabase:', planError);
        throw AppError.internal('Failed to initialize therapy plan', planError);
      }
      planRecord = newPlan;
    }

    return {
      assessmentId: assessmentRecord.id,
      mutismSeverity: assessmentRecord.mutism_severity,
      aiAnalysisSummary: assessmentRecord.ai_analysis_summary || aiAnalysisSummary,
      therapyPlan: {
        planId: planRecord.id,
        currentWeek: planRecord.current_week || 1,
        status: planRecord.status || 'active',
      },
    };
  }

  /**
   * Helper to call Claude 3.5 Sonnet API for psychological assessment analysis.
   */
  private static async generateAIAnalysisSummary(
    data: CreateAssessmentDTO
  ): Promise<string> {
    const defaultFallbackSummary = `Pengguna memiliki tingkat kecemasan situasional ${data.mutismSeverity} dengan pemicu utama di lingkungan ${data.primaryTriggers.join(', ')}. Kami telah merancang langkah terapi bertahap yang aman.`;

    try {
      const systemPrompt = `You are an expert clinical psychologist specializing in Pediatric & Adolescent Selective Mutism and Cognitive Behavioral Therapy (CBT).
Your task is to analyze initial assessment answers from a user and generate a compassionate summary with focus recommendations for their graded exposure plan.

Rules:
- Write in warm, encouraging Indonesian.
- Identify the primary triggers and provide a gentle summary of their baseline condition.
- Return output strictly in the specified JSON format:
{
  "aiAnalysisSummary": "string (1-2 sentences summarizing their state warmly and validating their courage to start)",
  "recommendedStartingPace": "slow" | "moderate" | "steady",
  "focusAreas": ["string"]
}`;

      const userPrompt = `User Assessment Data:
- Anxiety Score: ${data.anxietyScore} / 100
- Mutism Severity: ${data.mutismSeverity}
- Primary Triggers: ${data.primaryTriggers.join(', ')}
- Answers Detail: ${JSON.stringify(data.answersPayload)}

Generate an analysis summary and recommend the starting pathway emphasis. Return strictly valid JSON.`;

      const response = await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const responseText = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      // Parse JSON from LLM response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: LLMAssessmentAnalysis = JSON.parse(jsonMatch[0]);
        if (parsed.aiAnalysisSummary && parsed.aiAnalysisSummary.trim() !== '') {
          return parsed.aiAnalysisSummary.trim();
        }
      }

      return defaultFallbackSummary;
    } catch (error) {
      logger.warn('Claude API evaluation failed, utilizing fallback assessment summary:', error);
      return defaultFallbackSummary;
    }
  }
}
