<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-overview -->

# Project: Football Goal Shooting Game

Mobile-first web-based football penalty shooting game built for a campaign.
Full build guide: `football-game-build-guide.md` in project root.

**Stack:** Next.js 16 · Tailwind CSS v4 · Phaser.js · TypeScript · Zustand

<!-- END:project-overview -->

<!-- BEGIN:nextjs16-rules -->

# Next.js 16 Rules

- `params` and `searchParams` are always async — always `await` them
- Use `proxy.ts` NOT `middleware.ts` (deprecated in Next.js 16)
- Turbopack is the default bundler — do NOT add webpack config unless Phaser breaks
- `reactCompiler: true` is enabled — no manual `useMemo`/`useCallback` needed
- Tailwind v4: use `@import "tailwindcss"` in `globals.css`, NOT `@tailwind base/components/utilities`
- Node.js 20.9+ required
<!-- END:nextjs16-rules -->

<!-- BEGIN:phaser-rules -->

# Phaser.js Rules

Phaser accesses `window`/`document`/WebGL at import time. It CANNOT run on the server.

Two layers of protection are ALWAYS required:

1. In `src/components/game/GameCanvas.tsx` — dynamic import with `ssr: false`:

   ```ts
   const PhaserGame = dynamic(() => import("./PhaserGame"), { ssr: false });
   ```

2. In `src/components/game/PhaserGame.tsx` — `'use client'` + lazy import inside `useEffect`:
   ```ts
   "use client";
   const Phaser = (await import("phaser")).default;
   ```

- NEVER import Phaser at the top level of any file
- NEVER use Phaser in a Server Component
- Pass `router` and Zustand `setResult` into Phaser via `game.registry` in `postBoot` callback
- All assets go in `/public/assets/` — Phaser loads them as `/assets/...`
- Destroy the game instance on component unmount: `gameRef.current?.destroy(true)`
<!-- END:phaser-rules -->

<!-- BEGIN:folder-rules -->

# Folder Structure Rules

- `src/app/` — Next.js App Router pages only (no game logic here)
- `src/game/` — all Phaser scenes, objects, and systems (no React/Next.js imports here)
- `src/components/game/` — React wrappers for Phaser (`PhaserGame.tsx`, `GameCanvas.tsx`)
- `src/components/ui/` — shared Tailwind UI components (`Button`, `ShotBadge`, `LeaderboardRow`)
- `src/store/` — Zustand stores only
- `src/utils/` — pure utility functions (`storage.ts`, `cn.ts`, `mathUtils.ts`)
- `src/types/` — shared TypeScript interfaces (`game.ts`)
- `src/constants/` — game tuning constants (`game.ts`) — all difficulty values live here
- `public/assets/` — all Phaser game assets (images, audio)
<!-- END:folder-rules -->

<!-- BEGIN:routing-rules -->

# Routing Rules

- `/` redirects to `/menu`
- `/menu` — player name entry (Tailwind UI, `'use client'`)
- `/game` — Phaser canvas only; redirects to `/menu` if no `playerName` in store
- `/result` — match result (Tailwind UI); redirects to `/menu` if no `result` in store
- `/leaderboard` — daily + campaign tabs (Tailwind UI)

Game ends by calling `router.push('/result')` from inside `GameScene` via `this.registry.get('router')`.

<!-- END:routing-rules -->

<!-- BEGIN:state-rules -->

# State Rules

- Zustand store (`src/store/gameStore.ts`) is the bridge between Phaser and Next.js pages
- `playerName` is persisted to localStorage via `zustand/middleware persist`
- `result` (MatchResult) is NOT persisted — ephemeral per session
- Pass Zustand's `setResult` into Phaser via `game.registry.set('setResult', ...)` in `postBoot`
- Phaser scenes NEVER import React or Zustand directly
<!-- END:state-rules -->

<!-- BEGIN:style-rules -->

# Styling Rules

- Tailwind CSS for ALL UI outside the Phaser canvas
- Dark theme: base background `#000814`
- Primary accent: `#00e676` (green)
- Score/highlight color: `#FFD700` (gold)
- All interactive elements minimum `44×44px` tap target on mobile
- Use `cn()` utility (`src/utils/cn.ts`) for conditional classnames
- Safe area classes: `safe-top`, `safe-bottom` (defined in `globals.css`)
- `overscroll-behavior: none` on `html, body` — prevents pull-to-refresh during gameplay
<!-- END:style-rules -->

<!-- BEGIN:game-rules -->

# Game Rules (DO NOT change without client approval)

- Each match has exactly 5 shots (`GAME.TOTAL_SHOTS = 5`)
- Goal = 100 base points; Perfect shot (timing ≥ 0.85) = 200 points
- Miss = 0 points; Saved = 0 points
- Difficulty increases with repeat plays per player name (stored in localStorage)
- All difficulty constants live in `src/constants/game.ts` — tune there, not inline
<!-- END:game-rules -->

<!-- BEGIN:backend-hooks -->

# Backend Hook Points (not yet implemented)

When backend is ready, these are the ONLY files that need changes:

| What                 | File                                                | Change                                                       |
| -------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Auth / OTP           | Add `/auth` page before `/menu`                     | `POST /api/auth/otp/send` + verify                           |
| Save score           | `src/utils/storage.ts` → `saveToLeaderboard()`      | Replace with `POST /api/scores`                              |
| Daily leaderboard    | `src/app/leaderboard/page.tsx`                      | Replace `getLeaderboard()` with `GET /api/leaderboard/daily` |
| Campaign leaderboard | Same file, campaign tab                             | `GET /api/leaderboard/campaign`                              |
| Difficulty           | `src/game/systems/DifficultyManager.ts` constructor | Replace localStorage read with `GET /api/player/difficulty`  |
| Auth guard           | `src/proxy.ts`                                      | Check JWT cookie, redirect to `/auth`                        |

Do NOT refactor game logic when wiring up backend — only swap data sources.

<!-- END:backend-hooks -->
