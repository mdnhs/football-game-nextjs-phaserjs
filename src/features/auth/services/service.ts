import { ApiError } from '@/lib/api-client/legacy';
import type { ServiceResponse } from '@/types';
import { authApi } from './api';
import { mapCompleteProfile, mapVerifyOtp } from './mapper';
import type { CompleteProfilePayload, CompleteProfileResult, VerifyOtpPayload, VerifyOtpResult } from '../types';

const fail = <T>(err: unknown, fallback: string): ServiceResponse<T> => ({
  error: true,
  message: err instanceof ApiError ? err.message : fallback,
  data: null,
  status: err instanceof ApiError ? err.status : 500,
});

export const authService = {
  async verifyOtp(payload: VerifyOtpPayload): Promise<ServiceResponse<VerifyOtpResult>> {
    try {
      const data = await authApi.verifyOtp(payload);
      return { error: false, message: 'Verified', data: mapVerifyOtp(data) };
    } catch (err) {
      return fail<VerifyOtpResult>(err, 'Invalid code. Try again.');
    }
  },

  async completeProfile(payload: CompleteProfilePayload): Promise<ServiceResponse<CompleteProfileResult>> {
    try {
      const data = await authApi.completeProfile(payload);
      return { error: false, message: 'Profile saved', data: mapCompleteProfile(data) };
    } catch (err) {
      return fail<CompleteProfileResult>(err, 'Failed to save profile');
    }
  },
};
