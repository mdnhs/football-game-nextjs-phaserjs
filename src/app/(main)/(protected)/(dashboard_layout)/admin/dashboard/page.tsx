'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { api } from '@/features/admin/services/api';
import type { DashboardStats, ScoreDistribution } from '@/features/admin/types';
import {
  Users,
  Gamepad2,
  Flag,
  BarChart3,
  TrendingUp,
  Trophy,
  AlertTriangle,
  Settings2,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
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
    <AdminShell title='Dashboard' requirePermissions={['admin.dashboard.view']}>
      <div className='flex flex-col gap-6'>
        <div className='relative overflow-hidden rounded-2xl border bg-linear-to-br from-[#00e676]/10 via-transparent to-[#FFD700]/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#00e676]/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#FFD700]/10 blur-3xl' />
          <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <Badge variant='secondary' className='mb-3 gap-1.5'>
                <Activity className='h-3 w-3 text-[#00e676]' />
                Live overview
              </Badge>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>Campaign Dashboard</h1>
              <p className='text-muted-foreground mt-1 text-sm'>Real-time stats across players, matches, and scores.</p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Link
                href='/admin/scores/flagged'
                className='bg-background/60 hover:bg-background inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium backdrop-blur transition'
              >
                <AlertTriangle className='h-3.5 w-3.5 text-orange-500' />
                Review flagged
              </Link>
              <Link
                href='/admin/winners'
                className='bg-background/60 hover:bg-background inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium backdrop-blur transition'
              >
                <Trophy className='h-3.5 w-3.5 text-yellow-500' />
                Winners
              </Link>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            label='Total Players'
            value={stats?.totalPlayers}
            icon={Users}
            loading={loading}
            trend='+12% from last week'
            color='text-blue-500'
            ring='ring-blue-500/20'
            glow='from-blue-500/20'
          />
          <StatCard
            label="Today's Matches"
            value={stats?.todayMatches}
            icon={Gamepad2}
            loading={loading}
            trend='Live activity'
            color='text-emerald-500'
            ring='ring-emerald-500/20'
            glow='from-emerald-500/20'
          />
          <StatCard
            label='Flagged Scores'
            value={stats?.flaggedScores}
            icon={Flag}
            loading={loading}
            trend='Requires review'
            color='text-orange-500'
            ring='ring-orange-500/20'
            glow='from-orange-500/20'
          />
          <StatCard
            label='Avg Score'
            value={stats?.avgScore}
            icon={BarChart3}
            loading={loading}
            trend='Performance metric'
            color='text-purple-500'
            ring='ring-purple-500/20'
            glow='from-purple-500/20'
          />
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5 text-[#00e676]' />
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
                <div className='space-y-5'>
                  {(() => {
                    const total = Object.values(dist).reduce((s, n) => s + n, 0);
                    return Object.entries(dist).map(([bucket, count]) => {
                      const pct = total ? (count / total) * 100 : 0;
                      return (
                        <div key={bucket} className='group'>
                          <div className='mb-1.5 flex items-center justify-between text-sm'>
                            <span className='font-medium'>{bucket} pts</span>
                            <span className='text-muted-foreground'>
                              <span className='text-foreground font-semibold tabular-nums'>{count}</span>{' '}
                              <span className='text-xs'>({pct.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div className='bg-secondary/70 relative h-2.5 w-full overflow-hidden rounded-full'>
                            <div
                              className='h-full rounded-full bg-linear-to-r from-[#00e676] to-[#FFD700] transition-all duration-700 ease-out'
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequent management tasks</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-3'>
              <QuickActionLink
                href='/admin/scores/flagged'
                icon={AlertTriangle}
                title='Review Flagged'
                description='Check suspected cheating'
                count={stats?.flaggedScores}
                color='text-orange-600'
                bg='bg-orange-500/10'
              />
              <QuickActionLink
                href='/admin/winners'
                icon={Trophy}
                title='Daily Winners'
                description="Export today's leaderboard"
                color='text-yellow-600'
                bg='bg-yellow-500/10'
              />
              <QuickActionLink
                href='/admin/settings'
                icon={Settings2}
                title='Game Settings'
                description='Adjust difficulty & limits'
                color='text-blue-600'
                bg='bg-blue-500/10'
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
  ring,
  glow,
}: {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  trend?: string;
  color?: string;
  ring?: string;
  glow?: string;
}) {
  return (
    <Card className='group relative overflow-hidden border-none shadow-md transition hover:shadow-lg'>
      <div
        className={`pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-linear-to-br ${glow} to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100`}
      />
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>{label}</CardTitle>
        <div className={`bg-background rounded-lg p-2 ring-1 ${ring}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className='h-8 w-20' />
        ) : (
          <>
            <div className='text-3xl font-bold tracking-tight tabular-nums'>{value ?? 0}</div>
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
  bg,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  count?: number;
  color?: string;
  bg?: string;
}) {
  return (
    <Link
      href={href}
      className='group hover:bg-muted/60 hover:border-foreground/20 flex items-center gap-4 rounded-xl border p-3 transition'
    >
      <div className={`rounded-full p-2.5 ${bg} ${color}`}>
        <Icon className='h-5 w-5' />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <p className='truncate text-sm leading-none font-medium'>{title}</p>
          {count !== undefined && count > 0 && (
            <span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500/15 px-1.5 text-[10px] font-bold text-orange-600'>
              {count}
            </span>
          )}
        </div>
        <p className='text-muted-foreground mt-1 truncate text-xs'>{description}</p>
      </div>
      <ArrowUpRight className='text-muted-foreground h-4 w-4 opacity-0 transition group-hover:opacity-100' />
    </Link>
  );
}
