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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute left-1/4 top-2/3 h-64 w-64 rounded-full bg-emerald-600/8 blur-2xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
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

        <Button
          onClick={handlePlay}
          className="w-full"
          size="lg"
          variant="primary"
        >
          🎯 PLAY NOW
        </Button>

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
