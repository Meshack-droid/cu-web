import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    // Every input must have a stable id so its <label> is programmatically
    // associated for screen readers (WCAG — Chapter 56), even when the
    // caller doesn't pass an explicit id or name.
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={clsx(
            'rounded-[var(--radius-input)] border bg-white/60 px-3.5 py-3 text-sm outline-none backdrop-blur-md transition-all',
            'focus:border-primary-500 focus:bg-white/80 focus:ring-2 focus:ring-primary-300/40',
            error ? 'border-danger' : 'border-white/80',
            className
          )}
          {...props}
        />
        {hint && !error && <span id={`${inputId}-hint`} className="text-xs text-slate-500">{hint}</span>}
        {error && (
          <span id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
