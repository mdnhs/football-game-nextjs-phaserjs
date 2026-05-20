'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DailyWinner } from '@/features/admin/types';

export const columns: ColumnDef<DailyWinner>[] = [
  {
    id: 'rank',
    header: 'Rank',
    cell: ({ row }) => <div className='font-bold'>{row.index + 1}</div>,
  },
  {
    accessorKey: 'display_name',
    header: 'Name',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('display_name')}</div>,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => <div className='font-mono text-sm'>{row.getValue('phone')}</div>,
  },
  {
    accessorKey: 'best_score',
    header: () => <div className='text-right'>Score</div>,
    cell: ({ row }) => (
      <div className='text-primary text-right font-mono font-semibold'>{row.getValue('best_score')}</div>
    ),
  },
  {
    accessorKey: 'best_goals',
    header: () => <div className='text-right'>Goals</div>,
    cell: ({ row }) => <div className='text-right font-mono'>{row.getValue('best_goals')}</div>,
  },
];
