<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-overview -->

# Project: Football Goal Shooting Game

Mobile-first web-based football penalty shooting game built for campaign.
Full build guide: `football-game-build-guide.md` in project root.

**Stack:** Next.js 16 · Tailwind CSS v4 · Phaser.js · TypeScript · Zustand · TanStack Query · Firebase Auth

<!-- END:project-overview -->

<!-- BEGIN:nextjs16-rules -->

# Next.js 16 Rules

- `params` `searchParams` are always async — always `await` them
- Use `proxy.ts` NOT `middleware.ts` (deprecated in Next.js 16)
- Turbopack is default bundler — do NOT add webpack config unless Phaser breaks
- `reactCompiler: true` is enabled — no manual `useMemo`/`useCallback` needed
- Tailwind v4: use `@import "tailwindcss"` in `globals.css` NOT `@tailwind base/components/utilities`
- Node.js 20.9+ required

<!-- END:nextjs16-rules -->

<!-- BEGIN:phaser-rules -->

# Phaser.js Rules

Phaser accesses `window`/`document`/WebGL at import time. It CANNOT run on server.

Two layers of protection are ALWAYS required:

1. In `src/features/game/components/GameCanvas.tsx` — dynamic import w/ `ssr: false`

   ```ts
   const PhaserGame = dynamic(() => import('./PhaserGame'), { ssr: false });
   ```

2. In `src/features/game/components/PhaserGame.tsx` — `'use client'` + lazy import inside `useEffect`
   ```ts
   'use client';
   const Phaser = (await import('phaser')).default;
   ```

- NEVER import Phaser at top level of any file
- NEVER use Phaser in Server Component
- Pass `router` and Zustand `setResult` into Phaser via `game.registry` in `postBoot` callback
- All assets go in `/public/assets/` — Phaser loads them as `/assets/...`
- Destroy game instance on component unmount: `gameRef.current?.destroy(true)`

<!-- END:phaser-rules -->

<!-- BEGIN:folder-rules -->

# Folder Structure Rules (post skill reorg)

This project follows the project-architect skill layout (`.claude/skills/project-architect/SKILL.md`).
New code MUST live inside a feature module, NOT in root-level `src/store|game|utils|constants`.

## App router (route groups)

- `src/app/(auth)/` — public auth-gated pages (`/auth`, `/auth/profile`, `/admin-panel/login`)
- `src/app/(main)/(public)/` — public game pages (`/`, `/menu`, `/game`, `/result`, `/leaderboard`, `/profile`, `/unauthorized`, `/maintenance`)
- `src/app/(main)/(protected)/(dashboard_layout)/` — admin shell (`/admin-panel/*`)
- `src/app/(main)/(protected)/(global_layout)/` — protected non-dashboard pages
- App router pages contain NO business logic — they render feature components

## Feature modules (`src/features/<feature>/`)

Per-feature folders contain everything that feature owns:

```
src/features/<feature>/
├── components/         # feature UI
├── hooks/api/{query,mutation}/   # TanStack Query hooks
├── services/{api,service,mapper}.ts   # raw HTTP, ServiceResponse wrapping, snake↔camel
├── store/              # feature-local Zustand store (if needed)
├── types/              # feature types (ApiResponse + camelCase domain types)
├── utils/{constants,query-keys}.ts
└── validations/        # Zod schemas
```

Current features:

- `features/game/` — Phaser scenes/objects/systems, game store, types, constants
  - `phaser/{config,objects,scenes,systems}` — all Phaser code (no React/Zustand imports here)
  - `components/{GameCanvas,PhaserGame}.tsx` — React wrappers
  - `store/game-store.ts` — `playerName` (persisted) + ephemeral `result`
  - `utils/constants.ts` — `GAME` difficulty/score constants
- `features/auth/` — Firebase phone OTP + profile completion
  - `store/auth-store.ts` — token, player, qrRef (persisted)
  - `hooks/use-require-auth.ts` — client guard, redirects to `/auth`
- `features/player/` — current player data (me, plays-remaining)
- `features/score/` — score submission
- `features/leaderboard/` — daily + campaign + my-rank
- `features/admin/` — admin shell, sidebar, server-side admin auth/format

## Shared layers (`src/lib/`, `src/components/`, `src/contexts/`)

- `src/lib/utils.ts` — `cn()` only
- `src/lib/font.ts` — Geist font (re-exported, never inline in layout)
- `src/lib/constants.ts` — app-wide non-feature constants
- `src/lib/routes/{api,app}-routes.ts` — typed route maps
- `src/lib/api-client/index.ts` — structured HTTP client (skill version). Use for NEW endpoints.
- `src/lib/api-client/legacy.ts` — old `api()` helper. Existing pages still use it; migrate to structured client + service layer as features get touched.
- `src/lib/api-client/debug.ts` — request/response logger
- `src/lib/permission/` — bitfield compress/decompress + ROUTE_PERMISSIONS + gates (Firebase token claims TODO)
- `src/lib/firebase.ts` — Firebase client init
- `src/components/ui/` — shadcn primitives + game-specific UI (`ShotBadge`, `LeaderboardRow`, `game-button`)
- `src/components/layout/{header,sidebar,theme-toggle}` — shared chrome
- `src/contexts/ProviderWrapper.tsx` — wraps app with QueryProvider → ThemeProvider → LoadingOverlayProvider
- `src/contexts/{QueryProvider,ThemeProvider,LoadingOverlayProvider}.tsx` — individual providers

## Other

- `public/assets/` — all Phaser game assets (images, audio)
- `public/fonts/` — local fonts (if any)

<!-- END:folder-rules -->

<!-- BEGIN:routing-rules -->

# Routing Rules

- `/` — `HomeRedirect` (`(main)/(public)/page.tsx`) → `/menu`, `/auth`, or `/auth/profile` based on auth state
- `/auth` — Firebase phone OTP entry (under `(auth)` group)
- `/auth/profile` — display-name capture for new users
- `/menu` — player home; shows plays-remaining + campaign rank
- `/game` — Phaser canvas only; redirects to `/menu` if no `playerName` in store
- `/result` — match result (Tailwind UI); redirects to `/menu` if no `result` in store
- `/leaderboard` — daily + campaign tabs
- `/profile` — current user profile + name edit
- `/admin-panel/*` — admin dashboard (gated by admin auth)
- `/admin-panel/login` — admin login (under `(auth)` group)
- `/unauthorized`, `/maintenance` — generic gate pages

Game ends by calling `router.push('/result')` from inside `GameScene` via `this.registry.get('router')`.

<!-- END:routing-rules -->

<!-- BEGIN:state-rules -->

# State Rules

- Zustand store (`src/features/game/store/game-store.ts`) is bridge btw Phaser and Next.js pages
- `playerName` is persisted to localStorage via `zustand/middleware persist`
- `result` (MatchResult) is NOT persisted — ephemeral per session
- Auth state (`src/features/auth/store/auth-store.ts`) — `token`, `player`, `qrRef`, `isPending` — all persisted
- Pass Zustand's `setResult` into Phaser via `game.registry.set('setResult', ...)` in `postBoot`
- Phaser scenes NEVER import React or Zustand directly
- Server-state (API responses) → TanStack Query hooks under `features/<feature>/hooks/api/`. Do NOT store in Zustand.

<!-- END:state-rules -->

<!-- BEGIN:style-rules -->

# Styling Rules

- Tailwind CSS for ALL UI outside Phaser canvas
- Dark theme: base background `#000814`
- Primary accent: `#00e676` (green)
- Score/highlight color: `#FFD700` (gold)
- All interactive elements minimum `44×44px` tap target on mobile
- Use `cn()` utility (`@/lib/utils`) for conditional classnames
- Safe area classes: `safe-top` `safe-bottom` (defined in `globals.css`)
- `overscroll-behavior: none` on `html, body` — prevents pull-to-refresh during gameplay

<!-- END:style-rules -->

<!-- BEGIN:game-rules -->

# Game Rules (DO NOT change without client approval)

- Each match has exactly 5 shots (`GAME.TOTAL_SHOTS = 5`)
- Goal = 100 base points; Perfect shot (timing ≥ 0.85) = 200 points
- Miss = 0 points; Saved = 0 points
- Difficulty increases w/ repeat plays per player name (stored in localStorage)
- All difficulty constants live in `src/features/game/utils/constants.ts` — tune there, not inline

<!-- END:game-rules -->

<!-- BEGIN:backend-hooks -->

# Backend Hook Points

Backend integration is now done at the feature module's service layer.
Add new endpoints to `src/lib/routes/api-routes.ts`, then build `services/api.ts` + `services/service.ts` + `hooks/api/{query,mutation}/` per the new-feature skill (`.claude/skills/new-feature/SKILL.md`).

| What                 | Endpoint                                   | Feature module                                                                     |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| Auth / OTP verify    | `POST /api/auth/verify-otp`                | `features/auth/`                                                                   |
| Complete profile     | `POST /api/auth/complete-profile`          | `features/auth/`                                                                   |
| Current player       | `GET /api/players/me`                      | `features/player/`                                                                 |
| Plays remaining      | `GET /api/players/me/plays-remaining`      | `features/player/`                                                                 |
| Save score           | `POST /api/scores`                         | `features/score/`                                                                  |
| Daily leaderboard    | `GET /api/leaderboard/daily?date=&limit=`  | `features/leaderboard/`                                                            |
| Campaign leaderboard | `GET /api/leaderboard/campaign?limit=`     | `features/leaderboard/`                                                            |
| My rank              | `GET /api/leaderboard/my-rank?type=&date=` | `features/leaderboard/`                                                            |
| Difficulty           | `GET /api/player/difficulty` (TODO)        | `features/game/phaser/systems/DifficultyManager.ts` — currently reads localStorage |
| Auth guard           | `src/proxy.ts`                             | Check JWT cookie, redirect to `/auth` (TODO)                                       |

Do NOT refactor game logic when wiring up backend — only swap data sources.

<!-- END:backend-hooks -->
