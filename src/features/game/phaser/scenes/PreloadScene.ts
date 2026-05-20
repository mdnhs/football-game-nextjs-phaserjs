import Phaser from 'phaser';

const IMAGE_KEYS = ['bg', 'goal', 'ball', 'crowd', 'net_flash'] as const;
const SPRITESHEET_KEYS = ['keeper'] as const;

export class PreloadScene extends Phaser.Scene {
  private failedImages = new Set<string>();
  private failedAudio = new Set<string>();

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const { width, height } = this.scale;

    const track = this.add.rectangle(width / 2, height / 2, 280, 8, 0x1a1a2e);
    const bar = this.add.rectangle(width / 2 - 140, height / 2, 0, 8, 0x00e676).setOrigin(0, 0.5);

    const label = this.add
      .text(width / 2, height / 2 - 28, 'Loading...', {
        fontSize: '13px',
        color: '#888888',
        fontFamily: 'system-ui',
      })
      .setOrigin(0.5);

    const percentText = this.add
      .text(width / 2, height / 2 + 24, '0%', {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#00e676',
        fontFamily: 'system-ui',
      })
      .setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.width = 280 * v;
      percentText.setText(`${Math.round(v * 100)}%`);
    });
    this.load.on('complete', () => {
      track.destroy();
      bar.destroy();
      label.destroy();
      percentText.destroy();
    });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.type === 'image' || file.type === 'spritesheet') {
        this.failedImages.add(file.key);
      } else if (file.type === 'audio') {
        this.failedAudio.add(file.key);
      }
    });

    this.load.image('bg', '/assets/images/8083850_1131.jpg');
    this.load.image('goal', '/assets/images/goalbar.png');
    this.load.svg('ball', '/assets/images/ball.svg', { width: 128, height: 128 });
    this.load.image('crowd', '/assets/images/crowd.png');
    this.load.image('net_flash', '/assets/images/net_flash.png');

    this.load.spritesheet('keeper', '/assets/images/keeper.png', {
      frameWidth: 128,
      frameHeight: 196,
    });

    this.load.audio('crowd', '/assets/audio/crowd_ambient.mp3');
    this.load.audio('kick', '/assets/audio/kick.mp3');
    this.load.audio('goal', '/assets/audio/goal.mp3');
    this.load.audio('save', '/assets/audio/save.mp3');
    this.load.audio('miss', '/assets/audio/miss.mp3');
    this.load.audio('whistle', '/assets/audio/whistle.mp3');
  }

  create() {
    this.registry.set('usePhotoStadium', !this.failedImages.has('bg'));
    this.registry.set('useGoalbarAsset', !this.failedImages.has('goal'));
    this.generatePlaceholderTextures();
    this.makeBallTrailTexture('ball_trail');
    this.registry.set('missingAudio', this.failedAudio);
    this.scene.start('GameScene');
  }

  private generatePlaceholderTextures() {
    const drawers: Record<string, () => void> = {
      bg: () => this.makeBackgroundTexture('bg'),
      goal: () => this.makeGoalTexture('goal'),
      ball: () => this.makeBallTexture('ball'),
      crowd: () => this.makeCrowdTexture('crowd'),
      net_flash: () => this.makeNetFlashTexture('net_flash'),
      keeper: () => this.makeKeeperTexture('keeper'),
    };

    for (const key of IMAGE_KEYS) {
      if (!this.failedImages.has(key) && this.textures.exists(key)) continue;
      drawers[key]?.();
    }
    for (const key of SPRITESHEET_KEYS) {
      if (!this.failedImages.has(key) && this.textures.exists(key)) continue;
      drawers[key]?.();
    }
  }

  private newGraphics() {
    return this.make.graphics({ x: 0, y: 0 }, false);
  }

  private commit(g: Phaser.GameObjects.Graphics, key: string, w: number, h: number) {
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeBackgroundTexture(key: string) {
    const w = 390;
    const h = 844;
    const g = this.newGraphics();

    const horizonY = h * 0.56;
    const skyH = horizonY;
    const groundY = h;
    const grassH = groundY - horizonY;
    const vanishX = w / 2;

    // Night sky: deep broadcast blue w/ soft vertical grade.
    const skyBands = [0x030611, 0x050a18, 0x071024, 0x0b1834, 0x102247, 0x142b57, 0x193463];
    const band = skyH / skyBands.length;
    skyBands.forEach((c, i) => {
      g.fillStyle(c, 1);
      g.fillRect(0, i * band, w, band + 1);
    });

    for (let i = 0; i < 70; i++) {
      const y = Math.random() * skyH * 0.7;
      const x = Math.random() * w;
      g.fillStyle(0xcfe4ff, 0.08 + Math.random() * 0.16);
      g.fillCircle(x, y, 0.35 + Math.random() * 0.8);
    }

    // Stadium bowl silhouette behind the loaded crowd texture.
    g.fillStyle(0x02050c, 0.92);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-20, skyH * 0.54),
        new Phaser.Math.Vector2(w * 0.16, skyH * 0.36),
        new Phaser.Math.Vector2(w * 0.5, skyH * 0.29),
        new Phaser.Math.Vector2(w * 0.84, skyH * 0.36),
        new Phaser.Math.Vector2(w + 20, skyH * 0.54),
        new Phaser.Math.Vector2(w + 20, skyH),
        new Phaser.Math.Vector2(-20, skyH),
      ],
      true,
    );

    g.fillStyle(0x111b35, 0.8);
    for (let i = 0; i < 4; i++) {
      const y = skyH * (0.48 + i * 0.08);
      g.fillRect(0, y, w, 2);
      g.fillStyle(0x25385e, 0.28 - i * 0.035);
      g.fillRect(0, y + 2, w, 18);
      g.fillStyle(0x111b35, 0.8);
    }

    // Roof canopy and trusses.
    g.fillStyle(0x01030a, 0.96);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-24, 0),
        new Phaser.Math.Vector2(w + 24, 0),
        new Phaser.Math.Vector2(w * 0.86, skyH * 0.23),
        new Phaser.Math.Vector2(w * 0.5, skyH * 0.17),
        new Phaser.Math.Vector2(w * 0.14, skyH * 0.23),
      ],
      true,
    );
    g.lineStyle(1, 0x26395f, 0.55);
    for (let i = 0; i < 7; i++) {
      const x = (i / 6) * w;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(w / 2, skyH * 0.38);
      g.strokePath();
    }
    g.fillStyle(0xffffff, 0.04);
    g.fillEllipse(w / 2, skyH * 0.17, w * 0.86, skyH * 0.18);

    // Floodlight haze.
    g.fillStyle(0xfff1b8, 0.08);
    g.fillCircle(w * 0.1, skyH * 0.04, 92);
    g.fillCircle(w * 0.9, skyH * 0.04, 92);
    g.fillStyle(0xfff8d8, 0.045);
    g.fillTriangle(w * 0.05, 0, w * 0.28, 0, w * 0.58, h);
    g.fillTriangle(w * 0.72, 0, w * 0.95, 0, w * 0.42, h);

    // Pitch foundation.
    g.fillStyle(0x256f32, 1);
    g.fillRect(0, horizonY, w, grassH);

    // Horizontal soil/grass bands give scale before perspective stripes.
    for (let i = 0; i < 28; i++) {
      const t = i / 27;
      const y = horizonY + t * grassH;
      const a = 0.04 + t * 0.06;
      g.fillStyle(i % 2 === 0 ? 0xb8ffc4 : 0x061609, a);
      g.fillRect(0, y, w, 3 + t * 5);
    }

    const stripes = 9;
    const topLeft = -w * 0.04;
    const topRight = w * 1.04;
    const bottomLeft = -w * 0.1;
    const bottomRight = w * 1.1;
    const grassColors = [0x3e9444, 0x55b45b, 0x34833b, 0x63be62, 0x3a9844, 0x59b85c, 0x2f7d38, 0x4eaa55, 0x3b9141];

    for (let i = 0; i < stripes; i++) {
      const t0 = i / stripes;
      const t1 = (i + 1) / stripes;
      const bx0 = Phaser.Math.Linear(bottomLeft, bottomRight, t0);
      const bx1 = Phaser.Math.Linear(bottomLeft, bottomRight, t1);
      const hx0 = Phaser.Math.Linear(topLeft, topRight, t0);
      const hx1 = Phaser.Math.Linear(topLeft, topRight, t1);
      g.fillStyle(grassColors[i % grassColors.length], 1);
      g.fillPoints(
        [
          new Phaser.Math.Vector2(bx0, groundY),
          new Phaser.Math.Vector2(bx1, groundY),
          new Phaser.Math.Vector2(hx1, horizonY),
          new Phaser.Math.Vector2(hx0, horizonY),
        ],
        true,
      );
    }

    // Soft seams between wide mowing lanes, matching the reference style.
    g.lineStyle(2, 0xd7ffd2, 0.08);
    for (let i = 1; i < stripes; i++) {
      const t = i / stripes;
      const x0 = Phaser.Math.Linear(bottomLeft, bottomRight, t);
      const x1 = Phaser.Math.Linear(topLeft, topRight, t);
      g.beginPath();
      g.moveTo(x0, groundY);
      g.lineTo(x1, horizonY);
      g.strokePath();
    }
    g.lineStyle(1, 0x06200d, 0.22);
    for (let i = 0; i < 14; i++) {
      const y = horizonY + Math.pow(i / 13, 1.45) * grassH;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y + 4);
      g.strokePath();
    }

    // Stadium light falls onto the penalty spot.
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      g.fillStyle(0xd8ffd3, 0.035 * (1 - t));
      g.fillEllipse(vanishX, h * 0.79, w * (0.78 - t * 0.44), grassH * (0.52 - t * 0.3));
    }

    // Grass blade and divot texture, denser foreground.
    for (let i = 0; i < 1250; i++) {
      const t = Math.pow(Math.random(), 1.65);
      const y = horizonY + t * grassH;
      const x = Math.random() * w;
      const size = 0.35 + Math.random() * (0.8 + t * 1.9);
      const r = Math.random();
      let tint: number;
      if (r < 0.32) tint = 0x113e1c;
      else if (r < 0.68) tint = 0x78c879;
      else if (r < 0.88) tint = 0x99efa0;
      else tint = 0x061407;
      g.fillStyle(tint, 0.22 + Math.random() * 0.42);
      if (Math.random() < 0.72) {
        g.fillRect(x, y, size * 0.8, Math.max(1, size * 1.7));
      } else {
        g.fillCircle(x, y, size);
      }
    }

    // Edge vignette and goal-mouth shadow.
    const sideW = w * 0.24;
    for (let i = 0; i < sideW; i += 2) {
      const a = (1 - i / sideW) * 0.46;
      g.fillStyle(0x000814, a);
      g.fillRect(i, horizonY, 2, grassH);
      g.fillRect(w - i - 2, horizonY, 2, grassH);
    }
    g.fillStyle(0x02050c, 0.28);
    g.fillEllipse(vanishX, horizonY + 8, w * 0.78, 20);

    const goalLineY = horizonY;
    const sixBoxFrontY = h * 0.675;
    const boxFrontY = h * 0.885;
    const spotY = h * 0.78;

    const boxBackHalf = w * 0.145;
    const boxFrontHalf = w * 0.465;
    const sixBackHalf = w * 0.07;
    const sixFrontHalf = w * 0.2;

    const drawTrap = (bh: number, fh: number, fy: number, thickness: number, alpha: number, color = 0xffffff) => {
      g.lineStyle(thickness, color, alpha);
      g.beginPath();
      g.moveTo(vanishX - bh, goalLineY);
      g.lineTo(vanishX - fh, fy);
      g.lineTo(vanishX + fh, fy);
      g.lineTo(vanishX + bh, goalLineY);
      g.strokePath();
    };

    drawTrap(boxBackHalf, boxFrontHalf, boxFrontY + 3, 5, 0.35, 0x001006);
    drawTrap(sixBackHalf, sixFrontHalf, sixBoxFrontY + 2, 4, 0.32, 0x001006);
    drawTrap(boxBackHalf, boxFrontHalf, boxFrontY, 3.4, 0.9);
    drawTrap(sixBackHalf, sixFrontHalf, sixBoxFrontY, 2.8, 0.78);
    drawTrap(boxBackHalf, boxFrontHalf, boxFrontY - 1, 1, 0.25, 0xb6ffc6);

    const arcRX = w * 0.14;
    const arcRY = w * 0.05;
    const arcSegments = 28;

    g.lineStyle(4, 0x001006, 0.34);
    g.beginPath();
    for (let s = 0; s <= arcSegments; s++) {
      const a = Phaser.Math.DegToRad((180 * s) / arcSegments);
      const px = vanishX + Math.cos(a) * arcRX;
      const py = boxFrontY + 3 + Math.sin(a) * arcRY;
      if (s === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();

    g.lineStyle(3, 0xffffff, 0.88);
    g.beginPath();
    for (let s = 0; s <= arcSegments; s++) {
      const a = Phaser.Math.DegToRad((180 * s) / arcSegments);
      const px = vanishX + Math.cos(a) * arcRX;
      const py = boxFrontY + Math.sin(a) * arcRY;
      if (s === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();

    g.fillStyle(0x000814, 0.45);
    g.fillEllipse(vanishX + 1, spotY + 2, 16, 8);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(vanishX, spotY, 4.8);
    g.lineStyle(1, 0xb6ffc6, 0.5);
    g.strokeCircle(vanishX, spotY, 7.5);

    g.fillStyle(0x000814, 0.35);
    g.fillRect(vanishX - boxBackHalf, goalLineY, boxBackHalf * 2, 3);
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(vanishX - boxBackHalf, goalLineY - 1, boxBackHalf * 2, 2);

    g.fillStyle(0xffffff, 0.18);
    g.fillRect(0, horizonY - 1, vanishX - boxBackHalf, 1);
    g.fillRect(vanishX + boxBackHalf, horizonY - 1, w - vanishX - boxBackHalf, 1);

    this.commit(g, key, w, h);
  }

  private makeGoalTexture(key: string) {
    const w = 600;
    const h = 350;
    const g = this.newGraphics();

    const post = 16;
    const fL = post;
    const fR = w - post;
    const fT = post;
    const fB = h - 8;

    // Back net pocket and side depth.
    g.fillStyle(0x031126, 0.62);
    g.fillRect(fL, fT, fR - fL, fB - fT);
    g.fillStyle(0x0f2448, 0.35);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(fL, fT),
        new Phaser.Math.Vector2(fL + 42, fT + 24),
        new Phaser.Math.Vector2(fL + 42, fB - 20),
        new Phaser.Math.Vector2(fL, fB),
      ],
      true,
    );
    g.fillPoints(
      [
        new Phaser.Math.Vector2(fR, fT),
        new Phaser.Math.Vector2(fR - 42, fT + 24),
        new Phaser.Math.Vector2(fR - 42, fB - 20),
        new Phaser.Math.Vector2(fR, fB),
      ],
      true,
    );
    g.fillStyle(0xffffff, 0.04);
    g.fillEllipse(w / 2, fT + 28, w * 0.72, 38);

    // Diamond mesh net, double-pass for crisp broadcast look.
    g.lineStyle(2.2, 0x06101f, 0.44);
    const step = 20;
    const innerW = fR - fL;
    const innerH = fB - fT;
    const drawNet = (color: number, alpha: number, widthLine: number) => {
      g.lineStyle(widthLine, color, alpha);
      for (let c = -innerW; c <= innerH; c += step) {
        let x1 = fL;
        let y1 = fT + c;
        let x2 = fR;
        let y2 = fT + c + innerW;
        if (y1 < fT) {
          x1 += fT - y1;
          y1 = fT;
        }
        if (y2 > fB) {
          x2 -= y2 - fB;
          y2 = fB;
        }
        if (x1 < fR && x2 > fL && y1 < fB && y2 > fT) {
          g.beginPath();
          g.moveTo(x1, y1);
          g.lineTo(x2, y2);
          g.strokePath();
        }
      }
      for (let c = 0; c <= innerW + innerH; c += step) {
        let x1 = fL;
        let y1 = fT + c;
        let x2 = fR;
        let y2 = fT + c - innerW;
        if (y1 > fB) {
          x1 += y1 - fB;
          y1 = fB;
        }
        if (y2 < fT) {
          x2 -= fT - y2;
          y2 = fT;
        }
        if (x1 < fR && x2 > fL && y1 > fT && y2 < fB) {
          g.beginPath();
          g.moveTo(x1, y1);
          g.lineTo(x2, y2);
          g.strokePath();
        }
      }
    };

    drawNet(0x07101f, 0.5, 2.4);
    drawNet(0xe8f4ff, 0.78, 1.25);

    // Back frame depth lines.
    g.lineStyle(4, 0x9fb3c8, 0.42);
    g.strokeRect(fL + 42, fT + 24, innerW - 84, innerH - 44);
    g.lineStyle(2, 0xffffff, 0.22);
    g.beginPath();
    g.moveTo(fL, fT);
    g.lineTo(fL + 42, fT + 24);
    g.moveTo(fR, fT);
    g.lineTo(fR - 42, fT + 24);
    g.moveTo(fL, fB);
    g.lineTo(fL + 42, fB - 20);
    g.moveTo(fR, fB);
    g.lineTo(fR - 42, fB - 20);
    g.strokePath();

    // Frame: thick beveled white posts with cool shadows.
    g.fillStyle(0x000000, 0.42);
    g.fillRect(fL + 5, fT + post, fR - fL, 7);
    g.fillRect(fL + post + 2, fT + 6, 7, h - fT - 10);
    g.fillRect(fR - post - 9, fT + 6, 7, h - fT - 10);

    g.fillStyle(0xf5f7fb, 1);
    g.fillRect(0, fT, post, h - fT);
    g.fillRect(w - post, fT, post, h - fT);
    g.fillRect(0, 0, w, post);

    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, w, 4);
    g.fillRect(0, fT, 4, h - fT);
    g.fillRect(w - post, fT, 4, h - fT);
    g.fillStyle(0xc7d3df, 1);
    g.fillRect(0, post - 4, w, 4);
    g.fillRect(post - 4, fT, 4, h - fT);
    g.fillRect(w - 4, fT, 4, h - fT);

    g.lineStyle(2, 0x09111c, 0.85);
    g.strokeRect(0, 0, w, post);
    g.strokeRect(0, fT, post, h - fT);
    g.strokeRect(w - post, fT, post, h - fT);

    g.fillStyle(0xd9e2ec, 1);
    g.fillTriangle(post, post, post + 10, post, post, post + 10);
    g.fillTriangle(w - post, post, w - post - 10, post, w - post, post + 10);

    g.fillStyle(0x000000, 0.38);
    g.fillEllipse(w / 2, fB + 1, w * 0.96, 16);
    g.fillStyle(0xffffff, 0.72);
    g.fillRect(fL, fB - 3, fR - fL, 3);
    g.fillStyle(0x7fd29a, 0.4);
    g.fillRect(fL, fB, fR - fL, 2);

    this.commit(g, key, w, h);
  }

  private makeBallTexture(key: string) {
    const s = 64;
    const g = this.newGraphics();
    const c = s / 2;

    // Drop shadow
    g.fillStyle(0x000000, 0.25);
    g.fillCircle(c + 2, c + 3, c - 4);

    // Ball body
    g.fillStyle(0xffffff, 1);
    g.fillCircle(c, c, c - 4);
    g.lineStyle(2, 0x111111, 1);
    g.strokeCircle(c, c, c - 4);

    // Pentagons (stylized)
    g.fillStyle(0x111111, 1);
    g.fillCircle(c, c - 12, 5);
    g.fillCircle(c - 13, c + 4, 4);
    g.fillCircle(c + 13, c + 4, 4);
    g.fillCircle(c - 4, c + 14, 4);
    g.fillCircle(c + 8, c + 14, 3);

    // Connecting lines
    g.lineStyle(1.5, 0x111111, 0.9);
    g.beginPath();
    g.moveTo(c, c - 7);
    g.lineTo(c - 9, c + 2);
    g.moveTo(c, c - 7);
    g.lineTo(c + 9, c + 2);
    g.moveTo(c - 9, c + 2);
    g.lineTo(c - 1, c + 10);
    g.moveTo(c + 9, c + 2);
    g.lineTo(c + 5, c + 11);
    g.strokePath();

    // Highlight
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(c - 8, c - 8, 4);

    this.commit(g, key, s, s);
  }

  private makeCrowdTexture(key: string) {
    const w = 800;
    const h = 350;
    const g = this.newGraphics();

    // Deep stadium bowl.
    g.fillStyle(0x030612, 1);
    g.fillRect(0, 0, w, h);

    g.fillStyle(0x000000, 0.88);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(0, 0),
        new Phaser.Math.Vector2(w, 0),
        new Phaser.Math.Vector2(w, 42),
        new Phaser.Math.Vector2(w * 0.82, 74),
        new Phaser.Math.Vector2(w * 0.5, 88),
        new Phaser.Math.Vector2(w * 0.18, 74),
        new Phaser.Math.Vector2(0, 42),
      ],
      true,
    );

    g.lineStyle(2, 0x2a3d63, 0.55);
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * w;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(w / 2, h * 0.58);
      g.strokePath();
    }

    const tiers = 6;
    const tierH = h / tiers;
    for (let t = 0; t < tiers; t++) {
      const y0 = t * tierH;
      const baseAlpha = 0.22 + t * 0.09;
      g.fillStyle(t % 2 === 0 ? 0x17213e : 0x101a34, baseAlpha);
      g.fillRect(0, y0, w, tierH);

      g.fillStyle(0x000000, 0.78);
      g.fillRect(0, y0, w, 3);
      g.fillStyle(0x657aa5, 0.42);
      g.fillRect(0, y0 + 3, w, 1);

      // Seat row pinstripes.
      g.fillStyle(0x2f416c, 0.2);
      for (let r = 0; r < 4; r++) {
        g.fillRect(0, y0 + 12 + r * 10, w, 1);
      }
    }

    const teamColors = [
      0xffd36a, 0xff5b6e, 0x55c7ff, 0xa7f5b0, 0xf5f7ff, 0xff8c3a, 0x5c6b99, 0xd24f62, 0x39a3d8, 0x23365f, 0x111827,
    ];
    for (let t = 0; t < tiers; t++) {
      const y0 = t * tierH + 4;
      const y1 = (t + 1) * tierH - 2;
      const density = 150 + t * 58;
      const sizeMul = 0.48 + t * 0.16;

      for (let i = 0; i < density; i++) {
        const x = Math.random() * w;
        const y = y0 + Math.random() * (y1 - y0);
        const c = teamColors[Math.floor(Math.random() * teamColors.length)];
        const rowShade = 0.38 + t * 0.06;
        g.fillStyle(c, rowShade + Math.random() * 0.35);
        if (Math.random() < 0.65) {
          g.fillRect(x, y, sizeMul * (1.1 + Math.random()), sizeMul * 1.6);
        } else {
          g.fillCircle(x, y, sizeMul * (0.8 + Math.random() * 1.3));
        }
      }
    }

    // Camera flashes and reflected floodlights.
    for (let i = 0; i < 95; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      g.fillStyle(0xfff8e0, 0.45 + Math.random() * 0.42);
      g.fillCircle(x, y, 0.45 + Math.random() * 1.4);
    }

    // Side bowl vignette.
    for (let i = 0; i < 70; i += 2) {
      const a = (1 - i / 70) * 0.44;
      g.fillStyle(0x000000, a);
      g.fillRect(i, 0, 2, h);
      g.fillRect(w - i - 2, 0, 2, h);
    }

    for (let i = 0; i < 16; i++) {
      g.fillStyle(0x000000, 0.62 - i * 0.036);
      g.fillRect(0, i * 4, w, 5);
    }

    g.fillStyle(0xfff8cc, 0.055);
    g.fillTriangle(w * 0.06, 0, w * 0.3, 0, w * 0.56, h);
    g.fillTriangle(w * 0.7, 0, w * 0.94, 0, w * 0.44, h);

    // Front broadcast rail and shadow.
    g.fillStyle(0x050812, 0.95);
    g.fillRect(0, h - 24, w, 24);
    g.fillStyle(0x7f91bd, 0.55);
    g.fillRect(0, h - 24, w, 2);
    g.fillStyle(0x101b35, 1);
    g.fillRect(0, h - 16, w, 7);
    g.fillStyle(0x9fb8e8, 0.34);
    g.fillRect(0, h - 9, w, 1);

    this.commit(g, key, w, h);
  }

  private makeNetFlashTexture(key: string) {
    const w = 600;
    const h = 300;
    const g = this.newGraphics();

    g.lineStyle(2, 0xffffff, 0.9);
    for (let i = 0; i < 22; i++) {
      g.beginPath();
      g.moveTo(0, (i / 22) * h);
      g.lineTo(w, (i / 22) * h);
      g.strokePath();
    }
    for (let i = 0; i < 32; i++) {
      g.beginPath();
      g.moveTo((i / 32) * w, 0);
      g.lineTo((i / 32) * w, h);
      g.strokePath();
    }

    // Center burst
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(w / 2, h / 2, 80);

    this.commit(g, key, w, h);
  }

  private makeKeeperTexture(key: string) {
    const w = 128;
    const h = 196;
    const g = this.newGraphics();
    const cx = w / 2;

    const SKIN = 0xf3c69a;
    const SKIN_SHADE = 0xd8a376;
    const JERSEY = 0xff9a1f; // orange like ref
    const JERSEY_SHADE = 0xd47410;
    const SHORTS = 0x1a1a1a;
    const SOCK = 0xffffff;
    const BOOT = 0x111111;
    const GLOVE = 0x1a1a1a;
    const GLOVE_ACCENT = 0xff9a1f;
    const OUTLINE = 0x111111;

    // Ground shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, h - 4, 78, 10);

    // ── White socks ────────────────────────────────────────
    g.fillStyle(SOCK, 1);
    g.fillRoundedRect(cx - 26, 158, 18, 28, 4);
    g.fillRoundedRect(cx + 8, 158, 18, 28, 4);
    g.lineStyle(1.5, OUTLINE, 0.85);
    g.strokeRoundedRect(cx - 26, 158, 18, 28, 4);
    g.strokeRoundedRect(cx + 8, 158, 18, 28, 4);

    // ── Boots ──────────────────────────────────────────────
    g.fillStyle(BOOT, 1);
    g.fillRoundedRect(cx - 30, 184, 26, 10, 4);
    g.fillRoundedRect(cx + 4, 184, 26, 10, 4);
    g.lineStyle(1.5, OUTLINE, 0.9);
    g.strokeRoundedRect(cx - 30, 184, 26, 10, 4);
    g.strokeRoundedRect(cx + 4, 184, 26, 10, 4);

    // ── Shorts (black) ─────────────────────────────────────
    g.fillStyle(SHORTS, 1);
    g.fillRoundedRect(cx - 34, 124, 68, 40, 6);
    g.fillStyle(0xffffff, 0.07);
    g.fillRoundedRect(cx - 34, 124, 68, 8, 6);
    g.lineStyle(1.8, OUTLINE, 1);
    g.strokeRoundedRect(cx - 34, 124, 68, 40, 6);

    // ── Jersey (orange) ────────────────────────────────────
    // Body
    g.fillStyle(JERSEY, 1);
    g.fillRoundedRect(cx - 36, 58, 72, 72, 10);
    // Shade band bottom
    g.fillStyle(JERSEY_SHADE, 1);
    g.fillRoundedRect(cx - 36, 116, 72, 14, 10);
    // Outline
    g.lineStyle(2, OUTLINE, 1);
    g.strokeRoundedRect(cx - 36, 58, 72, 72, 10);

    // Collar (v-neck)
    g.fillStyle(OUTLINE, 1);
    g.fillTriangle(cx - 8, 58, cx + 8, 58, cx, 70);
    g.fillStyle(SKIN, 1);
    g.fillTriangle(cx - 5, 60, cx + 5, 60, cx, 67);

    // ── Arms out (ready position) ──────────────────────────
    // Upper arm
    g.fillStyle(JERSEY, 1);
    g.fillRoundedRect(cx - 54, 64, 18, 36, 6);
    g.fillRoundedRect(cx + 36, 64, 18, 36, 6);
    g.lineStyle(1.8, OUTLINE, 1);
    g.strokeRoundedRect(cx - 54, 64, 18, 36, 6);
    g.strokeRoundedRect(cx + 36, 64, 18, 36, 6);
    // Forearm skin
    g.fillStyle(SKIN, 1);
    g.fillRoundedRect(cx - 54, 98, 18, 14, 5);
    g.fillRoundedRect(cx + 36, 98, 18, 14, 5);
    g.lineStyle(1.5, OUTLINE, 0.9);
    g.strokeRoundedRect(cx - 54, 98, 18, 14, 5);
    g.strokeRoundedRect(cx + 36, 98, 18, 14, 5);

    // ── Gloves (dark with orange accent) ───────────────────
    const drawGlove = (gx: number) => {
      g.fillStyle(GLOVE, 1);
      g.fillRoundedRect(gx - 13, 108, 26, 22, 6);
      // Fingers — 4 stubs
      for (let i = 0; i < 4; i++) {
        g.fillRoundedRect(gx - 11 + i * 6, 100, 5, 12, 2);
      }
      // Thumb
      g.fillRoundedRect(gx - 16, 114, 7, 12, 3);
      // Orange wrist band
      g.fillStyle(GLOVE_ACCENT, 1);
      g.fillRect(gx - 13, 106, 26, 4);
      // Outline
      g.lineStyle(1.5, OUTLINE, 1);
      g.strokeRoundedRect(gx - 13, 108, 26, 22, 6);
    };
    drawGlove(cx - 45);
    drawGlove(cx + 45);

    // ── Head ───────────────────────────────────────────────
    // Neck
    g.fillStyle(SKIN_SHADE, 1);
    g.fillRect(cx - 6, 48, 12, 10);
    // Face
    g.fillStyle(SKIN, 1);
    g.fillCircle(cx, 32, 18);
    g.lineStyle(1.8, OUTLINE, 1);
    g.strokeCircle(cx, 32, 18);
    // Hair (top)
    g.fillStyle(0x3a2410, 1);
    g.fillCircle(cx, 22, 18);
    g.fillRect(cx - 18, 22, 36, 6);
    g.lineStyle(1.5, OUTLINE, 0.9);
    g.strokeCircle(cx, 22, 18);
    // Ears
    g.fillStyle(SKIN, 1);
    g.fillCircle(cx - 17, 33, 3);
    g.fillCircle(cx + 17, 33, 3);
    // Eyes
    g.fillStyle(OUTLINE, 1);
    g.fillCircle(cx - 6, 32, 1.6);
    g.fillCircle(cx + 6, 32, 1.6);
    // Smile
    g.lineStyle(1.5, OUTLINE, 1);
    g.beginPath();
    g.arc(cx, 38, 4, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
    g.strokePath();

    this.commit(g, key, w, h);
  }

  private makeBallTrailTexture(key: string) {
    const s = 32;
    const g = this.newGraphics();
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(s / 2, s / 2, s / 2 - 2);
    this.commit(g, key, s, s);
  }
}
