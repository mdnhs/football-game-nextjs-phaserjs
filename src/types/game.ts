export interface ShotResult {
  scored: boolean;
  saved: boolean;
  bonus: boolean;
  points: number;
  reason: string;
}

export interface MatchResult {
  playerName: string;
  totalScore: number;
  shotResults: ShotResult[];
  timestamp?: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  goalsOf5: number;
}

export interface AimDirection {
  x: number;
  y: number;
}

export interface WindInfo {
  speed: number;
  direction: -1 | 1;
}
