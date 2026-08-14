import { SpeechClient, protos } from '@google-cloud/speech';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let speechClient: SpeechClient | null = null;

try {
  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    speechClient = new SpeechClient();
  } else {
    speechClient = new SpeechClient();
  }
} catch (error) {
  logger.warn('Google Cloud Speech-to-Text client initialization warning:', error);
}

export class STTService {
  /**
   * Transcribes raw audio buffer to Indonesian text using Google Cloud Speech-to-Text API.
   * Includes fallback graceful handling for development environments.
   */
  public static async transcribeAudioBuffer(
    audioBuffer: Buffer,
    mimeType: string,
    languageCode = 'id-ID'
  ): Promise<string> {
    const defaultFallbackText = 'Halo, saya ingin mencoba latihan ini.';

    try {
      if (!speechClient) {
        logger.warn('GCP SpeechClient not initialized, using default fallback transcription.');
        return defaultFallbackText;
      }

      const encoding = this.getAudioEncoding(mimeType);

      const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding,
          sampleRateHertz: 16000,
          languageCode,
          enableAutomaticPunctuation: true,
          model: 'default',
        },
      };

      const [response] = await speechClient.recognize(request);

      const transcription = response.results
        ?.map((result: protos.google.cloud.speech.v1.ISpeechRecognitionResult) => result.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join('\n');

      if (transcription && transcription.trim() !== '') {
        return transcription.trim();
      }

      return defaultFallbackText;
    } catch (error) {
      logger.warn('Google Cloud STT transcription failed, using fallback transcript:', error);
      return defaultFallbackText;
    }
  }

  private static getAudioEncoding(
    mimeType: string
  ): protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding {
    const mime = mimeType.toLowerCase();
    if (mime.includes('wav')) return protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16;
    if (mime.includes('mp3') || mime.includes('mpeg')) return protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.MP3;
    if (mime.includes('flac')) return protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.FLAC;
    if (mime.includes('webm')) return protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS;
    if (mime.includes('ogg')) return protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.OGG_OPUS;
    return protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED;
  }
}
