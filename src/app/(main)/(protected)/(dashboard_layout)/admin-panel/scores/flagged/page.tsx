'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/features/admin/services/api';
import type { Paginated, FlaggedScore } from '@/features/admin/types';
import { fmtDate } from '@/features/admin/utils/format';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { AlertTriangle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function FlaggedScoresPage() {
  const [page] = useState(1);
  const limit = 50;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FlaggedScore | null>(null);

  const { data, error } = useQuery({
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

  return (
    <AdminShell title='Flagged Scores'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <h2 className='text-destructive text-3xl font-bold tracking-tight'>Anti-Cheat Review</h2>
          <div className='flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'>
            <AlertTriangle className='h-3 w-3' />
            {data?.total ?? 0} scores flagged
          </div>
        </div>

        <Card className='border-destructive/20 overflow-hidden p-0 shadow-sm'>
          <CardHeader className='bg-destructive/5 border-b px-6 py-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-destructive/10 rounded-full p-2'>
                <AlertTriangle className='text-destructive h-5 w-5' />
              </div>
              <div>
                <CardTitle className='text-lg'>Suspected Activity</CardTitle>
                <CardDescription>Review scores flagged by the automated anti-cheat engine</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              searchKey='players_display_name'
              searchPlaceholder='Search by player name...'
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader className='flex flex-row items-center space-y-0 border-b pb-4'>
            <div className='bg-muted flex h-12 w-12 items-center justify-center rounded-full'>
              <Info className='text-muted-foreground h-6 w-6' />
            </div>
            <div>
              <DialogTitle className='text-xl'>Shot log detail</DialogTitle>
              <DialogDescription>
                {selected?.players?.display_name} — {selected && fmtDate(selected.played_at)}
              </DialogDescription>
            </div>
          </DialogHeader>
          {selected && (
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
                    <TableRow key={s.shotIndex} className='hover:bg-transparent'>
                      <TableCell className='text-muted-foreground text-center font-medium'>{s.shotIndex + 1}</TableCell>
                      <TableCell>
                        <Badge
                          variant={s.result === 'goal' ? 'default' : s.result === 'saved' ? 'secondary' : 'outline'}
                        >
                          {s.result}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right font-mono text-sm'>{s.timing.toFixed(2)}</TableCell>
                      <TableCell className='text-right font-mono text-sm'>{s.power.toFixed(2)}</TableCell>
                      <TableCell className='text-right font-mono text-sm'>{s.durationMs}ms</TableCell>
                      <TableCell className='pr-6 text-right font-mono font-bold'>{s.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
