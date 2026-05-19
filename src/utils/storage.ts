import type { LeaderboardEntry } from "@/types/game";

const LEADERBOARD_KEY = "pg_leaderboard";

export function getStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore — private browsing / storage full
  }
}

export function saveToLeaderboard(entry: LeaderboardEntry): void {
  const existing = getLeaderboard();
  existing.push(entry);
  existing.sort((a, b) => b.score - a.score);
  setStorage(LEADERBOARD_KEY, existing.slice(0, 200));
}

export function getLeaderboard(): LeaderboardEntry[] {
  return getStorage<LeaderboardEntry[]>(LEADERBOARD_KEY) ?? [];
}
