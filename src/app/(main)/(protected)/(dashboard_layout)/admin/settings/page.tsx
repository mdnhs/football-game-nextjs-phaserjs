'use client';

import { useMemo, useState } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/features/admin/services/api';
import { toast } from 'sonner';
import { Settings2, Calendar, CalendarCheck, Gamepad2, Sliders, Loader2, RotateCcw, Save, Info } from 'lucide-react';

const EMPTY = {
  campaignStart: '',
  campaignEnd: '',
  dailyPlayLimit: '',
  difficultyBase: '',
};

export default function SettingsPage() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const dirtyCount = useMemo(() => Object.values(form).filter((v) => v.trim() !== '').length, [form]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, string | number> = {};
    if (form.campaignStart) payload.campaignStart = form.campaignStart;
    if (form.campaignEnd) payload.campaignEnd = form.campaignEnd;
    if (form.dailyPlayLimit) payload.dailyPlayLimit = Number(form.dailyPlayLimit);
    if (form.difficultyBase) payload.difficultyBase = Number(form.difficultyBase);

    if (!Object.keys(payload).length) {
      toast.error('Nothing to update');
      setSaving(false);
      return;
    }

    try {
      await api('/api/admin/settings', { method: 'PATCH', body: payload });
      toast.success('Settings updated');
      setForm(EMPTY);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title='Settings' requirePermissions={['admin.settings.view']}>
      <div className='flex flex-col gap-6'>
        <div className='relative overflow-hidden rounded-2xl border bg-linear-to-br from-blue-500/10 via-transparent to-[#00e676]/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#00e676]/10 blur-3xl' />
          <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <Badge variant='secondary' className='mb-3 gap-1.5'>
                <Settings2 className='h-3 w-3 text-blue-500' />
                Configuration
              </Badge>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>Campaign Settings</h1>
              <p className='text-muted-foreground mt-1 text-sm'>
                Adjust schedule, play limits, and difficulty. Only filled fields are pushed.
              </p>
            </div>
            {dirtyCount > 0 && (
              <Badge className='gap-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400'>
                <Info className='h-3 w-3' />
                {dirtyCount} pending change{dirtyCount === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
        </div>

        <form onSubmit={save} className='flex flex-col gap-6'>
          <Card>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-blue-500/10 p-2 ring-1 ring-blue-500/20'>
                  <Calendar className='h-5 w-5 text-blue-500' />
                </div>
                <div>
                  <CardTitle>Campaign Schedule</CardTitle>
                  <CardDescription>Set start and end windows for the active campaign.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className='pt-6'>
              <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
                <FieldRow
                  id='campaignStart'
                  label='Campaign Start'
                  hint='When the leaderboard opens for entries'
                  icon={Calendar}
                  iconColor='text-blue-500'
                >
                  <Input
                    id='campaignStart'
                    type='datetime-local'
                    value={form.campaignStart}
                    onChange={(e) => setForm({ ...form, campaignStart: e.target.value })}
                  />
                </FieldRow>
                <FieldRow
                  id='campaignEnd'
                  label='Campaign End'
                  hint='Cutoff after which no scores count'
                  icon={CalendarCheck}
                  iconColor='text-purple-500'
                >
                  <Input
                    id='campaignEnd'
                    type='datetime-local'
                    value={form.campaignEnd}
                    onChange={(e) => setForm({ ...form, campaignEnd: e.target.value })}
                  />
                </FieldRow>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-[#00e676]/10 p-2 ring-1 ring-[#00e676]/20'>
                  <Sliders className='h-5 w-5 text-[#00e676]' />
                </div>
                <div>
                  <CardTitle>Gameplay Tuning</CardTitle>
                  <CardDescription>Throttle plays and balance difficulty curve.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className='pt-6'>
              <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
                <FieldRow
                  id='dailyPlayLimit'
                  label='Daily Play Limit'
                  hint='Matches per player per day (1–100)'
                  icon={Gamepad2}
                  iconColor='text-emerald-500'
                >
                  <Input
                    id='dailyPlayLimit'
                    type='number'
                    min={1}
                    max={100}
                    value={form.dailyPlayLimit}
                    onChange={(e) => setForm({ ...form, dailyPlayLimit: e.target.value })}
                    placeholder='3'
                  />
                </FieldRow>
                <FieldRow
                  id='difficultyBase'
                  label='Difficulty Base'
                  hint='Starting difficulty offset (0.000–1.000)'
                  icon={Sliders}
                  iconColor='text-orange-500'
                >
                  <Input
                    id='difficultyBase'
                    type='number'
                    step='0.001'
                    min={0}
                    max={1}
                    value={form.difficultyBase}
                    onChange={(e) => setForm({ ...form, difficultyBase: e.target.value })}
                    placeholder='0'
                  />
                </FieldRow>
              </div>
            </CardContent>
          </Card>

          <div className='bg-background/60 sticky bottom-4 z-10 flex flex-col items-stretch gap-3 rounded-xl border p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Info className='h-4 w-4' />
              Blank fields keep their current value.
            </div>
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setForm(EMPTY)}
                disabled={saving || dirtyCount === 0}
                className='gap-2'
              >
                <RotateCcw className='h-4 w-4' />
                Reset
              </Button>
              <Button type='submit' disabled={saving || dirtyCount === 0} className='gap-2'>
                {saving ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4' />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}

function FieldRow({
  id,
  label,
  hint,
  icon: Icon,
  iconColor,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={id} className='flex items-center gap-2 text-sm font-medium'>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        {label}
      </Label>
      {children}
      <p className='text-muted-foreground text-xs'>{hint}</p>
    </div>
  );
}
