import Phaser from "phaser";
import type { AimDirection } from "@/types/game";

const COLORS = {
  SKIN: 0xf3c69a,
  SKIN_SHADE: 0xd8a376,
  JERSEY: 0xff9a1f,
  JERSEY_SHADE: 0xd47410,
  SHORTS: 0x1a1a1a,
  SOCK: 0xffffff,
  BOOT: 0x111111,
  GLOVE: 0x1a1a1a,
  HAIR: 0x3a2410,
  OUTLINE: 0x111111,
};

const NATURAL_HEIGHT = 220;

const DEG = (d: number) => Phaser.Math.DegToRad(d);

export class Goalkeeper {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private body!: Phaser.GameObjects.Graphics;
  private head!: Phaser.GameObjects.Graphics;
  private leftArm!: Phaser.GameObjects.Graphics;
  private rightArm!: Phaser.GameObjects.Graphics;
  private leftLeg!: Phaser.GameObjects.Graphics;
  private rightLeg!: Phaser.GameObjects.Graphics;
  private shadow!: Phaser.GameObjects.Ellipse;

  private startX: number;
  private startY: number;
  private baseScale: number;

  private leftArmIdle = DEG(22);
  private rightArmIdle = DEG(-22);

  constructor(scene: Phaser.Scene, x: number, y: number, height = 220) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;
    this.baseScale = height / NATURAL_HEIGHT;

    this.container = scene.add.container(x, y).setDepth(13);
    this.container.setScale(this.baseScale);

    this.shadow = scene.add.ellipse(0, 4, 90, 14, 0x000000, 0.35);
    this.container.add(this.shadow);

    this.leftLeg = this.makeLeg();
    this.leftLeg.setPosition(-14, -62);
    this.rightLeg = this.makeLeg();
    this.rightLeg.setPosition(14, -62);

    this.body = this.makeBody();
    this.body.setPosition(0, -62);

    this.head = this.makeHead();
    this.head.setPosition(0, -176);

    this.leftArm = this.makeArm();
    this.leftArm.setPosition(-32, -150);
    this.leftArm.setRotation(this.leftArmIdle);

    this.rightArm = this.makeArm();
    this.rightArm.setPosition(32, -150);
    this.rightArm.setRotation(this.rightArmIdle);

    this.container.add([
      this.leftLeg,
      this.rightLeg,
      this.body,
      this.head,
      this.leftArm,
      this.rightArm,
    ]);

    this.startIdle();
  }

  private makeBody() {
    const g = this.scene.add.graphics();
    g.fillStyle(COLORS.SHORTS, 1);
    g.fillRoundedRect(-34, -8, 68, 40, 6);
    g.lineStyle(1.8, COLORS.OUTLINE, 1);
    g.strokeRoundedRect(-34, -8, 68, 40, 6);

    g.fillStyle(COLORS.JERSEY, 1);
    g.fillRoundedRect(-36, -86, 72, 84, 10);
    g.fillStyle(COLORS.JERSEY_SHADE, 1);
    g.fillRoundedRect(-36, -20, 72, 16, 10);
    g.lineStyle(2, COLORS.OUTLINE, 1);
    g.strokeRoundedRect(-36, -86, 72, 84, 10);

    g.fillStyle(COLORS.OUTLINE, 1);
    g.fillTriangle(-8, -86, 8, -86, 0, -74);
    g.fillStyle(COLORS.SKIN, 1);
    g.fillTriangle(-5, -84, 5, -84, 0, -76);

    g.fillStyle(0xffffff, 1);
    g.fillCircle(0, -55, 8);
    g.fillStyle(COLORS.JERSEY_SHADE, 1);
    g.fillRect(-2, -60, 4, 10);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-22, -70, 4);
    return g;
  }

  private makeHead() {
    const g = this.scene.add.graphics();
    g.fillStyle(COLORS.HAIR, 1);
    g.fillCircle(0, -10, 18);
    g.fillRect(-18, -10, 36, 5);
    g.lineStyle(1.5, COLORS.OUTLINE, 0.9);
    g.strokeCircle(0, -10, 18);

    g.fillStyle(COLORS.SKIN, 1);
    g.fillCircle(0, 0, 17);
    g.lineStyle(1.8, COLORS.OUTLINE, 1);
    g.strokeCircle(0, 0, 17);

    g.fillStyle(COLORS.SKIN, 1);
    g.fillCircle(-16, 0, 3);
    g.fillCircle(16, 0, 3);

    g.fillStyle(COLORS.OUTLINE, 1);
    g.fillCircle(-6, 0, 1.8);
    g.fillCircle(6, 0, 1.8);

    g.fillStyle(0xffffff, 1);
    g.fillCircle(-5.5, -0.5, 0.6);
    g.fillCircle(6.5, -0.5, 0.6);

    g.lineStyle(1.5, COLORS.OUTLINE, 1);
    g.beginPath();
    g.arc(0, 6, 4, DEG(20), DEG(160), false);
    g.strokePath();

    g.fillStyle(COLORS.SKIN_SHADE, 1);
    g.fillRect(-6, 16, 12, 8);
    return g;
  }

  private makeArm() {
    const g = this.scene.add.graphics();
    g.fillStyle(COLORS.JERSEY, 1);
    g.fillRoundedRect(-9, 0, 18, 36, 6);
    g.lineStyle(2, COLORS.OUTLINE, 1);
    g.strokeRoundedRect(-9, 0, 18, 36, 6);

    g.fillStyle(COLORS.SKIN, 1);
    g.fillRoundedRect(-8, 34, 16, 14, 5);
    g.lineStyle(1.5, COLORS.OUTLINE, 1);
    g.strokeRoundedRect(-8, 34, 16, 14, 5);

    g.fillStyle(COLORS.GLOVE, 1);
    g.fillRoundedRect(-13, 46, 26, 24, 7);
    g.lineStyle(1.8, COLORS.OUTLINE, 1);
    g.strokeRoundedRect(-13, 46, 26, 24, 7);

    g.fillStyle(COLORS.JERSEY, 1);
    g.fillRect(-13, 46, 26, 4);

    g.lineStyle(1, COLORS.OUTLINE, 0.6);
    g.beginPath();
    g.moveTo(-6, 54);
    g.lineTo(-6, 68);
    g.moveTo(0, 54);
    g.lineTo(0, 68);
    g.moveTo(6, 54);
    g.lineTo(6, 68);
    g.strokePath();
    return g;
  }

  private makeLeg() {
    const g = this.scene.add.graphics();
    g.fillStyle(COLORS.SOCK, 1);
    g.fillRoundedRect(-9, 0, 18, 42, 4);
    g.lineStyle(1.5, COLORS.OUTLINE, 0.85);
    g.strokeRoundedRect(-9, 0, 18, 42, 4);

    g.fillStyle(COLORS.BOOT, 1);
    g.fillRoundedRect(-12, 40, 28, 14, 5);
    g.lineStyle(1.5, COLORS.OUTLINE, 0.9);
    g.strokeRoundedRect(-12, 40, 28, 14, 5);

    g.fillStyle(0xffffff, 0.6);
    g.fillRect(-10, 44, 6, 2);
    return g;
  }

  private stopAllTweens() {
    [
      this.container,
      this.body,
      this.head,
      this.leftArm,
      this.rightArm,
      this.leftLeg,
      this.rightLeg,
    ].forEach((t) => this.scene.tweens.killTweensOf(t));
  }

  private startIdle() {
    this.stopAllTweens();
    this.container.setRotation(0);
    this.container.setPosition(this.startX, this.startY);
    this.container.setScale(this.baseScale);

    const swayRange = this.scene.scale.width * 0.022;
    this.scene.tweens.add({
      targets: this.container,
      x: this.startX + swayRange,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.scene.tweens.add({
      targets: this.container,
      scaleY: this.baseScale * 1.015,
      duration: 640,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.leftArm.setRotation(this.leftArmIdle);
    this.rightArm.setRotation(this.rightArmIdle);
    this.scene.tweens.add({
      targets: this.leftArm,
      rotation: this.leftArmIdle + DEG(10),
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: this.rightArm,
      rotation: this.rightArmIdle - DEG(10),
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: this.head,
      angle: 4,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  anticipate() {
    this.stopAllTweens();
    this.scene.tweens.add({
      targets: this.container,
      scaleY: this.baseScale * 0.93,
      scaleX: this.baseScale * 1.06,
      duration: 150,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: this.leftArm,
      rotation: DEG(60),
      duration: 150,
    });
    this.scene.tweens.add({
      targets: this.rightArm,
      rotation: DEG(-60),
      duration: 150,
    });
  }

  reactToShot({
    direction,
    difficulty,
    willSave,
  }: {
    direction: AimDirection;
    power: number;
    difficulty: number;
    willSave: boolean;
  }) {
    this.anticipate();

    const predictChance = 0.38 + difficulty * 0.32;
    let goesRight: boolean;
    if (willSave) {
      goesRight = direction.x > 0;
    } else {
      goesRight =
        Math.random() < predictChance ? direction.x > 0 : direction.x <= 0;
    }

    this.scene.time.delayedCall(140, () => this.dive(goesRight ? 1 : -1));
  }

  private dive(side: 1 | -1) {
    const sceneWidth = this.scene.scale.width;
    const reach = sceneWidth * 0.32;
    const liftY = this.startY - sceneWidth * 0.18;
    const landY = this.startY - sceneWidth * 0.02;
    const apexX = this.startX + side * reach * 0.55;
    const finalX = this.startX + side * reach;

    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.leftArm);
    this.scene.tweens.killTweensOf(this.rightArm);

    const lead = side === 1 ? this.rightArm : this.leftArm;
    const trail = side === 1 ? this.leftArm : this.rightArm;

    this.scene.tweens.add({
      targets: lead,
      rotation: side * DEG(135),
      duration: 220,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: trail,
      rotation: side * DEG(95),
      duration: 220,
      ease: "Quad.easeOut",
    });

    this.scene.tweens.add({
      targets: this.container,
      x: apexX,
      y: liftY,
      rotation: side * DEG(38),
      duration: 230,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.container,
          x: finalX,
          y: landY,
          rotation: side * DEG(78),
          duration: 230,
          ease: "Quad.easeIn",
        });
      },
    });
  }

  celebrate() {
    this.stopAllTweens();
    this.scene.tweens.add({
      targets: this.leftArm,
      rotation: DEG(-155),
      duration: 220,
      yoyo: true,
      repeat: 2,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: this.rightArm,
      rotation: DEG(155),
      duration: 220,
      yoyo: true,
      repeat: 2,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - this.scene.scale.width * 0.06,
      rotation: 0,
      scaleX: this.baseScale * 1.06,
      scaleY: this.baseScale * 1.06,
      duration: 240,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
    });
  }

  dejected() {
    this.stopAllTweens();
    this.scene.tweens.add({
      targets: this.leftArm,
      rotation: DEG(-8),
      duration: 500,
    });
    this.scene.tweens.add({
      targets: this.rightArm,
      rotation: DEG(8),
      duration: 500,
    });
    this.scene.tweens.add({
      targets: this.head,
      angle: -18,
      duration: 500,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: this.container,
      rotation: DEG(-10),
      y: this.startY + 4,
      duration: 600,
      ease: "Sine.easeOut",
    });
  }

  resetPosition() {
    this.stopAllTweens();
    this.scene.tweens.add({
      targets: this.head,
      angle: 0,
      duration: 250,
    });
    this.scene.tweens.add({
      targets: this.container,
      x: this.startX,
      y: this.startY,
      rotation: 0,
      scaleX: this.baseScale,
      scaleY: this.baseScale,
      duration: 420,
      ease: "Power2",
      onComplete: () => this.startIdle(),
    });
  }
}
