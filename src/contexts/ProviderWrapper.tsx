'use client';

import { ReactNode } from 'react';
import { QueryProvider } from '@/contexts/QueryProvider';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import LoadingOverlayProvider from '@/contexts/LoadingOverlayProvider';

export default function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
        <LoadingOverlayProvider>{children}</LoadingOverlayProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
