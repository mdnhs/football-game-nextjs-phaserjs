import { mapSnakeToCamel } from '@/lib/utils';
import type { LeaderboardRow, LeaderboardRowApiResponse } from '../types';

export const mapLeaderboardRows = (data: LeaderboardRowApiResponse[]): LeaderboardRow[] =>
  data?.map(mapSnakeToCamel) ?? [];
