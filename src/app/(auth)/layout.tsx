import { Toaster } from '@/components/ui/sonner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className='fixed inset-0 overflow-auto bg-[#000814] text-white'>{children}</div>
      <Toaster richColors position='top-right' />
    </>
  );
}
