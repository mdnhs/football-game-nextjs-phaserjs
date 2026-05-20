import type { ShotResult } from '@/features/game/types';
import { cn } from '@/lib/utils';

interface Props {
  result: ShotResult;
  index: number;
}

export default function ShotBadge({ result }: Props) {
  const icon = result.bonus ? '🌟' : result.scored ? '⚽' : result.saved ? '🧤' : '✗';
  const color = result.bonus
    ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400'
    : result.scored
      ? 'border-green-400/50 bg-green-400/10 text-green-400'
      : 'border-red-500/30 bg-red-500/10 text-red-400';

  return (
    <div className={cn('flex w-14 flex-col items-center gap-1 rounded-xl border p-2', color)}>
      <span className='text-xl'>{icon}</span>
      <span className='text-[10px] font-bold tabular-nums'>+{result.points}</span>
    </div>
  );
}
