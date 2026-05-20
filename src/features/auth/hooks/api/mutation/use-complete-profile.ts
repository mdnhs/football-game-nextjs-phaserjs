import { useMutation } from '@tanstack/react-query';
import { authService } from '../../../services/service';
import type { CompleteProfilePayload } from '../../../types';

export const useCompleteProfile = () =>
  useMutation({ mutationFn: (payload: CompleteProfilePayload) => authService.completeProfile(payload) });
