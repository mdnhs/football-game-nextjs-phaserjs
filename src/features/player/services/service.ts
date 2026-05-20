import { ApiError } from '@/lib/api-client/legacy';
import type { ServiceResponse } from '@/types';
import { playerApi } from './api';
import { mapCurrentPlayer, mapPlaysRemaining } from './mapper';
import type { CurrentPlayer, PlaysRemaining } from '../types';

const fail = <T>(err: unknown, fallback: string): ServiceResponse<T> => ({
  error: true,
  message: err instanceof ApiError ? err.message : fallback,
  data: null,
  status: err instanceof ApiError ? err.status : 500,
});

export const playerService = {
  async getMe(): Promise<ServiceResponse<CurrentPlayer>> {
    try {
      const data = await playerApi.me();
      return { error: false, message: 'Success', data: mapCurrentPlayer(data) };
    } catch (err) {
      return fail<CurrentPlayer>(err, 'Failed to fetch player');
    }
  },

  async getPlaysRemaining(): Promise<ServiceResponse<PlaysRemaining>> {
    try {
      const data = await playerApi.playsRemaining();
      return { error: false, message: 'Success', data: mapPlaysRemaining(data) };
    } catch (err) {
      return fail<PlaysRemaining>(err, 'Failed to fetch plays-remaining');
    }
  },
};
