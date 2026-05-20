import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MatchResult } from '@/features/game/types';

interface GameState {
  playerName: string;
  result: MatchResult | null;

  setPlayerName: (name: string) => void;
  setResult: (result: MatchResult) => void;
  clearResult: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      playerName: '',
      result: null,

      setPlayerName: (name) => set({ playerName: name }),
      setResult: (result) => set({ result }),
      clearResult: () => set({ result: null }),
    }),
    {
      name: 'pg_game_store',
      partialize: (state) => ({ playerName: state.playerName }),
    },
  ),
);
