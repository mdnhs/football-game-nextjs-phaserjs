"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import type * as PhaserNS from "phaser";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserNS.Game | null>(null);
  const router = useRouter();
  const { playerName } = useGameStore();

  useEffect(() => {
    let cancelled = false;

    const initGame = async () => {
      const Phaser = (await import("phaser")).default;
      const { gameConfig } = await import("@/game/config");
      const { BootScene } = await import("@/game/scenes/BootScene");
      const { PreloadScene } = await import("@/game/scenes/PreloadScene");
      const { GameScene } = await import("@/game/scenes/GameScene");

      if (cancelled || !containerRef.current || gameRef.current) return;

      const game = new Phaser.Game({
        ...gameConfig,
        type: Phaser.AUTO,
        scale: {
          ...gameConfig.scale,
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [BootScene, PreloadScene, GameScene],
        parent: containerRef.current,
        callbacks: {
          postBoot: (g) => {
            g.registry.set("router", router);
            g.registry.set("playerName", playerName || "Player");
            g.registry.set("setResult", useGameStore.getState().setResult);
          },
        },
      });

      gameRef.current = game;
    };

    initGame();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full bg-[#000814]"
      id="game-container"
    />
  );
}
