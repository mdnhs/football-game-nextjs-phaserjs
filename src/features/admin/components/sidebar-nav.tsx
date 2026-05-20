'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Users, Flag, Trophy, QrCode, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearAdminSecret } from '@/features/admin/services/auth';

const items = [
  { href: '/admin-panel/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin-panel/players', label: 'Players', icon: Users },
  { href: '/admin-panel/scores/flagged', label: 'Flagged Scores', icon: Flag },
  { href: '/admin-panel/winners', label: 'Winners', icon: Trophy },
  { href: '/admin-panel/qr', label: 'QR Codes', icon: QrCode },
  { href: '/admin-panel/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    clearAdminSecret();
    router.replace('/admin-panel/login');
  }

  return (
    <Sidebar>
      <SidebarHeader className='px-4 py-4'>
        <div className='text-lg font-semibold'>Football Admin</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.href || (item.href !== '/admin-panel/dashboard' && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={active}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='p-3'>
        <Button variant='outline' onClick={signOut} className='w-full'>
          <LogOut className='mr-2 h-4 w-4' />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
