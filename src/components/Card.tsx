import { type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /**
   * 'flat' — plain bordered surface, used on dense data screens (tables,
   *          admin lists) where the "institutional portal" feel matters most.
   * 'glass' — frosted translucent surface over the mesh hero background,
   *           used on auth pages and hero sections.
   * 'clay' — soft dual-shadow raised surface, used for elevated cards on
   *          the member dashboard (stat cards, quick actions).
   */
  variant?: 'flat' | 'glass' | 'clay';
}

export function Card({ className, children, variant = 'flat', ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'p-6',
        variant === 'flat' && 'rounded-[var(--radius-card)] border border-slate-200 bg-white',
        variant === 'glass' && 'surface-glass rounded-[var(--radius-glass)]',
        variant === 'clay' && 'surface-clay rounded-[var(--radius-clay)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
