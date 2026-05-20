"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";
import { useRequireAuth } from "@/lib/use-require-auth";
import GameCanvas from "@/components/game/GameCanvas";

export default function GamePage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const { playerName, setPlayerName } = useGameStore();
  const player = useAuthStore((s) => s.player);

  useEffect(() => {
    if (!ready) return;
    if (player?.display_name && player.display_name !== playerName) {
      setPlayerName(player.display_name);
    }
  }, [ready, player?.display_name, playerName, setPlayerName]);

  useEffect(() => {
    if (!ready) return;
    if (!player?.display_name && !playerName) {
      router.replace("/menu");
    }
  }, [ready, player?.display_name, playerName, router]);

  if (!ready) return null;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#000814]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-black/35 to-transparent" />
      <GameCanvas />
    </main>
  );
}
