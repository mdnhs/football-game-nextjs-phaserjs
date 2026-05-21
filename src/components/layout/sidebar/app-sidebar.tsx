'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import { NavMain } from '@/components/layout/sidebar/navs/nav-main';
import { NavUser } from '@/components/layout/sidebar/navs/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import {
  FlagIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UserCogIcon,
  UsersIcon,
  ShieldIcon,
} from 'lucide-react';
import { usePermissions } from '@/lib/permission/usePermissions';
import type { PermissionValue } from '@/lib/permission/utils';

interface SubItem {
  title: string;
  url: string;
  permissions?: PermissionValue[];
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  isActive: boolean;
  permissions?: PermissionValue[];
  items?: SubItem[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { hasAnyPermission } = usePermissions();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.replace('/admin/login');
  }

  const sections: NavSection[] = [
    {
      label: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/admin/dashboard',
          icon: <LayoutDashboardIcon />,
          isActive: pathname.startsWith('/admin/dashboard'),
          permissions: ['admin.dashboard.view'],
        },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          title: 'Players',
          url: '/admin/players',
          icon: <UsersIcon />,
          isActive: pathname.startsWith('/admin/players'),
          permissions: ['admin.player.view_list'],
        },
        {
          title: 'Scores',
          url: '/admin/scores/flagged',
          icon: <FlagIcon />,
          isActive: pathname.startsWith('/admin/scores') || pathname.startsWith('/admin/winners'),
          permissions: ['admin.score.view_list', 'admin.winner.view_list'],
          items: [
            { title: 'Flagged scores', url: '/admin/scores/flagged', permissions: ['admin.score.view_list'] },
            { title: 'Winners', url: '/admin/winners', permissions: ['admin.winner.view_list'] },
          ],
        },
        {
          title: 'Campaign',
          url: '/admin/qr',
          icon: <QrCodeIcon />,
          isActive: pathname.startsWith('/admin/qr') || pathname.startsWith('/admin/settings'),
          permissions: ['admin.qr.view_list', 'admin.settings.view'],
          items: [
            { title: 'QR codes', url: '/admin/qr', permissions: ['admin.qr.view_list'] },
            { title: 'Settings', url: '/admin/settings', permissions: ['admin.settings.view'] },
          ],
        },
        {
          title: 'Ads',
          url: '/admin/ads',
          icon: <MegaphoneIcon />,
          isActive: pathname.startsWith('/admin/ads'),
          permissions: ['admin.ad.view_list'],
        },
      ],
    },
    {
      label: 'Access Control',
      items: [
        {
          title: 'Roles & permissions',
          url: '/admin/roles',
          icon: <ShieldCheckIcon />,
          isActive: pathname.startsWith('/admin/roles'),
          permissions: ['admin.rbac.view'],
        },
        {
          title: 'Admins',
          url: '/admin/admins',
          icon: <UserCogIcon />,
          isActive: pathname.startsWith('/admin/admins'),
          permissions: ['admin.admin.view_list'],
        },
      ],
    },
  ];

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => !item.permissions || hasAnyPermission(item.permissions))
        .map((item) => ({
          ...item,
          items: item.items?.filter((sub) => !sub.permissions || hasAnyPermission(sub.permissions)),
        })),
    }))
    .filter((section) => section.items.length > 0);

  const user = {
    name: session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'Admin',
    email: session?.user?.email ?? '—',
    role: session?.user?.role ?? 'admin',
  };

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='border-b'>
        <div className='flex items-center gap-3 px-2 py-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'>
          <div className='relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#00e676] to-emerald-600 shadow-[0_4px_16px_-4px_rgba(0,230,118,0.5)]'>
            <ShieldIcon className='h-5 w-5 text-[#000814]' />
            <span className='border-background absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 bg-emerald-400' />
          </div>
          <div className='flex flex-1 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden'>
            <span className='text-sm font-bold tracking-tight'>Football Admin</span>
            <span className='text-muted-foreground text-[10px] font-medium tracking-widest uppercase'>
              Operations Console
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className='gap-1'>
        {filteredSections.map((section) => (
          <NavMain key={section.label} label={section.label} items={section.items} />
        ))}
      </SidebarContent>
      <SidebarFooter className='border-t'>
        <NavUser user={user} onLogout={handleSignOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
