import { GAME } from "@/constants/game";
import type { ShotResult, AimDirection } from "@/types/game";
import type { DifficultyManager } from "./DifficultyManager";

export class ScoreEngine {
  constructor(private difficulty: DifficultyManager) {}

  evaluate({
    power,
    timing,
    direction,
    difficulty,
  }: {
    power: number;
    timing: number;
    direction: AimDirection;
    difficulty: number;
  }): ShotResult {
    const result: ShotResult = {
      scored: false,
      saved: false,
      bonus: false,
      points: 0,
      reason: "",
    };

    // ── Wide miss ─────────────────────────────────────────
    const postLimit =
      GAME.POST_LIMIT_BASE - difficulty * GAME.POST_LIMIT_REDUCTION;
    if (Math.abs(direction.x) > postLimit) {
      result.reason = "Wide!";
      return result;
    }

    // ── Too weak ──────────────────────────────────────────
    const minPower = GAME.MIN_POWER_BASE + difficulty * GAME.MIN_POWER_SLOPE;
    if (power < minPower) {
      result.reason = "Too weak!";
      return result;
    }

    // ── Crossbar miss — overpowered + bad timing, or aimed top with poor timing ─
    if (
      (power > 0.95 && timing < 0.3) ||
      (direction.y < -0.85 && timing < 0.4)
    ) {
      result.reason = "Over the bar!";
      return result;
    }

    // ── Keeper save ───────────────────────────────────────
    const saved = this.difficulty.keeperSaves({ direction, power });
    if (saved && power < 0.88) {
      result.saved = true;
      result.reason = "Keeper saved it!";
      return result;
    }

    // ── Goal ──────────────────────────────────────────────
    result.scored = true;

    if (timing >= 0.85) {
      result.bonus = true;
      result.points = Math.round(
        GAME.BASE_GOAL_POINTS * GAME.TIMING_MULTIPLIER + GAME.PERFECT_BONUS,
      );
      result.reason = "Perfect shot!";
    } else if (timing >= GAME.MIN_TIMING_TO_SCORE) {
      result.points = Math.round(GAME.BASE_GOAL_POINTS * (0.6 + timing * 0.4));
      result.reason = "Goal!";
    } else {
      result.points = Math.round(GAME.BASE_GOAL_POINTS * 0.6);
      result.reason = "Just in!";
    }

    // ── Corner bonus — near-post shot with good timing & power ─
    const isCorner = Math.abs(direction.x) >= GAME.CORNER_THRESHOLD;
    const isControlled =
      timing >= GAME.ACCURACY_TIMING_GATE && power >= GAME.ACCURACY_POWER_GATE;
    if (isCorner && isControlled) {
      result.points += GAME.CORNER_BONUS;
      result.reason = "Corner shot!";
    }

    return result;
  }
}
