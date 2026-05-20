export interface ShotResult {
  scored: boolean;
  saved: boolean;
  bonus: boolean;
  points: number;
  reason: string;
}

export interface ShotLogEntry {
  shotIndex: number;
  power: number;
  timing: number;
  directionX: number;
  result: "goal" | "saved" | "miss";
  points: number;
  durationMs: number;
}

export interface MatchResult {
  playerName: string;
  totalScore: number;
  shotResults: ShotResult[];
  shotLog: ShotLogEntry[];
  difficulty: number;
  timestamp?: string;
}

export interface LeaderboardEntry {
  playerId?: string;
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
