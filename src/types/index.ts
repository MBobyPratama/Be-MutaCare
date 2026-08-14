export * from '../constants/http.js';
export * from '../constants/errorCodes.js';
export * from '../utils/response.js';

export type MoodStatus = 'happy' | 'neutral' | 'anxious' | 'scared' | 'sad';
export type MutismSeverity = 'mild' | 'moderate' | 'severe';
export type MissionType = 'relaxation' | 'guided_practice' | 'simulation' | 'reflection';
export type MissionStatus = 'pending' | 'completed' | 'skipped';
export type ScenarioCategory = 'daily_life' | 'academic' | 'professional' | 'social_family' | 'custom';

export interface UserProfile {
  id: string;
  fullName: string;
  nickname: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  createdAt: string;
  updatedAt: string;
}
