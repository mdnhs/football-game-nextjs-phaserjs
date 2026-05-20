import { API_ROUTES } from '@/lib/routes/api-routes';
import { api } from '@/lib/api-client/legacy';
import type {
  CompleteProfileApiResponse,
  CompleteProfilePayload,
  VerifyOtpApiResponse,
  VerifyOtpPayload,
} from '../types';

export const authApi = {
  verifyOtp: (payload: VerifyOtpPayload) =>
    api<VerifyOtpApiResponse>(API_ROUTES.auth.verifyOtp, { method: 'POST', body: payload, auth: false }),
  completeProfile: (payload: CompleteProfilePayload) =>
    api<CompleteProfileApiResponse>(API_ROUTES.auth.completeProfile, { method: 'POST', body: payload }),
};
