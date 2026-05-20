import type { ShotLogEntry } from '@/features/game/types';

export interface SubmitScorePayload {
  totalScore: number;
  goals: number;
  perfectShots: number;
  difficulty: number;
  shotLog: ShotLogEntry[];
  qrRef?: string;
}

export interface SubmitScoreApiResponse {
  scoreId: string;
  flagged: boolean;
  reason?: string;
}

export type SubmitScoreResult = SubmitScoreApiResponse;
