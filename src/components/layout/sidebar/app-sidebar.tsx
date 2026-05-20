'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import { NavMain } from '@/components/layout/sidebar/navs/nav-main';
import { NavUser } from '@/components/layout/sidebar/navs/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { FlagIcon, LayoutDashboardIcon, QrCodeIcon, ShieldIcon, UsersIcon } from 'lucide-react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.replace('/admin-panel/login');
  }

  const data = {
    user: {
      name: 'Admin',
      email: session?.user?.email ?? 'football operations',
      avatar: '',
    },
    navMain: [
      {
        title: 'Analytics',
        url: '/admin-panel/dashboard',
        icon: <LayoutDashboardIcon />,
        isActive: pathname.startsWith('/admin-panel/dashboard'),
        items: [
          {
            title: 'Dashboard',
            url: '/admin-panel/dashboard',
          },
        ],
      },
      {
        title: 'Players',
        url: '/admin-panel/players',
        icon: <UsersIcon />,
        isActive: pathname.startsWith('/admin-panel/players'),
        items: [
          {
            title: 'All players',
            url: '/admin-panel/players',
          },
        ],
      },
      {
        title: 'Scores',
        url: '/admin-panel/scores/flagged',
        icon: <FlagIcon />,
        isActive: pathname.startsWith('/admin-panel/scores') || pathname.startsWith('/admin-panel/winners'),
        items: [
          {
            title: 'Flagged scores',
            url: '/admin-panel/scores/flagged',
          },
          {
            title: 'Winners',
            url: '/admin-panel/winners',
          },
        ],
      },
      {
        title: 'Campaign',
        url: '/admin-panel/qr',
        icon: <QrCodeIcon />,
        isActive: pathname.startsWith('/admin-panel/qr') || pathname.startsWith('/admin-panel/settings'),
        items: [
          {
            title: 'QR codes',
            url: '/admin-panel/qr',
          },
          {
            title: 'Settings',
            url: '/admin-panel/settings',
          },
        ],
      },
    ],
  };

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <div className='flex items-center gap-2 px-4 py-2'>
          <div className='bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg'>
            <ShieldIcon className='h-5 w-5' />
          </div>
          <div className='flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden'>
            <span className='font-semibold'>Football Admin</span>
            <span className='text-muted-foreground text-xs'>Operations</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} onLogout={handleSignOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
