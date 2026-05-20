'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/features/admin/services/api';
import type { Paginated, Player } from '@/features/admin/types';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { useQuery } from '@tanstack/react-query';

export default function PlayersPage() {
  const [page] = useState(1);
  const limit = 50;
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, error, refetch } = useQuery({
    queryKey: ['admin-players', page, limit],
    queryFn: () => api<Paginated<Player>>(`/api/admin/players?page=${page}&limit=${limit}`),
  });

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : 'Load failed');
    }
  }, [error]);

  async function toggleBlock(p: Player) {
    setBusyId(p.id);
    try {
      const action = p.is_blocked ? 'unblock' : 'block';
      await api(`/api/admin/players/${p.id}/${action}`, { method: 'PATCH' });
      toast.success(`Player ${p.display_name} ${action}ed successfully`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  const columns = createColumns(toggleBlock, busyId);

  return (
    <AdminShell title='Players'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <h2 className='text-3xl font-bold tracking-tight'>Participants</h2>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <span className='text-foreground font-medium'>{data?.total ?? 0}</span>
            <span>players registered</span>
          </div>
        </div>

        <Card className='overflow-hidden p-0 shadow-sm'>
          <CardHeader className='bg-muted/30 border-b px-6 py-4'>
            <CardTitle className='text-lg'>Player Management</CardTitle>
            <CardDescription>View and manage game participants and their status</CardDescription>
          </CardHeader>
          <CardContent className='p-6'>
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              searchKey='display_name'
              searchPlaceholder='Search by name...'
            />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
