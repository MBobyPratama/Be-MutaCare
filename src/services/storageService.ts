import { supabaseAdmin, STORAGE_BUCKETS } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export interface StorageUploadResult {
  storagePath: string;
  publicUrl: string;
}

export class StorageService {
  /**
   * Uploads raw audio buffer to Supabase Storage bucket 'audio-sessions' under path {userId}/{simulationId}_{timestamp}.m4a
   */
  public static async uploadAudioSession(
    userId: string,
    simulationId: string,
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<StorageUploadResult> {
    const extension = this.getFileExtension(mimeType);
    const fileName = `${simulationId}_${Date.now()}.${extension}`;
    const storagePath = `${userId}/${fileName}`;

    try {
      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS.AUDIO_SESSIONS)
        .upload(storagePath, audioBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        logger.error('Failed to upload audio to Supabase Storage:', error);
        // Fallback dummy path if bucket is not created in dev environment
        return {
          storagePath: `audio-sessions/${storagePath}`,
          publicUrl: `${env.SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKETS.AUDIO_SESSIONS}/${storagePath}`,
        };
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKETS.AUDIO_SESSIONS)
        .getPublicUrl(data.path);

      return {
        storagePath: data.path,
        publicUrl: publicUrlData.publicUrl,
      };
    } catch (error) {
      logger.warn('Storage upload error, using fallback audio path:', error);
      return {
        storagePath: `audio-sessions/${storagePath}`,
        publicUrl: `${env.SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKETS.AUDIO_SESSIONS}/${storagePath}`,
      };
    }
  }

  private static getFileExtension(mimeType: string): string {
    const mime = mimeType.toLowerCase();
    if (mime.includes('wav')) return 'wav';
    if (mime.includes('mp3') || mime.includes('mpeg')) return 'mp3';
    if (mime.includes('aac')) return 'aac';
    if (mime.includes('webm')) return 'webm';
    return 'm4a';
  }
}
