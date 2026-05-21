'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { api } from '@/features/admin/services/api';
import { fmtDate } from '@/features/admin/utils/format';
import { toast } from 'sonner';
import {
  UserCog,
  Mail,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Save,
  CalendarClock,
  Sparkles,
  LogOut,
} from 'lucide-react';

interface AdminProfile {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-me'],
    queryFn: () => api<AdminProfile>('/api/admin/auth/me'),
  });

  const [email, setEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const currentEmail = profile?.email ?? '';
  const pendingEmail = email.trim();
  const emailDirty = pendingEmail !== '' && pendingEmail !== currentEmail;

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailDirty) return;
    setSavingEmail(true);
    try {
      await api('/api/admin/auth/me', { method: 'PATCH', body: { email: pendingEmail } });
      toast.success('Email updated. Please sign in again.');
      qc.invalidateQueries({ queryKey: ['admin-me'] });
      await signOut({ redirect: false });
      router.replace('/admin/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSavingEmail(false);
    }
  }

  const pwdMismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;
  const pwdShort = newPassword.length > 0 && newPassword.length < 8;
  const canSubmitPwd =
    currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword && !savingPassword;

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitPwd) return;
    setSavingPassword(true);
    try {
      await api('/api/admin/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      toast.success('Password changed. Please sign in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await signOut({ redirect: false });
      router.replace('/admin/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Change failed');
    } finally {
      setSavingPassword(false);
    }
  }

  const initials = (profile?.email ?? session?.user?.email ?? 'A').split(/[@.]/)[0].slice(0, 2).toUpperCase();

  return (
    <AdminShell title='Account'>
      <div className='flex flex-col gap-6'>
        <div className='relative overflow-hidden rounded-2xl border bg-linear-to-br from-indigo-500/10 via-transparent to-[#00e676]/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#00e676]/10 blur-3xl' />
          <div className='relative flex flex-col items-start gap-5 sm:flex-row sm:items-center'>
            <Avatar className='ring-background h-20 w-20 ring-4'>
              <AvatarFallback className='bg-linear-to-br from-indigo-500 to-[#00e676] text-2xl font-bold text-white'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <Badge variant='secondary' className='mb-3 gap-1.5'>
                <UserCog className='h-3 w-3 text-indigo-500' />
                Account
              </Badge>
              {isLoading ? (
                <>
                  <Skeleton className='h-8 w-64' />
                  <Skeleton className='mt-2 h-4 w-48' />
                </>
              ) : (
                <>
                  <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>
                    {profile?.email ?? session?.user?.email}
                  </h1>
                  <div className='mt-2 flex flex-wrap items-center gap-2'>
                    <Badge className='gap-1.5 bg-[#00e676]/15 text-emerald-600 dark:text-emerald-400'>
                      <ShieldCheck className='h-3 w-3' />
                      {profile?.role ?? 'admin'}
                    </Badge>
                    {profile?.is_active && <Badge variant='secondary'>Active</Badge>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <MetaCard
            label='Last Login'
            value={profile?.last_login_at ? fmtDate(profile.last_login_at) : '—'}
            icon={CalendarClock}
            color='text-blue-500'
            ring='ring-blue-500/20'
            loading={isLoading}
          />
          <MetaCard
            label='Member Since'
            value={profile?.created_at ? fmtDate(profile.created_at) : '—'}
            icon={Sparkles}
            color='text-purple-500'
            ring='ring-purple-500/20'
            loading={isLoading}
          />
          <MetaCard
            label='Role'
            value={profile?.role ?? '—'}
            icon={ShieldCheck}
            color='text-emerald-500'
            ring='ring-emerald-500/20'
            loading={isLoading}
          />
        </div>

        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-blue-500/10 p-2 ring-1 ring-blue-500/20'>
                <Mail className='h-5 w-5 text-blue-500' />
              </div>
              <div>
                <CardTitle>Email Address</CardTitle>
                <CardDescription>
                  Updating your email will sign you out. Use the new email next time you log in.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className='pt-6'>
            <form onSubmit={saveEmail} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  autoComplete='email'
                  placeholder={currentEmail || 'admin@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || savingEmail}
                />
                <p className='text-muted-foreground text-xs'>Current: {currentEmail || '—'}</p>
              </div>
              <div className='flex justify-end'>
                <Button type='submit' disabled={!emailDirty || savingEmail} className='gap-2'>
                  {savingEmail ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
                  {savingEmail ? 'Saving…' : 'Update email'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-orange-500/10 p-2 ring-1 ring-orange-500/20'>
                <KeyRound className='h-5 w-5 text-orange-500' />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Minimum 8 characters. You&apos;ll be signed out after a successful change.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className='pt-6'>
            <form onSubmit={savePassword} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='currentPassword'>Current password</Label>
                <PasswordInput
                  id='currentPassword'
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  show={showCurrent}
                  onToggleShow={() => setShowCurrent((v) => !v)}
                  disabled={savingPassword}
                  autoComplete='current-password'
                />
              </div>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>New password</Label>
                  <PasswordInput
                    id='newPassword'
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showNew}
                    onToggleShow={() => setShowNew((v) => !v)}
                    disabled={savingPassword}
                    autoComplete='new-password'
                  />
                  {pwdShort && <p className='text-destructive text-xs'>Must be at least 8 characters.</p>}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Confirm new password</Label>
                  <PasswordInput
                    id='confirmPassword'
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showNew}
                    onToggleShow={() => setShowNew((v) => !v)}
                    disabled={savingPassword}
                    autoComplete='new-password'
                  />
                  {pwdMismatch && <p className='text-destructive text-xs'>Passwords do not match.</p>}
                </div>
              </div>
              <div className='flex justify-end'>
                <Button type='submit' disabled={!canSubmitPwd} className='gap-2'>
                  {savingPassword ? <Loader2 className='h-4 w-4 animate-spin' /> : <KeyRound className='h-4 w-4' />}
                  {savingPassword ? 'Updating…' : 'Change password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className='border-destructive/30'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='bg-destructive/10 ring-destructive/20 rounded-lg p-2 ring-1'>
                <LogOut className='text-destructive h-5 w-5' />
              </div>
              <div>
                <CardTitle>Session</CardTitle>
                <CardDescription>End your current admin session on this device.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className='flex justify-end pt-6'>
            <Button
              variant='destructive'
              className='gap-2'
              onClick={async () => {
                await signOut({ redirect: false });
                router.replace('/admin/login');
              }}
            >
              <LogOut className='h-4 w-4' />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function MetaCard({
  label,
  value,
  icon: Icon,
  color,
  ring,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  ring: string;
  loading?: boolean;
}) {
  return (
    <Card className='border-none shadow-sm'>
      <CardContent className='flex items-center justify-between p-4'>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{label}</span>
          {loading ? (
            <Skeleton className='h-6 w-32' />
          ) : (
            <span className='truncate text-base font-semibold'>{value}</span>
          )}
        </div>
        <div className={`bg-background ml-3 rounded-lg p-2 ring-1 ${ring}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggleShow,
  disabled,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className='relative'>
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        className='pr-10'
      />
      <button
        type='button'
        onClick={onToggleShow}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className='text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition hover:bg-white/10'
      >
        {show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
      </button>
    </div>
  );
}
