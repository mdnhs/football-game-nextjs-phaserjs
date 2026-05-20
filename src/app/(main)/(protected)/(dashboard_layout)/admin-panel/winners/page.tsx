'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api, apiBlob } from '@/features/admin/services/api';
import type { DailyWinner } from '@/features/admin/types';
import { today } from '@/features/admin/utils/format';
import { toast } from 'sonner';
import { Download, Trophy } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { useQuery } from '@tanstack/react-query';

export default function WinnersPage() {
  const [date, setDate] = useState(today());
  const [downloading, setDownloading] = useState(false);

  const { data: winners = [], error } = useQuery({
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

  return (
    <AdminShell title='Winners'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <h2 className='text-3xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400'>Hall of Fame</h2>
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
                className='h-9 w-48'
              />
            </div>
            <Button
              onClick={downloadCsv}
              disabled={downloading || !winners.length}
              variant='outline'
              size='sm'
              className='h-9'
            >
              <Download className='mr-2 h-4 w-4' />
              {downloading ? 'Downloading…' : 'Export CSV'}
            </Button>
          </div>
        </div>

        <Card className='overflow-hidden border-yellow-500/20 p-0 shadow-sm'>
          <CardHeader className='border-b bg-yellow-500/5 px-6 py-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-yellow-500/10 p-2'>
                <Trophy className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
              </div>
              <div>
                <CardTitle className='text-lg'>Daily Top Performers</CardTitle>
                <CardDescription>Official leaderboard results for {date}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            <DataTable
              columns={columns}
              data={winners}
              searchKey='display_name'
              searchPlaceholder='Find winner by name...'
            />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
