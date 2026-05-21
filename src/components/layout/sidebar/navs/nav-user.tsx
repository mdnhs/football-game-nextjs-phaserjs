'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { ChevronsUpDownIcon, LogOutIcon, ShieldCheckIcon, UserCogIcon, KeyRoundIcon } from 'lucide-react';

interface NavUserProps {
  user: {
    name: string;
    email: string;
    role?: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

function initials(value: string) {
  const base = (value ?? 'A').split(/[@.\s]/)[0] ?? 'A';
  return base.slice(0, 2).toUpperCase();
}

export function NavUser({ user, onLogout }: NavUserProps) {
  const { isMobile } = useSidebar();
  const init = initials(user.email || user.name);
  const role = user.role ?? 'admin';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                className='aria-expanded:bg-muted hover:bg-muted/60 data-[state=open]:bg-muted h-auto py-2 transition'
              />
            }
          >
            <Avatar className='ring-background h-9 w-9 shrink-0 ring-2'>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className='bg-linear-to-br from-indigo-500 to-[#00e676] text-xs font-bold text-white'>
                {init}
              </AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>{user.name}</span>
              <span className='text-muted-foreground truncate text-[11px]'>{user.email}</span>
            </div>
            <ChevronsUpDownIcon className='text-muted-foreground ml-auto size-4 shrink-0' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='min-w-64 rounded-xl p-1.5'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={8}
          >
            <div className='bg-muted/50 mb-1 flex items-center gap-3 rounded-lg p-2.5'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='bg-linear-to-br from-indigo-500 to-[#00e676] text-sm font-bold text-white'>
                  {init}
                </AvatarFallback>
              </Avatar>
              <div className='grid min-w-0 flex-1 text-left leading-tight'>
                <span className='truncate text-sm font-semibold'>{user.name}</span>
                <span className='text-muted-foreground truncate text-xs'>{user.email}</span>
                <Badge variant='secondary' className='mt-1 w-fit gap-1 text-[10px]'>
                  <ShieldCheckIcon className='h-2.5 w-2.5 text-emerald-500' />
                  {role}
                </Badge>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <Link href='/admin/account' className='flex items-center gap-2'>
                    <UserCogIcon className='text-muted-foreground h-4 w-4' />
                    Account settings
                  </Link>
                }
              />
              <DropdownMenuItem
                render={
                  <Link href='/admin/account' className='flex items-center gap-2'>
                    <KeyRoundIcon className='text-muted-foreground h-4 w-4' />
                    Change password
                  </Link>
                }
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className='text-destructive focus:text-destructive gap-2'>
              <LogOutIcon className='h-4 w-4' />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
