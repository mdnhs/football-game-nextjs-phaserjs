'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/layout/sidebar/app-sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { usePermissions } from '@/lib/permission/usePermissions';
import type { PermissionValue } from '@/lib/permission/utils';

interface AdminShellProps {
  title: string;
  children: React.ReactNode;
  requirePermissions?: PermissionValue[];
  requireAll?: boolean;
}

export function AdminShell({ title, children, requirePermissions, requireAll = false }: AdminShellProps) {
  const router = useRouter();
  const { status } = useSession();
  const { hasAnyPermission, hasAllPermissions, isLoading: permsLoading } = usePermissions();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/admin/login');
  }, [router, status]);

  if (status !== 'authenticated') return null;

  const accessGranted =
    !requirePermissions || requirePermissions.length === 0
      ? true
      : permsLoading
        ? null
        : requireAll
          ? hasAllPermissions(requirePermissions)
          : hasAnyPermission(requirePermissions);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
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
          <div className='px-4'>
            <ThemeToggle />
          </div>
        </header>
        <main className='flex-1 p-6'>
          {accessGranted === false ? (
            <AccessDenied />
          ) : accessGranted === null ? (
            <div className='text-muted-foreground p-6 text-sm'>Loading…</div>
          ) : (
            children
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AccessDenied() {
  return (
    <div className='flex flex-1 items-center justify-center p-6'>
      <Card className='border-destructive/30 w-full max-w-md'>
        <CardHeader>
          <div className='bg-destructive/10 ring-destructive/20 mb-2 flex h-12 w-12 items-center justify-center rounded-full ring-1'>
            <ShieldAlert className='text-destructive h-6 w-6' />
          </div>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to view this page. Contact a super admin if you believe this is a mistake.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-xs'>
            Need access? Ask a super admin to update your role under <strong>Access Control → Roles</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
