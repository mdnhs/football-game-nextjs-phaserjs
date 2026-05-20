import { ApiError } from '@/lib/api-client/legacy';
import type { ServiceResponse } from '@/types';
import { scoreApi } from './api';
import type { SubmitScorePayload, SubmitScoreResult } from '../types';

const fail = <T>(err: unknown, fallback: string): ServiceResponse<T> => ({
  error: true,
  message: err instanceof ApiError ? err.message : fallback,
  data: null,
  status: err instanceof ApiError ? err.status : 500,
});

export const scoreService = {
  async submit(payload: SubmitScorePayload): Promise<ServiceResponse<SubmitScoreResult>> {
    try {
      const data = await scoreApi.submit(payload);
      return { error: false, message: 'Score saved', data };
    } catch (err) {
      return fail<SubmitScoreResult>(err, 'Failed to save score');
    }
  },
};
