'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Player } from '@/features/admin/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/features/admin/utils/format';
import { ShieldAlert, ShieldCheck, UserMinus, UserPlus, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const createColumns = (toggleBlock: (p: Player) => void, busyId: string | null): ColumnDef<Player>[] => [
  {
    accessorKey: 'display_name',
    header: 'Name',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('display_name')}</div>,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => <div className='text-muted-foreground font-mono text-xs'>{row.getValue('phone')}</div>,
  },
  {
    accessorKey: 'play_count',
    header: () => <div className='text-center'>Matches</div>,
    cell: ({ row }) => <div className='text-center font-semibold'>{row.getValue('play_count')}</div>,
  },
  {
    accessorKey: 'is_blocked',
    header: 'Status',
    cell: ({ row }) => {
      const isBlocked = row.getValue('is_blocked') as boolean;
      return isBlocked ? (
        <Badge variant='destructive' className='gap-1'>
          <ShieldAlert className='h-3 w-3' />
          Blocked
        </Badge>
      ) : (
        <Badge variant='secondary' className='gap-1 bg-green-100 text-green-700 hover:bg-green-200'>
          <ShieldCheck className='h-3 w-3' />
          Active
        </Badge>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Joined Date',
    cell: ({ row }) => <div className='text-muted-foreground text-sm'>{fmtDate(row.getValue('created_at'))}</div>,
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Actions</div>,
    cell: ({ row }) => {
      const player = row.original;
      const isBlocked = player.is_blocked;

      return (
        <div className='text-right'>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              }
            />
            <DropdownMenuContent align='end'>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(player.phone)}>
                  Copy phone number
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={busyId === player.id}
                  onClick={() => toggleBlock(player)}
                  className={isBlocked ? 'text-green-600' : 'text-destructive'}
                >
                  {isBlocked ? (
                    <>
                      <UserPlus className='mr-2 h-4 w-4' />
                      Unblock Player
                    </>
                  ) : (
                    <>
                      <UserMinus className='mr-2 h-4 w-4' />
                      Block Player
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
