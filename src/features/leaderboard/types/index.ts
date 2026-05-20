import type { CamelCaseKeys } from '@/types';

export interface LeaderboardRowApiResponse {
  player_id: string;
  display_name: string;
  best_score: number;
  best_goals: number;
  matches_played: number;
}

export type LeaderboardRow = CamelCaseKeys<LeaderboardRowApiResponse>;

export interface RankApiResponse {
  rank: number | null;
  score: number | null;
}

export type RankResult = RankApiResponse;

export type LeaderboardTab = 'daily' | 'campaign';

export interface LeaderboardFilters {
  type: LeaderboardTab;
  date?: string;
  limit?: number;
}

export interface MyRankFilters {
  type: LeaderboardTab;
  date?: string;
}
