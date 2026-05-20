"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getLeaderboard } from "@/utils/storage";
import { useGameStore } from "@/store/gameStore";
import LeaderboardRow from "@/components/ui/LeaderboardRow";
import Button from "@/components/ui/game-button";
import type { LeaderboardEntry } from "@/types/game";

type Tab = "daily" | "campaign";

const EMPTY_LEADERBOARD = "[]";
const subscribeLeaderboard = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getSnapshot = () => JSON.stringify(getLeaderboard());
const getServerSnapshot = () => EMPTY_LEADERBOARD;

export default function LeaderboardPage() {
  const router = useRouter();
  const { result } = useGameStore();
  const [tab, setTab] = useState<Tab>("daily");
  const allSerialized = useSyncExternalStore(
    subscribeLeaderboard,
    getSnapshot,
    getServerSnapshot,
  );
  const all = useMemo(
    () => JSON.parse(allSerialized) as LeaderboardEntry[],
    [allSerialized],
  );

  const entries = useMemo(() => {
    if (tab === "daily") {
      const today = new Date().toDateString();
      return all.filter((e) => new Date(e.date).toDateString() === today);
    }
    return all;
  }, [tab, all]);

  const myName = result?.playerName ?? "";
  const myScore = result?.totalScore ?? 0;

  return (
    <main className="flex h-screen w-full flex-col bg-[#000814]">
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
