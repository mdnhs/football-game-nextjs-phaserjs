'use client';

import { ColumnDef } from '@tanstack/react-table';
import { FlaggedScore } from '@/features/admin/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/features/admin/utils/format';
import { Eye } from 'lucide-react';

export const createColumns = (openDetails: (s: FlaggedScore) => void): ColumnDef<FlaggedScore>[] => [
  {
    accessorKey: 'players.display_name',
    header: 'Player',
    cell: ({ row }) => <div className='font-medium'>{row.original.players?.display_name ?? '—'}</div>,
  },
  {
    accessorKey: 'players.phone',
    header: 'Phone',
    cell: ({ row }) => (
      <div className='text-muted-foreground font-mono text-xs'>{row.original.players?.phone ?? '—'}</div>
    ),
  },
  {
    accessorKey: 'total_score',
    header: () => <div className='text-right'>Score</div>,
    cell: ({ row }) => (
      <div className='text-right'>
        <Badge variant='destructive' className='font-mono'>
          {row.getValue('total_score')}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: 'goals',
    header: () => <div className='text-right'>Goals</div>,
    cell: ({ row }) => <div className='text-right'>{row.getValue('goals')}</div>,
  },
  {
    accessorKey: 'played_at',
    header: 'Played At',
    cell: ({ row }) => <div className='text-muted-foreground text-sm'>{fmtDate(row.getValue('played_at'))}</div>,
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Shot Log</div>,
    cell: ({ row }) => {
      const score = row.original;
      return (
        <div className='text-right'>
          <Button variant='outline' size='sm' onClick={() => openDetails(score)} className='gap-2'>
            <Eye className='h-4 w-4' />
            View
          </Button>
        </div>
      );
    },
  },
];
