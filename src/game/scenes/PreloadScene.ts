import Phaser from "phaser";

const IMAGE_KEYS = ["bg", "goal", "ball", "crowd", "net_flash"] as const;
const SPRITESHEET_KEYS = ["keeper"] as const;

export class PreloadScene extends Phaser.Scene {
  private failedImages = new Set<string>();
  private failedAudio = new Set<string>();

  constructor() {
    super({ key: "PreloadScene" });
  }

  preload() {
    const { width, height } = this.scale;

    const track = this.add.rectangle(width / 2, height / 2, 280, 8, 0x1a1a2e);
    const bar = this.add
      .rectangle(width / 2 - 140, height / 2, 0, 8, 0x00e676)
      .setOrigin(0, 0.5);

    const label = this.add
      .text(width / 2, height / 2 - 28, "Loading...", {
        fontSize: "13px",
        color: "#888888",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5);

    const percentText = this.add
      .text(width / 2, height / 2 + 24, "0%", {
        fontSize: "16px",
        fontStyle: "bold",
        color: "#00e676",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5);

    this.load.on("progress", (v: number) => {
      bar.width = 280 * v;
      percentText.setText(`${Math.round(v * 100)}%`);
    });
    this.load.on("complete", () => {
      track.destroy();
      bar.destroy();
      label.destroy();
      percentText.destroy();
    });
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      if (file.type === "image" || file.type === "spritesheet") {
        this.failedImages.add(file.key);
      } else if (file.type === "audio") {
        this.failedAudio.add(file.key);
      }
    });

    this.load.image("bg", "/assets/images/background.png");
    this.load.image("goal", "/assets/images/goal.png");
    this.load.svg("ball", "/assets/images/ball.svg", { width: 128, height: 128 });
    this.load.image("crowd", "/assets/images/crowd.png");
    this.load.image("net_flash", "/assets/images/net_flash.png");

    this.load.spritesheet("keeper", "/assets/images/keeper.png", {
      frameWidth: 128,
      frameHeight: 196,
    });

    this.load.audio("crowd", "/assets/audio/crowd_ambient.mp3");
    this.load.audio("kick", "/assets/audio/kick.mp3");
    this.load.audio("goal", "/assets/audio/goal.mp3");
    this.load.audio("save", "/assets/audio/save.mp3");
    this.load.audio("miss", "/assets/audio/miss.mp3");
    this.load.audio("whistle", "/assets/audio/whistle.mp3");
  }

  create() {
    this.generatePlaceholderTextures();
    this.makeBallTrailTexture("ball_trail");
    this.registry.set("missingAudio", this.failedAudio);
    this.scene.start("GameScene");
  }

  private generatePlaceholderTextures() {
    const drawers: Record<string, () => void> = {
      bg: () => this.makeBackgroundTexture("bg"),
      goal: () => this.makeGoalTexture("goal"),
      ball: () => this.makeBallTexture("ball"),
      crowd: () => this.makeCrowdTexture("crowd"),
      net_flash: () => this.makeNetFlashTexture("net_flash"),
      keeper: () => this.makeKeeperTexture("keeper"),
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

    // Sky gradient (stepped)
    const sky = [0x040a1a, 0x081230, 0x102044, 0x1a3268, 0x2a4d8a];
    const skyH = h * 0.55;
    const band = skyH / sky.length;
    sky.forEach((c, i) => {
      g.fillStyle(c, 1);
      g.fillRect(0, i * band, w, band + 1);
    });

    // Floodlight haze
    g.fillStyle(0xffffaa, 0.05);
    g.fillCircle(w * 0.2, skyH * 0.3, 90);
    g.fillCircle(w * 0.8, skyH * 0.3, 90);

    // Stadium silhouette band
    g.fillStyle(0x000814, 0.85);
    g.fillRect(0, skyH * 0.82, w, skyH * 0.18);

    // Grass — alternating mowed stripes
    const grassA = 0x0a5e1a;
    const grassB = 0x086018;
    const grassH = h - skyH;
    const stripes = 14;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle(i % 2 === 0 ? grassA : grassB, 1);
      g.fillRect(0, skyH + i * (grassH / stripes), w, grassH / stripes + 1);
    }

    // Penalty spot
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(w / 2, h * 0.78, 4);

    // Field horizon glow
    g.fillStyle(0x00e676, 0.06);
    g.fillRect(0, skyH - 4, w, 8);

    this.commit(g, key, w, h);
  }

  private makeGoalTexture(key: string) {
    const w = 600;
    const h = 350;
    const g = this.newGraphics();

    const post = 14;
    const fL = post;
    const fR = w - post;
    const fT = post;
    const fB = h - 4;

    // Soft dark interior so net pattern reads
    g.fillStyle(0x0a1830, 0.35);
    g.fillRect(fL, fT, fR - fL, fB - fT);

    // ── Diamond mesh net (rotated grid clipped to goal rect) ──
    g.lineStyle(1.4, 0xffffff, 0.75);
    const step = 18;
    const innerW = fR - fL;
    const innerH = fB - fT;
    // Diagonals going down-right (y = x + c)
    for (let c = -innerW; c <= innerH; c += step) {
      let x1 = fL;
      let y1 = fT + c + (fL - fL);
      let x2 = fR;
      let y2 = fT + c + (fR - fL);
      // clip to box
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
    // Diagonals going down-left (y = -x + c)
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

    // ── Frame (flat cartoon white posts + crossbar) ──
    // Drop shadow under crossbar/posts
    g.fillStyle(0x000000, 0.25);
    g.fillRect(fL + 3, fT + post + 1, fR - fL, 3);
    g.fillRect(fL + post + 1, fT + 3, 4, h - fT);
    g.fillRect(fR - post - 5, fT + 3, 4, h - fT);

    // Posts
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, fT, post, h - fT);
    g.fillRect(w - post, fT, post, h - fT);
    // Crossbar
    g.fillRect(0, 0, w, post);

    // Outline (cartoon stroke)
    g.lineStyle(2, 0x1a1a1a, 0.85);
    g.strokeRect(0, 0, w, post);
    g.strokeRect(0, fT, post, h - fT);
    g.strokeRect(w - post, fT, post, h - fT);

    // Subtle inner highlight
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(2, fT + 2, 2, h - fT - 4);
    g.fillRect(w - 4, fT + 2, 2, h - fT - 4);
    g.fillRect(2, 2, w - 4, 2);

    // Ground stripe at base of goal
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(fL, fB - 2, fR - fL, 2);

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

    g.fillStyle(0x05070d, 1);
    g.fillRect(0, 0, w, h);

    // Rows of crowd dots (denser farther down)
    const colors = [0xffcc66, 0xff6677, 0x66ccff, 0xaaffaa, 0xffffff, 0xff9933];
    const rows = 60;
    for (let r = 0; r < rows; r++) {
      const y = (r / rows) * h;
      const density = 18 + r * 0.6;
      for (let i = 0; i < density; i++) {
        const x = (i / density) * w + (Math.random() - 0.5) * 12;
        const jitter = (Math.random() - 0.5) * 4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        g.fillStyle(color, 0.35 + Math.random() * 0.4);
        g.fillCircle(x, y + jitter, Math.random() * 1.4 + 0.8);
      }
    }

    // Top lighting falloff
    g.fillStyle(0x000000, 0.45);
    g.fillRect(0, 0, w, h * 0.25);

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
