import type { Types } from "phaser";

export const gameConfig: Omit<Types.Core.GameConfig, "scene"> = {
  backgroundColor: "#000814",
  scale: {
    width: 390,
    height: 844,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
};
