'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { ArrowLeft, LockKeyhole, Phone, ShieldCheck } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useVerifyOtp } from '@/features/auth/hooks/api/mutation/use-verify-otp';
import { otpSchema, phoneSchema } from '@/features/auth/validations/auth-schema';
import Button from '@/components/ui/game-button';

type Step = 'phone' | 'otp';

export default function AuthPage() {
  const router = useRouter();
  const { qrRef, setAuth } = useAuthStore();
  const verifyOtpMutation = useVerifyOtp();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+880');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  async function sendOtp() {
    setError('');
    const parsed = phoneSchema.safeParse(phone.replace(/\s+/g, ''));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid phone');
      return;
    }

    setSending(true);
    try {
      const auth = getFirebaseAuth();
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current ?? 'recaptcha-container', {
          size: 'invisible',
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, parsed.data, verifierRef.current);
      confirmationRef.current = confirmation;
      setStep('otp');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      verifierRef.current?.clear();
      verifierRef.current = null;
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp() {
    setError('');
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid code');
      return;
    }
    if (!confirmationRef.current) {
      setError('Session expired. Try again.');
      setStep('phone');
      return;
    }

    try {
      const cred = await confirmationRef.current.confirm(parsed.data);
      const idToken = await cred.user.getIdToken();

      const response = await verifyOtpMutation.mutateAsync({ idToken, ...(qrRef ? { qrRef } : {}) });
      if (response.error || !response.data) {
        setError(response.message);
        return;
      }

      const { token, isNew, player } = response.data;
      setAuth(token, player, isNew);
      router.replace(isNew ? '/auth/profile' : '/menu');
    } catch (err) {
      console.error(err);
      setError('Invalid code. Try again.');
    }
  }

  const verifying = verifyOtpMutation.isPending;

  return (
    <main className='relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#000814] px-6'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-green-500/12 to-transparent' />
        <div className='absolute bottom-0 h-56 w-full bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.1),transparent_65%)]' />
      </div>

      <div className='relative z-10 flex w-full max-w-sm flex-col items-center gap-6'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <div className='flex h-20 w-20 items-center justify-center rounded-full border border-green-300/20 bg-green-400/10 shadow-[0_0_36px_rgba(34,197,94,0.22)]'>
            {step === 'phone' ? (
              <Phone className='h-9 w-9 text-green-300' />
            ) : (
              <ShieldCheck className='h-9 w-9 text-green-300' />
            )}
          </div>
          <h1 className='text-3xl font-black tracking-tight text-white'>
            PENALTY <span className='text-green-400'>SHOWDOWN</span>
          </h1>
          <p className='max-w-64 text-sm text-gray-400'>
            {step === 'phone'
              ? 'Sign in to save your runs and claim your spot on the board.'
              : 'Enter the verification code sent to your phone.'}
          </p>
        </div>

        {step === 'phone' ? (
          <div className='flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-[#071225]/80 p-4 shadow-2xl shadow-black/20 backdrop-blur-sm'>
            <label className='text-xs font-semibold tracking-widest text-gray-400 uppercase'>Phone</label>
            <div className='flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 transition-all focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-400/20'>
              <Phone className='h-4 w-4 shrink-0 text-gray-500' />
              <input
                type='tel'
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                placeholder='+8801XXXXXXXXX'
                inputMode='tel'
                autoComplete='tel'
                className='w-full bg-transparent py-3.5 text-base text-white outline-none placeholder:text-gray-500'
              />
            </div>
            {error && <p className='text-xs text-red-400'>{error}</p>}
            <Button onClick={sendOtp} disabled={sending} className='w-full' size='lg' variant='primary'>
              {sending ? 'Sending…' : 'Send OTP'}
            </Button>
          </div>
        ) : (
          <div className='flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-[#071225]/80 p-4 shadow-2xl shadow-black/20 backdrop-blur-sm'>
            <label className='text-xs font-semibold tracking-widest text-gray-400 uppercase'>Code</label>
            <div className='flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 transition-all focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-400/20'>
              <LockKeyhole className='h-4 w-4 shrink-0 text-gray-500' />
              <input
                type='text'
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder='123456'
                inputMode='numeric'
                autoComplete='one-time-code'
                maxLength={8}
                className='w-full bg-transparent py-3.5 text-center text-base tracking-[0.45em] text-white outline-none placeholder:text-gray-500'
              />
            </div>
            {error && <p className='text-xs text-red-400'>{error}</p>}
            <Button onClick={verifyOtp} disabled={verifying} className='w-full' size='lg' variant='primary'>
              {verifying ? 'Verifying…' : 'Verify'}
            </Button>
            <button
              type='button'
              onClick={() => {
                setStep('phone');
                setCode('');
                confirmationRef.current = null;
              }}
              className='inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white'
            >
              <ArrowLeft className='h-3.5 w-3.5' />
              Change phone
            </button>
          </div>
        )}

        <div ref={recaptchaContainerRef} id='recaptcha-container' />
      </div>
    </main>
  );
}
