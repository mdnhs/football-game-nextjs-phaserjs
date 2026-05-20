'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, Home, LogOut, Trophy, User } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { cn } from '@/lib/utils';

interface Props {
  showBack?: boolean;
  title?: string;
}

export default function TopBar({ showBack, title }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const player = useAuthStore((s) => s.player);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function signOut() {
    setOpen(false);
    clearAuth();
    router.replace('/auth');
  }

  const initial = player?.displayName?.trim()?.charAt(0)?.toUpperCase() ?? '?';
  const displayName = player?.displayName?.trim() || 'Player';

  return (
    <div className='safe-top relative z-30 px-4 pt-3 pb-2'>
      <div className='flex items-center justify-between rounded-2xl border border-white/10 bg-[#071225]/80 px-2.5 py-2 shadow-2xl shadow-black/20 backdrop-blur-md'>
        <div className='flex items-center gap-2'>
          {showBack ? (
            <button
              onClick={() => router.back()}
              className='flex h-9 w-9 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white'
              aria-label='Back'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
          ) : (
            <Link
              href='/menu'
              className='flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10'
              aria-label='Home'
            >
              <Home className='h-[18px] w-[18px]' />
            </Link>
          )}
          {title && <h1 className='max-w-[12rem] truncate text-base font-black text-white'>{title}</h1>}
        </div>

        <div ref={menuRef} className='relative'>
          <button
            onClick={() => setOpen((v) => !v)}
            className='flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-3 pl-1 transition-colors hover:bg-white/10'
            aria-expanded={open}
            aria-haspopup='menu'
          >
            <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-300 to-emerald-500 text-sm font-black text-black shadow-lg shadow-green-500/20'>
              {initial}
            </span>
            <span className='max-w-[9rem] truncate text-xs font-bold text-white'>{displayName}</span>
          </button>

          {open && (
            <div
              className='absolute top-full right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#071225] shadow-2xl shadow-black/40'
              role='menu'
            >
              <div className='border-b border-white/10 px-3 py-3'>
                <p className='text-[10px] font-semibold tracking-widest text-green-300/80 uppercase'>Signed in</p>
                <p className='mt-1 truncate text-sm font-bold text-white'>{displayName}</p>
                <p className='truncate text-[11px] text-gray-500'>{player?.phone}</p>
              </div>
              <Link
                href='/profile'
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 text-sm transition-colors',
                  pathname === '/profile'
                    ? 'bg-white/5 text-green-300'
                    : 'text-gray-200 hover:bg-white/5 hover:text-white',
                )}
                role='menuitem'
              >
                <User className='h-4 w-4' /> Profile
              </Link>
              <Link
                href='/leaderboard'
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 text-sm transition-colors',
                  pathname === '/leaderboard'
                    ? 'bg-white/5 text-green-300'
                    : 'text-gray-200 hover:bg-white/5 hover:text-white',
                )}
                role='menuitem'
              >
                <Trophy className='h-4 w-4' /> Leaderboard
              </Link>
              <button
                onClick={signOut}
                className='flex w-full items-center gap-2 border-t border-white/10 px-3 py-2.5 text-left text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10'
                role='menuitem'
              >
                <LogOut className='h-4 w-4' /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
