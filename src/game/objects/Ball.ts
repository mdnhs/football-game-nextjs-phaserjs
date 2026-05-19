import Phaser from "phaser";
import { GAME } from "@/constants/game";
import type { AimDirection } from "@/types/game";

export class Ball {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Ellipse;
  private aimLine: Phaser.GameObjects.Graphics;
  private startX: number;
  private startY: number;
  private aimX = 0;
  private aimY = 0;
  private trailTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;

    this.shadow = scene.add
      .ellipse(x, y + 18, 40, 12, 0x000000, 0.45)
      .setDepth(14);

    this.sprite = scene.add
      .image(x, y, "ball")
      .setDisplaySize(46, 46)
      .setDepth(15);
    this.aimLine = scene.add.graphics().setDepth(14);
  }

  resetPosition() {
    this.sprite.setPosition(this.startX, this.startY).setAlpha(1).setScale(1);
    this.sprite.angle = 0;
    this.shadow
      .setPosition(this.startX, this.startY + 18)
      .setScale(1)
      .setAlpha(0.45);
    this.aimLine.clear();
    this.aimX = 0;
    this.aimY = 0;
    this.trailTimer?.remove(false);
    this.trailTimer = null;
  }

  startAiming(pointer: Phaser.Input.Pointer) {
    this.updateAim(pointer);
  }

  updateAim(pointer: Phaser.Input.Pointer) {
    const dx = pointer.worldX - this.startX;
    const dy = pointer.worldY - this.startY;
    const rawX = Phaser.Math.Clamp(dx / GAME.AIM_INPUT_RANGE, -1, 1);
    const rawY = Phaser.Math.Clamp(dy / GAME.AIM_INPUT_RANGE, -1, 1);
    this.aimX = Math.sign(rawX) * rawX * rawX;
    this.aimY = Math.sign(rawY) * rawY * rawY;
    this.drawAimLine();
  }

  private curveOffsetX(aimX: number): number {
    const { width } = this.scene.scale;
    return aimX * Math.abs(aimX) * width * 0.32;
  }

  private targetFromAim(): { x: number; y: number } {
    const { width, height } = this.scene.scale;
    const targetX = this.startX + this.aimX * width * GAME.AIM_CONE_RATIO;
    const goalTopY = height * 0.15;
    const goalBottomY = height * 0.46;
    const midY = (goalTopY + goalBottomY) / 2;
    const aimRange = (goalBottomY - goalTopY) / 2;
    const targetY = midY + this.aimY * aimRange;
    return { x: targetX, y: targetY };
  }

  private drawAimLine() {
    this.aimLine.clear();

    const { x: targetX, y: targetY } = this.targetFromAim();
    const midX = (this.startX + targetX) / 2 + this.curveOffsetX(this.aimX);
    const midY = (this.startY + targetY) / 2 - 30;

    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(this.startX, this.startY),
      new Phaser.Math.Vector2(midX, midY),
      new Phaser.Math.Vector2(targetX, targetY),
    );

    const steps = 16;
    const p1 = new Phaser.Math.Vector2();
    const p2 = new Phaser.Math.Vector2();
    for (let i = 0; i < steps; i++) {
      const t1 = i / steps;
      const t2 = (i + 0.5) / steps;
      curve.getPoint(t1, p1);
      curve.getPoint(t2, p2);
      const alpha = 0.55 * (1 - t1);
      this.aimLine.lineStyle(3, 0x00e676, alpha);
      this.aimLine.beginPath();
      this.aimLine.moveTo(p1.x, p1.y);
      this.aimLine.lineTo(p2.x, p2.y);
      this.aimLine.strokePath();
    }

    this.aimLine.lineStyle(2, 0x00e676, 0.7);
    this.aimLine.strokeCircle(targetX, targetY, 12);
    this.aimLine.lineStyle(2, 0x00e676, 0.4);
    this.aimLine.strokeCircle(targetX, targetY, 18);
    this.aimLine.fillStyle(0xffffff, 0.9);
    this.aimLine.fillCircle(targetX, targetY, 2);

    if (Math.abs(this.aimX) >= GAME.CORNER_THRESHOLD) {
      this.aimLine.fillStyle(0xffd700, 0.9);
      this.aimLine.fillCircle(targetX, targetY - 24, 3);
    }
  }

  getAimDirection(): AimDirection {
    return { x: this.aimX, y: this.aimY };
  }

  shoot({
    direction,
    power,
    timing,
    missType = null,
    onComplete,
  }: {
    direction: AimDirection;
    power: number;
    timing: number;
    missType?: "wide" | "over" | "short" | null;
    onComplete: () => void;
  }) {
    const { width, height } = this.scene.scale;

    const baseSpread = (1 - power) * 55 + (1 - timing) * 35;
    const centerStability = 1 - Math.abs(direction.x) * 0.35;
    const spread = baseSpread * centerStability;

    let tx: number;
    let ty: number;

    if (missType === "wide") {
      const side =
        direction.x !== 0
          ? Math.sign(direction.x)
          : Math.random() < 0.5
            ? -1
            : 1;
      tx = width / 2 + side * width * (0.52 + Math.random() * 0.06);
      ty = height * (0.24 + Math.random() * 0.1);
    } else if (missType === "over") {
      tx =
        width / 2 +
        direction.x * width * GAME.AIM_CONE_RATIO * 0.7 +
        Phaser.Math.FloatBetween(-spread * 0.4, spread * 0.4);
      ty = height * 0.06;
    } else if (missType === "short") {
      const target = this.targetFromAim();
      tx = target.x + Phaser.Math.FloatBetween(-spread, spread);
      ty = height * (0.55 + Math.random() * 0.05);
    } else {
      const target = this.targetFromAim();
      tx = target.x + Phaser.Math.FloatBetween(-spread, spread);
      ty =
        target.y +
        (1 - power) * height * 0.04 +
        Phaser.Math.FloatBetween(-spread * 0.3, spread * 0.3);
    }

    const curveOffset = missType ? 0 : this.curveOffsetX(direction.x);
    const peakLift =
      missType === "over" ? 40 : missType === "short" ? 50 : 90 + 70 * power;
    const peakX = (this.startX + tx) / 2 + curveOffset;
    const peakY = Math.min(this.startY, ty) - peakLift;

    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(this.startX, this.startY),
      new Phaser.Math.Vector2(peakX, peakY),
      new Phaser.Math.Vector2(tx, ty),
    );

    this.aimLine.clear();
    this.startTrail();

    this.scene.tweens.add({
      targets: this.shadow,
      x: tx,
      y: this.startY + 14,
      scaleX: 0.28,
      scaleY: 0.28,
      alpha: missType ? 0 : 0.12,
      duration: 600,
      ease: "Power2",
    });

    const progress = { t: 0 };
    const point = new Phaser.Math.Vector2();
    this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: 600,
      ease: "Sine.easeIn",
      onUpdate: () => {
        curve.getPoint(progress.t, point);
        this.sprite.setPosition(point.x, point.y);
        this.sprite.setScale(1 - progress.t * 0.62);
        this.sprite.angle += 16;
      },
      onComplete: () => {
        if (missType) {
          this.flyPastGoal(missType, tx, ty, onComplete);
        } else {
          this.stopTrail();
          onComplete();
        }
      },
    });
  }

  private flyPastGoal(
    missType: "wide" | "over" | "short",
    fromX: number,
    fromY: number,
    onComplete: () => void,
  ) {
    const { width, height } = this.scene.scale;
    let toX: number;
    let toY: number;
    let duration = 600;

    if (missType === "wide") {
      const side = fromX < width / 2 ? -1 : 1;
      toX = fromX + side * width * 0.3;
      toY = height * 0.55;
    } else if (missType === "over") {
      toX = fromX + Phaser.Math.FloatBetween(-40, 40);
      toY = -80;
    } else {
      toX = fromX + Phaser.Math.FloatBetween(-30, 30);
      toY = height * 0.78;
      duration = 400;
    }

    this.scene.tweens.add({
      targets: this.sprite,
      x: toX,
      y: toY,
      alpha: 0.35,
      duration,
      ease: "Quad.easeIn",
      onUpdate: () => {
        this.sprite.angle += 18;
      },
      onComplete: () => {
        this.stopTrail();
        onComplete();
      },
    });

    this.scene.tweens.add({
      targets: this.shadow,
      alpha: 0,
      duration: 400,
    });

    void fromY;
  }

  bounceBack() {
    const { width, height } = this.scene.scale;
    const fromX = this.sprite.x;
    const fromY = this.sprite.y;

    const side = fromX < width / 2 ? -1 : 1;
    const bounceX = Phaser.Math.Clamp(
      fromX + side * width * 0.22 + Phaser.Math.FloatBetween(-30, 30),
      width * 0.1,
      width * 0.9,
    );
    const bounceY = height * 0.72;

    const peakX = (fromX + bounceX) / 2;
    const peakY = Math.min(fromY, bounceY) - 90;

    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(fromX, fromY),
      new Phaser.Math.Vector2(peakX, peakY),
      new Phaser.Math.Vector2(bounceX, bounceY),
    );

    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.shadow);

    this.scene.tweens.add({
      targets: this.shadow,
      x: bounceX,
      y: this.startY + 14,
      scaleX: 0.85,
      scaleY: 0.85,
      alpha: 0.4,
      duration: 600,
      ease: "Sine.easeIn",
    });

    const startScale = this.sprite.scaleX;
    const progress = { t: 0 };
    const point = new Phaser.Math.Vector2();

    this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: 600,
      ease: "Quad.easeOut",
      onUpdate: () => {
        curve.getPoint(progress.t, point);
        this.sprite.setPosition(point.x, point.y);
        this.sprite.setScale(Phaser.Math.Linear(startScale, 0.95, progress.t));
        this.sprite.angle -= 22;
      },
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          y: this.sprite.y - 22,
          duration: 180,
          yoyo: true,
          ease: "Quad.easeOut",
        });
      },
    });
  }

  private startTrail() {
    if (!this.scene.textures.exists("ball_trail")) return;
    this.trailTimer = this.scene.time.addEvent({
      delay: 28,
      repeat: -1,
      callback: () => {
        const ghost = this.scene.add
          .image(this.sprite.x, this.sprite.y, "ball_trail")
          .setDisplaySize(
            (this.sprite.displayWidth || 46) * 0.55,
            (this.sprite.displayHeight || 46) * 0.55,
          )
          .setAlpha(0.45)
          .setTint(0x00e676)
          .setDepth(14);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          scale: 0.1,
          duration: 320,
          onComplete: () => ghost.destroy(),
        });
      },
    });
  }

  private stopTrail() {
    this.trailTimer?.remove(false);
    this.trailTimer = null;
  }
}
