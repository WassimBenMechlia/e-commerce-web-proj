import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref,
) {
  return (
    <label className="grid gap-2 text-sm text-text-secondary" htmlFor={id}>
      {label ? <span className="font-medium text-text-primary">{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-12 rounded-input border border-border bg-background-primary px-4 text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15',
          error ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/15' : '',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-brand-error">{error}</span> : null}
    </label>
  );
});
