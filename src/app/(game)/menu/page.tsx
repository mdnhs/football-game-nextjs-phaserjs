"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Medal, Play, Target, Timer, Trophy, User, Zap } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api-client";
import Button from "@/components/ui/game-button";
import TopBar from "@/components/layout/TopBar";

interface RankResponse {
  rank: number | null;
  score: number | null;
}

export default function MenuPage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const { setPlayerName } = useGameStore();
  const player = useAuthStore((s) => s.player);
  const [playsRemaining, setPlaysRemaining] = useState<number | null>(null);
  const [rank, setRank] = useState<RankResponse | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (player?.display_name) setPlayerName(player.display_name);

    (async () => {
      try {
        const [plays, rk] = await Promise.all([
          api<{ remaining: number }>("/api/players/me/plays-remaining"),
          api<RankResponse>("/api/leaderboard/my-rank?type=campaign"),
        ]);
        setPlaysRemaining(plays.remaining);
        setRank(rk);
      } catch {
        // ignore
      }
    })();
  }, [ready, player?.display_name, setPlayerName]);

  if (!ready) return null;

  const outOfPlays = playsRemaining === 0;

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden bg-[#000814]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-green-500/12 to-transparent" />
        <div className="absolute bottom-0 h-52 w-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.13),transparent_65%)]" />
      </div>

      <TopBar />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-between gap-5 overflow-y-auto px-6 py-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 pt-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-green-300/20 bg-green-400/10 shadow-[0_0_36px_rgba(34,197,94,0.22)]">
            <Target className="h-10 w-10 text-green-300" />
          </div>
          <h1 className="text-center text-3xl font-black tracking-tight text-white">
            PENALTY
            <span className="ml-2 text-green-400">SHOWDOWN</span>
          </h1>
          <p className="text-center text-sm text-gray-400">
            5 shots · Score goals · Top the board
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Plays left today"
              value={playsRemaining === null ? "…" : `${playsRemaining}`}
              accent={outOfPlays ? "red" : "green"}
            />
            <Stat
              label="Best score"
              value={rank?.score ?? "—"}
              accent="gold"
            />
          </div>

          {rank?.rank && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-center">
              <Medal className="h-4 w-4 text-yellow-300" />
              <p className="text-xs font-semibold text-yellow-200/90">
                Campaign rank{" "}
                <span className="font-black text-yellow-400">
                  #{rank.rank}
                </span>
              </p>
            </div>
          )}

          <Button
            onClick={() => router.push("/game")}
            className="w-full"
            size="lg"
            variant="primary"
            disabled={outOfPlays}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Play className="h-5 w-5 fill-current" />
              {outOfPlays ? "Daily limit reached" : "PLAY NOW"}
            </span>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => router.push("/leaderboard")}
              variant="secondary"
              className="w-full"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-300" />
                Leaderboard
              </span>
            </Button>
            <Button
              onClick={() => router.push("/profile")}
              variant="secondary"
              className="w-full"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <User className="h-4 w-4 text-green-300" />
                Profile
              </span>
            </Button>
          </div>
        </div>

        <div className="grid w-full max-w-sm grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#071225]/70 p-3 backdrop-blur-sm">
          {[
            { icon: Target, label: "Aim", desc: "Swipe to aim" },
            { icon: Zap, label: "Power", desc: "Hold to charge" },
            { icon: Timer, label: "Timing", desc: "Hit the zone" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-0.5 text-center"
            >
              <item.icon className="mb-1 h-5 w-5 text-green-300" />
              <span className="text-[11px] font-bold text-white">
                {item.label}
              </span>
              <span className="text-[9px] text-gray-400">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "green" | "gold" | "red";
}) {
  const color =
    accent === "green"
      ? "text-green-400"
      : accent === "gold"
        ? "text-yellow-400"
        : "text-red-400";
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className={`text-xl font-black tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
