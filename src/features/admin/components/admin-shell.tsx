'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/layout/sidebar/app-sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { getAdminSecret } from '@/features/admin/services/auth';

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const [hasSecret, setHasSecret] = useState<boolean | null>(null);

  useEffect(() => {
    const secret = getAdminSecret();
    // Hydrating client-only localStorage state — required setState in effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasSecret(!!secret);
    if (!secret) router.replace('/admin-panel/login');
  }, [router]);

  if (hasSecret !== true) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 data-vertical:h-4 data-vertical:self-auto' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className='flex-1 p-6'>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
