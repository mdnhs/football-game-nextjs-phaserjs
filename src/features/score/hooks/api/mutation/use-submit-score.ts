import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LEADERBOARD_QUERY_KEYS } from '@/features/leaderboard/utils/query-keys';
import { PLAYER_QUERY_KEYS } from '@/features/player/utils/query-keys';
import { scoreService } from '../../../services/service';
import type { SubmitScorePayload } from '../../../types';

export const useSubmitScore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitScorePayload) => scoreService.submit(payload),
    onSuccess: (response) => {
      if (response.error) return;
      queryClient.invalidateQueries({ queryKey: LEADERBOARD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PLAYER_QUERY_KEYS.playsRemaining() });
    },
  });
};
