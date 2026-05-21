'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/features/admin/services/api';
import type { Paginated, Player } from '@/features/admin/types';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { useQuery } from '@tanstack/react-query';
import { Users, ShieldCheck, ShieldAlert, Gamepad2 } from 'lucide-react';

export default function PlayersPage() {
  const [page] = useState(1);
  const limit = 50;
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, error, refetch, isLoading } = useQuery({
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

  const summary = useMemo(() => {
    const rows = data?.data ?? [];
    const active = rows.filter((p) => !p.is_blocked).length;
    const blocked = rows.filter((p) => p.is_blocked).length;
    const totalMatches = rows.reduce((s, p) => s + (p.play_count ?? 0), 0);
    return { active, blocked, totalMatches };
  }, [data]);

  return (
    <AdminShell title='Players' requirePermissions={['admin.player.view_list']}>
      <div className='flex flex-col gap-6'>
        <div className='relative overflow-hidden rounded-2xl border bg-linear-to-br from-[#00e676]/10 via-transparent to-blue-500/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#00e676]/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl' />
          <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <Badge variant='secondary' className='mb-3 gap-1.5'>
                <Users className='h-3 w-3 text-[#00e676]' />
                Participants
              </Badge>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>Player Management</h1>
              <p className='text-muted-foreground mt-1 text-sm'>View, search, and moderate registered players.</p>
            </div>
            <div className='text-muted-foreground flex items-baseline gap-2 text-sm'>
              <span className='text-foreground text-3xl font-bold tabular-nums'>{data?.total ?? 0}</span>
              <span>registered</span>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <MiniStat
            label='Active'
            value={summary.active}
            icon={ShieldCheck}
            color='text-emerald-500'
            ring='ring-emerald-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Blocked'
            value={summary.blocked}
            icon={ShieldAlert}
            color='text-red-500'
            ring='ring-red-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Total Matches'
            value={summary.totalMatches}
            icon={Gamepad2}
            color='text-blue-500'
            ring='ring-blue-500/20'
            loading={isLoading}
          />
        </div>

        <Card className='overflow-hidden p-0 shadow-sm'>
          <CardHeader className='bg-muted/30 border-b px-6 py-4'>
            <CardTitle className='text-lg'>All Players</CardTitle>
            <CardDescription>Search by name. Use row menu to block or copy contact.</CardDescription>
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
                searchKey='display_name'
                searchPlaceholder='Search by name...'
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
