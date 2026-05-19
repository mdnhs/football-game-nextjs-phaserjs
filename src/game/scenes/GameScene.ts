import Phaser from "phaser";
import { Ball } from "../objects/Ball";
import { Goalkeeper } from "../objects/Goalkeeper";
import { PowerBar } from "../objects/PowerBar";
import { TimingBar } from "../objects/TimingBar";
import { ScoreEngine } from "../systems/ScoreEngine";
import { DifficultyManager } from "../systems/DifficultyManager";
import type { ShotResult } from "@/types/game";

const TOTAL_SHOTS = 5;

export class GameScene extends Phaser.Scene {
  private ball!: Ball;
  private goalkeeper!: Goalkeeper;
  private powerBar!: PowerBar;
  private timingBar!: TimingBar;
  private scoreEngine!: ScoreEngine;
  private difficultyManager!: DifficultyManager;

  private shotsTaken = 0;
  private totalScore = 0;
  private shotResults: ShotResult[] = [];
  private isAnimating = false;

  private scoreText!: Phaser.GameObjects.Text;
  private shotsText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private netFlash!: Phaser.GameObjects.Image;
  private crowdSound: Phaser.Sound.BaseSound | null = null;

  private hasAudio(key: string): boolean {
    return this.cache.audio.exists(key);
  }

  private playSafe(key: string) {
    if (this.hasAudio(key)) this.sound.play(key);
  }

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    const { width, height } = this.scale;
    const playerName: string = this.registry.get("playerName") || "Player";

    this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height);
    this.add
      .image(width / 2, height * 0.15, "crowd")
      .setDisplaySize(width, height * 0.35)
      .setAlpha(0.75);

    // Floodlight beams from top
    const beams = this.add.graphics().setDepth(1);
    beams.fillStyle(0xffffee, 0.04);
    beams.fillTriangle(width * 0.1, 0, width * 0.4, 0, width * 0.55, height);
    beams.fillTriangle(width * 0.6, 0, width * 0.9, 0, width * 0.45, height);

    this.add
      .image(width / 2, height * 0.31, "goal")
      .setDisplaySize(width * 0.85, height * 0.38)
      .setDepth(2);

    this.netFlash = this.add
      .image(width / 2, height * 0.27, "net_flash")
      .setDisplaySize(width * 0.72, height * 0.3)
      .setAlpha(0)
      .setDepth(3);

    // Field markings (penalty arc + box hint)
    const lines = this.add.graphics().setDepth(2);
    lines.lineStyle(2, 0xffffff, 0.35);
    lines.strokeRect(width * 0.08, height * 0.62, width * 0.84, height * 0.3);
    lines.beginPath();
    lines.arc(
      width / 2,
      height * 0.62,
      width * 0.18,
      Phaser.Math.DegToRad(0),
      Phaser.Math.DegToRad(180),
      true,
    );
    lines.strokePath();

    // Bottom vignette
    const vignette = this.add.graphics().setDepth(4);
    vignette.fillStyle(0x000000, 0.45);
    vignette.fillRect(0, height * 0.85, width, height * 0.15);

    this.difficultyManager = new DifficultyManager(playerName);
    this.scoreEngine = new ScoreEngine(this.difficultyManager);

    const goalBottomY = height * 0.31 + (height * 0.38) / 2;
    const keeperHeight = height * 0.24;
    this.goalkeeper = new Goalkeeper(
      this,
      width / 2,
      goalBottomY,
      keeperHeight,
    );
    this.ball = new Ball(this, width / 2, height * 0.77);
    this.powerBar = new PowerBar(this, width / 2, height * 0.87);
    this.timingBar = new TimingBar(this, width / 2, height * 0.92);

    // HUD pill backings
    this.add
      .rectangle(16, 16, 130, 32, 0x000000, 0.55)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xffd70044)
      .setDepth(19);
    this.add
      .rectangle(width - 16, 16, 80, 32, 0x000000, 0.55)
      .setOrigin(1, 0)
      .setStrokeStyle(1, 0xffffff22)
      .setDepth(19);

    this.scoreText = this.add
      .text(28, 22, "Score: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#FFD700",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setDepth(20);

    this.shotsText = this.add
      .text(width - 28, 22, `0 / ${TOTAL_SHOTS}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(1, 0)
      .setDepth(20);

    this.statusText = this.add
      .text(width / 2, 52, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        color: "#aaffaa",
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.toastText = this.add
      .text(width / 2, height * 0.44, "", {
        fontFamily: "system-ui, sans-serif",
        fontStyle: "bold",
        fontSize: "38px",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(30);

    if (this.hasAudio("crowd")) {
      this.crowdSound = this.sound.add("crowd", { loop: true, volume: 0.25 });
      this.crowdSound.play();
    }

    this.setupInput();

    this.time.delayedCall(700, () => {
      this.playSafe("whistle");
      this.readyForShot();
    });
  }

  override update(_time: number, delta: number) {
    this.powerBar.update(delta);
    this.timingBar.update(delta);
  }

  private readyForShot() {
    if (this.shotsTaken >= TOTAL_SHOTS) {
      this.endMatch();
      return;
    }

    this.isAnimating = false;
    this.ball.resetPosition();
    this.goalkeeper.resetPosition();
    this.powerBar.reset();
    this.timingBar.reset();
    this.powerBar.show();
    this.timingBar.show();

    const remaining = TOTAL_SHOTS - this.shotsTaken;
    this.statusText.setText(
      `Shot ${this.shotsTaken + 1} of ${TOTAL_SHOTS}  ·  ${remaining} remaining`,
    );
  }

  private setupInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating) return;
      this.powerBar.startCharging();
      this.timingBar.start(this.difficultyManager.getTimingBarSpeed());
      this.ball.startAiming(pointer);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating) return;
      this.ball.updateAim(pointer);
    });

    this.input.on("pointerup", () => {
      if (this.isAnimating) return;
      this.shoot();
    });
  }

  private shoot() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const power = this.powerBar.release();
    const timing = this.timingBar.release();
    const direction = this.ball.getAimDirection();
    const difficulty = this.difficultyManager.getCurrentLevel();

    this.powerBar.hide();
    this.timingBar.hide();

    const result = this.scoreEngine.evaluate({
      power,
      timing,
      direction,
      difficulty,
    });
    this.goalkeeper.reactToShot({
      direction,
      power,
      difficulty,
      willSave: result.saved,
    });

    this.ball.shoot({
      direction,
      power,
      timing,
      onComplete: () => this.handleShotResult(result),
    });

    this.playSafe("kick");
  }

  private handleShotResult(result: ShotResult) {
    this.shotsTaken++;
    this.totalScore += result.points;
    this.shotResults.push(result);

    this.scoreText.setText(`Score: ${this.totalScore}`);
    this.shotsText.setText(`${this.shotsTaken} / ${TOTAL_SHOTS}`);

    if (result.scored) this.showGoal(result);
    else if (result.saved) this.showSaved();
    else this.showMiss(result.reason);
  }

  private showGoal(result: ShotResult) {
    this.playSafe("goal");
    if (this.crowdSound) {
      (this.crowdSound as Phaser.Sound.WebAudioSound).setVolume(0.8);
    }
    this.cameras.main.shake(250, 0.015);
    this.goalkeeper.dejected();

    this.tweens.add({
      targets: this.netFlash,
      alpha: { from: 0.9, to: 0 },
      duration: 750,
      ease: "Power2",
    });

    const label = result.bonus
      ? `🌟 PERFECT!  +${result.points}`
      : `⚽ GOAL!  +${result.points}`;

    this.showToast(label, result.bonus ? "#FFD700" : "#00e676");

    this.time.delayedCall(1800, () => {
      if (this.crowdSound) {
        (this.crowdSound as Phaser.Sound.WebAudioSound).setVolume(0.25);
      }
      this.readyForShot();
    });
  }

  private showSaved() {
    this.playSafe("save");
    this.ball.bounceBack();
    this.showToast("🧤 SAVED!", "#ff5722");
    this.time.delayedCall(900, () => this.goalkeeper.celebrate());
    this.time.delayedCall(1900, () => this.readyForShot());
  }

  private showMiss(reason: string) {
    this.playSafe("miss");
    const label = reason ? `😬 ${reason.toUpperCase()}` : "😬 MISS!";
    this.showToast(label, "#ff1744");
    this.time.delayedCall(1500, () => this.readyForShot());
  }

  private showToast(message: string, color: string) {
    this.toastText.setText(message).setColor(color).setAlpha(1).setScale(0.4);

    this.tweens.add({
      targets: this.toastText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 220,
      ease: "Back.Out",
      onComplete: () => {
        this.time.delayedCall(900, () => {
          this.tweens.add({
            targets: this.toastText,
            alpha: 0,
            duration: 300,
          });
        });
      },
    });
  }

  private endMatch() {
    this.crowdSound?.stop();
    this.playSafe("whistle");

    const setResult = this.registry.get("setResult");
    const router = this.registry.get("router");

    setResult({
      playerName: this.registry.get("playerName"),
      totalScore: this.totalScore,
      shotResults: this.shotResults,
    });

    this.time.delayedCall(1200, () => {
      router.push("/result");
    });
  }
}
