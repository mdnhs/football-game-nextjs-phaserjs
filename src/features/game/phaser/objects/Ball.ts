import Phaser from 'phaser';
import { GAME } from '@/features/game/utils/constants';
import type { AimDirection } from '@/features/game/types';

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
  private holderContainer: Phaser.GameObjects.Container | null = null;
  private holdOffsetX = 0;
  private holdOffsetY = 0;
  private baseScale = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;

    this.shadow = scene.add.ellipse(x, y + 14, 28, 9, 0x000000, 0.45).setDepth(14);

    this.sprite = scene.add.image(x, y, 'ball').setDisplaySize(32, 32).setDepth(15);
    this.baseScale = this.sprite.scaleX;
    this.aimLine = scene.add.graphics().setDepth(14);
  }

  resetPosition() {
    this.detach();
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.shadow);
    this.sprite.setPosition(this.startX, this.startY).setAlpha(1).setScale(this.baseScale);
    this.sprite.angle = 0;
    this.shadow
      .setPosition(this.startX, this.startY + 14)
      .setScale(1)
      .setAlpha(0.45);
    this.aimLine.clear();
    this.aimX = 0;
    this.aimY = 0;
    this.trailTimer?.remove(false);
    this.trailTimer = null;
  }

  attachTo(container: Phaser.GameObjects.Container, offsetX: number, offsetY: number) {
    this.holderContainer = container;
    this.holdOffsetX = offsetX;
    this.holdOffsetY = offsetY;
  }

  detach() {
    this.holderContainer = null;
  }

  tweenHoldOffsetY(targetY: number, duration: number, ease = 'Sine.easeInOut') {
    this.scene.tweens.add({
      targets: this,
      holdOffsetY: targetY,
      duration,
      ease,
    });
  }

  updateFollow() {
    if (!this.holderContainer) return;
    const c = this.holderContainer;
    const scale = c.scaleX;
    const cos = Math.cos(c.rotation);
    const sin = Math.sin(c.rotation);
    const lx = this.holdOffsetX * scale;
    const ly = this.holdOffsetY * scale;
    this.sprite.setPosition(c.x + lx * cos - ly * sin, c.y + lx * sin + ly * cos);
  }

  catchByKeeper(holdRef: { target: Phaser.GameObjects.Container; offX: number; offY: number }) {
    this.stopTrail();
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.shadow);

    const c = holdRef.target;
    const scale = c.scaleX;
    const cos = Math.cos(c.rotation);
    const sin = Math.sin(c.rotation);
    const lx = holdRef.offX * scale;
    const ly = holdRef.offY * scale;
    const targetX = c.x + lx * cos - ly * sin;
    const targetY = c.y + lx * sin + ly * cos;

    this.scene.tweens.add({
      targets: this.shadow,
      alpha: 0,
      duration: 220,
    });

    const fromX = this.sprite.x;
    const fromY = this.sprite.y;
    const peakX = (fromX + targetX) / 2;
    const peakY = Math.min(fromY, targetY) - 24;
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(fromX, fromY),
      new Phaser.Math.Vector2(peakX, peakY),
      new Phaser.Math.Vector2(targetX, targetY),
    );

    const startScale = this.sprite.scaleX;
    const heldScale = this.baseScale * 0.85;
    const progress = { t: 0 };
    const point = new Phaser.Math.Vector2();

    this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: 220,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        curve.getPoint(progress.t, point);
        this.sprite.setPosition(point.x, point.y);
        this.sprite.setScale(Phaser.Math.Linear(startScale, heldScale, progress.t));
        this.sprite.angle += 14;
      },
      onComplete: () => {
        this.attachTo(holdRef.target, holdRef.offX, holdRef.offY);
        // Settle squish — keeper "grips" ball
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: heldScale * 1.12,
          scaleY: heldScale * 0.9,
          duration: 90,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      },
    });
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
    return this.targetFromDirection({ x: this.aimX, y: this.aimY });
  }

  private targetFromDirection(direction: AimDirection): { x: number; y: number } {
    const { width, height } = this.scene.scale;
    const targetX = this.startX + direction.x * width * GAME.AIM_CONE_RATIO;
    const goalTopY = (this.scene.registry.get('goalTopY') as number | undefined) ?? height * 0.32;
    const goalBottomY = (this.scene.registry.get('goalBottomY') as number | undefined) ?? height * 0.55;
    const midY = (goalTopY + goalBottomY) / 2;
    const aimRange = (goalBottomY - goalTopY) / 2;
    const targetY = midY + direction.y * aimRange;
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

    this.drawCurveBeam(this.aimLine, curve, 14, 0x00e676, 0.2);
    this.drawCurveBeam(this.aimLine, curve, 5, 0xffffff, 0.34);

    this.aimLine.fillStyle(0xb8fff0, 0.16);
    this.aimLine.fillCircle(targetX, targetY, 18);
    this.aimLine.fillStyle(0x00e676, 0.28);
    this.aimLine.fillCircle(targetX, targetY, 11);
    this.aimLine.fillStyle(0xffffff, 0.85);
    this.aimLine.fillCircle(targetX, targetY, 3);

    if (Math.abs(this.aimX) >= GAME.CORNER_THRESHOLD) {
      this.aimLine.fillStyle(0xffd700, 0.3);
      this.aimLine.fillCircle(targetX, targetY - 22, 8);
      this.aimLine.fillStyle(0xfff4b0, 0.95);
      this.aimLine.fillCircle(targetX, targetY - 22, 3);
    }
  }

  private drawCurveBeam(
    graphics: Phaser.GameObjects.Graphics,
    curve: Phaser.Curves.QuadraticBezier,
    maxWidth: number,
    color: number,
    alpha: number,
  ) {
    const segments = 18;
    const p0 = new Phaser.Math.Vector2();
    const p1 = new Phaser.Math.Vector2();

    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      curve.getPoint(t0, p0);
      curve.getPoint(t1, p1);

      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const nx = -dy / len;
      const ny = dx / len;
      const w0 = Phaser.Math.Linear(maxWidth, maxWidth * 0.18, t0);
      const w1 = Phaser.Math.Linear(maxWidth, maxWidth * 0.18, t1);
      const segmentAlpha = alpha * (1 - t0 * 0.72);

      graphics.fillStyle(color, segmentAlpha);
      graphics.fillPoints(
        [
          new Phaser.Math.Vector2(p0.x + nx * w0, p0.y + ny * w0),
          new Phaser.Math.Vector2(p0.x - nx * w0, p0.y - ny * w0),
          new Phaser.Math.Vector2(p1.x - nx * w1, p1.y - ny * w1),
          new Phaser.Math.Vector2(p1.x + nx * w1, p1.y + ny * w1),
        ],
        true,
      );
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
    missType?: 'wide' | 'over' | 'short' | null;
    onComplete: () => void;
  }) {
    const { width, height } = this.scene.scale;

    const baseSpread = (1 - power) * 55 + (1 - timing) * 35;
    const centerStability = 1 - Math.abs(direction.x) * 0.35;
    const spread = baseSpread * centerStability;

    let tx: number;
    let ty: number;

    if (missType === 'wide') {
      const side = direction.x !== 0 ? Math.sign(direction.x) : Math.random() < 0.5 ? -1 : 1;
      tx = width / 2 + side * width * (0.52 + Math.random() * 0.06);
      ty = height * (0.24 + Math.random() * 0.1);
    } else if (missType === 'over') {
      tx =
        width / 2 +
        direction.x * width * GAME.AIM_CONE_RATIO * 0.7 +
        Phaser.Math.FloatBetween(-spread * 0.4, spread * 0.4);
      ty = height * 0.06;
    } else if (missType === 'short') {
      const target = this.targetFromDirection(direction);
      tx = target.x + Phaser.Math.FloatBetween(-spread, spread);
      ty = height * (0.55 + Math.random() * 0.05);
    } else {
      const target = this.targetFromDirection(direction);
      tx = target.x + Phaser.Math.FloatBetween(-spread, spread);
      ty = target.y + (1 - power) * height * 0.04 + Phaser.Math.FloatBetween(-spread * 0.3, spread * 0.3);
    }

    const curveOffset = missType ? 0 : this.curveOffsetX(direction.x);
    const peakLift = missType === 'over' ? 40 : missType === 'short' ? 50 : 90 + 70 * power;
    const peakX = (this.startX + tx) / 2 + curveOffset;
    const peakY = Math.min(this.startY, ty) - peakLift;

    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(this.startX, this.startY),
      new Phaser.Math.Vector2(peakX, peakY),
      new Phaser.Math.Vector2(tx, ty),
    );

    this.aimLine.clear();
    this.spawnKickBeam(curve, power);
    this.spawnKickDust();
    this.startTrail(power);

    this.scene.tweens.add({
      targets: this.shadow,
      x: tx,
      y: this.startY + 14,
      scaleX: 0.28,
      scaleY: 0.28,
      alpha: missType ? 0 : 0.12,
      duration: 600,
      ease: 'Power2',
    });

    const spinDir = direction.x !== 0 ? Math.sign(direction.x) : 1;
    const spinRate = (13 + power * 9) * spinDir;

    const progress = { t: 0 };
    const point = new Phaser.Math.Vector2();
    this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: 600,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        curve.getPoint(progress.t, point);
        this.sprite.setPosition(point.x, point.y);
        const flightScale = 1 - progress.t * 0.35;
        // Squash burst at start (anticipation → release)
        let squashX = 1;
        let squashY = 1;
        if (progress.t < 0.1) {
          const k = progress.t / 0.1;
          squashX = 1.25 - k * 0.25;
          squashY = 0.7 + k * 0.3;
        }
        this.sprite.setScale(this.baseScale * flightScale * squashX, this.baseScale * flightScale * squashY);
        this.sprite.angle += spinRate;
      },
      onComplete: () => {
        if (missType) {
          this.flyPastGoal(missType, tx, ty, onComplete);
        } else {
          this.spawnNetImpact(tx, ty);
          this.stopTrail();
          onComplete();
        }
      },
    });
  }

  private spawnKickBeam(curve: Phaser.Curves.QuadraticBezier, power: number) {
    const beam = this.scene.add.graphics().setDepth(13);
    this.drawCurveBeam(beam, curve, 34 + power * 12, 0xeaffd2, 0.16);
    this.drawCurveBeam(beam, curve, 15 + power * 7, 0x00e676, 0.2);
    this.drawCurveBeam(beam, curve, 6 + power * 3, 0xffffff, 0.36);

    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => beam.destroy(),
    });
  }

  private spawnKickDust() {
    for (let i = 0; i < 9; i++) {
      const offX = Phaser.Math.FloatBetween(-10, 10);
      const dot = this.scene.add
        .circle(this.startX + offX, this.startY + 16, Phaser.Math.Between(2, 5), 0xeeeedd, 0.7)
        .setDepth(13);
      const angle = Phaser.Math.FloatBetween(-Math.PI, 0);
      const dist = Phaser.Math.Between(22, 52);
      this.scene.tweens.add({
        targets: dot,
        x: dot.x + Math.cos(angle) * dist,
        y: dot.y + Math.sin(angle) * dist * 0.45 + 8,
        alpha: 0,
        scale: 0.2,
        duration: 500 + Phaser.Math.Between(0, 200),
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private spawnNetImpact(x: number, y: number) {
    const burst = this.scene.add.circle(x, y, 18, 0xffffff, 0.85).setDepth(16);
    this.scene.tweens.add({
      targets: burst,
      scale: 2.4,
      alpha: 0,
      duration: 360,
      ease: 'Quad.easeOut',
      onComplete: () => burst.destroy(),
    });
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const dot = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), 0xffffff, 0.9).setDepth(16);
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * Phaser.Math.Between(40, 70),
        y: y + Math.sin(angle) * Phaser.Math.Between(40, 70),
        alpha: 0,
        scale: 0.2,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private flyPastGoal(missType: 'wide' | 'over' | 'short', fromX: number, fromY: number, onComplete: () => void) {
    const { width, height } = this.scene.scale;

    if (missType === 'over') {
      this.scene.tweens.add({
        targets: this.shadow,
        alpha: 0,
        duration: 300,
      });

      // Slow to a stop just above the bar
      this.scene.tweens.add({
        targets: this.sprite,
        y: fromY - 16,
        duration: 220,
        ease: 'Sine.easeOut',
        onComplete: () => {
          // Gentle hover bob — looks like ball hanging in air above crossbar
          this.scene.tweens.add({
            targets: this.sprite,
            y: fromY + 10,
            angle: this.sprite.angle + 25,
            duration: 260,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              // Drift upward and fade out
              this.scene.tweens.add({
                targets: this.sprite,
                y: fromY - 90,
                alpha: 0,
                duration: 380,
                ease: 'Quad.easeIn',
                onComplete: () => {
                  this.stopTrail();
                  onComplete();
                },
              });
            },
          });
        },
      });
      return;
    }

    let toX: number;
    let toY: number;
    let duration = 600;

    if (missType === 'wide') {
      const side = fromX < width / 2 ? -1 : 1;
      toX = fromX + side * width * 0.3;
      toY = height * 0.55;
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
      ease: 'Quad.easeIn',
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

    void fromX;
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
      ease: 'Sine.easeIn',
    });

    const startScale = this.sprite.scaleX;
    const progress = { t: 0 };
    const point = new Phaser.Math.Vector2();

    this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: 600,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        curve.getPoint(progress.t, point);
        this.sprite.setPosition(point.x, point.y);
        this.sprite.setScale(Phaser.Math.Linear(startScale, this.baseScale * 0.95, progress.t));
        this.sprite.angle -= 22;
      },
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          y: this.sprite.y - 22,
          duration: 180,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      },
    });
  }

  private startTrail(power = 0.5) {
    if (!this.scene.textures.exists('ball_trail')) return;
    const delay = Phaser.Math.Linear(42, 16, power);
    const glowAlpha = Phaser.Math.Linear(0.28, 0.72, power);
    const flameScale = Phaser.Math.Linear(0.42, 0.95, power);
    let lastX = this.sprite.x;
    let lastY = this.sprite.y;

    this.trailTimer = this.scene.time.addEvent({
      delay,
      repeat: -1,
      callback: () => {
        const dx = this.sprite.x - lastX;
        const dy = this.sprite.y - lastY;
        const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const backX = -dx / len;
        const backY = -dy / len;
        const flameX = this.sprite.x + backX * (8 + power * 10);
        const flameY = this.sprite.y + backY * (8 + power * 10);
        const width = (this.sprite.displayWidth || 32) * flameScale;
        const height = (this.sprite.displayHeight || 32) * flameScale * 0.82;

        const ghost = this.scene.add
          .image(flameX, flameY, 'ball_trail')
          .setDisplaySize(width, height)
          .setAlpha(glowAlpha)
          .setTint(power > 0.72 ? 0xff3d00 : 0xffa000)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(14);

        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          scaleX: ghost.scaleX * (0.18 + power * 0.18),
          scaleY: ghost.scaleY * 0.08,
          x: flameX + backX * (16 + power * 26),
          y: flameY + backY * (10 + power * 18),
          duration: Phaser.Math.Linear(220, 430, power),
          onComplete: () => ghost.destroy(),
        });

        const core = this.scene.add
          .circle(
            flameX + Phaser.Math.FloatBetween(-3, 3),
            flameY + Phaser.Math.FloatBetween(-3, 3),
            Phaser.Math.FloatBetween(3, 6 + power * 7),
            power > 0.78 ? 0xffffff : 0xfff176,
            Phaser.Math.Linear(0.3, 0.72, power),
          )
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(14);
        this.scene.tweens.add({
          targets: core,
          x: core.x + backX * Phaser.Math.Between(12, 26),
          y: core.y + backY * Phaser.Math.Between(8, 18),
          alpha: 0,
          scale: 0.2,
          duration: Phaser.Math.Linear(160, 280, power),
          ease: 'Quad.easeOut',
          onComplete: () => core.destroy(),
        });

        const emberCount = Math.max(1, Math.round(1 + power * 4));
        for (let i = 0; i < emberCount; i++) {
          const ember = this.scene.add
            .circle(
              flameX + Phaser.Math.FloatBetween(-7, 7),
              flameY + Phaser.Math.FloatBetween(-7, 7),
              Phaser.Math.FloatBetween(1.2, 2.8 + power * 2.2),
              Phaser.Utils.Array.GetRandom([0xffd54f, 0xff8f00, 0xff3d00]),
              Phaser.Math.Linear(0.35, 0.85, power),
            )
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(14);
          this.scene.tweens.add({
            targets: ember,
            x: ember.x + backX * Phaser.Math.Between(18, 42) + Phaser.Math.FloatBetween(-12, 12),
            y: ember.y + backY * Phaser.Math.Between(12, 32) + Phaser.Math.FloatBetween(-10, 10),
            alpha: 0,
            scale: 0.15,
            duration: Phaser.Math.Between(240, 520),
            ease: 'Quad.easeOut',
            onComplete: () => ember.destroy(),
          });
        }

        lastX = this.sprite.x;
        lastY = this.sprite.y;
      },
    });
  }

  private stopTrail() {
    this.trailTimer?.remove(false);
    this.trailTimer = null;
  }
}
