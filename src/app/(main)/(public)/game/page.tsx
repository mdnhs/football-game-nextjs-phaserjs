'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/features/game/store/game-store';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import GameCanvas from '@/features/game/components/GameCanvas';

export default function GamePage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const { playerName, setPlayerName } = useGameStore();
  const player = useAuthStore((s) => s.player);

  useEffect(() => {
    if (!ready) return;
    if (player?.displayName && player.displayName !== playerName) {
      setPlayerName(player.displayName);
    }
  }, [ready, player?.displayName, playerName, setPlayerName]);

  useEffect(() => {
    if (!ready) return;
    if (!player?.displayName && !playerName) {
      router.replace('/menu');
    }
  }, [ready, player?.displayName, playerName, router]);

  if (!ready) return null;

  return (
    <main className='relative h-screen w-full overflow-hidden bg-[#000814]'>
      <div className='pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-black/45 to-transparent' />
      <div className='pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-black/35 to-transparent' />
      <GameCanvas />
    </main>
  );
}
