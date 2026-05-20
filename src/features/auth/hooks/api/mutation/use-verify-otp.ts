import { useMutation } from '@tanstack/react-query';
import { authService } from '../../../services/service';
import type { VerifyOtpPayload } from '../../../types';

export const useVerifyOtp = () =>
  useMutation({ mutationFn: (payload: VerifyOtpPayload) => authService.verifyOtp(payload) });
