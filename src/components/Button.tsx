import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] backdrop-blur-md',
        'font-medium transition-all duration-150 ease-out',
        'active:scale-[0.97]', // iOS-style press feedback
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        variant === 'primary' &&
          'bg-primary-900 text-white shadow-xl shadow-primary-900/15 hover:bg-primary-700 active:shadow-none',
        variant === 'secondary' &&
          'bg-gold-500 text-primary-900 shadow-xl shadow-gold-500/20 hover:bg-gold-400 active:shadow-none',
        variant === 'ghost' && 'border border-white/70 bg-white/55 text-primary-700 shadow-lg shadow-primary-900/5 hover:bg-white/80',
        variant === 'outline' && 'border border-slate-300 bg-white/80 text-slate-700 hover:bg-slate-50',
        variant === 'danger' && 'bg-danger text-white hover:opacity-90',
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}
