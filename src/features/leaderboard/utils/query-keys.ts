import type { LeaderboardFilters, MyRankFilters } from '../types';

export const LEADERBOARD_QUERY_KEYS = {
  all: ['leaderboard'] as const,
  list: (filters: LeaderboardFilters) => [...LEADERBOARD_QUERY_KEYS.all, 'list', filters] as const,
  myRank: (filters: MyRankFilters) => [...LEADERBOARD_QUERY_KEYS.all, 'my-rank', filters] as const,
};
