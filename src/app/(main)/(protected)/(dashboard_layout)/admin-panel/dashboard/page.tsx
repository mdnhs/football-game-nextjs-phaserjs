'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/features/admin/services/api';
import type { DashboardStats, ScoreDistribution } from '@/features/admin/types';
import { Users, Gamepad2, Flag, BarChart3, TrendingUp, Trophy, AlertTriangle, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
      <div className='flex flex-col gap-6'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            label='Total Players'
            value={stats?.totalPlayers}
            icon={Users}
            loading={loading}
            trend='+12% from last week'
            color='text-blue-500'
            bg='bg-blue-50'
          />
          <StatCard
            label="Today's Matches"
            value={stats?.todayMatches}
            icon={Gamepad2}
            loading={loading}
            trend='Live activity'
            color='text-green-500'
            bg='bg-green-50'
          />
          <StatCard
            label='Flagged Scores'
            value={stats?.flaggedScores}
            icon={Flag}
            loading={loading}
            trend='Requires review'
            color='text-orange-500'
            bg='bg-orange-50'
          />
          <StatCard
            label='Avg Score'
            value={stats?.avgScore}
            icon={BarChart3}
            loading={loading}
            trend='Performance metric'
            color='text-purple-500'
            bg='bg-purple-50'
          />
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='text-primary h-5 w-5' />
                Score Distribution
              </CardTitle>
              <CardDescription>Breakdown of player performance across all matches</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || !dist ? (
                <div className='space-y-4'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-12 w-full' />
                  ))}
                </div>
              ) : (
                <div className='space-y-4'>
                  {Object.entries(dist).map(([bucket, count]) => {
                    const total = Object.values(dist).reduce((s, n) => s + n, 0);
                    const pct = total ? (count / total) * 100 : 0;
                    return (
                      <div key={bucket} className='group'>
                        <div className='mb-1.5 flex justify-between text-sm'>
                          <span className='font-medium'>{bucket} points</span>
                          <span className='text-muted-foreground'>
                            <span className='text-foreground font-semibold'>{count}</span> players ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className='bg-secondary relative h-3 w-full overflow-hidden rounded-full'>
                          <div
                            className='bg-primary h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80'
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequent management tasks</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <QuickActionLink
                href='/admin-panel/scores/flagged'
                icon={AlertTriangle}
                title='Review Flagged'
                description='Check suspected cheating'
                count={stats?.flaggedScores}
                color='text-orange-600'
              />
              <QuickActionLink
                href='/admin-panel/winners'
                icon={Trophy}
                title='Daily Winners'
                description="Export today's leaderboard"
                color='text-yellow-600'
              />
              <QuickActionLink
                href='/admin-panel/settings'
                icon={Settings2}
                title='Game Settings'
                description='Adjust difficulty & limits'
                color='text-blue-600'
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  trend,
  color,
  bg,
}: {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  trend?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <Card className='overflow-hidden border-none shadow-md'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>{label}</CardTitle>
        <div className={`rounded-lg p-2 ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className='h-8 w-20' />
        ) : (
          <>
            <div className='text-3xl font-bold tracking-tight'>{value ?? 0}</div>
            {trend && <p className='text-muted-foreground mt-1 text-xs'>{trend}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionLink({
  href,
  icon: Icon,
  title,
  description,
  count,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  count?: number;
  color?: string;
}) {
  return (
    <Link href={href} className='hover:bg-muted/50 flex items-center gap-4 rounded-xl border p-4 transition-colors'>
      <div className={`bg-background rounded-full p-2 shadow-sm ${color}`}>
        <Icon className='h-5 w-5' />
      </div>
      <div className='flex-1'>
        <div className='flex items-center justify-between'>
          <p className='text-sm leading-none font-medium'>{title}</p>
          {count !== undefined && count > 0 && (
            <span className='flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600'>
              {count}
            </span>
          )}
        </div>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
    </Link>
  );
}
