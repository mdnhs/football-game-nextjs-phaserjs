import Phaser from "phaser";

const PERFECT_ZONE_START = 240;
const PERFECT_ZONE_END = 300;
const RADIUS = 28;

export class TimingBar {
  private graphics: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;

  private angle = 0;
  private speed = 155;
  private active = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y - 55;
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

    this.graphics.lineStyle(5, 0x222233, 1);
    this.graphics.strokeCircle(this.x, this.y, RADIUS);

    this.graphics.lineStyle(5, 0x00e676, 1);
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

    const inZone =
      this.angle >= PERFECT_ZONE_START && this.angle <= PERFECT_ZONE_END;
    this.graphics.fillStyle(inZone ? 0x00e676 : 0xffffff, 1);
    this.graphics.fillCircle(dotX, dotY, 5);
  }

  release(): number {
    this.active = false;

    const normalized = ((this.angle % 360) + 360) % 360;
    const inZone =
      normalized >= PERFECT_ZONE_START && normalized <= PERFECT_ZONE_END;
    if (inZone) return 1;

    const centerDist = Math.min(
      Math.abs(normalized - 270),
      360 - Math.abs(normalized - 270),
    );
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
