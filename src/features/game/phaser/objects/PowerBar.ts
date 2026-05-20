import Phaser from 'phaser';
import { GAME } from '@/features/game/utils/constants';

export class PowerBar {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Graphics;
  private fill: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private valueText: Phaser.GameObjects.Text;
  private x: number;
  private y: number;
  private barWidth: number;
  private barHeight = 18;

  private power = 0;
  private direction = 1;
  private charging = false;
  private pulse = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.barWidth = Math.min(scene.scale.width * 0.76, 330);

    this.bg = scene.add.graphics().setDepth(10);
    this.fill = scene.add.graphics().setDepth(11);
    this.label = scene.add
      .text(x - this.barWidth / 2 + 10, y - 33, 'KICK POWER', {
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#eaf6ff',
        fontFamily: 'Arial Black, system-ui, sans-serif',
      })
      .setOrigin(0, 0.5)
      .setDepth(11)
      .setShadow(0, 2, '#000814', 4);
    this.valueText = scene.add
      .text(x + this.barWidth / 2 - 10, y - 33, '0%', {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#FFD700',
        fontFamily: 'Arial Black, system-ui, sans-serif',
      })
      .setOrigin(1, 0.5)
      .setDepth(11)
      .setShadow(0, 2, '#000814', 4);

    this.drawBg();
    this.hide();
  }

  private drawBg() {
    const bw = this.barWidth;
    const bh = this.barHeight;
    const left = this.x - bw / 2;
    const top = this.y - bh / 2;

    this.bg.clear();

    this.bg.fillStyle(0x000000, 0.38);
    this.bg.fillRoundedRect(left - 16, top - 30, bw + 32, 58, 18);
    this.bg.fillStyle(0x000814, 0.74);
    this.bg.fillRoundedRect(left - 14, top - 32, bw + 28, 58, 17);
    this.bg.lineStyle(1.5, 0x8ebcff, 0.2);
    this.bg.strokeRoundedRect(left - 14, top - 32, bw + 28, 58, 17);
    this.bg.fillStyle(0xffffff, 0.08);
    this.bg.fillRoundedRect(left - 8, top - 27, bw + 16, 16, 8);

    this.bg.fillStyle(0x031020, 0.96);
    this.bg.fillRoundedRect(left, top, bw, bh, bh / 2);
    this.bg.fillStyle(0x1b2846, 0.95);
    this.bg.fillRoundedRect(left + 2, top + 2, bw - 4, bh - 4, bh / 2 - 2);

    this.bg.fillStyle(0x00e676, 0.1);
    this.bg.fillRoundedRect(left + 3, top + 3, bw * 0.65 - 6, bh - 6, 5);
    this.bg.fillStyle(0xffd700, 0.26);
    this.bg.fillRoundedRect(left + bw * 0.65, top + 3, bw * 0.25, bh - 6, 3);
    this.bg.fillStyle(0xff5722, 0.24);
    this.bg.fillRoundedRect(left + bw * 0.9, top + 3, bw * 0.1 - 3, bh - 6, 5);

    this.bg.lineStyle(1, 0xffffff, 0.45);
    [0.25, 0.5, 0.65, 0.9].forEach((p) => {
      this.bg.lineBetween(left + bw * p, top + 2, left + bw * p, top + bh - 2);
    });

    this.bg.lineStyle(2, 0x7aa2d9, 0.78);
    this.bg.strokeRoundedRect(left, top, bw, bh, bh / 2);
    this.bg.lineStyle(1, 0xffffff, 0.24);
    this.bg.strokeRoundedRect(left + 3, top + 3, bw - 6, bh - 6, bh / 2 - 3);
  }

  startCharging() {
    this.charging = true;
    this.power = 0;
    this.direction = 1;
  }

  update(delta: number) {
    if (!this.charging) return;

    this.pulse += delta * 0.006;
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

    this.drawFill();
  }

  private drawFill() {
    const bw = this.barWidth;
    const bh = this.barHeight;
    const left = this.x - bw / 2;
    const top = this.y - bh / 2;
    const fw = bw * this.power;

    this.fill.clear();
    this.valueText.setText(`${Math.round(this.power * 100)}%`);
    if (fw < 2) return;

    let color = 0x00e676;
    if (this.power > 0.9) color = 0xff5722;
    else if (this.power > 0.65) color = 0xffd700;

    const shimmer = 0.22 + Math.sin(this.pulse) * 0.08;

    this.fill.fillStyle(color, 0.34);
    this.fill.fillRoundedRect(left - 4, top - 5, fw + 8, bh + 10, bh / 2 + 4);

    this.fill.fillStyle(color, 0.95);
    this.fill.fillRoundedRect(left + 3, top + 3, Math.max(4, fw - 6), bh - 6, bh / 2 - 3);

    this.fill.fillStyle(0xffffff, shimmer);
    this.fill.fillRoundedRect(left + 5, top + 4, Math.max(0, fw - 12), 5, 3);

    this.fill.fillStyle(0xffffff, 0.86);
    this.fill.fillRoundedRect(left + fw - 3, top - 4, 5, bh + 8, 3);
    this.fill.fillStyle(color, 0.45);
    this.fill.fillCircle(left + fw, top + bh / 2, 10);
  }

  release(): number {
    this.charging = false;
    return this.power;
  }

  reset() {
    this.power = 0;
    this.direction = 1;
    this.fill.clear();
    this.valueText.setText('0%');
  }

  show() {
    this.bg.setVisible(true);
    this.fill.setVisible(true);
    this.label.setVisible(true);
    this.valueText.setVisible(true);
  }

  hide() {
    this.bg.setVisible(false);
    this.fill.setVisible(false);
    this.label.setVisible(false);
    this.valueText.setVisible(false);
  }
}
