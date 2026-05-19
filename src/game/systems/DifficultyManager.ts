import Phaser from "phaser";
import { getStorage, setStorage } from "@/utils/storage";
import { GAME } from "@/constants/game";
import type { AimDirection } from "@/types/game";

const STORAGE_KEY = "pg_difficulty";

interface DifficultyState {
  playCount: number;
  level: number;
}

export class DifficultyManager {
  private playCount: number;
  private level: number;
  private storageKey: string;

  constructor(playerName: string) {
    this.storageKey = `${STORAGE_KEY}_${playerName}`;

    const stored = getStorage<DifficultyState>(this.storageKey) ?? {
      playCount: 0,
      level: 0,
    };

    this.playCount = stored.playCount + 1;
    this.level = Math.min(
      this.playCount * GAME.DIFFICULTY_PER_PLAY,
      GAME.MAX_DIFFICULTY,
    );

    setStorage(this.storageKey, {
      playCount: this.playCount,
      level: this.level,
    });
  }

  getCurrentLevel(): number {
    return this.level;
  }

  keeperSaves({
    power,
  }: {
    direction: AimDirection;
    power: number;
  }): boolean {
    const keeperSkill =
      GAME.KEEPER_BASE_SKILL +
      this.level * (GAME.KEEPER_MAX_SKILL - GAME.KEEPER_BASE_SKILL);

    const saveChance = keeperSkill * (1 - power * 0.62);
    return Math.random() < saveChance;
  }

  getTimingBarSpeed(): number {
    return Phaser.Math.Linear(
      GAME.TIMING_BASE_SPEED,
      GAME.TIMING_MAX_SPEED,
      this.level,
    );
  }
}
