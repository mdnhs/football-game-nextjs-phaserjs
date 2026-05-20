import { API_ROUTES } from '@/lib/routes/api-routes';
import { api } from '@/lib/api-client/legacy';
import type { LeaderboardFilters, LeaderboardRowApiResponse, MyRankFilters, RankApiResponse } from '../types';

const qs = (params: Record<string, string | number | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
};

export const leaderboardApi = {
  list: ({ type, date, limit }: LeaderboardFilters) => {
    const path = type === 'daily' ? API_ROUTES.leaderboard.daily : API_ROUTES.leaderboard.campaign;
    return api<LeaderboardRowApiResponse[]>(`${path}${qs({ date, limit })}`);
  },
  myRank: ({ type, date }: MyRankFilters) =>
    api<RankApiResponse>(`${API_ROUTES.leaderboard.myRank}${qs({ type, date })}`),
};
