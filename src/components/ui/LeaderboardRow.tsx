import type { LeaderboardEntry } from '@/features/game/types';
import { cn } from '@/lib/utils';

interface Props {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentPlayer: boolean;
}

const RANK_ICONS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardRow({ entry, rank, isCurrentPlayer }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
        isCurrentPlayer ? 'border border-green-400/30 bg-green-400/10' : 'border border-white/5 bg-white/5',
      )}
    >
      <span className='w-8 text-center text-lg'>
        {RANK_ICONS[rank] ?? <span className='text-sm text-gray-500'>{rank}</span>}
      </span>
      <div className='min-w-0 flex-1'>
        <p className={cn('truncate text-sm font-semibold', isCurrentPlayer ? 'text-green-400' : 'text-white')}>
          {entry.name}
          {isCurrentPlayer && <span className='ml-2 text-[10px] text-green-400/70'>(you)</span>}
        </p>
        <p className='text-[10px] text-gray-500'>
          {entry.goalsOf5}/5 goals · {new Date(entry.date).toLocaleDateString()}
        </p>
      </div>
      <span className={cn('text-lg font-black tabular-nums', isCurrentPlayer ? 'text-green-400' : 'text-yellow-400')}>
        {entry.score}
      </span>
    </div>
  );
}
