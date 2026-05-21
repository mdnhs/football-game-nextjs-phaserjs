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

// ── RBAC ────────────────────────────────────────────────────
export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  role_id: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

// ── Ads ─────────────────────────────────────────────────────
export interface AdSlide {
  url: string;
  caption?: string;
  clickUrl?: string;
}

export type AdKind = 'single' | 'carousel';
export type AdMediaType = 'image' | 'video';

export interface Ad {
  id: string;
  title: string;
  kind: AdKind;
  media_type: AdMediaType | null;
  media_url: string | null;
  click_url: string | null;
  caption: string | null;
  slides: AdSlide[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
