# ⚽ Football Goal Shooting Game

## Next.js 16 + Tailwind CSS + Phaser.js — Complete Build Guide

> **Stack:** Next.js 16 (App Router, Turbopack) · Tailwind CSS v4 · Phaser.js · TypeScript  
> **Scope:** Frontend-only game. No backend, no auth, no real leaderboard API — pure game mechanics first.

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Folder Structure](#2-folder-structure)
3. [Architecture Overview](#3-architecture-overview)
4. [Next.js 16 Key Rules](#4-nextjs-16-key-rules)
5. [Phaser in Next.js — The Right Pattern](#5-phaser-in-nextjs--the-right-pattern)
6. [App Router Pages](#6-app-router-pages)
7. [Screen 1 — Menu Page](#7-screen-1--menu-page)
8. [Screen 2 — Game Page](#8-screen-2--game-page)
9. [Phaser Game Scenes](#9-phaser-game-scenes)
   - [9.1 BootScene](#91-bootscene)
   - [9.2 PreloadScene](#92-preloadscene)
   - [9.3 GameScene](#93-gamescene)
10. [Core Game Mechanics](#10-core-game-mechanics)
    - [10.1 PowerBar](#101-powerbar)
    - [10.2 TimingBar](#102-timingbar)
    - [10.3 Ball](#103-ball)
    - [10.4 Goalkeeper AI](#104-goalkeeper-ai)
    - [10.5 ScoreEngine](#105-scoreengine)
    - [10.6 DifficultyManager](#106-difficultymanager)
11. [Screen 3 — Result Page](#11-screen-3--result-page)
12. [Screen 4 — Leaderboard Page](#12-screen-4--leaderboard-page)
13. [Shared UI Components](#13-shared-ui-components)
14. [State Management](#14-state-management)
15. [Local Storage Utils](#15-local-storage-utils)
16. [Game Config & Constants](#16-game-config--constants)
17. [Mobile-First Tailwind Patterns](#17-mobile-first-tailwind-patterns)
18. [Assets Guide](#18-assets-guide)
19. [Testing Checklist](#19-testing-checklist)
20. [Backend Hook Points](#20-backend-hook-points)
21. [Build Order](#21-build-order)

---

## 1. Project Setup

### Scaffold

```bash
npx create-next-app@latest football-game
```

When prompted:

```
✔ Would you like to use TypeScript? › Yes
✔ Would you like to use ESLint? › Yes
✔ Would you like to use Tailwind CSS? › Yes
✔ Would you like your code inside a `src/` directory? › Yes
✔ Would you like to use App Router? › Yes
✔ Would you like to use Turbopack for next dev? › Yes
✔ Would you like to customize the import alias? › Yes (@/*)
```

### Install Phaser

```bash
npm install phaser
```

### Install Zustand (lightweight state between pages)

```bash
npm install zustand
```

### Verify Node version

```bash
node -v   # Must be 20.9.0 or higher (Next.js 16 requirement)
```

---

## 2. Folder Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (dark bg, mobile viewport)
│   ├── page.tsx                    # → redirects to /menu
│   ├── menu/
│   │   └── page.tsx                # Landing / name entry screen
│   ├── game/
│   │   └── page.tsx                # Phaser canvas page
│   ├── result/
│   │   └── page.tsx                # Match result screen
│   └── leaderboard/
│       └── page.tsx                # Daily + campaign leaderboard
├── components/
│   ├── game/
│   │   ├── PhaserGame.tsx          # 'use client' Phaser wrapper
│   │   └── GameCanvas.tsx          # dynamic import wrapper (no SSR)
│   └── ui/
│       ├── Button.tsx
│       ├── ScoreCard.tsx
│       ├── LeaderboardRow.tsx
│       └── ShotBadge.tsx
├── game/
│   ├── config.ts                   # Phaser.Game config
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   └── GameScene.ts
│   ├── objects/
│   │   ├── Ball.ts
│   │   ├── Goalkeeper.ts
│   │   ├── PowerBar.ts
│   │   └── TimingBar.ts
│   └── systems/
│       ├── ScoreEngine.ts
│       └── DifficultyManager.ts
├── store/
│   └── gameStore.ts                # Zustand global state
├── utils/
│   ├── storage.ts                  # localStorage helpers
│   └── mathUtils.ts
├── types/
│   └── game.ts                     # Shared TypeScript interfaces
└── constants/
    └── game.ts                     # Game tuning constants
```

---

## 3. Architecture Overview

```
Browser
  │
  ├── /menu          (Next.js page, Tailwind UI)
  │     └── player enters name → navigates to /game
  │
  ├── /game          (Next.js page)
  │     └── <GameCanvas /> (dynamic, ssr:false)
  │           └── Phaser.Game
  │                 ├── BootScene
  │                 ├── PreloadScene
  │                 └── GameScene  ──► on match end:
  │                       • writes result to Zustand store
  │                       • calls router.push('/result')
  │
  ├── /result        (Next.js page, Tailwind UI)
  │     └── reads from Zustand → shows score breakdown
  │
  └── /leaderboard   (Next.js page, Tailwind UI)
        └── reads from localStorage → shows rankings
```

### Why split Phaser and Next.js this way?

| Concern                                        | Solution                                     |
| ---------------------------------------------- | -------------------------------------------- |
| Phaser uses `window`/`document` at import time | `dynamic(() => import(...), { ssr: false })` |
| Game result needs to reach Next.js pages       | Zustand store (client-side, persisted)       |
| All non-game UI (menus, scores)                | Tailwind components in Next.js pages         |
| Routing between screens                        | Next.js App Router `router.push()`           |

---

## 4. Next.js 16 Key Rules

Always follow these in every file you write:

### Async params and searchParams

```tsx
// ✅ Next.js 16 — always await params
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref: string }>;
}) {
  const { id } = await params;
  const { ref } = await searchParams;
  return <div>{id}</div>;
}
```

### Server vs Client components

```tsx
// Server component (default) — no hooks, no browser APIs
export default function ResultPage() { ... }

// Client component — add directive at top
'use client'
import { useState } from 'react'
export default function MenuPage() { ... }
```

### proxy.ts (not middleware.ts)

```ts
// src/proxy.ts  — NOT middleware.ts (deprecated in Next.js 16)
import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  // Auth guard goes here later
  return NextResponse.next();
}
```

### next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16, no config needed
  // React Compiler (optional — great for game UI components)
  reactCompiler: true,
};

export default nextConfig;
```

---

## 5. Phaser in Next.js — The Right Pattern

Phaser accesses `window`, `document`, and `WebGL` at import time. It **cannot** run on the server. Two layers of protection are needed.

### Layer 1 — Dynamic import with `ssr: false`

```tsx
// src/components/game/GameCanvas.tsx
import dynamic from "next/dynamic";

const PhaserGame = dynamic(() => import("./PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#000814]">
      <div className="text-center">
        <div className="mb-4 text-4xl">⚽</div>
        <p className="text-sm text-green-400 animate-pulse">Loading game...</p>
      </div>
    </div>
  ),
});

export default function GameCanvas() {
  return <PhaserGame />;
}
```

### Layer 2 — `'use client'` Phaser wrapper

```tsx
// src/components/game/PhaserGame.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const router = useRouter();
  const { playerName } = useGameStore();

  useEffect(() => {
    // Only runs in browser — safe to import Phaser here
    let game: Phaser.Game;

    const initGame = async () => {
      const Phaser = (await import("phaser")).default;
      const { gameConfig } = await import("@/game/config");

      if (!containerRef.current || gameRef.current) return;

      game = new Phaser.Game({
        ...gameConfig,
        parent: containerRef.current,
        callbacks: {
          // Pass Next.js router into Phaser via game registry
          postBoot: (g) => {
            g.registry.set("router", router);
            g.registry.set("playerName", playerName || "Player");
            g.registry.set("setResult", useGameStore.getState().setResult);
          },
        },
      });

      gameRef.current = game;
    };

    initGame();

    return () => {
      // Cleanup on unmount (e.g. navigating away)
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="h-screen w-full bg-[#000814]"
      id="game-container"
    />
  );
}
```

### How Phaser calls Next.js router

Inside any Phaser scene, to navigate after match ends:

```ts
// Inside GameScene.ts
const router = this.registry.get("router");
const setResult = this.registry.get("setResult");

setResult({
  totalScore: this.totalScore,
  shotResults: this.shotResults,
});

router.push("/result");
```

---

## 6. App Router Pages

### `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Penalty Showdown ⚽",
  description: "Score goals, top the leaderboard, win prizes!",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#000814",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#000814] text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
```

### `src/app/page.tsx`

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/menu");
}
```

### `src/app/globals.css`

```css
@import "tailwindcss";

/* Prevent pull-to-refresh and overscroll on mobile */
html,
body {
  overscroll-behavior: none;
  touch-action: pan-x pan-y;
  height: 100%;
  width: 100%;
}

/* Safe area for notched phones */
.safe-top {
  padding-top: env(safe-area-inset-top);
}
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 7. Screen 1 — Menu Page

```tsx
// src/app/menu/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import Button from "@/components/ui/Button";

export default function MenuPage() {
  const router = useRouter();
  const { setPlayerName } = useGameStore();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handlePlay() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    setPlayerName(trimmed);
    router.push("/game");
  }

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-[#000814] px-6">
      {/* Stadium glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute left-1/4 top-2/3 h-64 w-64 rounded-full bg-emerald-600/8 blur-2xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-7xl drop-shadow-[0_0_30px_rgba(0,230,118,0.4)]">
            ⚽
          </div>
          <h1 className="text-center font-black text-3xl tracking-tight text-white">
            PENALTY
            <span className="ml-2 text-green-400">SHOWDOWN</span>
          </h1>
          <p className="text-sm text-gray-400 text-center">
            5 shots · Score goals · Top the board
          </p>
        </div>

        {/* Rules quick-reference */}
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "🎯", label: "Aim", desc: "Swipe to aim" },
              { icon: "⚡", label: "Power", desc: "Hold to charge" },
              { icon: "⏱️", label: "Timing", desc: "Hit the zone" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-bold text-white">
                  {item.label}
                </span>
                <span className="text-[10px] text-gray-400">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handlePlay()}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-white placeholder-gray-500 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* CTA */}
        <Button
          onClick={handlePlay}
          className="w-full"
          size="lg"
          variant="primary"
        >
          🎯 PLAY NOW
        </Button>

        {/* Leaderboard link */}
        <button
          onClick={() => router.push("/leaderboard")}
          className="text-sm text-gray-500 underline underline-offset-4 hover:text-gray-300 transition-colors"
        >
          View Leaderboard
        </button>
      </div>
    </main>
  );
}
```

---

## 8. Screen 2 — Game Page

```tsx
// src/app/game/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import GameCanvas from "@/components/game/GameCanvas";

export default function GamePage() {
  const router = useRouter();
  const { playerName } = useGameStore();

  // Guard: redirect back to menu if no player name
  useEffect(() => {
    if (!playerName) {
      router.replace("/menu");
    }
  }, [playerName, router]);

  if (!playerName) return null;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#000814]">
      <GameCanvas />
    </main>
  );
}
```

---

## 9. Phaser Game Scenes

### `src/game/config.ts`

```ts
import type { Types } from "phaser";

// Scenes are imported lazily inside PhaserGame.tsx to avoid SSR issues
export const gameConfig: Omit<Types.Core.GameConfig, "scene"> = {
  type: 0, // Phaser.AUTO — resolved at runtime
  backgroundColor: "#000814",
  scale: {
    mode: 5, // Phaser.Scale.FIT
    autoCenter: 1, // Phaser.Scale.CENTER_BOTH
    width: 390,
    height: 844,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
};
```

Update `PhaserGame.tsx` to also import scenes:

```ts
// Inside initGame() in PhaserGame.tsx, after importing Phaser:
const { BootScene } = await import("@/game/scenes/BootScene");
const { PreloadScene } = await import("@/game/scenes/PreloadScene");
const { GameScene } = await import("@/game/scenes/GameScene");

game = new Phaser.Game({
  ...gameConfig,
  type: Phaser.AUTO,
  scale: {
    ...gameConfig.scale,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, GameScene],
  parent: containerRef.current,
  // ... callbacks
});
```

---

### 9.1 BootScene

```ts
// src/game/scenes/BootScene.ts
import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create() {
    this.scene.start("PreloadScene");
  }
}
```

---

### 9.2 PreloadScene

```ts
// src/game/scenes/PreloadScene.ts
import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload() {
    const { width, height } = this.scale;

    // ── Progress bar ──────────────────────────────────────
    const track = this.add.rectangle(width / 2, height / 2, 280, 8, 0x1a1a2e);
    const bar = this.add
      .rectangle(width / 2 - 140, height / 2, 0, 8, 0x00e676)
      .setOrigin(0, 0.5);

    this.add
      .text(width / 2, height / 2 - 28, "Loading...", {
        fontSize: "13px",
        color: "#888888",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5);

    this.load.on("progress", (v: number) => {
      bar.width = 280 * v;
    });
    this.load.on("complete", () => {
      track.destroy();
      bar.destroy();
    });

    // ── Images ────────────────────────────────────────────
    this.load.image("bg", "/assets/images/background.png");
    this.load.image("goal", "/assets/images/goal.png");
    this.load.image("ball", "/assets/images/ball.png");
    this.load.image("crowd", "/assets/images/crowd.png");
    this.load.image("net_flash", "/assets/images/net_flash.png");

    this.load.spritesheet("keeper", "/assets/images/keeper.png", {
      frameWidth: 128,
      frameHeight: 196,
    });

    // ── Audio ─────────────────────────────────────────────
    this.load.audio("crowd", "/assets/audio/crowd_ambient.mp3");
    this.load.audio("kick", "/assets/audio/kick.mp3");
    this.load.audio("goal", "/assets/audio/goal.mp3");
    this.load.audio("save", "/assets/audio/save.mp3");
    this.load.audio("miss", "/assets/audio/miss.mp3");
    this.load.audio("whistle", "/assets/audio/whistle.mp3");
  }

  create() {
    this.scene.start("GameScene");
  }
}
```

> Place all assets in `/public/assets/` — Next.js serves `public/` at the root path.

---

### 9.3 GameScene

```ts
// src/game/scenes/GameScene.ts
import Phaser from "phaser";
import { Ball } from "../objects/Ball";
import { Goalkeeper } from "../objects/Goalkeeper";
import { PowerBar } from "../objects/PowerBar";
import { TimingBar } from "../objects/TimingBar";
import { ScoreEngine } from "../systems/ScoreEngine";
import { DifficultyManager } from "../systems/DifficultyManager";
import type { ShotResult } from "@/types/game";

const TOTAL_SHOTS = 5;

export class GameScene extends Phaser.Scene {
  private ball!: Ball;
  private goalkeeper!: Goalkeeper;
  private powerBar!: PowerBar;
  private timingBar!: TimingBar;
  private scoreEngine!: ScoreEngine;
  private difficultyManager!: DifficultyManager;

  private shotsTaken = 0;
  private totalScore = 0;
  private shotResults: ShotResult[] = [];
  private isAnimating = false;

  private scoreText!: Phaser.GameObjects.Text;
  private shotsText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private netFlash!: Phaser.GameObjects.Image;
  private crowdSound!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    const { width, height } = this.scale;
    const playerName: string = this.registry.get("playerName") || "Player";

    // ── Background ───────────────────────────────────────
    this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height);
    this.add
      .image(width / 2, height * 0.15, "crowd")
      .setDisplaySize(width, height * 0.35)
      .setAlpha(0.6);

    // ── Goal ─────────────────────────────────────────────
    this.add
      .image(width / 2, height * 0.31, "goal")
      .setDisplaySize(width * 0.85, height * 0.38);

    // ── Net flash (hidden) ───────────────────────────────
    this.netFlash = this.add
      .image(width / 2, height * 0.27, "net_flash")
      .setDisplaySize(width * 0.72, height * 0.3)
      .setAlpha(0);

    // ── Systems ──────────────────────────────────────────
    this.difficultyManager = new DifficultyManager(playerName);
    this.scoreEngine = new ScoreEngine(this.difficultyManager);

    // ── Game objects ─────────────────────────────────────
    this.goalkeeper = new Goalkeeper(this, width / 2, height * 0.3);
    this.ball = new Ball(this, width / 2, height * 0.77);
    this.powerBar = new PowerBar(this, width / 2, height * 0.87);
    this.timingBar = new TimingBar(this, width / 2, height * 0.92);

    // ── HUD ──────────────────────────────────────────────
    this.scoreText = this.add
      .text(16, 16, "Score: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#FFD700",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setDepth(20);

    this.shotsText = this.add
      .text(width - 16, 16, `0 / ${TOTAL_SHOTS}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(1, 0)
      .setDepth(20);

    this.statusText = this.add
      .text(width / 2, 52, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        color: "#aaffaa",
      })
      .setOrigin(0.5)
      .setDepth(20);

    // ── Toast ────────────────────────────────────────────
    this.toastText = this.add
      .text(width / 2, height * 0.44, "", {
        fontFamily: "system-ui, sans-serif",
        fontStyle: "bold",
        fontSize: "38px",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(30);

    // ── Audio ────────────────────────────────────────────
    this.crowdSound = this.sound.add("crowd", { loop: true, volume: 0.25 });
    this.crowdSound.play();

    // ── Input ────────────────────────────────────────────
    this.setupInput();

    // ── Start whistle ────────────────────────────────────
    this.time.delayedCall(700, () => {
      this.sound.play("whistle");
      this.readyForShot();
    });
  }

  override update(_time: number, delta: number) {
    this.powerBar.update(delta);
    this.timingBar.update(delta);
  }

  // ── Shot cycle ───────────────────────────────────────────────────────────

  private readyForShot() {
    if (this.shotsTaken >= TOTAL_SHOTS) {
      this.endMatch();
      return;
    }

    this.isAnimating = false;
    this.ball.resetPosition();
    this.goalkeeper.resetPosition();
    this.powerBar.reset();
    this.timingBar.reset();
    this.powerBar.show();
    this.timingBar.show();

    const remaining = TOTAL_SHOTS - this.shotsTaken;
    this.statusText.setText(
      `Shot ${this.shotsTaken + 1} of ${TOTAL_SHOTS}  ·  ${remaining} remaining`,
    );
  }

  private setupInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating) return;
      this.powerBar.startCharging();
      this.timingBar.start(this.difficultyManager.getTimingBarSpeed());
      this.ball.startAiming(pointer);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating) return;
      this.ball.updateAim(pointer);
    });

    this.input.on("pointerup", () => {
      if (this.isAnimating) return;
      this.shoot();
    });
  }

  private shoot() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const power = this.powerBar.release();
    const timing = this.timingBar.release();
    const direction = this.ball.getAimDirection();
    const difficulty = this.difficultyManager.getCurrentLevel();

    this.powerBar.hide();
    this.timingBar.hide();

    this.goalkeeper.reactToShot({ direction, power, difficulty });
    const result = this.scoreEngine.evaluate({
      power,
      timing,
      direction,
      difficulty,
    });

    this.ball.shoot({
      direction,
      power,
      onComplete: () => this.handleShotResult(result),
    });

    this.sound.play("kick");
  }

  private handleShotResult(result: ShotResult) {
    this.shotsTaken++;
    this.totalScore += result.points;
    this.shotResults.push(result);

    this.scoreText.setText(`Score: ${this.totalScore}`);
    this.shotsText.setText(`${this.shotsTaken} / ${TOTAL_SHOTS}`);

    if (result.scored) this.showGoal(result);
    else if (result.saved) this.showSaved();
    else this.showMiss();
  }

  private showGoal(result: ShotResult) {
    this.sound.play("goal");
    (this.crowdSound as Phaser.Sound.WebAudioSound).setVolume(0.8);
    this.cameras.main.shake(250, 0.015);

    this.tweens.add({
      targets: this.netFlash,
      alpha: { from: 0.9, to: 0 },
      duration: 750,
      ease: "Power2",
    });

    const label = result.bonus
      ? `🌟 PERFECT!  +${result.points}`
      : `⚽ GOAL!  +${result.points}`;

    this.showToast(label, result.bonus ? "#FFD700" : "#00e676");

    this.time.delayedCall(1800, () => {
      (this.crowdSound as Phaser.Sound.WebAudioSound).setVolume(0.25);
      this.readyForShot();
    });
  }

  private showSaved() {
    this.sound.play("save");
    this.showToast("🧤 SAVED!", "#ff5722");
    this.time.delayedCall(1600, () => this.readyForShot());
  }

  private showMiss() {
    this.sound.play("miss");
    this.showToast("😬 MISS!", "#ff1744");
    this.time.delayedCall(1500, () => this.readyForShot());
  }

  private showToast(message: string, color: string) {
    this.toastText.setText(message).setColor(color).setAlpha(1).setScale(0.4);

    this.tweens.add({
      targets: this.toastText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 220,
      ease: "Back.Out",
      onComplete: () => {
        this.time.delayedCall(900, () => {
          this.tweens.add({
            targets: this.toastText,
            alpha: 0,
            duration: 300,
          });
        });
      },
    });
  }

  private endMatch() {
    this.crowdSound.stop();
    this.sound.play("whistle");

    const setResult = this.registry.get("setResult");
    const router = this.registry.get("router");

    setResult({
      playerName: this.registry.get("playerName"),
      totalScore: this.totalScore,
      shotResults: this.shotResults,
    });

    this.time.delayedCall(1200, () => {
      router.push("/result");
    });
  }
}
```

---

## 10. Core Game Mechanics

### `src/types/game.ts`

```ts
export interface ShotResult {
  scored: boolean;
  saved: boolean;
  bonus: boolean;
  points: number;
  reason: string;
}

export interface MatchResult {
  playerName: string;
  totalScore: number;
  shotResults: ShotResult[];
  timestamp?: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  goalsOf5: number;
}

export interface AimDirection {
  x: number; // -1 (far left) to 1 (far right)
  y: number; // always 1
}
```

---

### `src/constants/game.ts`

```ts
export const GAME = {
  TOTAL_SHOTS: 5,
  BASE_GOAL_POINTS: 100,
  PERFECT_BONUS: 50,
  TIMING_MULTIPLIER: 1.5,
  MIN_TIMING_TO_SCORE: 0.3,

  // Power bar
  POWER_BAR_BASE_SPEED: 0.9, // units/sec charge rate multiplier

  // Timing bar
  TIMING_BASE_SPEED: 155, // degrees/sec at difficulty 0
  TIMING_MAX_SPEED: 310, // degrees/sec at difficulty 1

  // Difficulty
  DIFFICULTY_PER_PLAY: 0.08, // increment per match
  MAX_DIFFICULTY: 1.0,

  // Keeper
  KEEPER_BASE_SKILL: 0.35,
  KEEPER_MAX_SKILL: 0.75,

  // Miss threshold
  POST_LIMIT_BASE: 0.85,
  POST_LIMIT_REDUCTION: 0.05, // per difficulty point

  MIN_POWER_BASE: 0.2,
  MIN_POWER_SLOPE: 0.1,
} as const;
```

---

### 10.1 PowerBar

```ts
// src/game/objects/PowerBar.ts
import Phaser from "phaser";
import { GAME } from "@/constants/game";

export class PowerBar {
  private scene: Phaser.Scene;
  private track: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private barWidth: number;

  private power = 0;
  private direction = 1;
  private charging = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
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
        letterSpacing: 2,
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

    // Color: green → yellow → red
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
```

---

### 10.2 TimingBar

```ts
// src/game/objects/TimingBar.ts
import Phaser from "phaser";

const PERFECT_ZONE_START = 240; // degrees
const PERFECT_ZONE_END = 300; // degrees (60° window centered at 270°)
const RADIUS = 28;

export class TimingBar {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;

  private angle = 0;
  private speed = 155; // degrees/sec — set via start()
  private active = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
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

    // Background ring
    this.graphics.lineStyle(5, 0x222233, 1);
    this.graphics.strokeCircle(this.x, this.y, RADIUS);

    // Perfect zone arc (green)
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

    // Moving dot
    const rad = Phaser.Math.DegToRad(this.angle - 90);
    const dotX = this.x + Math.cos(rad) * RADIUS;
    const dotY = this.y + Math.sin(rad) * RADIUS;

    const inZone =
      this.angle >= PERFECT_ZONE_START && this.angle <= PERFECT_ZONE_END;
    this.graphics.fillStyle(inZone ? 0x00e676 : 0xffffff, 1);
    this.graphics.fillCircle(dotX, dotY, 5);

    // Label
    this.graphics.fillStyle(0x00000000); // transparent
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
```

---

### 10.3 Ball

```ts
// src/game/objects/Ball.ts
import Phaser from "phaser";
import type { AimDirection } from "@/types/game";

export class Ball {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Image;
  private aimLine: Phaser.GameObjects.Graphics;
  private startX: number;
  private startY: number;
  private aimX = 0; // -1 to 1

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;

    this.sprite = scene.add
      .image(x, y, "ball")
      .setDisplaySize(46, 46)
      .setDepth(15);
    this.aimLine = scene.add.graphics().setDepth(14);
  }

  resetPosition() {
    this.sprite.setPosition(this.startX, this.startY).setAlpha(1).setScale(1);
    this.aimLine.clear();
    this.aimX = 0;
  }

  startAiming(pointer: Phaser.Input.Pointer) {
    this.updateAim(pointer);
  }

  updateAim(pointer: Phaser.Input.Pointer) {
    const dx = pointer.worldX - this.startX;
    this.aimX = Phaser.Math.Clamp(dx / 100, -1, 1);
    this.drawAimLine();
  }

  private drawAimLine() {
    const { width, height } = this.scene.scale;
    this.aimLine.clear();
    this.aimLine.lineStyle(2, 0xffffff, 0.35);

    const targetX = this.startX + this.aimX * width * 0.34;
    const targetY = height * 0.31;

    for (let i = 0; i < 8; i++) {
      const t1 = i / 8;
      const t2 = (i + 0.45) / 8;
      this.aimLine.beginPath();
      this.aimLine.moveTo(
        Phaser.Math.Linear(this.startX, targetX, t1),
        Phaser.Math.Linear(this.startY, targetY, t1),
      );
      this.aimLine.lineTo(
        Phaser.Math.Linear(this.startX, targetX, t2),
        Phaser.Math.Linear(this.startY, targetY, t2),
      );
      this.aimLine.strokePath();
    }
  }

  getAimDirection(): AimDirection {
    return { x: this.aimX, y: 1 };
  }

  shoot({
    direction,
    power,
    onComplete,
  }: {
    direction: AimDirection;
    power: number;
    onComplete: () => void;
  }) {
    const { width, height } = this.scene.scale;

    // Spread increases when power is low (inaccurate weak shots)
    const spread = (1 - power) * 80;
    const tx =
      width / 2 +
      direction.x * width * 0.31 +
      Phaser.Math.FloatBetween(-spread, spread);
    const ty = height * 0.18 + (1 - power) * height * 0.1;

    this.aimLine.clear();

    this.scene.tweens.add({
      targets: this.sprite,
      x: tx,
      y: ty,
      scaleX: 0.38,
      scaleY: 0.38,
      duration: 580,
      ease: "Power2",
      onUpdate: () => {
        this.sprite.angle += 14;
      },
      onComplete,
    });
  }
}
```

---

### 10.4 Goalkeeper AI

```ts
// src/game/objects/Goalkeeper.ts
import Phaser from "phaser";
import type { AimDirection } from "@/types/game";

export class Goalkeeper {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite;
  private startX: number;
  private startY: number;
  private swayTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;

    this.sprite = scene.add
      .sprite(x, y, "keeper")
      .setDisplaySize(88, 138)
      .setDepth(13);

    this.startSway();
  }

  private startSway() {
    this.swayTween = this.scene.tweens.add({
      targets: this.sprite,
      x: this.startX + 14,
      duration: 780,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  reactToShot({
    direction,
    power,
    difficulty,
  }: {
    direction: AimDirection;
    power: number;
    difficulty: number;
  }) {
    this.swayTween?.stop();

    // Higher difficulty → keeper predicts direction more often
    const predictChance = 0.38 + difficulty * 0.32;
    const goesRight =
      Math.random() < predictChance ? direction.x > 0 : direction.x <= 0;

    const diveX = this.startX + (goesRight ? 1 : -1) * 115;
    const diveY = this.startY + 28;

    this.scene.tweens.add({
      targets: this.sprite,
      x: diveX,
      y: diveY,
      duration: 480,
      ease: "Power3",
    });
  }

  resetPosition() {
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.startX,
      y: this.startY,
      duration: 380,
      ease: "Power2",
      onComplete: () => this.startSway(),
    });
  }
}
```

---

### 10.5 ScoreEngine

```ts
// src/game/systems/ScoreEngine.ts
import { GAME } from "@/constants/game";
import type { ShotResult, AimDirection } from "@/types/game";
import type { DifficultyManager } from "./DifficultyManager";

export class ScoreEngine {
  constructor(private difficulty: DifficultyManager) {}

  evaluate({
    power,
    timing,
    direction,
    difficulty,
  }: {
    power: number;
    timing: number;
    direction: AimDirection;
    difficulty: number;
  }): ShotResult {
    const result: ShotResult = {
      scored: false,
      saved: false,
      bonus: false,
      points: 0,
      reason: "",
    };

    // ── Miss: too wide ────────────────────────────────────
    const postLimit =
      GAME.POST_LIMIT_BASE - difficulty * GAME.POST_LIMIT_REDUCTION;
    if (Math.abs(direction.x) > postLimit) {
      result.reason = "Wide!";
      return result;
    }

    // ── Miss: too weak ────────────────────────────────────
    const minPower = GAME.MIN_POWER_BASE + difficulty * GAME.MIN_POWER_SLOPE;
    if (power < minPower) {
      result.reason = "Too weak!";
      return result;
    }

    // ── Keeper save chance ────────────────────────────────
    const saved = this.difficulty.keeperSaves({ direction, power });
    if (saved && power < 0.88) {
      result.saved = true;
      result.reason = "Keeper saved it!";
      return result;
    }

    // ── Goal ──────────────────────────────────────────────
    result.scored = true;

    if (timing >= 0.85) {
      // Perfect timing
      result.bonus = true;
      result.points = Math.round(
        GAME.BASE_GOAL_POINTS * GAME.TIMING_MULTIPLIER + GAME.PERFECT_BONUS,
      );
      result.reason = "Perfect shot!";
    } else if (timing >= GAME.MIN_TIMING_TO_SCORE) {
      // Good timing — partial bonus
      result.points = Math.round(GAME.BASE_GOAL_POINTS * (0.6 + timing * 0.4));
      result.reason = "Goal!";
    } else {
      // Scraped in
      result.points = Math.round(GAME.BASE_GOAL_POINTS * 0.6);
      result.reason = "Just in!";
    }

    return result;
  }
}
```

---

### 10.6 DifficultyManager

```ts
// src/game/systems/DifficultyManager.ts
import { getStorage, setStorage } from "@/utils/storage";
import { GAME } from "@/constants/game";
import type { AimDirection } from "@/types/game";

const STORAGE_KEY = "pg_difficulty";

interface DifficultyState {
  playCount: number;
  level: number;
}

export class DifficultyManager {
  private playCount: number;
  private level: number;
  private storageKey: string;

  constructor(playerName: string) {
    this.storageKey = `${STORAGE_KEY}_${playerName}`;

    const stored = getStorage<DifficultyState>(this.storageKey) ?? {
      playCount: 0,
      level: 0,
    };

    this.playCount = stored.playCount + 1;
    this.level = Math.min(
      this.playCount * GAME.DIFFICULTY_PER_PLAY,
      GAME.MAX_DIFFICULTY,
    );

    setStorage(this.storageKey, {
      playCount: this.playCount,
      level: this.level,
    });
  }

  getCurrentLevel(): number {
    return this.level;
  }

  keeperSaves({
    direction,
    power,
  }: {
    direction: AimDirection;
    power: number;
  }): boolean {
    const keeperSkill =
      GAME.KEEPER_BASE_SKILL +
      this.level * (GAME.KEEPER_MAX_SKILL - GAME.KEEPER_BASE_SKILL);

    // High power overcomes keeper skill
    const saveChance = keeperSkill * (1 - power * 0.62);
    return Math.random() < saveChance;
  }

  getTimingBarSpeed(): number {
    return Phaser.Math.Linear(
      GAME.TIMING_BASE_SPEED,
      GAME.TIMING_MAX_SPEED,
      this.level,
    );
  }
}
```

---

## 11. Screen 3 — Result Page

```tsx
// src/app/result/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { saveToLeaderboard } from "@/utils/storage";
import ShotBadge from "@/components/ui/ShotBadge";
import Button from "@/components/ui/Button";

export default function ResultPage() {
  const router = useRouter();
  const { result, playerName, clearResult } = useGameStore();

  useEffect(() => {
    if (!result) {
      router.replace("/menu");
      return;
    }
    // Persist score to local leaderboard
    saveToLeaderboard({
      name: result.playerName,
      score: result.totalScore,
      date: new Date().toISOString(),
      goalsOf5: result.shotResults.filter((s) => s.scored).length,
    });
  }, [result, router]);

  if (!result) return null;

  const goals = result.shotResults.filter((s) => s.scored).length;
  const perfect = result.shotResults.filter((s) => s.bonus).length;
  const isPerfectGame = goals === 5;

  return (
    <main className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#000814] px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[3px] text-gray-500">
            Match Result
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">
            {result.playerName}
          </h2>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
          <span className="text-8xl font-black text-yellow-400 tabular-nums drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]">
            {result.totalScore}
          </span>
          <span className="mt-1 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Points
          </span>
        </div>

        {/* Stats row */}
        <div className="flex w-full justify-around rounded-2xl border border-white/10 bg-white/5 py-4">
          {[
            { label: "Goals", value: `${goals}/5` },
            { label: "Perfect", value: perfect },
            {
              label: "Saved",
              value: result.shotResults.filter((s) => s.saved).length,
            },
            {
              label: "Missed",
              value: result.shotResults.filter((s) => !s.scored && !s.saved)
                .length,
            },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black text-white">
                {stat.value}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Shot badges */}
        <div className="flex gap-3">
          {result.shotResults.map((shot, i) => (
            <ShotBadge key={i} result={shot} index={i} />
          ))}
        </div>

        {/* Perfect game banner */}
        {isPerfectGame && (
          <div className="w-full rounded-xl border border-yellow-400/30 bg-yellow-400/10 py-3 text-center">
            <p className="text-base font-black text-yellow-400">
              🏆 PERFECT GAME!
            </p>
            <p className="text-xs text-yellow-400/70">
              You scored all 5 goals!
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <Button
            onClick={() => router.push("/leaderboard")}
            variant="secondary"
            className="w-full"
          >
            📊 View Leaderboard
          </Button>
          <Button
            onClick={() => {
              clearResult();
              router.push("/menu");
            }}
            variant="primary"
            className="w-full"
          >
            🔁 Play Again
          </Button>
        </div>
      </div>
    </main>
  );
}
```

---

## 12. Screen 4 — Leaderboard Page

```tsx
// src/app/leaderboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLeaderboard } from "@/utils/storage";
import { useGameStore } from "@/store/gameStore";
import LeaderboardRow from "@/components/ui/LeaderboardRow";
import Button from "@/components/ui/Button";
import type { LeaderboardEntry } from "@/types/game";

type Tab = "daily" | "campaign";

export default function LeaderboardPage() {
  const router = useRouter();
  const { result } = useGameStore();
  const [tab, setTab] = useState<Tab>("daily");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const all = getLeaderboard();

    if (tab === "daily") {
      const today = new Date().toDateString();
      setEntries(all.filter((e) => new Date(e.date).toDateString() === today));
    } else {
      setEntries(all);
    }
  }, [tab]);

  const myName = result?.playerName ?? "";
  const myScore = result?.totalScore ?? 0;

  return (
    <main className="flex h-screen w-full flex-col bg-[#000814]">
      {/* Header */}
      <div className="safe-top px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-black text-white">🏆 Leaderboard</h1>
          <div className="w-10" />
        </div>

        {/* Tab switcher */}
        <div className="mt-4 flex rounded-xl border border-white/10 bg-white/5 p-1">
          {(["daily", "campaign"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all ${
                tab === t
                  ? "bg-green-500 text-black shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "daily" ? "📅 Today" : "🏅 Campaign"}
            </button>
          ))}
        </div>
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {entries.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <span className="text-4xl">🎯</span>
            <p className="text-sm text-gray-500">
              No scores yet — be the first!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, i) => (
              <LeaderboardRow
                key={`${entry.name}-${entry.date}`}
                entry={entry}
                rank={i + 1}
                isCurrentPlayer={
                  entry.name === myName && entry.score === myScore
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="safe-bottom px-6 pb-6">
        <Button
          onClick={() => router.push("/menu")}
          variant="primary"
          className="w-full"
        >
          ⚽ Play Again
        </Button>
      </div>
    </main>
  );
}
```

---

## 13. Shared UI Components

### `src/components/ui/Button.tsx`

```tsx
"use client";

import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-black shadow-lg shadow-green-500/20",
  secondary:
    "bg-white/10 hover:bg-white/20 active:bg-white/5 text-white font-semibold border border-white/10",
  ghost: "text-gray-400 hover:text-white",
};

const sizes = {
  sm: "py-2 px-4 text-sm rounded-lg",
  md: "py-3 px-6 text-base rounded-xl",
  lg: "py-4 px-8 text-lg rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "transition-all duration-150 active:scale-95 disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### `src/components/ui/ShotBadge.tsx`

```tsx
import type { ShotResult } from "@/types/game";
import { cn } from "@/utils/cn";

interface Props {
  result: ShotResult;
  index: number;
}

export default function ShotBadge({ result, index }: Props) {
  const icon = result.bonus
    ? "🌟"
    : result.scored
      ? "⚽"
      : result.saved
        ? "🧤"
        : "✗";
  const color = result.bonus
    ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400"
    : result.scored
      ? "border-green-400/50 bg-green-400/10 text-green-400"
      : "border-red-500/30 bg-red-500/10 text-red-400";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border p-2 w-14",
        color,
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold tabular-nums">
        +{result.points}
      </span>
    </div>
  );
}
```

### `src/components/ui/LeaderboardRow.tsx`

```tsx
import type { LeaderboardEntry } from "@/types/game";
import { cn } from "@/utils/cn";

interface Props {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentPlayer: boolean;
}

const RANK_ICONS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardRow({
  entry,
  rank,
  isCurrentPlayer,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
        isCurrentPlayer
          ? "border border-green-400/30 bg-green-400/10"
          : "border border-white/5 bg-white/5",
      )}
    >
      <span className="w-8 text-center text-lg">
        {RANK_ICONS[rank] ?? (
          <span className="text-sm text-gray-500">{rank}</span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "truncate text-sm font-semibold",
            isCurrentPlayer ? "text-green-400" : "text-white",
          )}
        >
          {entry.name}
          {isCurrentPlayer && (
            <span className="ml-2 text-[10px] text-green-400/70">(you)</span>
          )}
        </p>
        <p className="text-[10px] text-gray-500">
          {entry.goalsOf5}/5 goals · {new Date(entry.date).toLocaleDateString()}
        </p>
      </div>
      <span
        className={cn(
          "text-lg font-black tabular-nums",
          isCurrentPlayer ? "text-green-400" : "text-yellow-400",
        )}
      >
        {entry.score}
      </span>
    </div>
  );
}
```

---

## 14. State Management

### `src/store/gameStore.ts`

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MatchResult } from "@/types/game";

interface GameState {
  playerName: string;
  result: MatchResult | null;

  setPlayerName: (name: string) => void;
  setResult: (result: MatchResult) => void;
  clearResult: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      playerName: "",
      result: null,

      setPlayerName: (name) => set({ playerName: name }),
      setResult: (result) => set({ result }),
      clearResult: () => set({ result: null }),
    }),
    {
      name: "pg_game_store", // localStorage key
      // Only persist playerName — result is ephemeral
      partialize: (state) => ({ playerName: state.playerName }),
    },
  ),
);
```

---

## 15. Local Storage Utils

### `src/utils/storage.ts`

```ts
import type { LeaderboardEntry } from "@/types/game";

const LEADERBOARD_KEY = "pg_leaderboard";

export function getStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore — private browsing / storage full
  }
}

export function saveToLeaderboard(entry: LeaderboardEntry): void {
  const existing = getLeaderboard();
  existing.push(entry);
  existing.sort((a, b) => b.score - a.score);
  setStorage(LEADERBOARD_KEY, existing.slice(0, 200));
}

export function getLeaderboard(): LeaderboardEntry[] {
  return getStorage<LeaderboardEntry[]>(LEADERBOARD_KEY) ?? [];
}
```

### `src/utils/cn.ts`

```ts
// Tiny classname helper (or install clsx if preferred)
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
```

---

## 16. Game Config & Constants

Already defined in [Section 10 constants](#srcgameconstantsgamets). Reference it everywhere via:

```ts
import { GAME } from "@/constants/game";
```

This ensures all difficulty tuning lives in one place — easy to hand off to a backend config endpoint later.

---

## 17. Mobile-First Tailwind Patterns

### Prevent bounce scroll on iOS

```css
/* globals.css — already included above */
html,
body {
  overscroll-behavior: none;
}
```

### Safe area for notched phones

```tsx
// In layout.tsx or page wrapper
<div className="safe-top safe-bottom">...</div>
```

### Touch-friendly tap targets

All interactive elements must be at least **44×44px** on mobile:

```tsx
// ✅ Good — large enough tap target
<button className="min-h-[44px] min-w-[44px] px-4 py-3">...</button>

// ❌ Bad — too small on mobile
<button className="p-1 text-xs">...</button>
```

### Landscape lock (optional)

```html
<!-- public/manifest.json -->
{ "orientation": "portrait" }
```

Or via CSS:

```css
@media (orientation: landscape) and (max-height: 500px) {
  body::before {
    content: "Please rotate your phone to portrait mode ⚽";
    display: flex;
    /* full screen overlay */
  }
}
```

---

## 18. Assets Guide

Place all game assets in `/public/assets/` — Next.js serves this at root.

```
public/
└── assets/
    ├── images/
    │   ├── background.png     (800×1600px — stadium at night)
    │   ├── goal.png           (600×350px — goal post, transparent bg)
    │   ├── ball.png           (64×64px)
    │   ├── crowd.png          (800×350px — crowd silhouette)
    │   ├── net_flash.png      (600×300px — white mesh with alpha)
    │   └── keeper.png         (512×196px — 4 frame spritesheet)
    └── audio/
        ├── crowd_ambient.mp3
        ├── kick.mp3
        ├── goal.mp3
        ├── save.mp3
        ├── miss.mp3
        └── whistle.mp3
```

Free sources:

| Asset                | Source                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Ball sprite          | [OpenGameArt soccer ball](https://opengameart.org/content/soccer-ball)                    |
| Sports pack (keeper) | [Kenney.nl Sports Pack](https://kenney.nl/assets/sports-pack)                             |
| Sound effects        | [Freesound.org](https://freesound.org) — search "crowd cheer", "football kick", "whistle" |
| Background           | Midjourney prompt: `football stadium night aerial view, crowd lights, penalty spot`       |

---

## 19. Testing Checklist

### Game mechanics

- [ ] Power bar oscillates green → yellow → red
- [ ] Power bar captures value on pointer release
- [ ] Timing ring rotates at correct speed per difficulty
- [ ] Timing ring returns 0–1 value correctly
- [ ] Ball animates with spin toward goal
- [ ] Aim line tracks finger swipe left/right
- [ ] Goalkeeper dives every shot
- [ ] Shot resolves: Goal / Saved / Miss — correct result
- [ ] Perfect bonus fires on timing ≥ 0.85
- [ ] Score accumulates correctly across all 5 shots
- [ ] Match ends after exactly 5 shots

### Difficulty

- [ ] Play count increments in localStorage per player name
- [ ] 1st session: easy (more goals, slow keeper)
- [ ] After 5+ sessions: noticeably harder
- [ ] Timing bar faster at higher difficulty

### Next.js routing

- [ ] `/` redirects to `/menu`
- [ ] `/game` redirects to `/menu` if no player name
- [ ] Match end navigates to `/result` via `router.push`
- [ ] Result page shows correct data from Zustand store
- [ ] Leaderboard daily tab filters today's scores correctly
- [ ] Play Again from result clears state and returns to menu
- [ ] Back button from leaderboard works

### Phaser + Next.js integration

- [ ] No SSR errors (`window is not defined`, etc.)
- [ ] Game mounts on `/game` page
- [ ] Game properly destroyed on component unmount
- [ ] No memory leaks on repeated play → back → play cycles

### Mobile

- [ ] Renders correctly on 375px width (iPhone SE)
- [ ] Renders correctly on 430px width (iPhone 15 Pro Max)
- [ ] No browser bounce scroll during gameplay
- [ ] Tap/swipe input works on iOS Safari
- [ ] Tap/swipe input works on Android Chrome
- [ ] Notch/safe-area not clipping UI

---

## 20. Backend Hook Points

When you're ready to connect the backend (Node.js + PostgreSQL + Redis), here's exactly where each integration lives:

| Feature               | Current (frontend-only)                | Backend integration point                                                                                                    |
| --------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Auth / OTP            | Skipped                                | Add `AuthScene` or `/auth` page before `/menu`; call `POST /api/auth/otp/send` + `POST /api/auth/otp/verify`                 |
| Player profile        | Zustand + localStorage                 | `GET /api/player/:id` — replace Zustand init                                                                                 |
| Save score            | `saveToLeaderboard()` in `storage.ts`  | `POST /api/scores` with JWT in header; send full shot log for validation                                                     |
| Daily leaderboard     | `getLeaderboard()` filtered by date    | `GET /api/leaderboard/daily` — replace in `LeaderboardPage`                                                                  |
| Campaign leaderboard  | Same localStorage                      | `GET /api/leaderboard/campaign`                                                                                              |
| Difficulty            | `DifficultyManager` reads localStorage | `GET /api/player/difficulty` — replace constructor read                                                                      |
| Anti-cheat            | None                                   | Send `shotLog[]` (power, timing, direction per shot) to backend; server validates plausibility and rejects impossible scores |
| QR entry              | Just a URL param                       | `?ref=QR_CODE_ID` → send `ref` on score save; backend tracks campaign source                                                 |
| `proxy.ts` auth guard | Empty                                  | Check JWT cookie; redirect unauthenticated users to `/auth`                                                                  |
| Admin panel           | None                                   | Separate Next.js `/admin` route group with protected layouts                                                                 |

---

## 21. Build Order

Follow this day-by-day to avoid rework:

| Day   | Task                                                                                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | `create-next-app`, folder structure, Tailwind setup, root layout, `/menu` page with name input                                                              |
| **2** | `PhaserGame.tsx` + `GameCanvas.tsx` wrapper, Phaser dynamic import working, `BootScene` + `PreloadScene` with progress bar, placeholder assets in `/public` |
| **3** | `Ball`, `PowerBar`, `TimingBar` — wired into `GameScene`, shot fires and animates                                                                           |
| **4** | `Goalkeeper` AI, `ScoreEngine`, `DifficultyManager` — shot evaluates correctly, toast shows result                                                          |
| **5** | Zustand store, match ends → `router.push('/result')`, Result page with shot badges                                                                          |
| **6** | Leaderboard page with daily/campaign tabs, localStorage persistence                                                                                         |
| **7** | Sound effects, screen shake, haptics, mobile testing on real devices                                                                                        |
| **8** | Polish: animations, edge cases, landscape lock, safe area fixes, Vercel deploy                                                                              |

---

_Once the game is solid and client-approved, wire up backend at the hook points in Section 20. The frontend code changes are surgical — mostly swapping `localStorage` calls for `fetch` calls._
