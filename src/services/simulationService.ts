import { anthropicClient } from '../config/anthropic.js';
import { supabaseAdmin } from '../config/supabase.js';
import { STTService } from './sttService.js';
import { StorageService } from './storageService.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

export interface ScenarioItem {
  id: string;
  category: string;
  title: string;
  personaRole: string;
  description: string;
  difficultyLevel: number;
  initialAiGreeting: string;
}

export interface StartSimulationResponse {
  simulationId: string;
  scenarioTitle: string;
  initialMessage: {
    senderType: 'assistant';
    text: string;
  };
}

export interface SimulationTurnResponse {
  userTurn: {
    transcription: string;
    speechDurationSeconds: number;
    audioUrl: string;
  };
  aiTurn: {
    senderType: 'assistant';
    text: string;
    supportiveFeedback: string;
  };
}

export interface EndSimulationResponse {
  simulationId: string;
  totalDurationSeconds: number;
  turnsCount: number;
  confidenceScore: number;
  feedbackSummary: string;
  newBadgeUnlocked?: {
    id: string;
    title: string;
    iconName: string;
  } | null;
}

interface LLMTurnResponse {
  replyText: string;
  supportiveFeedback: string;
  comfortScore: number;
}

export class SimulationService {
  /**
   * Retrieves list of master simulation scenarios filtered optionally by category.
   */
  public static async getScenarios(category?: string): Promise<ScenarioItem[]> {
    let query = supabaseAdmin
      .from('simulation_scenarios')
      .select('id, category, title, persona_role, description, difficulty_level, initial_ai_greeting')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: scenarios, error } = await query;

    if (error || !scenarios || scenarios.length === 0) {
      // Fallback scenarios catalogue if table is empty or querying in dev
      return [
        {
          id: 'scen-kasir-1',
          category: 'daily_life',
          title: 'Kasir Minimarket',
          personaRole: 'Kasir Ramah',
          description: 'Berlatih menyapa dan menjawab kasir saat berbelanja barang.',
          difficultyLevel: 1,
          initialAiGreeting: 'Halo kak, selamat siang! Ada kantong belanja atau mau pakai struk digital?',
        },
        {
          id: 'scen-dosen-1',
          category: 'academic',
          title: 'Bertanya di Kelas',
          personaRole: 'Dosen Pengampu',
          description: 'Berlatih merespon sapaan dan mengajukan pertanyaan singkat.',
          difficultyLevel: 2,
          initialAiGreeting: 'Apakah ada materi perkuliahan hari ini yang masih belum jelas?',
        },
      ];
    }

    return scenarios.map((s) => ({
      id: s.id,
      category: s.category,
      title: s.title,
      personaRole: s.persona_role,
      description: s.description,
      difficultyLevel: s.difficulty_level,
      initialAiGreeting: s.initial_ai_greeting,
    }));
  }

  /**
   * Starts a new simulation session for a user with initial AI greeting turn.
   */
  public static async startSimulation(
    userId: string,
    scenarioId: string
  ): Promise<StartSimulationResponse> {
    const scenarios = await this.getScenarios();
    const scenario = scenarios.find((s) => s.id === scenarioId) || scenarios[0];

    // 1. Create simulation session
    const { data: simulation, error } = await supabaseAdmin
      .from('simulations')
      .insert({
        user_id: userId,
        scenario_id: scenario.id.startsWith('scen-') ? null : scenario.id,
        turns_count: 0,
        total_duration_seconds: 0,
      })
      .select('id')
      .single();

    const simulationId = simulation?.id || `sim-session-${Date.now()}`;

    if (error) {
      logger.warn('Failed to insert simulation record in Supabase, using session ID:', simulationId);
    }

    // 2. Insert initial AI greeting into simulation_messages
    await supabaseAdmin.from('simulation_messages').insert({
      simulation_id: simulationId,
      sender_type: 'assistant',
      transcription_text: scenario.initialAiGreeting,
      speech_duration_seconds: 0,
    });

    return {
      simulationId,
      scenarioTitle: scenario.title,
      initialMessage: {
        senderType: 'assistant',
        text: scenario.initialAiGreeting,
      },
    };
  }

  /**
   * Processes a user audio dialogue turn:
   * 1. STT transcription via Google Cloud STT
   * 2. Supabase Storage upload to audio-sessions
   * 3. Claude 3.5 Sonnet roleplay & supportive feedback generation
   * 4. Persisting turns and returning envelope.
   */
  public static async processSimulationTurn(
    userId: string,
    simulationId: string,
    audioBuffer: Buffer,
    mimeType: string,
    speechDurationSeconds = 2.0
  ): Promise<SimulationTurnResponse> {
    // 1. Execute STT transcription and Storage upload concurrently
    const [transcription, storageResult] = await Promise.all([
      STTService.transcribeAudioBuffer(audioBuffer, mimeType),
      StorageService.uploadAudioSession(userId, simulationId, audioBuffer, mimeType),
    ]);

    // 2. Fetch conversation turn history
    const { data: historyRecords } = await supabaseAdmin
      .from('simulation_messages')
      .select('sender_type, transcription_text')
      .eq('simulation_id', simulationId)
      .order('created_at', { ascending: true });

    const formattedHistory = historyRecords
      ?.map((h) => `${h.sender_type.toUpperCase()}: ${h.transcription_text}`)
      .join('\n') || 'ASSISTANT: Halo kak, selamat siang! Ada yang bisa saya bantu?';

    // 3. Generate LLM roleplay reply and supportive feedback via Claude 3.5 Sonnet
    const llmTurn = await this.generateLLMRoleplayReply(
      'Kasir Minimarket',
      'Kasir Ramah',
      'Berlatih menyapa dan menjawab kasir',
      1,
      formattedHistory,
      transcription
    );

    // 4. Persist User Turn in simulation_messages
    await supabaseAdmin.from('simulation_messages').insert({
      simulation_id: simulationId,
      sender_type: 'user',
      audio_storage_path: storageResult.storagePath,
      transcription_text: transcription,
      speech_duration_seconds: speechDurationSeconds,
    });

    // 5. Persist Assistant Turn in simulation_messages
    await supabaseAdmin.from('simulation_messages').insert({
      simulation_id: simulationId,
      sender_type: 'assistant',
      transcription_text: llmTurn.replyText,
      speech_duration_seconds: 0,
      ai_empathy_score: llmTurn.comfortScore,
    });

    // 6. Update simulation turns count & duration
    try {
      await supabaseAdmin.rpc('increment_simulation_turns', {
        sim_id: simulationId,
        added_duration: Math.round(speechDurationSeconds),
      });
    } catch {
      await supabaseAdmin
        .from('simulations')
        .update({
          turns_count: (historyRecords?.length || 0) + 1,
        })
        .eq('id', simulationId);
    }

    return {
      userTurn: {
        transcription,
        speechDurationSeconds,
        audioUrl: storageResult.publicUrl,
      },
      aiTurn: {
        senderType: 'assistant',
        text: llmTurn.replyText,
        supportiveFeedback: llmTurn.supportiveFeedback,
      },
    };
  }

  /**
   * Concludes simulation session and generates final CBT summary evaluation.
   */
  public static async endSimulation(
    userId: string,
    simulationId: string,
    anxietyScoreAfter = 3
  ): Promise<EndSimulationResponse> {
    const { data: messages } = await supabaseAdmin
      .from('simulation_messages')
      .select('sender_type, transcription_text, speech_duration_seconds')
      .eq('simulation_id', simulationId);

    const turnsCount = Math.floor((messages?.length || 0) / 2);
    const totalDuration = messages?.reduce((acc, curr) => acc + Number(curr.speech_duration_seconds || 0), 0) || 60;

    const confidenceScore = Math.min(100, Math.max(50, 60 + turnsCount * 5));
    const feedbackSummary = `Hebat! Kamu berhasil merespon ${turnsCount} giliran percakapan secara runtut tanpa jeda panjang. Bukti nyata bahwa kamu bisa berkomunikasi dengan tenang.`;

    await supabaseAdmin
      .from('simulations')
      .update({
        ended_at: new Date().toISOString(),
        anxiety_score_after: anxietyScoreAfter,
        confidence_score: confidenceScore,
        feedback_summary: feedbackSummary,
      })
      .eq('id', simulationId);

    return {
      simulationId,
      totalDurationSeconds: Math.round(totalDuration),
      turnsCount,
      confidenceScore,
      feedbackSummary,
      newBadgeUnlocked: {
        id: 'first_conversation',
        title: 'First Conversation',
        iconName: 'seedling',
      },
    };
  }

  private static async generateLLMRoleplayReply(
    scenarioTitle: string,
    personaRole: string,
    scenarioDescription: string,
    difficultyLevel: number,
    historyText: string,
    userTranscription: string
  ): Promise<LLMTurnResponse> {
    const defaultTurn: LLMTurnResponse = {
      replyText: 'Baik kak, nomor HP atau emailnya boleh disebutkan untuk struk digitalnya?',
      supportiveFeedback: 'Responsmu terdengar sangat jelas dan tenang! Lanjutkan ke langkah berikutnya.',
      comfortScore: 85,
    };

    try {
      const systemPrompt = `You are acting as the roleplay character "${personaRole}" in the scenario "${scenarioTitle}".
Scenario Context: ${scenarioDescription}
Difficulty Level: ${difficultyLevel} / 5

Goals:
1. Stay in character naturally and keep the conversation realistic, patient, and welcoming.
2. Adapt your response to the user's input: keep replies concise (1-2 sentences) so the user doesn't feel overwhelmed.
3. Alongside the in-character dialogue, provide a supportive, encouraging cue ("supportiveFeedback") in Indonesian praising their effort.
4. Estimate an internal "comfortScore" (1-100) reflecting how well they engaged with the scenario.

Constraint:
- Output MUST be valid JSON only with keys: "replyText", "supportiveFeedback", "comfortScore".`;

      const userPrompt = `Conversation History:
${historyText}

User's Latest Audio Transcription:
"${userTranscription}"

Generate the in-character reply and supportive feedback. Return strictly valid JSON.`;

      const response = await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
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
        const parsed: LLMTurnResponse = JSON.parse(jsonMatch[0]);
        if (parsed.replyText && parsed.supportiveFeedback) {
          return {
            replyText: parsed.replyText.trim(),
            supportiveFeedback: parsed.supportiveFeedback.trim(),
            comfortScore: parsed.comfortScore || 80,
          };
        }
      }

      return defaultTurn;
    } catch (error) {
      logger.warn('Claude roleplay turn generation error, using fallback reply:', error);
      return defaultTurn;
    }
  }
}
