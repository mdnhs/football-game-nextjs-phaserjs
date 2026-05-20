import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player } from '../types';

export type AuthPlayer = Player;

interface AuthState {
  token: string | null;
  isPending: boolean;
  player: Player | null;
  qrRef: string | null;

  setAuth: (token: string, player: Player | null, isPending: boolean) => void;
  setQrRef: (ref: string | null) => void;
  setPlayer: (player: Player) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isPending: false,
      player: null,
      qrRef: null,

      setAuth: (token, player, isPending) => set({ token, player, isPending }),
      setQrRef: (qrRef) => set({ qrRef }),
      setPlayer: (player) => set({ player, isPending: false }),
      clearAuth: () => set({ token: null, player: null, isPending: false }),
    }),
    {
      name: 'pg_auth_store',
      partialize: (state) => ({
        token: state.token,
        isPending: state.isPending,
        player: state.player,
        qrRef: state.qrRef,
      }),
    },
  ),
);
