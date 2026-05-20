import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { geist } from '@/lib/font';
import ProviderWrapper from '@/contexts/ProviderWrapper';

export const metadata: Metadata = {
  title: 'Penalty Showdown ⚽',
  description: 'Score goals, top the leaderboard, win prizes!',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000814',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={cn('font-sans', geist.variable)} suppressHydrationWarning>
      <body className='overflow-hidden bg-[#000814] text-white'>
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  );
}
