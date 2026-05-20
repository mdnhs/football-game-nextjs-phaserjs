"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, ApiError } from "@/lib/api-client";
import ShotBadge from "@/components/ui/ShotBadge";
import Button from "@/components/ui/game-button";

type SubmitStatus = "idle" | "submitting" | "saved" | "flagged" | "error";

export default function ResultPage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const { result, clearResult } = useGameStore();
  const qrRef = useAuthStore((s) => s.qrRef);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!result) {
      router.replace("/menu");
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;
    setStatus("submitting");

    const goalsCount = result.shotResults.filter((s) => s.scored).length;
    const perfectCount = result.shotResults.filter((s) => s.bonus).length;

    (async () => {
      try {
        const res = await api<{ scoreId: string; flagged: boolean; reason?: string }>(
          "/api/scores",
          {
            method: "POST",
            body: {
              totalScore: result.totalScore,
              goals: goalsCount,
              perfectShots: perfectCount,
              difficulty: result.difficulty,
              shotLog: result.shotLog,
              ...(qrRef ? { qrRef } : {}),
            },
          },
        );
        if (res.flagged) {
          setStatus("flagged");
          setStatusMessage(res.reason ?? "Score under review");
        } else {
          setStatus("saved");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setStatusMessage(
          err instanceof ApiError ? err.message : "Failed to save score",
        );
      }
    })();
  }, [ready, result, qrRef, router]);

  if (!ready || !result) return null;

  const goals = result.shotResults.filter((s) => s.scored).length;
  const perfect = result.shotResults.filter((s) => s.bonus).length;
  const isPerfectGame = goals === 5;

  return (
    <main className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#000814] px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[3px] text-gray-500">
            Match Result
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">
            {result.playerName}
          </h2>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-8xl font-black text-yellow-400 tabular-nums drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]">
            {result.totalScore}
          </span>
          <span className="mt-1 text-sm font-semibold uppercase tracking-widest text-gray-400">
            Points
          </span>
        </div>

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

        <div className="flex gap-3">
          {result.shotResults.map((shot, i) => (
            <ShotBadge key={i} result={shot} index={i} />
          ))}
        </div>

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

        <div className="w-full text-center text-xs">
          {status === "submitting" && (
            <p className="text-gray-400">Saving score…</p>
          )}
          {status === "saved" && (
            <p className="text-green-400">✓ Score saved</p>
          )}
          {status === "flagged" && (
            <p className="text-yellow-400">
              ⚠ Score flagged for review{statusMessage ? `: ${statusMessage}` : ""}
            </p>
          )}
          {status === "error" && (
            <p className="text-red-400">{statusMessage}</p>
          )}
        </div>

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
