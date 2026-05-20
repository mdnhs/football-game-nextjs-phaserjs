import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className='bg-background text-foreground fixed inset-0 overflow-auto'>{children}</div>
      <Toaster richColors position='top-right' />
    </TooltipProvider>
  );
}
