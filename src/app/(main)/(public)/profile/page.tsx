'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pencil, Phone, RotateCcw, X } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { useCurrentPlayer } from '@/features/player/hooks/api/query/use-current-player';
import { usePlaysRemaining } from '@/features/player/hooks/api/query/use-plays-remaining';
import { useMyRank } from '@/features/leaderboard/hooks/api/query/use-my-rank';
import { useCompleteProfile } from '@/features/auth/hooks/api/mutation/use-complete-profile';
import { displayNameSchema } from '@/features/auth/validations/auth-schema';
import TopBar from '@/components/layout/header/top-bar';
import Button from '@/components/ui/game-button';

function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}•••••${phone.slice(-3)}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const player = useAuthStore((s) => s.player);
  const setAuth = useAuthStore((s) => s.setAuth);

  const meQuery = useCurrentPlayer(ready);
  const playsRemainingQuery = usePlaysRemaining(ready);
  const myRankQuery = useMyRank({ type: 'campaign' }, ready);
  const completeProfileMutation = useCompleteProfile();

  const me = meQuery.data?.data ?? null;
  const playsRemaining = playsRemainingQuery.data?.data?.remaining ?? null;
  const rank = myRankQuery.data?.data ?? null;
  const loading = meQuery.isPending;

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  function startEditing() {
    setNewName(me?.displayName ?? '');
    setError('');
    setEditing(true);
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const parsed = displayNameSchema.safeParse(newName);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid name');
      return;
    }
    if (parsed.data === me?.displayName) {
      setEditing(false);
      return;
    }

    const response = await completeProfileMutation.mutateAsync({ displayName: parsed.data });
    if (response.error || !response.data) {
      setError(response.message);
      return;
    }
    setAuth(response.data.token, response.data.player, false);
    meQuery.refetch();
    setEditing(false);
  }

  if (!ready) return null;

  const saving = completeProfileMutation.isPending;

  return (
    <main className='relative flex h-screen w-full flex-col overflow-hidden bg-[#000814]'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-green-500/12 to-transparent' />
        <div className='absolute bottom-0 h-60 w-full bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.1),transparent_65%)]' />
      </div>

      <TopBar showBack title='Profile' />

      <div className='relative z-10 flex-1 overflow-y-auto px-6 pb-6'>
        <div className='mx-auto flex w-full max-w-sm flex-col items-center gap-6 pt-4'>
          <div className='flex w-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#071225]/80 px-4 py-6 shadow-2xl shadow-black/20 backdrop-blur-sm'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-3xl font-black text-black shadow-[0_0_40px_rgba(0,230,118,0.3)]'>
              {(player?.displayName ?? '?').charAt(0).toUpperCase()}
            </div>

            {editing ? (
              <form onSubmit={saveName} className='flex w-full flex-col items-center gap-2'>
                <input
                  autoFocus
                  type='text'
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setError('');
                  }}
                  maxLength={30}
                  className='w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center text-lg font-bold text-white transition-all outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20'
                />
                {error && <p className='text-xs text-red-400'>{error}</p>}
                <div className='flex gap-2'>
                  <button
                    type='button'
                    onClick={() => {
                      setEditing(false);
                      setNewName(me?.displayName ?? '');
                      setError('');
                    }}
                    className='inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/10'
                  >
                    <X className='h-3.5 w-3.5' />
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={saving}
                    className='inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50'
                  >
                    <Check className='h-3.5 w-3.5' />
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <div className='flex items-center gap-2'>
                <h2 className='text-2xl font-black text-white'>{me?.displayName ?? player?.displayName ?? '—'}</h2>
                <button
                  onClick={startEditing}
                  className='rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white'
                  aria-label='Edit name'
                >
                  <Pencil className='h-4 w-4' />
                </button>
              </div>
            )}

            <p className='inline-flex items-center gap-1.5 text-xs text-gray-400'>
              <Phone className='h-3.5 w-3.5' />
              {loading ? '…' : me ? maskPhone(me.phone) : '—'}
            </p>
          </div>

          <div className='grid w-full grid-cols-2 gap-3'>
            <StatCard label='Total matches' value={loading ? '…' : (me?.playCount ?? 0)} />
            <StatCard
              label='Plays today'
              value={loading ? '…' : (playsRemaining ?? 0)}
              suffix={loading || playsRemaining === null ? undefined : 'left'}
            />
            <StatCard label='Best score' value={loading || !rank ? '…' : (rank.score ?? '—')} accent='gold' />
            <StatCard
              label='Campaign rank'
              value={loading || !rank ? '…' : rank.rank ? `#${rank.rank}` : '—'}
              accent='green'
            />
          </div>

          <Button onClick={() => router.push('/menu')} className='w-full' variant='primary' size='lg'>
            <span className='inline-flex items-center justify-center gap-2'>
              <RotateCcw className='h-4 w-4' />
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
  accent?: 'gold' | 'green';
}) {
  const valueColor = accent === 'gold' ? 'text-yellow-300' : accent === 'green' ? 'text-green-400' : 'text-white';
  return (
    <div className='flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm'>
      <p className='text-[10px] tracking-widest text-gray-500 uppercase'>{label}</p>
      <p className={`text-2xl font-black tabular-nums ${valueColor}`}>
        {value}
        {suffix && <span className='ml-1 text-xs font-semibold text-gray-500'>{suffix}</span>}
      </p>
    </div>
  );
}
