export const PLAYER_QUERY_KEYS = {
  all: ['player'] as const,
  me: () => [...PLAYER_QUERY_KEYS.all, 'me'] as const,
  playsRemaining: () => [...PLAYER_QUERY_KEYS.all, 'plays-remaining'] as const,
};
