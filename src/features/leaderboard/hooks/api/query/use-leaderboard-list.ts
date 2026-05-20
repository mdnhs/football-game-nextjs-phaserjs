import { useQuery } from '@tanstack/react-query';
import { leaderboardService } from '../../../services/service';
import { LEADERBOARD_QUERY_KEYS } from '../../../utils/query-keys';
import type { LeaderboardFilters } from '../../../types';

export const useLeaderboardList = (filters: LeaderboardFilters, enabled = true) =>
  useQuery({
    queryKey: LEADERBOARD_QUERY_KEYS.list(filters),
    queryFn: () => leaderboardService.getList(filters),
    enabled,
  });
