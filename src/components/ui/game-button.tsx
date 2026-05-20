'use client';

import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-black shadow-lg shadow-green-500/20',
  secondary: 'bg-white/10 hover:bg-white/20 active:bg-white/5 text-white font-semibold border border-white/10',
  ghost: 'text-gray-400 hover:text-white',
};

const sizes = {
  sm: 'py-2 px-4 text-sm rounded-lg',
  md: 'py-3 px-6 text-base rounded-xl',
  lg: 'py-4 px-8 text-lg rounded-xl',
};

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'transition-all duration-150 active:scale-95 disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
