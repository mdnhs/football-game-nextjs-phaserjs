import Phaser from "phaser";
import { GAME } from "@/constants/game";

export class PowerBar {
  private track: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private barWidth: number;

  private power = 0;
  private direction = 1;
  private charging = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.barWidth = scene.scale.width * 0.7;

    this.track = scene.add
      .rectangle(x, y, this.barWidth, 16, 0x1a1a2e)
      .setDepth(10);
    this.fill = scene.add
      .rectangle(x - this.barWidth / 2, y, 0, 16, 0x00e676)
      .setOrigin(0, 0.5)
      .setDepth(11);
    this.label = scene.add
      .text(x, y - 22, "POWER", {
        fontSize: "11px",
        color: "#aaaaaa",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.hide();
  }

  startCharging() {
    this.charging = true;
    this.power = 0;
    this.direction = 1;
  }

  update(delta: number) {
    if (!this.charging) return;

    const speed = GAME.POWER_BAR_BASE_SPEED;
    this.power += this.direction * speed * (delta / 1000);

    if (this.power >= 1) {
      this.power = 1;
      this.direction = -1;
    }
    if (this.power <= 0) {
      this.power = 0;
      this.direction = 1;
    }

    this.fill.width = this.barWidth * this.power;

    const r =
      this.power < 0.5
        ? Math.round(Phaser.Math.Linear(0, 255, this.power * 2))
        : 255;
    const g =
      this.power < 0.5
        ? 230
        : Math.round(Phaser.Math.Linear(230, 23, (this.power - 0.5) * 2));

    this.fill.fillColor = Phaser.Display.Color.GetColor(r, g, 0);
  }

  release(): number {
    this.charging = false;
    return this.power;
  }

  reset() {
    this.power = 0;
    this.direction = 1;
    this.fill.width = 0;
  }
  show() {
    [this.track, this.fill, this.label].forEach((o) => o.setVisible(true));
  }
  hide() {
    [this.track, this.fill, this.label].forEach((o) => o.setVisible(false));
  }
}
