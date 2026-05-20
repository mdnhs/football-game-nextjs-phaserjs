import { z } from 'zod';

export const submitScoreSchema = z.object({
  totalScore: z.number().int().min(0).max(2000),
  goals: z.number().int().min(0).max(5),
  perfectShots: z.number().int().min(0).max(5),
  difficulty: z.number().min(0).max(1),
  shotLog: z.array(z.object({}).passthrough()),
  qrRef: z.string().optional(),
});
