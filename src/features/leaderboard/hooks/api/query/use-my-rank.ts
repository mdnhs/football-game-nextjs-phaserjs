import { useQuery } from '@tanstack/react-query';
import { leaderboardService } from '../../../services/service';
import { LEADERBOARD_QUERY_KEYS } from '../../../utils/query-keys';
import type { MyRankFilters } from '../../../types';

export const useMyRank = (filters: MyRankFilters, enabled = true) =>
  useQuery({
    queryKey: LEADERBOARD_QUERY_KEYS.myRank(filters),
    queryFn: () => leaderboardService.getMyRank(filters),
    enabled,
  });
