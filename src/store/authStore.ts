import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthPlayer {
  id: string;
  phone: string;
  display_name: string;
  play_count: number;
  is_blocked: boolean;
}

interface AuthState {
  token: string | null;
  isPending: boolean;
  player: AuthPlayer | null;
  qrRef: string | null;

  setAuth: (token: string, player: AuthPlayer | null, isPending: boolean) => void;
  setQrRef: (ref: string | null) => void;
  setPlayer: (player: AuthPlayer) => void;
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
      clearAuth: () =>
        set({ token: null, player: null, isPending: false }),
    }),
    {
      name: "pg_auth_store",
      partialize: (state) => ({
        token: state.token,
        isPending: state.isPending,
        player: state.player,
        qrRef: state.qrRef,
      }),
    },
  ),
);
