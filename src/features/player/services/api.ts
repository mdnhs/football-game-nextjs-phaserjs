import { API_ROUTES } from '@/lib/routes/api-routes';
import { api } from '@/lib/api-client/legacy';
import type { CurrentPlayerApiResponse, PlaysRemainingApiResponse } from '../types';

export const playerApi = {
  me: () => api<CurrentPlayerApiResponse>(API_ROUTES.player.me),
  playsRemaining: () => api<PlaysRemainingApiResponse>(API_ROUTES.player.playsRemaining),
};
