'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api, apiBlob } from '@/features/admin/services/api';
import type { DailyWinner } from '@/features/admin/types';
import { today } from '@/features/admin/utils/format';
import { toast } from 'sonner';
import { Download, Trophy, Medal, Target, Users, Crown } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { useQuery } from '@tanstack/react-query';

export default function WinnersPage() {
  const [date, setDate] = useState(today());
  const [downloading, setDownloading] = useState(false);

  const {
    data: winners = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ['admin-winners', date],
    queryFn: () => api<DailyWinner[]>(`/api/admin/winners?date=${date}`),
  });

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : 'Load failed');
    }
  }, [error]);

  async function downloadCsv() {
    setDownloading(true);
    try {
      const blob = await apiBlob(`/api/admin/winners/export?date=${date}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `winners-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  const podium = useMemo(() => winners.slice(0, 3), [winners]);
  const topScore = winners[0]?.best_score ?? 0;
  const totalGoals = useMemo(() => winners.reduce((s, w) => s + (w.best_goals ?? 0), 0), [winners]);

  return (
    <AdminShell title='Winners' requirePermissions={['admin.winner.view_list']}>
      <div className='flex flex-col gap-6'>
        <div className='relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-linear-to-br from-yellow-500/10 via-transparent to-amber-500/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-yellow-500/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl' />
          <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end'>
            <div>
              <Badge variant='secondary' className='mb-3 gap-1.5 bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'>
                <Crown className='h-3 w-3' />
                Hall of Fame
              </Badge>
              <h1 className='text-2xl font-bold tracking-tight text-yellow-700 sm:text-3xl dark:text-yellow-400'>
                Daily Winners
              </h1>
              <p className='text-muted-foreground mt-1 text-sm'>
                Top performers from the daily leaderboard. Export the official list as CSV.
              </p>
            </div>
            <div className='flex flex-wrap items-end gap-3'>
              <div className='space-y-1'>
                <Label htmlFor='date' className='text-muted-foreground text-xs tracking-wider uppercase'>
                  Selected Date
                </Label>
                <Input
                  id='date'
                  type='date'
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className='bg-background/70 h-9 w-48 backdrop-blur'
                />
              </div>
              <Button
                onClick={downloadCsv}
                disabled={downloading || !winners.length}
                size='sm'
                className='h-9 bg-yellow-500 text-yellow-950 hover:bg-yellow-400'
              >
                <Download className='mr-2 h-4 w-4' />
                {downloading ? 'Downloading…' : 'Export CSV'}
              </Button>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <MiniStat
            label='Top Score'
            value={topScore}
            icon={Trophy}
            color='text-yellow-500'
            ring='ring-yellow-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Winners'
            value={winners.length}
            icon={Users}
            color='text-blue-500'
            ring='ring-blue-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Total Goals'
            value={totalGoals}
            icon={Target}
            color='text-emerald-500'
            ring='ring-emerald-500/20'
            loading={isLoading}
          />
        </div>

        {(isLoading || podium.length > 0) && (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className='h-32 w-full rounded-xl' />)
              : podium.map((w, i) => <PodiumCard key={w.player_id} rank={i + 1} winner={w} />)}
          </div>
        )}

        <Card className='overflow-hidden border-yellow-500/20 p-0 shadow-sm'>
          <CardHeader className='border-b bg-yellow-500/5 px-6 py-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-yellow-500/10 p-2 ring-1 ring-yellow-500/20'>
                <Trophy className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
              </div>
              <div>
                <CardTitle className='text-lg'>Full Leaderboard</CardTitle>
                <CardDescription>Official results for {date}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            {isLoading ? (
              <div className='space-y-3'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className='h-12 w-full' />
                ))}
              </div>
            ) : winners.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
                <div className='bg-muted rounded-full p-4'>
                  <Trophy className='text-muted-foreground h-8 w-8' />
                </div>
                <div className='text-muted-foreground text-sm'>No winners recorded for this date.</div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={winners}
                searchKey='display_name'
                searchPlaceholder='Find winner by name...'
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  color,
  ring,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  ring: string;
  loading?: boolean;
}) {
  return (
    <Card className='border-none shadow-sm'>
      <CardContent className='flex items-center justify-between p-4'>
        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{label}</span>
          {loading ? (
            <Skeleton className='h-7 w-12' />
          ) : (
            <span className='text-2xl font-bold tabular-nums'>{value}</span>
          )}
        </div>
        <div className={`bg-background rounded-lg p-2 ring-1 ${ring}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function PodiumCard({ rank, winner }: { rank: number; winner: DailyWinner }) {
  const styles =
    {
      1: {
        ring: 'ring-yellow-500/40',
        bg: 'from-yellow-500/15 via-yellow-500/5 to-transparent',
        icon: 'text-yellow-500',
        label: 'text-yellow-600 dark:text-yellow-400',
        tag: '1st',
      },
      2: {
        ring: 'ring-zinc-400/40',
        bg: 'from-zinc-400/15 via-zinc-400/5 to-transparent',
        icon: 'text-zinc-400',
        label: 'text-zinc-500 dark:text-zinc-300',
        tag: '2nd',
      },
      3: {
        ring: 'ring-amber-700/40',
        bg: 'from-amber-700/15 via-amber-700/5 to-transparent',
        icon: 'text-amber-700',
        label: 'text-amber-700 dark:text-amber-500',
        tag: '3rd',
      },
    }[rank] ?? null;

  if (!styles) return null;

  return (
    <Card className={`relative overflow-hidden border-none shadow-md ring-1 ${styles.ring}`}>
      <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${styles.bg}`} />
      <CardContent className='relative flex items-center gap-4 p-5'>
        <div className='bg-background/70 flex h-14 w-14 items-center justify-center rounded-full ring-1 ring-white/10 backdrop-blur ring-inset'>
          <Medal className={`h-7 w-7 ${styles.icon}`} />
        </div>
        <div className='min-w-0 flex-1'>
          <div className={`text-xs font-bold tracking-wider uppercase ${styles.label}`}>{styles.tag} place</div>
          <div className='mt-0.5 truncate text-lg font-bold'>{winner.display_name}</div>
          <div className='text-muted-foreground mt-0.5 text-xs'>
            {winner.best_goals} goals · <span className='font-mono'>{winner.phone}</span>
          </div>
        </div>
        <div className='text-right'>
          <div className='text-2xl font-bold tabular-nums'>{winner.best_score}</div>
          <div className='text-muted-foreground text-[10px] tracking-wide uppercase'>points</div>
        </div>
      </CardContent>
    </Card>
  );
}
