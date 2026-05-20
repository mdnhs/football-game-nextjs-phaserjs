"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Medal, RotateCcw, Trophy } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api-client";
import LeaderboardRow from "@/components/ui/LeaderboardRow";
import Button from "@/components/ui/game-button";
import TopBar from "@/components/layout/TopBar";
import type { LeaderboardEntry } from "@/types/game";

type Tab = "daily" | "campaign";

interface ApiLeaderboardEntry {
  player_id: string;
  display_name: string;
  best_score: number;
  best_goals: number;
  matches_played: number;
}

interface RankResponse {
  rank: number | null;
  score: number | null;
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function mapEntries(rows: ApiLeaderboardEntry[]): LeaderboardEntry[] {
  const today = new Date().toISOString();
  return rows.map((r) => ({
    playerId: r.player_id,
    name: r.display_name,
    score: r.best_score,
    date: today,
    goalsOf5: r.best_goals,
  }));
}

export default function LeaderboardPage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const player = useAuthStore((s) => s.player);
  const [tab, setTab] = useState<Tab>("daily");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<RankResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const path =
          tab === "daily"
            ? `/api/leaderboard/daily?date=${todayIso()}&limit=50`
            : "/api/leaderboard/campaign?limit=100";
        const rankPath =
          tab === "daily"
            ? `/api/leaderboard/my-rank?type=daily&date=${todayIso()}`
            : "/api/leaderboard/my-rank?type=campaign";
        const [rows, rank] = await Promise.all([
          api<ApiLeaderboardEntry[]>(path),
          api<RankResponse>(rankPath),
        ]);
        if (!cancelled) {
          setEntries(mapEntries(rows));
          setMyRank(rank);
        }
      } catch {
        if (!cancelled) {
          setEntries([]);
          setMyRank(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, tab]);

  if (!ready) return null;

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden bg-[#000814]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-yellow-400/10 to-transparent" />
        <div className="absolute bottom-0 h-60 w-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_68%)]" />
      </div>

      <TopBar showBack title="Leaderboard" />

      <div className="relative z-10 px-6 pb-4 pt-2">
        <div className="flex rounded-2xl border border-white/10 bg-[#071225]/80 p-1 backdrop-blur-sm">
          {(["daily", "campaign"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold capitalize transition-all ${
                tab === t
                  ? "bg-green-500 text-black shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "daily" ? (
                <>
                  <CalendarDays className="h-4 w-4" /> Today
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" /> Campaign
                </>
              )}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-300/10 text-yellow-300">
                <Medal className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Your {tab} rank
                </p>
                <p className="truncate text-sm font-bold text-white">
                  {myRank?.rank ? `#${myRank.rank}` : "Not ranked yet"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Best
              </p>
              <p className="text-lg font-black tabular-nums text-yellow-300">
                {myRank?.score ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-4">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-gray-500">Loading…</p>
          </div>
        ) : entries.length === 0 ? (
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
                key={`${entry.name}-${i}`}
                entry={entry}
                rank={i + 1}
                isCurrentPlayer={entry.playerId === player?.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="safe-bottom relative z-10 px-6 pb-6">
        <Button
          onClick={() => router.push("/menu")}
          variant="primary"
          className="w-full"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </span>
        </Button>
      </div>
    </main>
  );
}
