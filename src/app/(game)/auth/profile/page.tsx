"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { useAuthStore, type AuthPlayer } from "@/store/authStore";
import { api, ApiError } from "@/lib/api-client";
import Button from "@/components/ui/game-button";

interface CompleteProfileResult {
  token: string;
  player: AuthPlayer;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { token, isPending, player, setAuth } = useAuthStore();
  const [displayName, setDisplayName] = useState(player?.display_name ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/auth");
    } else if (!isPending && player) {
      router.replace("/menu");
    }
  }, [token, isPending, player, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError("Name must be 2–30 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await api<CompleteProfileResult>(
        "/api/auth/complete-profile",
        {
          method: "POST",
          body: { displayName: trimmed },
        },
      );
      setAuth(result.token, result.player, false);
      router.replace("/menu");
    } catch (err) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#000814] px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-green-500/12 to-transparent" />
        <div className="absolute bottom-0 h-56 w-full bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.1),transparent_65%)]" />
      </div>

      <form
        onSubmit={onSubmit}
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-green-300/20 bg-green-400/10 shadow-[0_0_36px_rgba(34,197,94,0.22)]">
            <User className="h-9 w-9 text-green-300" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Create profile
          </h1>
          <p className="max-w-64 text-sm text-gray-400">
            Pick the display name that will appear on the leaderboard.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-[#071225]/80 p-4 shadow-2xl shadow-black/20 backdrop-blur-sm">
          <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Display name
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 transition-all focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-400/20">
            <User className="h-4 w-4 shrink-0 text-gray-500" />
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setError("");
            }}
            placeholder="Your name..."
            maxLength={30}
              className="w-full bg-transparent py-3.5 text-base text-white outline-none placeholder:text-gray-500"
          />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
            variant="primary"
          >
            {loading ? "Saving…" : "Continue"}
          </Button>
        </div>
      </form>
    </main>
  );
}
