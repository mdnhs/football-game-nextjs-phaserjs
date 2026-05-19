"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import GameCanvas from "@/components/game/GameCanvas";

export default function GamePage() {
  const router = useRouter();
  const { playerName } = useGameStore();

  useEffect(() => {
    if (!playerName) {
      router.replace("/menu");
    }
  }, [playerName, router]);

  if (!playerName) return null;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#000814]">
      <GameCanvas />
    </main>
  );
}
