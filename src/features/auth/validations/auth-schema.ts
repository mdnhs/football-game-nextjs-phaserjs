import { z } from 'zod';

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+\d{8,15}$/, 'Enter phone in international format, e.g. +8801712345678');

export const otpSchema = z.string().regex(/^\d{4,8}$/, 'Enter the OTP code sent to your phone');

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be 2–30 characters')
  .max(30, 'Name must be 2–30 characters');

export const completeProfileSchema = z.object({ displayName: displayNameSchema });

export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;
