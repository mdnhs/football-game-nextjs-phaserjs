import Phaser from "phaser";
import type { AimDirection } from "@/types/game";

const COLORS = {
  SKIN: 0xf6cda5,
  SKIN_SHADE: 0xd8a376,
  SKIN_BLUSH: 0xff9a9a,
  JERSEY: 0xfcc419,
  JERSEY_SHADE: 0xd99e0a,
  JERSEY_DARK: 0xb77d05,
  JERSEY_LIGHT: 0xffe066,
  JERSEY_TRIM: 0xffffff,
  SHORTS: 0x2b2f3a,
  SHORTS_HL: 0x40454f,
  SHORTS_SHADOW: 0x151922,
  SOCK: 0xfcc419,
  SOCK_BAND: 0x2b2f3a,
  SOCK_STRIPE: 0x40454f,
  BOOT: 0xfcc419,
  BOOT_HL: 0xe6a800,
  BOOT_DETAIL: 0x2b2f3a,
  GLOVE: 0x2b2f3a,
  GLOVE_PALM: 0x6a7180,
  GLOVE_BAND: 0xfcc419,
  GLOVE_HL: 0x9aa3b5,
  HAIR: 0x1a1410,
  HAIR_HL: 0x4a3a2a,
  OUTLINE: 0x1a1410,
  BROW: 0x1a1410,
  EYE: 0x1a1410,
  MOUTH: 0x4a2010,
};

const NATURAL_HEIGHT = 230;
const DEG = (d: number) => Phaser.Math.DegToRad(d);

type Expression = "idle" | "focus" | "happy" | "sad" | "shout";

export class Goalkeeper {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  private shadow!: Phaser.GameObjects.Ellipse;
  private body!: Phaser.GameObjects.Graphics;

  // Head rig
  private head!: Phaser.GameObjects.Container;
  private headShape!: Phaser.GameObjects.Graphics;
  private hair!: Phaser.GameObjects.Graphics;
  private leftBrow!: Phaser.GameObjects.Graphics;
  private rightBrow!: Phaser.GameObjects.Graphics;
  private leftEye!: Phaser.GameObjects.Ellipse;
  private rightEye!: Phaser.GameObjects.Ellipse;
  private mouth!: Phaser.GameObjects.Graphics;

  // Arm rig (upper arm container, forearm container nested)
  private leftUpperArm!: Phaser.GameObjects.Container;
  private leftForearm!: Phaser.GameObjects.Container;
  private rightUpperArm!: Phaser.GameObjects.Container;
  private rightForearm!: Phaser.GameObjects.Container;

  // Leg rig (thigh container, shin container nested)
  private leftThigh!: Phaser.GameObjects.Container;
  private leftShin!: Phaser.GameObjects.Container;
  private rightThigh!: Phaser.GameObjects.Container;
  private rightShin!: Phaser.GameObjects.Container;

  private startX: number;
  private startY: number;
  private baseScale: number;

  private leftArmIdle = DEG(48);
  private rightArmIdle = DEG(-48);
  private leftElbowIdle = DEG(-8);
  private rightElbowIdle = DEG(8);

  constructor(scene: Phaser.Scene, x: number, y: number, height = NATURAL_HEIGHT) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;
    this.baseScale = height / NATURAL_HEIGHT;

    this.container = scene.add.container(x, y).setDepth(13);
    this.container.setScale(this.baseScale);

    this.shadow = scene.add.ellipse(0, 4, 108, 16, 0x000000, 0.48);
    this.container.add(this.shadow);

    this.buildLegs();
    this.buildBody();
    this.buildHead();
    this.buildArms();

    this.setExpression("idle");
    this.startIdle();
  }

  // ── BUILD ─────────────────────────────────────────────────

  private buildLegs() {
    this.leftThigh = this.makeJointContainer(-13, -102);
    this.drawThigh(this.addGraphicsTo(this.leftThigh));
    this.leftShin = this.makeJointContainer(0, 50);
    this.drawShin(this.addGraphicsTo(this.leftShin));
    this.leftThigh.add(this.leftShin);

    this.rightThigh = this.makeJointContainer(13, -102);
    this.drawThigh(this.addGraphicsTo(this.rightThigh));
    this.rightShin = this.makeJointContainer(0, 50);
    this.drawShin(this.addGraphicsTo(this.rightShin));
    this.rightThigh.add(this.rightShin);

    this.container.add([this.leftThigh, this.rightThigh]);
  }

  private buildBody() {
    this.body = this.scene.add.graphics();
    this.drawBody(this.body);
    this.container.add(this.body);
  }

  private buildHead() {
    this.head = this.scene.add.container(0, -174);

    this.hair = this.scene.add.graphics();
    this.drawHair(this.hair);

    this.headShape = this.scene.add.graphics();
    this.drawHeadShape(this.headShape);

    this.leftBrow = this.scene.add.graphics();
    this.rightBrow = this.scene.add.graphics();

    this.leftEye = this.scene.add.ellipse(-6.5, -10.5, 3.2, 4.1, COLORS.EYE);
    this.rightEye = this.scene.add.ellipse(6.5, -10.5, 3.2, 4.1, COLORS.EYE);
    const leftHL = this.scene.add.ellipse(-5.9, -11.5, 1.2, 1.2, 0xffffff);
    const rightHL = this.scene.add.ellipse(7.1, -11.5, 1.2, 1.2, 0xffffff);

    this.mouth = this.scene.add.graphics();

    this.head.add([
      this.hair,
      this.headShape,
      this.leftBrow,
      this.rightBrow,
      this.leftEye,
      this.rightEye,
      leftHL,
      rightHL,
      this.mouth,
    ]);

    this.container.add(this.head);
  }

  private buildArms() {
    this.leftUpperArm = this.makeJointContainer(-37, -160);
    this.drawUpperArm(this.addGraphicsTo(this.leftUpperArm));
    this.leftForearm = this.makeJointContainer(0, 34);
    this.drawForearm(this.addGraphicsTo(this.leftForearm));
    this.leftUpperArm.add(this.leftForearm);
    this.leftUpperArm.setRotation(this.leftArmIdle);
    this.leftForearm.setRotation(this.leftElbowIdle);

    this.rightUpperArm = this.makeJointContainer(37, -160);
    this.drawUpperArm(this.addGraphicsTo(this.rightUpperArm));
    this.rightForearm = this.makeJointContainer(0, 34);
    this.drawForearm(this.addGraphicsTo(this.rightForearm));
    this.rightUpperArm.add(this.rightForearm);
    this.rightUpperArm.setRotation(this.rightArmIdle);
    this.rightForearm.setRotation(this.rightElbowIdle);

    this.container.add([this.leftUpperArm, this.rightUpperArm]);
  }

  private makeJointContainer(x: number, y: number) {
    return this.scene.add.container(x, y);
  }

  private addGraphicsTo(c: Phaser.GameObjects.Container) {
    const g = this.scene.add.graphics();
    c.add(g);
    return g;
  }

  // ── DRAW PRIMITIVES ───────────────────────────────────────

  private drawThigh(g: Phaser.GameObjects.Graphics) {
    // Tapered thigh with stronger athletic shape.
    const thighPts = [
      new Phaser.Math.Vector2(-11, 14),
      new Phaser.Math.Vector2(11, 14),
      new Phaser.Math.Vector2(12, 48),
      new Phaser.Math.Vector2(-9, 50),
    ];
    g.fillStyle(COLORS.SKIN, 1);
    g.fillPoints(thighPts, true);
    g.lineStyle(1.5, COLORS.OUTLINE, 0.9);
    g.strokePoints(thighPts, true);

    g.fillStyle(0xffffff, 0.16);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-9, 17),
        new Phaser.Math.Vector2(-4, 16),
        new Phaser.Math.Vector2(-2, 47),
        new Phaser.Math.Vector2(-8, 49),
      ],
      true,
    );

    g.fillStyle(COLORS.SKIN_SHADE, 0.5);
    g.fillPoints([
      new Phaser.Math.Vector2(5, 20),
      new Phaser.Math.Vector2(10, 20),
      new Phaser.Math.Vector2(12, 50),
      new Phaser.Math.Vector2(6, 50),
    ], true);

    g.fillStyle(COLORS.SKIN_SHADE, 0.5);
    g.fillEllipse(0, 49, 20, 5);
    g.fillStyle(0xffffff, 0.18);
    g.fillEllipse(-4, 47, 8, 2);
  }

  private drawShin(g: Phaser.GameObjects.Graphics) {
    // Tapered sock from knee to ankle.
    const sockPts = [
      new Phaser.Math.Vector2(-12, 0),
      new Phaser.Math.Vector2(12, 0),
      new Phaser.Math.Vector2(8, 40),
      new Phaser.Math.Vector2(-8, 40),
    ];
    g.fillStyle(COLORS.SOCK, 1);
    g.fillPoints(sockPts, true);
    g.lineStyle(1.5, COLORS.OUTLINE, 0.9);
    g.strokePoints(sockPts, true);
    // Top sock band (dark)
    g.fillStyle(COLORS.SOCK_BAND, 1);
    g.fillRect(-12, 2, 24, 6);
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(-10, 9, 4, 27);
    // Diagonal sock stripes (Adidas-style 3 stripes)
    g.fillStyle(COLORS.SOCK_BAND, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-10, 16),
        new Phaser.Math.Vector2(-7, 16),
        new Phaser.Math.Vector2(-7, 30),
        new Phaser.Math.Vector2(-10, 30),
      ],
      true,
    );
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-3, 16),
        new Phaser.Math.Vector2(0, 16),
        new Phaser.Math.Vector2(0, 30),
        new Phaser.Math.Vector2(-3, 30),
      ],
      true,
    );
    g.fillPoints(
      [
        new Phaser.Math.Vector2(4, 16),
        new Phaser.Math.Vector2(7, 16),
        new Phaser.Math.Vector2(7, 30),
        new Phaser.Math.Vector2(4, 30),
      ],
      true,
    );
    // Side calf shading and ribbed sock texture.
    g.fillStyle(COLORS.JERSEY_SHADE, 0.35);
    g.fillRect(6, 14, 4, 22);
    g.lineStyle(0.8, COLORS.SOCK_BAND, 0.16);
    for (let y = 12; y <= 36; y += 6) {
      g.beginPath();
      g.moveTo(-8, y);
      g.lineTo(8, y);
      g.strokePath();
    }

    // Boot - curved football boot with toe and sole.
    const bootPts = [
      new Phaser.Math.Vector2(-10, 37),
      new Phaser.Math.Vector2(10, 37),
      new Phaser.Math.Vector2(18, 44),
      new Phaser.Math.Vector2(17, 52),
      new Phaser.Math.Vector2(-15, 52),
      new Phaser.Math.Vector2(-15, 45),
    ];
    g.fillStyle(COLORS.BOOT, 1);
    g.fillPoints(bootPts, true);
    g.lineStyle(1.5, COLORS.OUTLINE, 0.95);
    g.strokePoints(bootPts, true);
    // Dark side stripes (brand detail)
    g.fillStyle(COLORS.BOOT_DETAIL, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-6, 43),
        new Phaser.Math.Vector2(-2, 43),
        new Phaser.Math.Vector2(-3, 50),
        new Phaser.Math.Vector2(-7, 50),
      ],
      true,
    );
    g.fillPoints(
      [
        new Phaser.Math.Vector2(0, 43),
        new Phaser.Math.Vector2(4, 43),
        new Phaser.Math.Vector2(3, 50),
        new Phaser.Math.Vector2(-1, 50),
      ],
      true,
    );
    g.fillPoints(
      [
        new Phaser.Math.Vector2(6, 43),
        new Phaser.Math.Vector2(10, 43),
        new Phaser.Math.Vector2(9, 50),
        new Phaser.Math.Vector2(5, 50),
      ],
      true,
    );
    // Boot tongue/top shadow
    g.fillStyle(COLORS.BOOT_HL, 1);
    g.fillRect(-9, 38, 18, 3);
    g.fillStyle(0xffffff, 0.18);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-8, 40),
        new Phaser.Math.Vector2(4, 40),
        new Phaser.Math.Vector2(0, 45),
        new Phaser.Math.Vector2(-10, 45),
      ],
      true,
    );
    // Toe shine
    g.fillStyle(0xffffff, 0.25);
    g.fillEllipse(10, 47, 8, 2);
    // Dark sole
    g.fillStyle(COLORS.BOOT_DETAIL, 1);
    g.fillRect(-13, 52, 30, 2);
  }

  private drawBody(g: Phaser.GameObjects.Graphics) {
    // Athletic keeper jersey: broad shoulders, fitted waist, fabric panels.
    const torsoPts = [
      new Phaser.Math.Vector2(-44, -168),
      new Phaser.Math.Vector2(44, -168),
      new Phaser.Math.Vector2(38, -132),
      new Phaser.Math.Vector2(30, -99),
      new Phaser.Math.Vector2(-30, -99),
      new Phaser.Math.Vector2(-38, -132),
    ];
    g.fillStyle(COLORS.OUTLINE, 0.28);
    g.fillEllipse(0, -119, 78, 86);
    g.fillStyle(COLORS.JERSEY, 1);
    g.fillPoints(torsoPts, true);
    g.lineStyle(2, COLORS.OUTLINE, 1);
    g.strokePoints(torsoPts, true);

    // Shoulder caps and chest volume.
    g.fillStyle(COLORS.JERSEY_LIGHT, 0.48);
    g.fillEllipse(-23, -155, 28, 12);
    g.fillStyle(COLORS.JERSEY_DARK, 0.28);
    g.fillEllipse(24, -154, 28, 12);

    // Left light panel.
    g.fillStyle(COLORS.JERSEY_LIGHT, 0.45);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-33, -166),
        new Phaser.Math.Vector2(-20, -166),
        new Phaser.Math.Vector2(-14, -100),
        new Phaser.Math.Vector2(-27, -100),
      ],
      true,
    );

    // Right shadow panel.
    g.fillStyle(COLORS.JERSEY_SHADE, 0.55);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(35, -166),
        new Phaser.Math.Vector2(22, -166),
        new Phaser.Math.Vector2(15, -100),
        new Phaser.Math.Vector2(29, -100),
      ],
      true,
    );

    // Fabric folds down the body.
    g.lineStyle(1, COLORS.JERSEY_DARK, 0.28);
    for (const x of [-18, -6, 8, 20]) {
      g.beginPath();
      g.moveTo(x, -158);
      g.lineTo(x * 0.62, -106);
      g.strokePath();
    }
    g.lineStyle(1, 0xffffff, 0.18);
    g.beginPath();
    g.moveTo(-2, -160);
    g.lineTo(-5, -108);
    g.strokePath();

    // Shoulder chevrons — two parallel white diagonal stripes on each shoulder
    g.fillStyle(COLORS.JERSEY_TRIM, 1);
    // Left shoulder chevrons (drawn as rotated thin rects via polygon)
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-36, -160),
        new Phaser.Math.Vector2(-30, -162),
        new Phaser.Math.Vector2(-14, -148),
        new Phaser.Math.Vector2(-18, -144),
      ],
      true,
    );
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-32, -152),
        new Phaser.Math.Vector2(-26, -154),
        new Phaser.Math.Vector2(-12, -140),
        new Phaser.Math.Vector2(-16, -136),
      ],
      true,
    );
    // Right shoulder chevrons (mirrored)
    g.fillPoints(
      [
        new Phaser.Math.Vector2(36, -160),
        new Phaser.Math.Vector2(30, -162),
        new Phaser.Math.Vector2(14, -148),
        new Phaser.Math.Vector2(18, -144),
      ],
      true,
    );
    g.fillPoints(
      [
        new Phaser.Math.Vector2(32, -152),
        new Phaser.Math.Vector2(26, -154),
        new Phaser.Math.Vector2(12, -140),
        new Phaser.Math.Vector2(16, -136),
      ],
      true,
    );

    // Lower hem and subtle elastic crease.
    g.fillStyle(COLORS.JERSEY_DARK, 0.7);
    g.fillRect(-30, -105, 60, 2);
    g.fillStyle(0xffffff, 0.14);
    g.fillRect(-27, -102, 54, 1);

    // ── Chest shield crest (right side from viewer = player's left chest) ──
    const crestX = 15;
    const crestY = -140;
    // Shield outer (white)
    const shieldPts = [
      new Phaser.Math.Vector2(crestX - 7, crestY - 8),
      new Phaser.Math.Vector2(crestX + 7, crestY - 8),
      new Phaser.Math.Vector2(crestX + 7, crestY + 2),
      new Phaser.Math.Vector2(crestX, crestY + 8),
      new Phaser.Math.Vector2(crestX - 7, crestY + 2),
    ];
    g.fillStyle(COLORS.JERSEY_TRIM, 1);
    g.fillPoints(shieldPts, true);
    g.lineStyle(1, COLORS.OUTLINE, 0.6);
    g.strokePoints(shieldPts, true);
    // Inner shield detail
    g.fillStyle(COLORS.JERSEY, 1);
    g.fillRect(crestX - 4, crestY - 5, 8, 8);
    g.fillStyle(COLORS.JERSEY_TRIM, 1);
    g.fillRect(crestX - 1, crestY - 5, 2, 8);

    // V-neck collar with black undershirt.
    g.fillStyle(COLORS.OUTLINE, 0.9);
    g.fillTriangle(-16, -169, 16, -169, 0, -149);
    g.fillStyle(COLORS.JERSEY_SHADE, 1);
    g.fillTriangle(-13, -169, 13, -169, 0, -151);
    g.fillStyle(COLORS.SKIN, 1);
    g.fillTriangle(-7, -168, 7, -168, 0, -157);
    g.lineStyle(1.2, COLORS.OUTLINE, 0.8);
    g.strokeTriangle(-13, -169, 13, -169, 0, -151);

    // Shorts with center seam and side panels.
    const shortsPts = [
      new Phaser.Math.Vector2(-32, -101),
      new Phaser.Math.Vector2(32, -101),
      new Phaser.Math.Vector2(36, -64),
      new Phaser.Math.Vector2(9, -61),
      new Phaser.Math.Vector2(4, -55),
      new Phaser.Math.Vector2(-4, -55),
      new Phaser.Math.Vector2(-9, -61),
      new Phaser.Math.Vector2(-36, -64),
    ];
    g.fillStyle(COLORS.SHORTS, 1);
    g.fillPoints(shortsPts, true);
    g.lineStyle(1.5, COLORS.OUTLINE, 1);
    g.strokePoints(shortsPts, true);

    g.fillStyle(COLORS.SHORTS_SHADOW, 0.62);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(3, -99),
        new Phaser.Math.Vector2(31, -99),
        new Phaser.Math.Vector2(34, -65),
        new Phaser.Math.Vector2(9, -62),
        new Phaser.Math.Vector2(4, -56),
      ],
      true,
    );
    g.lineStyle(1, 0xffffff, 0.12);
    g.beginPath();
    g.moveTo(0, -99);
    g.lineTo(0, -57);
    g.strokePath();

    g.fillStyle(COLORS.JERSEY, 0.9);
    g.fillRect(-33, -97, 3, 31);
    g.fillRect(30, -97, 3, 31);
    g.fillStyle(0xffffff, 0.08);
    g.fillRect(-28, -98, 6, 32);
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(-30, -100, 60, 2);
  }

  private drawHair(g: Phaser.GameObjects.Graphics) {
    // Short side-part haircut, less cartoon-spiky.
    const hairPts = [
      new Phaser.Math.Vector2(-16, -16),
      new Phaser.Math.Vector2(-18, -23),
      new Phaser.Math.Vector2(-14, -30),
      new Phaser.Math.Vector2(-6, -35),
      new Phaser.Math.Vector2(4, -35),
      new Phaser.Math.Vector2(13, -31),
      new Phaser.Math.Vector2(18, -23),
      new Phaser.Math.Vector2(17, -15),
      new Phaser.Math.Vector2(8, -13),
      new Phaser.Math.Vector2(-5, -14),
    ];
    g.fillStyle(COLORS.HAIR, 1);
    g.fillPoints(hairPts, true);
    g.lineStyle(1.5, COLORS.OUTLINE, 0.95);
    g.strokePoints(hairPts, true);

    // Combed front sweep.
    const sweepPts = [
      new Phaser.Math.Vector2(-15, -24),
      new Phaser.Math.Vector2(-5, -30),
      new Phaser.Math.Vector2(9, -29),
      new Phaser.Math.Vector2(15, -23),
      new Phaser.Math.Vector2(8, -21),
      new Phaser.Math.Vector2(-5, -22),
    ];
    g.fillStyle(COLORS.HAIR, 1);
    g.fillPoints(sweepPts, true);
    g.lineStyle(1.3, COLORS.OUTLINE, 0.95);
    g.strokePoints(sweepPts, true);

    // Highlight strands
    g.fillStyle(COLORS.HAIR_HL, 0.7);
    g.fillEllipse(-6, -28, 7, 2);
    g.fillEllipse(5, -29, 8, 2);
    g.fillEllipse(12, -24, 4, 1.5);

    g.fillStyle(0x000000, 0.4);
    g.fillRect(-13, -15, 28, 1.2);
  }

  private drawHeadShape(g: Phaser.GameObjects.Graphics) {
    // Head with cheek planes, ears, nose bridge, and neck.
    g.fillStyle(COLORS.OUTLINE, 1);
    g.fillEllipse(0, -10, 32, 39);
    g.fillStyle(COLORS.SKIN, 1);
    g.fillEllipse(0, -10, 30, 37);

    g.fillStyle(COLORS.SKIN_SHADE, 0.45);
    g.fillEllipse(8, -8, 13, 29);
    g.fillStyle(0xffffff, 0.14);
    g.fillEllipse(-7, -15, 8, 13);
    g.fillStyle(COLORS.SKIN_SHADE, 0.4);
    g.fillEllipse(0, 4, 22, 6);

    // Ears
    g.fillStyle(COLORS.OUTLINE, 1);
    g.fillEllipse(-15, -10, 6, 9);
    g.fillEllipse(15, -10, 6, 9);
    g.fillStyle(COLORS.SKIN, 1);
    g.fillEllipse(-15, -10, 4.5, 7.5);
    g.fillEllipse(15, -10, 4.5, 7.5);
    g.fillStyle(COLORS.SKIN_SHADE, 0.85);
    g.fillEllipse(-15, -9, 2, 4);
    g.fillEllipse(15, -9, 2, 4);

    g.fillStyle(COLORS.SKIN_BLUSH, 0.22);
    g.fillEllipse(-9, 0, 6, 3);
    g.fillEllipse(9, 0, 6, 3);

    // Nose bridge and nostril shadow.
    g.lineStyle(1, COLORS.SKIN_SHADE, 0.6);
    g.beginPath();
    g.moveTo(1, -11);
    g.lineTo(2, -4);
    g.strokePath();
    g.fillStyle(COLORS.SKIN_SHADE, 0.6);
    g.fillTriangle(-2, -8, 2, -8, 0, -1);
    g.fillStyle(COLORS.SKIN_SHADE, 0.4);
    g.fillEllipse(0, -1, 3, 1.5);

    g.fillStyle(COLORS.SKIN_SHADE, 1);
    g.fillRoundedRect(-7, 7, 14, 11, 3);
    g.fillStyle(0x000000, 0.2);
    g.fillRect(-7, 8, 14, 2);
    g.fillStyle(COLORS.OUTLINE, 1);
    g.fillRect(-7, 7, 14, 1);
    g.fillRect(7, 8, 1, 8);
    g.fillRect(-8, 8, 1, 8);
  }

  // ── EXPRESSIONS ──────────────────────────────────────────

  private setExpression(type: Expression) {
    this.leftBrow.clear();
    this.rightBrow.clear();
    this.mouth.clear();

    const drawBrow = (
      g: Phaser.GameObjects.Graphics,
      cx: number,
      cy: number,
      rotDeg: number,
    ) => {
      g.save();
      g.translateCanvas(cx, cy);
      g.rotateCanvas(DEG(rotDeg));
      g.fillStyle(COLORS.BROW, 1);
      g.fillRect(-5, -1.4, 10, 2.8);
      g.restore();
    };

    if (type === "idle") {
      // Slight raised brows + confident smile with teeth
      drawBrow(this.leftBrow, -7, -17, -8);
      drawBrow(this.rightBrow, 7, -17, 8);
      this.mouth.lineStyle(1.8, COLORS.MOUTH, 1);
      this.mouth.beginPath();
      this.mouth.arc(0, -3, 6, DEG(18), DEG(162), false);
      this.mouth.strokePath();
      // Teeth
      this.mouth.fillStyle(0xffffff, 1);
      this.mouth.fillRect(-4, -1, 8, 2);
      this.mouth.fillStyle(COLORS.MOUTH, 0.55);
      this.mouth.fillRect(-4, -1, 8, 0.5);
    } else if (type === "focus") {
      drawBrow(this.leftBrow, -7, -15, 18);
      drawBrow(this.rightBrow, 7, -15, -18);
      this.mouth.lineStyle(1.6, COLORS.MOUTH, 1);
      this.mouth.lineBetween(-4, -2, 4, -2);
    } else if (type === "happy") {
      drawBrow(this.leftBrow, -7, -19, -10);
      drawBrow(this.rightBrow, 7, -19, 10);
      // Big smile
      this.mouth.lineStyle(2, COLORS.MOUTH, 1);
      this.mouth.beginPath();
      this.mouth.arc(0, -4, 7, DEG(15), DEG(165), false);
      this.mouth.strokePath();
      // Teeth
      this.mouth.fillStyle(0xffffff, 1);
      this.mouth.fillRect(-4.5, -1, 9, 2.5);
      this.mouth.fillStyle(COLORS.MOUTH, 0.6);
      this.mouth.fillRect(-4.5, -1, 9, 0.6);
    } else if (type === "sad") {
      drawBrow(this.leftBrow, -7, -16, -22);
      drawBrow(this.rightBrow, 7, -16, 22);
      this.mouth.lineStyle(1.6, COLORS.MOUTH, 1);
      this.mouth.beginPath();
      this.mouth.arc(0, 3, 4, DEG(200), DEG(340), false);
      this.mouth.strokePath();
    } else if (type === "shout") {
      drawBrow(this.leftBrow, -7, -14, 22);
      drawBrow(this.rightBrow, 7, -14, -22);
      this.mouth.fillStyle(COLORS.MOUTH, 1);
      this.mouth.fillEllipse(0, 0, 7, 8);
      this.mouth.fillStyle(0x000000, 1);
      this.mouth.fillEllipse(0, 1, 4, 5);
      // Tongue hint
      this.mouth.fillStyle(0xff8888, 0.8);
      this.mouth.fillEllipse(0, 3, 3, 2);
    }
  }

  // ── DRAW ARM PARTS ───────────────────────────────────────

  private drawUpperArm(g: Phaser.GameObjects.Graphics) {
    // Padded goalkeeper sleeve.
    const sleevePts = [
      new Phaser.Math.Vector2(-11, 0),
      new Phaser.Math.Vector2(11, 0),
      new Phaser.Math.Vector2(8, 34),
      new Phaser.Math.Vector2(-8, 34),
    ];
    g.fillStyle(COLORS.JERSEY, 1);
    g.fillPoints(sleevePts, true);
    g.lineStyle(1.8, COLORS.OUTLINE, 1);
    g.strokePoints(sleevePts, true);
    // Left highlight
    g.fillStyle(COLORS.JERSEY_LIGHT, 0.45);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-10, 1),
        new Phaser.Math.Vector2(-5, 0),
        new Phaser.Math.Vector2(-4, 34),
        new Phaser.Math.Vector2(-8, 34),
      ],
      true,
    );
    // Right shadow
    g.fillStyle(COLORS.JERSEY_SHADE, 0.55);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(9, 0),
        new Phaser.Math.Vector2(5, 0),
        new Phaser.Math.Vector2(4, 34),
        new Phaser.Math.Vector2(7, 34),
      ],
      true,
    );
    g.lineStyle(1, COLORS.JERSEY_DARK, 0.36);
    g.beginPath();
    g.moveTo(-4, 5);
    g.lineTo(-2, 30);
    g.moveTo(4, 6);
    g.lineTo(2, 30);
    g.strokePath();
    // Cuff trim
    g.fillStyle(COLORS.JERSEY_SHADE, 1);
    g.fillRect(-8, 30, 16, 4);
    g.fillStyle(0x000000, 0.25);
    g.fillRect(-8, 30, 16, 1);
  }

  private drawForearm(g: Phaser.GameObjects.Graphics) {
    // Tapered forearm.
    const forearmPts = [
      new Phaser.Math.Vector2(-7.5, 0),
      new Phaser.Math.Vector2(7.5, 0),
      new Phaser.Math.Vector2(6, 15),
      new Phaser.Math.Vector2(-6, 15),
    ];
    g.fillStyle(COLORS.SKIN, 1);
    g.fillPoints(forearmPts, true);
    g.lineStyle(1.5, COLORS.OUTLINE, 0.9);
    g.strokePoints(forearmPts, true);
    // Skin shadow
    g.fillStyle(COLORS.SKIN_SHADE, 0.5);
    g.fillRect(3, 2, 3, 11);
    g.fillStyle(0xffffff, 0.14);
    g.fillRect(-5, 2, 2, 10);

    // Keeper glove with padded fingers and palm.
    g.fillStyle(COLORS.GLOVE_BAND, 1);
    g.fillRoundedRect(-11, 12, 22, 6, 2);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(-9, 13, 18, 1);
    g.lineStyle(1.2, COLORS.OUTLINE, 1);
    g.strokeRoundedRect(-11, 12, 22, 6, 2);

    const fingerY = 14;
    const fingerW = 4.6;
    const fingerGap = 1;
    const totalW = 4 * fingerW + 3 * fingerGap;
    const startX = -totalW / 2;
    for (let i = 0; i < 4; i++) {
      const fx = startX + i * (fingerW + fingerGap);
      g.fillStyle(COLORS.GLOVE, 1);
      g.fillRoundedRect(fx, fingerY - 7, fingerW, 10, 2);
      g.lineStyle(1, COLORS.OUTLINE, 0.85);
      g.strokeRoundedRect(fx, fingerY - 7, fingerW, 10, 2);
      g.fillStyle(COLORS.GLOVE_HL, 0.42);
      g.fillRoundedRect(fx + 0.8, fingerY - 5, fingerW - 1.6, 4, 1.5);
    }

    g.fillStyle(COLORS.GLOVE, 1);
    g.fillRoundedRect(-13, 17, 26, 22, 6);
    g.lineStyle(1.8, COLORS.OUTLINE, 1);
    g.strokeRoundedRect(-13, 17, 26, 22, 6);

    g.fillStyle(COLORS.GLOVE_PALM, 1);
    g.fillRoundedRect(-10, 21, 20, 15, 4);
    g.fillStyle(COLORS.GLOVE_HL, 0.22);
    g.fillRoundedRect(-8, 22, 8, 12, 3);

    // Knuckle ridges
    g.lineStyle(1, COLORS.OUTLINE, 0.6);
    g.beginPath();
    g.moveTo(-7, 22);
    g.lineTo(-7, 33);
    g.moveTo(-2, 22);
    g.lineTo(-2, 33);
    g.moveTo(3, 22);
    g.lineTo(3, 33);
    g.moveTo(8, 22);
    g.lineTo(8, 33);
    g.strokePath();

    g.fillStyle(COLORS.GLOVE, 1);
    g.fillRoundedRect(-17, 20, 6, 12, 3);
    g.lineStyle(1, COLORS.OUTLINE, 0.85);
    g.strokeRoundedRect(-17, 20, 6, 12, 3);

    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(-10, 19, 6, 4, 2);
  }

  // ── ANIMATION HELPERS ────────────────────────────────────

  private allJoints() {
    return [
      this.container,
      this.body,
      this.head,
      this.leftUpperArm,
      this.rightUpperArm,
      this.leftForearm,
      this.rightForearm,
      this.leftThigh,
      this.rightThigh,
      this.leftShin,
      this.rightShin,
    ];
  }

  private stopAllTweens() {
    this.allJoints().forEach((t) => this.scene.tweens.killTweensOf(t));
  }

  // ── STATES ───────────────────────────────────────────────

  private startIdle() {
    this.stopAllTweens();
    this.container.setRotation(0);
    this.container.setPosition(this.startX, this.startY);
    this.container.setScale(this.baseScale);
    this.container.setAlpha(1);

    this.head.angle = 0;
    this.leftThigh.angle = 0;
    this.rightThigh.angle = 0;
    this.leftShin.angle = 0;
    this.rightShin.angle = 0;
    this.leftUpperArm.setRotation(this.leftArmIdle);
    this.rightUpperArm.setRotation(this.rightArmIdle);
    this.leftForearm.setRotation(this.leftElbowIdle);
    this.rightForearm.setRotation(this.rightElbowIdle);

    this.setExpression("idle");

    const swayRange = this.scene.scale.width * 0.05;
    // Walking side-to-side along the goal line
    this.scene.tweens.add({
      targets: this.container,
      x: this.startX + swayRange,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    // Breathing/step bob
    this.scene.tweens.add({
      targets: this.container,
      y: this.startY - 4,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ── Walking gait — legs alternating ──
    // Left leg swings forward as right swings back, then alternate
    this.scene.tweens.add({
      targets: this.leftThigh,
      angle: -8,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: this.rightThigh,
      angle: 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 350,
    });
    // Knee bends — opposite phase to thigh swing
    this.scene.tweens.add({
      targets: this.leftShin,
      angle: 10,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 350,
    });
    this.scene.tweens.add({
      targets: this.rightShin,
      angle: 10,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    // Chest expand
    this.scene.tweens.add({
      targets: this.container,
      scaleY: this.baseScale * 1.02,
      duration: 640,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    // Subtle arm sway
    this.scene.tweens.add({
      targets: this.leftUpperArm,
      rotation: this.leftArmIdle + DEG(8),
      duration: 920,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: this.rightUpperArm,
      rotation: this.rightArmIdle - DEG(8),
      duration: 920,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    // Head bob
    this.scene.tweens.add({
      targets: this.head,
      angle: 4,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    // Periodic blink — quickly shrink eyes
    this.scheduleBlink();
  }

  private scheduleBlink() {
    this.scene.time.delayedCall(
      2500 + Math.random() * 2500,
      () => {
        if (!this.leftEye || !this.rightEye) return;
        this.scene.tweens.add({
          targets: [this.leftEye, this.rightEye],
          scaleY: 0.1,
          duration: 70,
          yoyo: true,
          ease: "Sine.easeInOut",
          onComplete: () => this.scheduleBlink(),
        });
      },
    );
  }

  anticipate() {
    this.stopAllTweens();
    this.setExpression("focus");

    // Crouch — body lowers, scale squashes
    this.scene.tweens.add({
      targets: this.container,
      scaleY: this.baseScale * 0.88,
      scaleX: this.baseScale * 1.08,
      y: this.startY + 6,
      duration: 170,
      ease: "Back.Out",
    });
    // Arms spread + ready
    this.scene.tweens.add({
      targets: this.leftUpperArm,
      rotation: DEG(70),
      duration: 170,
      ease: "Back.Out",
    });
    this.scene.tweens.add({
      targets: this.rightUpperArm,
      rotation: DEG(-70),
      duration: 170,
      ease: "Back.Out",
    });
    // Forearms bent forward (ready to grab)
    this.scene.tweens.add({
      targets: this.leftForearm,
      rotation: DEG(-40),
      duration: 170,
    });
    this.scene.tweens.add({
      targets: this.rightForearm,
      rotation: DEG(40),
      duration: 170,
    });
    // Knees bend slightly
    this.scene.tweens.add({
      targets: [this.leftShin, this.rightShin],
      angle: -8,
      duration: 170,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: this.leftThigh,
      angle: 4,
      duration: 170,
    });
    this.scene.tweens.add({
      targets: this.rightThigh,
      angle: -4,
      duration: 170,
    });
    // Head focus forward
    this.scene.tweens.add({
      targets: this.head,
      angle: 6,
      duration: 170,
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
    const reach = sceneWidth * 0.34;
    const liftY = this.startY - sceneWidth * 0.2;
    const landY = this.startY - sceneWidth * 0.015;
    const apexX = this.startX + side * reach * 0.55;
    const finalX = this.startX + side * reach;

    this.stopAllTweens();
    this.setExpression("shout");

    const leadUp = side === 1 ? this.rightUpperArm : this.leftUpperArm;
    const trailUp = side === 1 ? this.leftUpperArm : this.rightUpperArm;
    const leadFore = side === 1 ? this.rightForearm : this.leftForearm;
    const trailFore = side === 1 ? this.leftForearm : this.rightForearm;
    const leadThigh = side === 1 ? this.rightThigh : this.leftThigh;
    const trailThigh = side === 1 ? this.leftThigh : this.rightThigh;
    const leadShin = side === 1 ? this.rightShin : this.leftShin;
    const trailShin = side === 1 ? this.leftShin : this.rightShin;

    // Lead arm extended to grab ball
    this.scene.tweens.add({
      targets: leadUp,
      rotation: side * DEG(150),
      duration: 240,
      ease: "Back.Out",
    });
    this.scene.tweens.add({
      targets: leadFore,
      rotation: 0, // straight
      duration: 240,
    });
    // Trail arm extended back
    this.scene.tweens.add({
      targets: trailUp,
      rotation: side * DEG(105),
      duration: 240,
    });
    this.scene.tweens.add({
      targets: trailFore,
      rotation: side * DEG(-15),
      duration: 240,
    });
    // Lead leg straightens & pushes
    this.scene.tweens.add({
      targets: leadThigh,
      angle: side * 32,
      duration: 250,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: leadShin,
      angle: side * 5,
      duration: 250,
    });
    // Trail leg tucks back
    this.scene.tweens.add({
      targets: trailThigh,
      angle: side * -22,
      duration: 250,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: trailShin,
      angle: side * -28,
      duration: 250,
    });
    // Head looks toward ball
    this.scene.tweens.add({
      targets: this.head,
      angle: side * -8,
      duration: 240,
    });
    // Body launches
    this.scene.tweens.add({
      targets: this.container,
      x: apexX,
      y: liftY,
      rotation: side * DEG(46),
      scaleX: this.baseScale * 1.04,
      scaleY: this.baseScale * 0.96,
      duration: 250,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.container,
          x: finalX,
          y: landY,
          rotation: side * DEG(82),
          scaleX: this.baseScale * 1.05,
          scaleY: this.baseScale * 0.94,
          duration: 240,
          ease: "Quad.easeIn",
          onComplete: () => {
            this.spawnDust(finalX, this.startY + 6);
            this.scene.tweens.add({
              targets: this.container,
              y: landY - 6,
              duration: 90,
              yoyo: true,
              ease: "Quad.easeOut",
            });
          },
        });
      },
    });
  }

  private spawnDust(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const offX = Phaser.Math.Between(-14, 14);
      const dot = this.scene.add
        .circle(x + offX, y, Phaser.Math.Between(3, 6), 0xddd0b8, 0.65)
        .setDepth(11);
      this.scene.tweens.add({
        targets: dot,
        x: dot.x + offX * 2,
        y: y - Phaser.Math.Between(14, 34),
        alpha: 0,
        scale: 0.2,
        duration: 500 + Phaser.Math.Between(0, 200),
        ease: "Quad.easeOut",
        onComplete: () => dot.destroy(),
      });
    }
  }

  celebrate() {
    this.stopAllTweens();
    this.setExpression("happy");

    // Stand upright from dive pose
    this.scene.tweens.add({
      targets: this.container,
      x: this.startX,
      y: this.startY,
      rotation: 0,
      scaleX: this.baseScale,
      scaleY: this.baseScale,
      duration: 230,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: [this.leftThigh, this.rightThigh, this.leftShin, this.rightShin],
      angle: 0,
      duration: 230,
    });
    this.scene.tweens.add({
      targets: this.leftUpperArm,
      rotation: this.leftArmIdle,
      duration: 230,
    });
    this.scene.tweens.add({
      targets: this.rightUpperArm,
      rotation: this.rightArmIdle,
      duration: 230,
    });
    this.scene.tweens.add({
      targets: this.leftForearm,
      rotation: this.leftElbowIdle,
      duration: 230,
    });
    this.scene.tweens.add({
      targets: this.rightForearm,
      rotation: this.rightElbowIdle,
      duration: 230,
    });

    // Fist pumps overhead — both arms swing up, forearms bent
    this.scene.tweens.add({
      targets: this.leftUpperArm,
      rotation: DEG(-160),
      duration: 230,
      yoyo: true,
      repeat: 2,
      ease: "Quad.easeOut",
      delay: 240,
    });
    this.scene.tweens.add({
      targets: this.rightUpperArm,
      rotation: DEG(160),
      duration: 230,
      yoyo: true,
      repeat: 2,
      ease: "Quad.easeOut",
      delay: 240,
    });
    this.scene.tweens.add({
      targets: this.leftForearm,
      rotation: DEG(-30),
      duration: 230,
      yoyo: true,
      repeat: 2,
      delay: 240,
    });
    this.scene.tweens.add({
      targets: this.rightForearm,
      rotation: DEG(30),
      duration: 230,
      yoyo: true,
      repeat: 2,
      delay: 240,
    });
    // Jumps
    this.scene.tweens.add({
      targets: this.container,
      y: this.startY - this.scene.scale.width * 0.08,
      duration: 240,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
      delay: 240,
    });
    this.scene.tweens.add({
      targets: this.container,
      scaleX: this.baseScale * 1.08,
      scaleY: this.baseScale * 1.08,
      duration: 240,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
      delay: 240,
    });
    // Knees bend on landing
    this.scene.tweens.add({
      targets: [this.leftShin, this.rightShin],
      angle: -15,
      duration: 240,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
      delay: 240,
    });
    // Head looks up triumphantly
    this.scene.tweens.add({
      targets: this.head,
      angle: -12,
      duration: 240,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      delay: 240,
    });
  }

  dejected() {
    this.stopAllTweens();
    this.setExpression("sad");

    // Arms hang loose
    this.scene.tweens.add({
      targets: this.leftUpperArm,
      rotation: DEG(-12),
      duration: 720,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: this.rightUpperArm,
      rotation: DEG(12),
      duration: 720,
      ease: "Sine.easeInOut",
    });
    // Forearms relax
    this.scene.tweens.add({
      targets: this.leftForearm,
      rotation: DEG(8),
      duration: 720,
    });
    this.scene.tweens.add({
      targets: this.rightForearm,
      rotation: DEG(-8),
      duration: 720,
    });
    // Head drops
    this.scene.tweens.add({
      targets: this.head,
      angle: -25,
      duration: 720,
      ease: "Sine.easeOut",
    });
    // Knees buckle
    this.scene.tweens.add({
      targets: this.leftShin,
      angle: -10,
      duration: 720,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: this.rightShin,
      angle: 10,
      duration: 720,
      ease: "Sine.easeOut",
    });
    // Thighs slightly outward
    this.scene.tweens.add({
      targets: this.leftThigh,
      angle: 4,
      duration: 720,
    });
    this.scene.tweens.add({
      targets: this.rightThigh,
      angle: -4,
      duration: 720,
    });
    // Body slumps
    this.scene.tweens.add({
      targets: this.container,
      rotation: DEG(-10),
      y: this.startY + 9,
      scaleY: this.baseScale * 0.94,
      duration: 800,
      ease: "Sine.easeOut",
    });
  }

  resetPosition() {
    this.stopAllTweens();
    this.scene.tweens.add({
      targets: this.head,
      angle: 0,
      duration: 280,
    });
    this.scene.tweens.add({
      targets: [this.leftThigh, this.rightThigh, this.leftShin, this.rightShin],
      angle: 0,
      duration: 280,
    });
    this.scene.tweens.add({
      targets: this.leftUpperArm,
      rotation: this.leftArmIdle,
      duration: 280,
    });
    this.scene.tweens.add({
      targets: this.rightUpperArm,
      rotation: this.rightArmIdle,
      duration: 280,
    });
    this.scene.tweens.add({
      targets: this.leftForearm,
      rotation: this.leftElbowIdle,
      duration: 280,
    });
    this.scene.tweens.add({
      targets: this.rightForearm,
      rotation: this.rightElbowIdle,
      duration: 280,
    });
    this.scene.tweens.add({
      targets: this.container,
      x: this.startX,
      y: this.startY,
      rotation: 0,
      scaleX: this.baseScale,
      scaleY: this.baseScale,
      duration: 460,
      ease: "Back.Out",
      onComplete: () => this.startIdle(),
    });
  }

  celebrateSave() {
    this.stopAllTweens();
    this.setExpression("happy");

    const w = this.scene.scale.width;
    const smallHop = w * 0.07;
    const bigHop = w * 0.14;

    // ── Phase A: Stand up + cradle pose ──
    this.scene.tweens.add({
      targets: this.container,
      x: this.startX,
      y: this.startY,
      rotation: 0,
      scaleX: this.baseScale,
      scaleY: this.baseScale,
      duration: 230,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: [this.leftThigh, this.rightThigh, this.leftShin, this.rightShin],
      angle: 0,
      duration: 230,
    });
    this.scene.tweens.add({
      targets: this.leftUpperArm,
      rotation: DEG(38),
      duration: 280,
      ease: "Back.Out",
    });
    this.scene.tweens.add({
      targets: this.rightUpperArm,
      rotation: DEG(-38),
      duration: 280,
      ease: "Back.Out",
    });
    this.scene.tweens.add({
      targets: this.leftForearm,
      rotation: DEG(55),
      duration: 280,
      ease: "Back.Out",
    });
    this.scene.tweens.add({
      targets: this.rightForearm,
      rotation: DEG(-55),
      duration: 280,
      ease: "Back.Out",
    });

    // Sparkle bursts at key moments
    this.scene.time.delayedCall(280, () => this.spawnSparkles(8));
    this.scene.time.delayedCall(700, () => this.spawnSparkles(10));
    this.scene.time.delayedCall(1100, () => this.spawnSparkles(8));
    this.scene.time.delayedCall(1450, () => this.spawnSparkles(6));

    // ── Phase B: First quick hop (small) ──
    this.scene.tweens.add({
      targets: [this.leftShin, this.rightShin],
      angle: -22,
      duration: 130,
      delay: 300,
      yoyo: true,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: this.container,
      y: this.startY - smallHop,
      duration: 210,
      delay: 430,
      yoyo: true,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: this.container,
      scaleY: this.baseScale * 1.05,
      scaleX: this.baseScale * 0.96,
      duration: 210,
      delay: 430,
      yoyo: true,
      ease: "Sine.easeOut",
    });

    // ── Phase C: Big hop + arms thrust overhead + ball lifts ──
    this.scene.tweens.add({
      targets: [this.leftShin, this.rightShin],
      angle: -30,
      duration: 140,
      delay: 760,
      yoyo: true,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: this.container,
      y: this.startY - bigHop,
      duration: 260,
      delay: 900,
      yoyo: true,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: this.container,
      scaleY: this.baseScale * 1.1,
      scaleX: this.baseScale * 0.94,
      duration: 260,
      delay: 900,
      yoyo: true,
      ease: "Sine.easeOut",
    });
    // Arms blast overhead — ball goes with them
    this.scene.tweens.add({
      targets: this.leftUpperArm,
      rotation: DEG(160),
      duration: 240,
      delay: 900,
      yoyo: true,
      ease: "Back.Out",
    });
    this.scene.tweens.add({
      targets: this.rightUpperArm,
      rotation: DEG(-160),
      duration: 240,
      delay: 900,
      yoyo: true,
      ease: "Back.Out",
    });
    this.scene.tweens.add({
      targets: this.leftForearm,
      rotation: DEG(-50),
      duration: 240,
      delay: 900,
      yoyo: true,
    });
    this.scene.tweens.add({
      targets: this.rightForearm,
      rotation: DEG(50),
      duration: 240,
      delay: 900,
      yoyo: true,
    });

    // ── Phase D: Final celebration hop ──
    this.scene.tweens.add({
      targets: [this.leftShin, this.rightShin],
      angle: -20,
      duration: 130,
      delay: 1400,
      yoyo: true,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: this.container,
      y: this.startY - smallHop * 0.7,
      duration: 200,
      delay: 1530,
      yoyo: true,
      ease: "Sine.easeOut",
    });

    // Head wags side-to-side throughout celebration
    this.scene.tweens.add({
      targets: this.head,
      angle: 14,
      duration: 280,
      delay: 320,
      yoyo: true,
      repeat: 4,
      ease: "Sine.easeInOut",
    });
  }

  private spawnSparkles(count = 8) {
    const colors = ["#FFD700", "#ffffff", "#fff5aa", "#aaffff", "#ffd0e0"];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 70;
      const startX = this.startX + (Math.random() - 0.5) * 36;
      const startY =
        this.startY - 110 + (Math.random() - 0.5) * 50;
      const star = this.scene.add
        .text(startX, startY, "★", {
          fontFamily: "system-ui",
          fontSize: `${12 + Math.random() * 10}px`,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
        .setOrigin(0.5)
        .setDepth(22)
        .setAlpha(0);

      this.scene.tweens.add({
        targets: star,
        x: startX + Math.cos(ang) * dist,
        y: startY + Math.sin(ang) * dist,
        alpha: { from: 1, to: 0 },
        scale: { from: 0.4, to: 1.3 },
        angle: Phaser.Math.Between(-360, 360),
        duration: 700 + Math.random() * 500,
        ease: "Quad.easeOut",
        onComplete: () => star.destroy(),
      });
    }
  }

  getHoldRef(): {
    target: Phaser.GameObjects.Container;
    offX: number;
    offY: number;
  } {
    // Ball cradled between hands when keeper holds the ball
    return {
      target: this.container,
      offX: 0,
      offY: -128,
    };
  }
}
