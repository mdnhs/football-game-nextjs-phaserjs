import { API_ROUTES } from '@/lib/routes/api-routes';
import { api } from '@/lib/api-client/legacy';
import type { SubmitScoreApiResponse, SubmitScorePayload } from '../types';

export const scoreApi = {
  submit: (payload: SubmitScorePayload) =>
    api<SubmitScoreApiResponse>(API_ROUTES.score.create, { method: 'POST', body: payload }),
};
