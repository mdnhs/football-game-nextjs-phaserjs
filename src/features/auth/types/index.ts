import type { CamelCaseKeys } from '@/types';

export interface PlayerApiResponse {
  id: string;
  phone: string;
  display_name: string;
  play_count: number;
  is_blocked: boolean;
}

export type Player = CamelCaseKeys<PlayerApiResponse>;

export interface VerifyOtpApiResponse {
  token: string;
  isNew: boolean;
  player: PlayerApiResponse | null;
}

export type VerifyOtpResult = CamelCaseKeys<VerifyOtpApiResponse>;

export interface CompleteProfileApiResponse {
  token: string;
  player: PlayerApiResponse;
}

export type CompleteProfileResult = CamelCaseKeys<CompleteProfileApiResponse>;

export interface VerifyOtpPayload {
  idToken: string;
  qrRef?: string;
}

export interface CompleteProfilePayload {
  displayName: string;
}
