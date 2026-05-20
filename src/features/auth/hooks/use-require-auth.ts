'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth-store';

export function useRequireAuth(): boolean {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isPending = useAuthStore((s) => s.isPending);

  useEffect(() => {
    if (!token) router.replace('/auth');
    else if (isPending) router.replace('/auth/profile');
  }, [token, isPending, router]);

  return !!token && !isPending;
}
