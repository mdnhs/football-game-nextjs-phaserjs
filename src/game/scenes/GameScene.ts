import Phaser from "phaser";
import { Ball } from "../objects/Ball";
import { Goalkeeper } from "../objects/Goalkeeper";
import { PowerBar } from "../objects/PowerBar";
import { TimingBar } from "../objects/TimingBar";
import { ScoreEngine } from "../systems/ScoreEngine";
import { DifficultyManager } from "../systems/DifficultyManager";
import type { ShotResult } from "@/types/game";

const TOTAL_SHOTS = 5;

type ToastStyle = "burst" | "shake" | "droop" | "slide" | "hover";

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
  private statusPanel!: Phaser.GameObjects.Graphics;
  private shotDots: Phaser.GameObjects.Arc[] = [];
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
    const usePhotoStadium = Boolean(this.registry.get("usePhotoStadium"));
    const useGoalbarAsset = Boolean(this.registry.get("useGoalbarAsset"));

    const bg = this.add.image(width / 2, height / 2, "bg");
    bg.setScale(Math.max(width / bg.width, height / bg.height));

    if (!usePhotoStadium) {
      this.add
        .image(width / 2, height * 0.15, "crowd")
        .setDisplaySize(width, height * 0.35)
        .setAlpha(0.9);

      // Roof lip, rig lights, and soft broadcast beams.
      const stadiumFx = this.add.graphics().setDepth(1);
      stadiumFx.fillStyle(0x00040c, 0.82);
      stadiumFx.fillRect(0, 0, width, height * 0.075);
      stadiumFx.fillStyle(0xffffff, 0.05);
      stadiumFx.fillRect(0, height * 0.075, width, 1);
      stadiumFx.fillStyle(0xfff4c8, 0.08);
      stadiumFx.fillCircle(width * 0.1, -18, width * 0.5);
      stadiumFx.fillCircle(width * 0.9, -18, width * 0.5);
      stadiumFx.fillStyle(0xffffee, 0.18);
      stadiumFx.fillCircle(width * 0.09, 12, width * 0.07);
      stadiumFx.fillCircle(width * 0.91, 12, width * 0.07);
      stadiumFx.fillStyle(0xfff8dd, 0.05);
      stadiumFx.fillTriangle(
        width * 0.02,
        0,
        width * 0.27,
        0,
        width * 0.56,
        height,
      );
      stadiumFx.fillTriangle(
        width * 0.73,
        0,
        width * 0.98,
        0,
        width * 0.44,
        height,
      );
      stadiumFx.fillStyle(0xfff8dd, 0.028);
      stadiumFx.fillTriangle(
        width * 0.16,
        0,
        width * 0.38,
        0,
        width * 0.5,
        height,
      );
      stadiumFx.fillTriangle(
        width * 0.62,
        0,
        width * 0.84,
        0,
        width * 0.5,
        height,
      );

      for (let i = 0; i < 7; i++) {
        const x = width * 0.18 + i * width * 0.106;
        stadiumFx.fillStyle(0xf8fbff, 0.18);
        stadiumFx.fillRoundedRect(x, height * 0.055, 12, 4, 2);
        stadiumFx.fillStyle(0xfff0b0, 0.12);
        stadiumFx.fillCircle(x + 6, height * 0.06, 13);
      }

      // LED advertising board below the stand.
      const adY = height * 0.5;
      const adH = height * 0.022;
      const adColors = [
        0x00d4ff, 0xff3366, 0xffd700, 0x00e676, 0xff6600, 0xb066ff,
        0xffffff,
      ];
      const adBoard = this.add.graphics().setDepth(1);
      adBoard.fillStyle(0x02040a, 1);
      adBoard.fillRect(0, adY - 6, width, adH + 11);
      adBoard.fillStyle(0xffffff, 0.16);
      adBoard.fillRect(0, adY - 6, width, 1);
      adBoard.fillStyle(0x000000, 0.55);
      adBoard.fillRect(0, adY + adH + 3, width, 3);
      const segments = 12;
      const segW = width / segments;
      for (let i = 0; i < segments; i++) {
        const color = adColors[i % adColors.length];
        const x = i * segW + 1;
        adBoard.fillStyle(color, 0.92);
        adBoard.fillRoundedRect(x, adY, segW - 2, adH, 2);
        adBoard.fillStyle(0xffffff, 0.34);
        adBoard.fillRect(x + 2, adY + 1, segW - 6, 1);
        adBoard.fillStyle(color, 0.14);
        adBoard.fillRect(x, adY + adH, segW - 2, 5);
        for (let d = 0; d < 4; d++) {
          adBoard.fillStyle(0x001020, 0.18);
          adBoard.fillRect(x + d * 8, adY, 1, adH);
        }
      }

      const horizonMist = this.add.graphics().setDepth(1);
      horizonMist.fillStyle(0xd8f4ff, 0.06);
      horizonMist.fillEllipse(width / 2, height * 0.535, width * 0.86, 24);
      horizonMist.fillStyle(0x000814, 0.24);
      horizonMist.fillRect(0, height * 0.535, width, 8);
    }

    // Goal positioning — align photo goalbar feet with the turf line.
    const horizonY = height * (usePhotoStadium ? 0.625 : 0.55);
    const goalW = width * (usePhotoStadium ? 0.88 : 0.88);
    const goalAspect = useGoalbarAsset ? 307 / 616 : 350 / 600;
    const goalH = goalW * goalAspect;
    const goalCenterY = horizonY - goalH / 2;
    const goalTopY = horizonY - goalH;
    const goalBottomY = horizonY;

    // Grass shadow under goal frame
    const goalShadow = this.add.graphics().setDepth(1);
    goalShadow.fillStyle(0x000814, usePhotoStadium ? 0.58 : 0.45);
    goalShadow.fillEllipse(width / 2, goalBottomY + 2, goalW * 0.92, 16);

    this.add
      .image(width / 2, goalCenterY, "goal")
      .setDisplaySize(goalW, goalH)
      .setDepth(2);

    this.netFlash = this.add
      .image(width / 2, goalCenterY, "net_flash")
      .setDisplaySize(goalW * 0.92, goalH * 0.88)
      .setAlpha(0)
      .setDepth(3);

    // Stadium light pool on penalty spot.
    const lightPool = this.add.graphics().setDepth(1);
    for (let i = 0; i < 5; i++) {
      lightPool.fillStyle(0xf4ffd8, 0.055 - i * 0.008);
      lightPool.fillEllipse(
        width / 2,
        height * 0.785,
        width * (0.62 - i * 0.08),
        height * (0.13 - i * 0.018),
      );
    }
    lightPool.lineStyle(1, 0xb8ffc8, 0.08);
    for (let i = 0; i < 7; i++) {
      const x = width * (0.22 + i * 0.093);
      lightPool.beginPath();
      lightPool.moveTo(width / 2, horizonY);
      lightPool.lineTo(x, height);
      lightPool.strokePath();
    }

    // Floating pitch particles in floodlights.
    for (let i = 0; i < 34; i++) {
      const startX = Math.random() * width;
      const startY = height * 0.1 + Math.random() * height * 0.55;
      const mote = this.add
        .circle(startX, startY, 0.7 + Math.random() * 1.2, 0xfff5cc, 0)
        .setDepth(5);
      this.tweens.add({
        targets: mote,
        y: startY + 50 + Math.random() * 80,
        x: startX + (Math.random() - 0.5) * 70,
        alpha: { from: 0, to: 0.35, ease: "Sine.easeInOut" },
        duration: 4500 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2500,
      });
    }

    const foregroundGrass = this.add.graphics().setDepth(4);
    for (let i = 0; i < 90; i++) {
      const y = height * (0.78 + Math.random() * 0.2);
      const x = Math.random() * width;
      const len = 2 + Math.random() * 6;
      foregroundGrass.lineStyle(
        1,
        Math.random() < 0.5 ? 0x94e68f : 0x06280f,
        0.16,
      );
      foregroundGrass.beginPath();
      foregroundGrass.moveTo(x, y);
      foregroundGrass.lineTo(x + (Math.random() - 0.5) * 4, y - len);
      foregroundGrass.strokePath();
    }

    // Bottom vignette softens controls over pitch.
    const vignette = this.add.graphics().setDepth(4);
    vignette.fillStyle(0x000000, 0.34);
    vignette.fillRect(0, height * 0.875, width, height * 0.125);

    this.difficultyManager = new DifficultyManager(playerName);
    this.scoreEngine = new ScoreEngine(this.difficultyManager);

    // Expose goal bounds for Ball aim calculations
    this.registry.set("goalTopY", goalTopY);
    this.registry.set("goalBottomY", goalBottomY);

    const keeperHeight = goalH * 0.78;
    this.goalkeeper = new Goalkeeper(
      this,
      width / 2,
      goalBottomY,
      keeperHeight,
    );
    this.ball = new Ball(this, width / 2, height * 0.78);
    this.powerBar = new PowerBar(this, width / 2, height * 0.87);
    this.timingBar = new TimingBar(this, width * 0.18, height * 0.76);

    // Match HUD
    const sx = 12;
    const sy = 12;
    const sw = Math.min(154, (width - 34) / 2);
    const sh = 58;
    const scorePanel = this.add.graphics().setDepth(19);
    scorePanel.fillStyle(0x000000, 0.38);
    scorePanel.fillRoundedRect(sx + 3, sy + 5, sw, sh, 15);
    scorePanel.fillStyle(0xffd700, 0.28);
    scorePanel.fillRoundedRect(sx - 3, sy - 3, sw + 6, sh + 6, 17);
    scorePanel.fillStyle(0x050914, 0.94);
    scorePanel.fillRoundedRect(sx, sy, sw, sh, 13);
    scorePanel.fillStyle(0xffd700, 0.08);
    scorePanel.fillRoundedRect(sx + 2, sy + 2, sw - 4, 18, 9);
    scorePanel.lineStyle(2, 0xffd700, 0.85);
    scorePanel.strokeRoundedRect(sx, sy, sw, sh, 13);
    scorePanel.lineStyle(1, 0xffffff, 0.2);
    scorePanel.strokeRoundedRect(sx + 3, sy + 3, sw - 6, sh - 6, 10);
    scorePanel.fillStyle(0xfff1a6, 0.72);
    scorePanel.fillRoundedRect(sx + 12, sy + 3, sw - 24, 2, 1);
    scorePanel.fillStyle(0xffd700, 0.16);
    scorePanel.fillCircle(sx + sw - 28, sy + 31, 18);
    scorePanel.fillStyle(0xffd700, 0.88);
    scorePanel.fillCircle(sx + sw - 28, sy + 31, 11);
    scorePanel.fillStyle(0x553800, 0.95);
    scorePanel.fillCircle(sx + sw - 28, sy + 31, 4);

    this.add
      .text(sx + 14, sy + 7, "MATCH SCORE", {
        fontFamily: "Arial Black, system-ui, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#ffe680",
      })
      .setDepth(20)
      .setShadow(0, 2, "#000814", 4);

    this.scoreText = this.add
      .text(sx + 14, sy + 20, "0", {
        fontFamily: "Arial Black, system-ui, sans-serif",
        fontSize: "26px",
        fontStyle: "bold",
        color: "#FFD700",
        stroke: "#000814",
        strokeThickness: 4,
      })
      .setDepth(20)
      .setShadow(0, 4, "#000000", 5);

    const pw = sw;
    const ph = sh;
    const pxl = width - 12 - pw;
    const py = 12;
    const shotPanel = this.add.graphics().setDepth(19);
    shotPanel.fillStyle(0x000000, 0.38);
    shotPanel.fillRoundedRect(pxl + 3, py + 5, pw, ph, 15);
    shotPanel.fillStyle(0x00e676, 0.22);
    shotPanel.fillRoundedRect(pxl - 3, py - 3, pw + 6, ph + 6, 17);
    shotPanel.fillStyle(0x050914, 0.94);
    shotPanel.fillRoundedRect(pxl, py, pw, ph, 13);
    shotPanel.fillStyle(0x00e676, 0.07);
    shotPanel.fillRoundedRect(pxl + 2, py + 2, pw - 4, 18, 9);
    shotPanel.lineStyle(2, 0x00e676, 0.82);
    shotPanel.strokeRoundedRect(pxl, py, pw, ph, 13);
    shotPanel.lineStyle(1, 0xffffff, 0.17);
    shotPanel.strokeRoundedRect(pxl + 3, py + 3, pw - 6, ph - 6, 10);
    shotPanel.fillStyle(0x9fffd0, 0.62);
    shotPanel.fillRoundedRect(pxl + 12, py + 3, pw - 24, 2, 1);

    this.add
      .text(pxl + 14, py + 7, "SHOT COUNT", {
        fontFamily: "Arial Black, system-ui, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#aaffcc",
      })
      .setDepth(20)
      .setShadow(0, 2, "#000814", 4);

    this.shotsText = this.add
      .text(pxl + 14, py + 21, `0/${TOTAL_SHOTS}`, {
        fontFamily: "Arial Black, system-ui, sans-serif",
        fontSize: "23px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000814",
        strokeThickness: 4,
      })
      .setDepth(20)
      .setShadow(0, 4, "#000000", 5);

    const dotStartX = pxl + pw - 18 - (TOTAL_SHOTS - 1) * 13;
    const dotY = py + 33;
    for (let i = 0; i < TOTAL_SHOTS; i++) {
      const dot = this.add
        .circle(dotStartX + i * 13, dotY, 4.5, 0x101a31, 1)
        .setStrokeStyle(2, 0x4c628f, 0.92)
        .setDepth(20);
      this.shotDots.push(dot);
    }

    this.statusPanel = this.add.graphics().setDepth(19);
    const statusW = Math.min(width - 42, 236);
    const statusY = 82;
    this.statusPanel.fillStyle(0x000814, 0.64);
    this.statusPanel.fillRoundedRect(
      width / 2 - statusW / 2,
      statusY - 12,
      statusW,
      24,
      12,
    );
    this.statusPanel.lineStyle(1, 0x9fd7ff, 0.2);
    this.statusPanel.strokeRoundedRect(
      width / 2 - statusW / 2,
      statusY - 12,
      statusW,
      24,
      12,
    );
    this.statusPanel.fillStyle(0x00e676, 0.5);
    this.statusPanel.fillCircle(width / 2 - statusW / 2 + 14, statusY, 3);

    this.statusText = this.add
      .text(width / 2, statusY - 1, "", {
        fontFamily: "Arial Black, system-ui, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#dceeff",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setShadow(0, 2, "#000814", 3);

    this.toastText = this.add
      .text(width / 2, height * 0.18, "", {
        fontFamily: "Arial Black, Impact, system-ui, sans-serif",
        fontStyle: "bold",
        fontSize: "36px",
        stroke: "#000000",
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(30)
      .setShadow(0, 6, "#000000", 8);

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
    this.ball.updateFollow();
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
      `SHOT ${this.shotsTaken + 1}/${TOTAL_SHOTS}   ${remaining} LEFT`,
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

    const missType: "wide" | "over" | "short" | null =
      !result.scored && !result.saved
        ? result.reason === "Wide!"
          ? "wide"
          : result.reason === "Over the bar!"
            ? "over"
            : "short"
        : null;

    this.ball.shoot({
      direction,
      power,
      timing,
      missType,
      onComplete: () => this.handleShotResult(result),
    });

    this.playSafe("kick");
  }

  private handleShotResult(result: ShotResult) {
    this.shotsTaken++;
    this.totalScore += result.points;
    this.shotResults.push(result);

    this.scoreText.setText(`${this.totalScore}`);
    this.shotsText.setText(`${this.shotsTaken}/${TOTAL_SHOTS}`);

    // Animate score pump on points gained
    if (result.points > 0) {
      this.tweens.killTweensOf(this.scoreText);
      this.scoreText.setScale(1);
      this.tweens.add({
        targets: this.scoreText,
        scale: 1.35,
        duration: 180,
        yoyo: true,
        ease: "Back.Out",
      });
    }

    // Fill the dot for this shot
    const dot = this.shotDots[this.shotsTaken - 1];
    if (dot) {
      const color = result.scored
        ? result.bonus
          ? 0xffd700
          : 0x00e676
        : result.saved
          ? 0xff5722
          : 0xff1744;
      dot.setFillStyle(color, 1);
      dot.setStrokeStyle(2.5, 0xffffff, 0.9);
      this.tweens.add({
        targets: dot,
        scale: 1.95,
        duration: 220,
        yoyo: true,
        ease: "Back.Out",
      });
    }

    if (result.scored) this.showGoal(result);
    else if (result.saved) this.showSaved();
    else this.showMiss(result.reason);
  }

  private showGoal(result: ShotResult) {
    this.playSafe("goal");
    if (this.crowdSound) {
      (this.crowdSound as Phaser.Sound.WebAudioSound).setVolume(0.8);
    }
    this.cameras.main.shake(280, 0.018);
    this.cameras.main.flash(160, 255, 255, 255, false);
    this.goalkeeper.dejected();

    this.tweens.add({
      targets: this.netFlash,
      alpha: { from: 0.95, to: 0 },
      scaleX: { from: 0.95, to: 1.06 },
      scaleY: { from: 0.95, to: 1.06 },
      duration: 900,
      ease: "Power2",
    });

    this.spawnConfetti(result.bonus);

    const label = result.bonus
      ? `PERFECT +${result.points}`
      : `GOAL +${result.points}`;

    this.showToast(label, result.bonus ? "#FFD700" : "#00e676", "burst");

    this.time.delayedCall(1800, () => {
      if (this.crowdSound) {
        (this.crowdSound as Phaser.Sound.WebAudioSound).setVolume(0.25);
      }
      this.readyForShot();
    });
  }

  private showSaved() {
    this.playSafe("save");
    this.ball.catchByKeeper(this.goalkeeper.getHoldRef());
    this.cameras.main.shake(120, 0.008);
    this.showToast("SAVED", "#ff5722", "shake");
    this.time.delayedCall(320, () => this.goalkeeper.celebrateSave());
    // Ball lifts overhead at big hop peak, then returns to cradle
    this.time.delayedCall(1220, () =>
      this.ball.tweenHoldOffsetY(-200, 220, "Back.Out"),
    );
    this.time.delayedCall(1460, () =>
      this.ball.tweenHoldOffsetY(-128, 220, "Sine.easeIn"),
    );
    this.time.delayedCall(1900, () => this.readyForShot());
  }

  private showMiss(reason: string) {
    this.playSafe("miss");
    const label = reason ? reason.toUpperCase() : "MISS";
    const style: ToastStyle =
      reason === "Over the bar!"
        ? "hover"
        : reason === "Wide!"
          ? "slide"
          : "droop";
    this.showToast(label, "#ff1744", style);
    this.time.delayedCall(1700, () => this.readyForShot());
  }

  private showToast(
    message: string,
    color: string,
    style: ToastStyle = "burst",
  ) {
    const { width, height } = this.scale;
    const baseX = width / 2;
    const baseY = height * 0.18;

    this.tweens.killTweensOf(this.toastText);
    this.toastText
      .setText(message)
      .setColor(color)
      .setAlpha(1)
      .setScale(1)
      .setAngle(0)
      .setPosition(baseX, baseY);

    if (style === "burst") {
      this.toastText.setScale(0.15).setAngle(-10);
      this.tweens.add({
        targets: this.toastText,
        scale: 1.18,
        angle: 0,
        duration: 280,
        ease: "Back.Out",
      });
      this.tweens.add({
        targets: this.toastText,
        scale: 1.0,
        delay: 280,
        duration: 220,
        ease: "Quad.easeOut",
      });
      this.tweens.add({
        targets: this.toastText,
        angle: 3,
        delay: 520,
        duration: 200,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    } else if (style === "shake") {
      this.toastText.setScale(0.55);
      this.tweens.add({
        targets: this.toastText,
        scale: 1.0,
        duration: 200,
        ease: "Back.Out",
      });
      this.tweens.add({
        targets: this.toastText,
        x: baseX + 14,
        delay: 200,
        duration: 55,
        yoyo: true,
        repeat: 5,
        ease: "Sine.easeInOut",
      });
    } else if (style === "droop") {
      this.toastText.setScale(0.5).setY(baseY - 22);
      this.tweens.add({
        targets: this.toastText,
        scale: 1.0,
        y: baseY,
        duration: 240,
        ease: "Quad.easeOut",
      });
      this.tweens.add({
        targets: this.toastText,
        angle: -7,
        y: baseY + 14,
        delay: 280,
        duration: 380,
        ease: "Sine.easeIn",
      });
    } else if (style === "slide") {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.toastText.setX(baseX + side * width * 0.55).setScale(0.8);
      this.tweens.add({
        targets: this.toastText,
        x: baseX,
        scale: 1.0,
        duration: 280,
        ease: "Back.Out",
      });
      this.tweens.add({
        targets: this.toastText,
        angle: side * -8,
        delay: 320,
        duration: 240,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    } else if (style === "hover") {
      this.toastText.setScale(0.55);
      this.tweens.add({
        targets: this.toastText,
        scale: 1.0,
        duration: 220,
        ease: "Back.Out",
      });
      this.tweens.add({
        targets: this.toastText,
        y: baseY - 10,
        delay: 240,
        duration: 340,
        yoyo: true,
        repeat: 1,
        ease: "Sine.easeInOut",
      });
    }

    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 1250,
      duration: 320,
    });
  }

  private spawnConfetti(bonus: boolean) {
    const { width, height } = this.scale;
    const colors = bonus
      ? [0xffd700, 0xffc107, 0xffe082, 0xffab00, 0xffffff]
      : [0x00e676, 0xffd700, 0x29b6f6, 0xff5722, 0xff4081];
    for (let i = 0; i < 28; i++) {
      const x = width / 2 + Phaser.Math.Between(-width * 0.32, width * 0.32);
      const y = height * 0.28;
      const color = Phaser.Utils.Array.GetRandom(colors);
      const piece = this.add
        .rectangle(x, y, 6, 9, color)
        .setDepth(25)
        .setAngle(Phaser.Math.Between(0, 360));
      this.tweens.add({
        targets: piece,
        y: piece.y + Phaser.Math.Between(180, 380),
        x: piece.x + Phaser.Math.Between(-80, 80),
        angle: piece.angle + Phaser.Math.Between(-540, 540),
        alpha: 0,
        duration: 1200 + Phaser.Math.Between(0, 700),
        ease: "Quad.easeIn",
        onComplete: () => piece.destroy(),
      });
    }
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
