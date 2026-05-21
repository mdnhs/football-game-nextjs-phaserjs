'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/features/admin/services/api';
import type { Paginated, FlaggedScore } from '@/features/admin/types';
import { fmtDate } from '@/features/admin/utils/format';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { AlertTriangle, Info, ShieldAlert, Target, TrendingUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function FlaggedScoresPage() {
  const [page] = useState(1);
  const limit = 50;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FlaggedScore | null>(null);

  const { data, error, isLoading } = useQuery({
    queryKey: ['admin-scores-flagged', page, limit],
    queryFn: () => api<Paginated<FlaggedScore>>(`/api/admin/scores/flagged?page=${page}&limit=${limit}`),
  });

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : 'Load failed');
    }
  }, [error]);

  function openDetails(s: FlaggedScore) {
    setSelected(s);
    setOpen(true);
  }

  const columns = createColumns(openDetails);

  const summary = useMemo(() => {
    const rows = data?.data ?? [];
    const maxScore = rows.reduce((m, r) => Math.max(m, r.total_score ?? 0), 0);
    const avgScore = rows.length ? Math.round(rows.reduce((s, r) => s + (r.total_score ?? 0), 0) / rows.length) : 0;
    const today = new Date().toDateString();
    const todayCount = rows.filter((r) => new Date(r.played_at).toDateString() === today).length;
    return { maxScore, avgScore, todayCount };
  }, [data]);

  return (
    <AdminShell title='Flagged Scores' requirePermissions={['admin.score.view_list']}>
      <div className='flex flex-col gap-6'>
        <div className='border-destructive/20 relative overflow-hidden rounded-2xl border bg-linear-to-br from-red-500/10 via-transparent to-orange-500/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-red-500/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl' />
          <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <Badge variant='destructive' className='mb-3 gap-1.5'>
                <ShieldAlert className='h-3 w-3' />
                Anti-Cheat
              </Badge>
              <h1 className='text-destructive text-2xl font-bold tracking-tight sm:text-3xl'>
                Suspected Activity Review
              </h1>
              <p className='text-muted-foreground mt-1 text-sm'>
                Scores auto-flagged by anti-cheat engine. Inspect shot log before action.
              </p>
            </div>
            <div className='flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-bold text-orange-600 dark:text-orange-400'>
              <AlertTriangle className='h-4 w-4' />
              <span className='tabular-nums'>{data?.total ?? 0}</span>
              <span className='font-medium'>flagged</span>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <MiniStat
            label='Highest Flagged'
            value={summary.maxScore}
            icon={TrendingUp}
            color='text-red-500'
            ring='ring-red-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Average Score'
            value={summary.avgScore}
            icon={Target}
            color='text-orange-500'
            ring='ring-orange-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Flagged Today'
            value={summary.todayCount}
            icon={Calendar}
            color='text-yellow-500'
            ring='ring-yellow-500/20'
            loading={isLoading}
          />
        </div>

        <Card className='border-destructive/20 overflow-hidden p-0 shadow-sm'>
          <CardHeader className='bg-destructive/5 border-b px-6 py-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-destructive/10 ring-destructive/20 rounded-full p-2 ring-1'>
                <AlertTriangle className='text-destructive h-5 w-5' />
              </div>
              <div>
                <CardTitle className='text-lg'>Flagged Match History</CardTitle>
                <CardDescription>Search by player. Click View to inspect shot timing.</CardDescription>
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
            ) : (
              <DataTable
                columns={columns}
                data={data?.data ?? []}
                searchKey='players_display_name'
                searchPlaceholder='Search by player name...'
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader className='flex flex-row items-center space-y-0 border-b pb-4'>
            <div className='bg-muted ring-border flex h-12 w-12 items-center justify-center rounded-full ring-1'>
              <Info className='text-muted-foreground h-6 w-6' />
            </div>
            <div className='ml-3'>
              <DialogTitle className='text-xl'>Shot Log Detail</DialogTitle>
              <DialogDescription>
                {selected?.players?.display_name ?? 'Unknown player'} — {selected && fmtDate(selected.played_at)}
              </DialogDescription>
            </div>
          </DialogHeader>
          {selected && (
            <>
              <div className='mt-4 grid grid-cols-3 gap-3'>
                <DialogStat label='Total Score' value={selected.total_score} accent='text-red-500' />
                <DialogStat label='Goals' value={selected.goals} accent='text-emerald-500' />
                <DialogStat label='Shots' value={selected.shot_log.length} accent='text-blue-500' />
              </div>
              <div className='mt-4 overflow-hidden rounded-md border'>
                <Table>
                  <TableHeader className='bg-muted/50'>
                    <TableRow>
                      <TableHead className='w-12 text-center'>#</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className='text-right'>Timing</TableHead>
                      <TableHead className='text-right'>Power</TableHead>
                      <TableHead className='text-right'>Duration</TableHead>
                      <TableHead className='pr-6 text-right'>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.shot_log.map((s) => (
                      <TableRow key={s.shotIndex} className='hover:bg-muted/30'>
                        <TableCell className='text-muted-foreground text-center font-medium'>
                          {s.shotIndex + 1}
                        </TableCell>
                        <TableCell>
                          <ResultBadge result={s.result} />
                        </TableCell>
                        <TableCell className='text-right font-mono text-sm tabular-nums'>
                          {s.timing.toFixed(2)}
                        </TableCell>
                        <TableCell className='text-right font-mono text-sm tabular-nums'>
                          {s.power.toFixed(2)}
                        </TableCell>
                        <TableCell className='text-right font-mono text-sm tabular-nums'>{s.durationMs}ms</TableCell>
                        <TableCell className='pr-6 text-right font-mono font-bold tabular-nums'>{s.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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

function DialogStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className='bg-muted/40 rounded-lg border p-3'>
      <div className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>{label}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function ResultBadge({ result }: { result: 'goal' | 'saved' | 'miss' }) {
  if (result === 'goal') {
    return (
      <Badge className='bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'>goal</Badge>
    );
  }
  if (result === 'saved') {
    return <Badge className='bg-blue-500/15 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400'>saved</Badge>;
  }
  return <Badge variant='outline'>miss</Badge>;
}
