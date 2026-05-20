export interface Player {
  id: string;
  phone: string;
  display_name: string;
  firebase_uid: string;
  play_count: number;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ShotLogEntry {
  shotIndex: number;
  power: number;
  timing: number;
  directionX: number;
  result: 'goal' | 'saved' | 'miss';
  points: number;
  durationMs: number;
}

export interface FlaggedScore {
  id: string;
  total_score: number;
  goals: number;
  is_flagged: boolean;
  played_at: string;
  shot_log: ShotLogEntry[];
  players: { display_name: string; phone: string } | null;
}

export interface DailyWinner {
  player_id: string;
  display_name: string;
  phone: string;
  best_score: number;
  best_goals: number;
}

export interface QrCode {
  id: string;
  ref: string;
  label: string;
  target_path: string;
  scan_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface QrStats extends QrCode {
  signups: number;
}

export interface DashboardStats {
  totalPlayers: number;
  todayMatches: number;
  flaggedScores: number;
  avgScore: number;
}

export type ScoreDistribution = Record<string, number>;
