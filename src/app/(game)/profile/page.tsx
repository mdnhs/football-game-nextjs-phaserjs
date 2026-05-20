"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Phone, RotateCcw, X } from "lucide-react";
import { useAuthStore, type AuthPlayer } from "@/store/authStore";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, ApiError } from "@/lib/api-client";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/game-button";

interface MePlayer {
  id: string;
  display_name: string;
  phone: string;
  play_count: number;
  created_at: string;
}

interface RankResponse {
  rank: number | null;
  score: number | null;
}

function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}•••••${phone.slice(-3)}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const player = useAuthStore((s) => s.player);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [me, setMe] = useState<MePlayer | null>(null);
  const [playsRemaining, setPlaysRemaining] = useState<number | null>(null);
  const [rank, setRank] = useState<RankResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    (async () => {
      try {
        const [meRes, playsRes, rankRes] = await Promise.all([
          api<MePlayer>("/api/players/me"),
          api<{ remaining: number }>("/api/players/me/plays-remaining"),
          api<RankResponse>("/api/leaderboard/my-rank?type=campaign"),
        ]);
        if (cancelled) return;
        setMe(meRes);
        setPlaysRemaining(playsRes.remaining);
        setRank(rankRes);
        setNewName(meRes.display_name);
      } catch {
        // silently ignored
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = newName.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError("Name must be 2–30 characters");
      return;
    }
    if (trimmed === me?.display_name) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await api<{ token: string; player: AuthPlayer }>(
        "/api/auth/complete-profile",
        {
          method: "POST",
          body: { displayName: trimmed },
        },
      );
      setAuth(res.token, res.player, false);
      setMe((prev) => (prev ? { ...prev, display_name: res.player.display_name } : prev));
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden bg-[#000814]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-green-500/12 to-transparent" />
        <div className="absolute bottom-0 h-60 w-full bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.1),transparent_65%)]" />
      </div>

      <TopBar showBack title="Profile" />

      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 pt-4">
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#071225]/80 px-4 py-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-3xl font-black text-black shadow-[0_0_40px_rgba(0,230,118,0.3)]">
              {(player?.display_name ?? "?").charAt(0).toUpperCase()}
            </div>

            {editing ? (
              <form onSubmit={saveName} className="flex w-full flex-col items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setError("");
                  }}
                  maxLength={30}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center text-lg font-bold text-white outline-none transition-all focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setNewName(me?.display_name ?? "");
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/10"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">
                  {me?.display_name ?? player?.display_name ?? "—"}
                </h2>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                  aria-label="Edit name"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}

            <p className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Phone className="h-3.5 w-3.5" />
              {loading ? "…" : me ? maskPhone(me.phone) : "—"}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3">
            <StatCard label="Total matches" value={loading ? "…" : (me?.play_count ?? 0)} />
            <StatCard
              label="Plays today"
              value={loading ? "…" : (playsRemaining ?? 0)}
              suffix={loading || playsRemaining === null ? undefined : "left"}
            />
            <StatCard
              label="Best score"
              value={loading || !rank ? "…" : (rank.score ?? "—")}
              accent="gold"
            />
            <StatCard
              label="Campaign rank"
              value={loading || !rank ? "…" : rank.rank ? `#${rank.rank}` : "—"}
              accent="green"
            />
          </div>

          <Button
            onClick={() => router.push("/menu")}
            className="w-full"
            variant="primary"
            size="lg"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Back to Menu
            </span>
          </Button>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: "gold" | "green";
}) {
  const valueColor =
    accent === "gold"
      ? "text-yellow-300"
      : accent === "green"
        ? "text-green-400"
        : "text-white";
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className={`text-2xl font-black tabular-nums ${valueColor}`}>
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-semibold text-gray-500">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
