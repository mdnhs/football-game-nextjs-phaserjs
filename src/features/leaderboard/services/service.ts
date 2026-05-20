import { ApiError } from '@/lib/api-client/legacy';
import type { ServiceResponse } from '@/types';
import { leaderboardApi } from './api';
import { mapLeaderboardRows } from './mapper';
import type { LeaderboardFilters, LeaderboardRow, MyRankFilters, RankResult } from '../types';

const fail = <T>(err: unknown, fallback: string): ServiceResponse<T> => ({
  error: true,
  message: err instanceof ApiError ? err.message : fallback,
  data: null,
  status: err instanceof ApiError ? err.status : 500,
});

export const leaderboardService = {
  async getList(filters: LeaderboardFilters): Promise<ServiceResponse<LeaderboardRow[]>> {
    try {
      const data = await leaderboardApi.list(filters);
      return { error: false, message: 'Success', data: mapLeaderboardRows(data) };
    } catch (err) {
      return fail<LeaderboardRow[]>(err, 'Failed to fetch leaderboard');
    }
  },

  async getMyRank(filters: MyRankFilters): Promise<ServiceResponse<RankResult>> {
    try {
      const data = await leaderboardApi.myRank(filters);
      return { error: false, message: 'Success', data };
    } catch (err) {
      return fail<RankResult>(err, 'Failed to fetch rank');
    }
  },
};
