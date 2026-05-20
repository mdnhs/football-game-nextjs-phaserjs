import Phaser from 'phaser';

const PERFECT_ZONE_START = 240;
const PERFECT_ZONE_END = 300;
const GOOD_SPAN = 35;
const RADIUS = 32;
const LINE_WIDTH = 6;

export class TimingBar {
  private graphics: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;

  private angle = 0;
  private speed = 155;
  private active = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.graphics = scene.add.graphics().setDepth(12);
    this.hide();
  }

  start(speed: number) {
    this.angle = 0;
    this.speed = speed;
    this.active = true;
    this.show();
  }

  update(delta: number) {
    if (!this.active) return;
    this.angle = (this.angle + this.speed * (delta / 1000)) % 360;
    this.draw();
  }

  private draw() {
    this.graphics.clear();

    this.graphics.fillStyle(0x000814, 0.46);
    this.graphics.fillCircle(this.x, this.y, RADIUS + 15);

    this.graphics.lineStyle(LINE_WIDTH + 14, 0x00e676, 0.08);
    this.graphics.strokeCircle(this.x, this.y, RADIUS + 2);
    this.graphics.lineStyle(LINE_WIDTH + 8, 0xffffff, 0.06);
    this.graphics.strokeCircle(this.x, this.y, RADIUS);

    this.graphics.lineStyle(LINE_WIDTH, 0x0a1428, 1);
    this.graphics.strokeCircle(this.x, this.y, RADIUS);
    this.graphics.lineStyle(1.5, 0x8ebcff, 0.45);
    this.graphics.strokeCircle(this.x, this.y, RADIUS + LINE_WIDTH / 2);
    this.graphics.strokeCircle(this.x, this.y, RADIUS - LINE_WIDTH / 2);

    this.graphics.lineStyle(1, 0xffffff, 0.16);
    for (let i = 0; i < 8; i++) {
      const rad = Phaser.Math.DegToRad(i * 45);
      const ix = this.x + Math.cos(rad) * (RADIUS - 9);
      const iy = this.y + Math.sin(rad) * (RADIUS - 9);
      const ox = this.x + Math.cos(rad) * (RADIUS + 9);
      const oy = this.y + Math.sin(rad) * (RADIUS + 9);
      this.graphics.lineBetween(ix, iy, ox, oy);
    }

    this.graphics.lineStyle(LINE_WIDTH, 0xffd700, 0.85);
    this.graphics.beginPath();
    this.graphics.arc(
      this.x,
      this.y,
      RADIUS,
      Phaser.Math.DegToRad(PERFECT_ZONE_START - GOOD_SPAN - 90),
      Phaser.Math.DegToRad(PERFECT_ZONE_START - 90),
      false,
    );
    this.graphics.strokePath();
    this.graphics.beginPath();
    this.graphics.arc(
      this.x,
      this.y,
      RADIUS,
      Phaser.Math.DegToRad(PERFECT_ZONE_END - 90),
      Phaser.Math.DegToRad(PERFECT_ZONE_END + GOOD_SPAN - 90),
      false,
    );
    this.graphics.strokePath();

    this.graphics.lineStyle(LINE_WIDTH + 6, 0x00e676, 0.28);
    this.graphics.beginPath();
    this.graphics.arc(
      this.x,
      this.y,
      RADIUS,
      Phaser.Math.DegToRad(PERFECT_ZONE_START - 90),
      Phaser.Math.DegToRad(PERFECT_ZONE_END - 90),
      false,
    );
    this.graphics.strokePath();
    this.graphics.lineStyle(LINE_WIDTH, 0x00ff8a, 1);
    this.graphics.beginPath();
    this.graphics.arc(
      this.x,
      this.y,
      RADIUS,
      Phaser.Math.DegToRad(PERFECT_ZONE_START - 90),
      Phaser.Math.DegToRad(PERFECT_ZONE_END - 90),
      false,
    );
    this.graphics.strokePath();

    const rad = Phaser.Math.DegToRad(this.angle - 90);
    const dotX = this.x + Math.cos(rad) * RADIUS;
    const dotY = this.y + Math.sin(rad) * RADIUS;
    const inPerfect = this.angle >= PERFECT_ZONE_START && this.angle <= PERFECT_ZONE_END;
    const inGood =
      (this.angle >= PERFECT_ZONE_START - GOOD_SPAN && this.angle < PERFECT_ZONE_START) ||
      (this.angle > PERFECT_ZONE_END && this.angle <= PERFECT_ZONE_END + GOOD_SPAN);

    const dotColor = inPerfect ? 0x00e676 : inGood ? 0xffd700 : 0xffffff;

    this.graphics.lineStyle(2, dotColor, 0.42);
    this.graphics.lineBetween(this.x, this.y, dotX, dotY);
    this.graphics.fillStyle(dotColor, 0.4);
    this.graphics.fillCircle(dotX, dotY, 12);
    this.graphics.fillStyle(dotColor, 0.65);
    this.graphics.fillCircle(dotX, dotY, 8);

    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(dotX, dotY, 5);
    this.graphics.fillStyle(dotColor, 1);
    this.graphics.fillCircle(dotX, dotY, 3.5);

    this.graphics.fillStyle(0xffffff, 0.9);
    this.graphics.fillCircle(dotX - 1, dotY - 1, 1);

    this.graphics.fillStyle(0xffffff, 0.92);
    this.graphics.fillCircle(this.x, this.y, 2.4);
    this.graphics.lineStyle(1, 0xffffff, 0.34);
    this.graphics.strokeCircle(this.x, this.y, 8);
  }

  release(): number {
    this.active = false;

    const normalized = ((this.angle % 360) + 360) % 360;
    const inZone = normalized >= PERFECT_ZONE_START && normalized <= PERFECT_ZONE_END;
    if (inZone) return 1;

    const centerDist = Math.min(Math.abs(normalized - 270), 360 - Math.abs(normalized - 270));
    return Math.max(0, 1 - centerDist / 90);
  }

  reset() {
    this.angle = 0;
    this.active = false;
    this.graphics.clear();
  }
  show() {
    this.graphics.setVisible(true);
  }
  hide() {
    this.graphics.setVisible(false);
  }
}
