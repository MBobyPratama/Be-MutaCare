import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/appError.js';

// Memory storage engine: buffers incoming audio in RAM for fast STT & Supabase Storage processing
const storage = multer.memoryStorage();

const audioFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = [
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav',
    'audio/aac',
    'audio/mp3',
    'audio/mpeg',
    'audio/webm',
    'audio/ogg',
    'audio/3gpp',
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        `Invalid file type '${file.mimetype}'. Only audio files (m4a, wav, mp3, aac, webm) are allowed.`
      )
    );
  }
};

export const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max file size per DB_SCHEMA.md
  },
});

export const uploadAudioSingle = uploadAudio.single('audio');
