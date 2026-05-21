'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/admin/dashboard');
  }, [router, status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
        return;
      }

      toast.success('Signed in');
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden p-4'>
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute top-[-20%] left-[-10%] h-120 w-120 rounded-full bg-[#00e676]/20 blur-[120px]' />
        <div className='absolute right-[-15%] bottom-[-20%] h-130 w-130 rounded-full bg-[#FFD700]/10 blur-[140px]' />
        <div
          className='absolute inset-0 opacity-[0.04]'
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className='w-full max-w-md'>
        <div className='mb-8 flex flex-col items-center text-center'>
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-[#00e676] to-[#00b85a] shadow-[0_0_40px_-8px_rgba(0,230,118,0.6)]'>
            <ShieldCheck className='h-8 w-8 text-[#000814]' />
          </div>
          <h1 className='text-2xl font-bold tracking-tight text-white'>Football Admin</h1>
          <p className='mt-1 text-sm text-white/60'>Sign in to manage the campaign</p>
        </div>

        <div className='rounded-2xl border border-white/10 bg-white/3 p-6 shadow-2xl backdrop-blur-xl sm:p-8'>
          <form onSubmit={onSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium text-white/80'>
                Email
              </Label>
              <div className='relative'>
                <Mail className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40' />
                <Input
                  id='email'
                  type='email'
                  placeholder='admin@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete='email'
                  autoFocus
                  required
                  disabled={loading}
                  className='h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30 focus-visible:border-[#00e676]/60 focus-visible:ring-[#00e676]/30'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password' className='text-sm font-medium text-white/80'>
                Password
              </Label>
              <div className='relative'>
                <Lock className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete='current-password'
                  required
                  disabled={loading}
                  className='h-11 border-white/10 bg-white/5 pr-10 pl-10 text-white placeholder:text-white/30 focus-visible:border-[#00e676]/60 focus-visible:ring-[#00e676]/30'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className='absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white/80'
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              disabled={loading}
              className='h-11 w-full bg-[#00e676] font-semibold text-[#000814] shadow-[0_8px_24px_-8px_rgba(0,230,118,0.6)] transition hover:bg-[#00ff7f] disabled:opacity-60'
            >
              {loading ? (
                <span className='flex items-center justify-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        <p className='mt-6 text-center text-xs text-white/40'>Authorized personnel only. All actions are logged.</p>
      </div>
    </div>
  );
}
