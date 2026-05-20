'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/features/admin/services/api';
import type { DashboardStats, ScoreDistribution } from '@/features/admin/types';
import { Users, Gamepad2, Flag, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dist, setDist] = useState<ScoreDistribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, d] = await Promise.all([
          api<DashboardStats>('/api/analytics/dashboard'),
          api<ScoreDistribution>('/api/analytics/distribution'),
        ]);
        setStats(s);
        setDist(d);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminShell title='Dashboard'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard label='Total Players' value={stats?.totalPlayers} icon={Users} loading={loading} />
        <StatCard label="Today's Matches" value={stats?.todayMatches} icon={Gamepad2} loading={loading} />
        <StatCard label='Flagged Scores' value={stats?.flaggedScores} icon={Flag} loading={loading} />
        <StatCard label='Avg Score' value={stats?.avgScore} icon={BarChart3} loading={loading} />
      </div>

      <Card className='mt-6'>
        <CardHeader>
          <CardTitle>Score distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || !dist ? (
            <Skeleton className='h-40 w-full' />
          ) : (
            <div className='space-y-3'>
              {Object.entries(dist).map(([bucket, count]) => {
                const total = Object.values(dist).reduce((s, n) => s + n, 0);
                const pct = total ? (count / total) * 100 : 0;
                return (
                  <div key={bucket}>
                    <div className='mb-1 flex justify-between text-sm'>
                      <span className='font-mono'>{bucket}</span>
                      <span className='text-muted-foreground'>
                        {count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className='bg-muted h-2 rounded'>
                      <div className='bg-primary h-2 rounded' style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{label}</CardTitle>
        <Icon className='text-muted-foreground h-4 w-4' />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className='h-8 w-20' /> : <div className='text-2xl font-bold'>{value ?? 0}</div>}
      </CardContent>
    </Card>
  );
}
