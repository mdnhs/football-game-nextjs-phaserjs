# ⚽ Football Goal Shooting Game

Penalty Showdown is a high-performance, mobile-first penalty shootout game built with **Next.js 16** and **Phaser.js**.

> **Stack:** Next.js 16 (App Router, Turbopack) · Tailwind CSS v4 · Phaser.js · TypeScript · Zustand

---

## 📸 Screenshots

| Menu Screen | Gameplay | Result Screen |
| :---: | :---: | :---: |
| ![Menu](/public/assets/images/screenshot-menu.png) | ![Gameplay](/public/assets/images/screenshot-game.png) | ![Result](/public/assets/images/screenshot-result.png) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.9.0 or higher

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd football-game

# Install dependencies
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to play.

---

## 🏗️ Architecture

The project follows a hybrid architecture combining the best of Next.js for UI/Routing and Phaser for the core game engine.

- **Next.js App Router**: Handles page transitions (/menu, /game, /result, /leaderboard).
- **Phaser.js**: Handles WebGL rendering, physics, and game loops.
- **Zustand**: Manages shared state between the Phaser engine and Next.js UI.
- **Dynamic Imports**: Phaser is loaded with `ssr: false` to ensure compatibility with Next.js Server Components.

---

## 📁 Folder Structure

```
src/
├── app/              # Next.js Pages & Layouts
├── components/       # React components (UI & Phaser Wrapper)
├── game/             # Core Phaser Game Logic
│   ├── scenes/       # Phaser Scenes (Boot, Preload, Game)
│   ├── objects/      # Game Entities (Ball, Goalkeeper, Bars)
│   └── systems/      # Game Rules (Score, Difficulty)
├── store/            # Zustand State Management
├── constants/        # Game tuning constants
└── utils/            # Shared helpers
```

---

## 🎯 Game Mechanics

- **5 Shots per Match**: Aim to get the highest total score.
- **Aiming**: Swipe or drag to aim the ball.
- **Power Bar**: Hold to charge power; release at the right time.
- **Timing Bar**: Hit the perfect zone for a precision bonus.
- **Dynamic Difficulty**: The goalkeeper gets smarter and faster as you play more matches.

---

## 🛠️ Tech Stack Details

- **Next.js 16**: Utilizing the latest App Router features and Turbopack.
- **Tailwind CSS v4**: Modern, utility-first styling with zero-runtime CSS.
- **Phaser 3**: Robust 2D game framework for the shooting mechanics.
- **TypeScript**: Full type safety across both UI and Game code.

---

## 📜 License

MIT
