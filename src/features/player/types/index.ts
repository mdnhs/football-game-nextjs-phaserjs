import type { CamelCaseKeys } from '@/types';

export interface CurrentPlayerApiResponse {
  id: string;
  display_name: string;
  phone: string;
  play_count: number;
  created_at: string;
}

export type CurrentPlayer = CamelCaseKeys<CurrentPlayerApiResponse>;

export interface PlaysRemainingApiResponse {
  remaining: number;
}

export type PlaysRemaining = CamelCaseKeys<PlaysRemainingApiResponse>;
