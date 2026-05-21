'use client';

import { ColumnDef } from '@tanstack/react-table';
import { QrCode } from '@/features/admin/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/features/admin/utils/format';
import { BarChart3, QrCode as QrIcon, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const createColumns = (
  setPreview: (q: QrCode) => void,
  setPreviewOpen: (open: boolean) => void,
  toggleActive: (q: QrCode) => void,
  busyId: string | null,
): ColumnDef<QrCode>[] => [
  {
    accessorKey: 'label',
    header: 'Label',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('label')}</div>,
  },
  {
    accessorKey: 'ref',
    header: 'Reference',
    cell: ({ row }) => <code className='bg-muted rounded px-1.5 py-0.5 font-mono text-xs'>{row.getValue('ref')}</code>,
  },
  {
    accessorKey: 'scan_count',
    header: () => <div className='text-center'>Scans</div>,
    cell: ({ row }) => <div className='text-center font-bold'>{row.getValue('scan_count')}</div>,
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean;
      return isActive ? (
        <Badge variant='secondary' className='bg-green-100 text-green-700 hover:bg-green-200'>
          Active
        </Badge>
      ) : (
        <Badge variant='outline' className='text-muted-foreground'>
          Inactive
        </Badge>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => <div className='text-muted-foreground text-sm'>{fmtDate(row.getValue('created_at'))}</div>,
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Actions</div>,
    cell: ({ row }) => {
      const q = row.original;
      return (
        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setPreview(q);
              setPreviewOpen(true);
            }}
            className='h-8 gap-1'
          >
            <QrIcon className='h-3.5 w-3.5' />
            QR
          </Button>
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
                <DropdownMenuLabel>Campaign Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  render={
                    <Link href={`/admin/qr/${q.id}`} className='flex items-center'>
                      <BarChart3 className='mr-2 h-4 w-4' />
                      View Analytics
                    </Link>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={busyId === q.id}
                  onClick={() => toggleActive(q)}
                  className={q.is_active ? 'text-destructive' : 'text-green-600'}
                >
                  {q.is_active ? 'Deactivate QR' : 'Activate QR'}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
