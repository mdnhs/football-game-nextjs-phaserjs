import { useQuery } from '@tanstack/react-query';
import { playerService } from '../../../services/service';
import { PLAYER_QUERY_KEYS } from '../../../utils/query-keys';

export const useCurrentPlayer = (enabled = true) =>
  useQuery({
    queryKey: PLAYER_QUERY_KEYS.me(),
    queryFn: () => playerService.getMe(),
    enabled,
  });
