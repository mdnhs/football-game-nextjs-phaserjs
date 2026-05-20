import { mapSnakeToCamel } from '@/lib/utils';
import type {
  CompleteProfileApiResponse,
  CompleteProfileResult,
  Player,
  PlayerApiResponse,
  VerifyOtpApiResponse,
  VerifyOtpResult,
} from '../types';

export const mapPlayer = (data: PlayerApiResponse | null): Player | null => (data ? mapSnakeToCamel(data) : null);

export const mapVerifyOtp = (data: VerifyOtpApiResponse): VerifyOtpResult => ({
  token: data.token,
  isNew: data.isNew,
  player: mapPlayer(data.player),
});

export const mapCompleteProfile = (data: CompleteProfileApiResponse): CompleteProfileResult => ({
  token: data.token,
  player: mapSnakeToCamel(data.player),
});
