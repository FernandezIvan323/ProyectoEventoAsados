import { Children, cloneElement } from 'react';
import { cn } from '@/lib/utils';

function FormField({ label, error, hint, required, children, className, labelClassName, errorClassName, ...props }) {
  const enhanced = Children.map(children, child => {
    if (!child || !error) return child;
    return cloneElement(child, { 'aria-invalid': true, 'data-invalid': true });
  });

  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      {label && (
        <label className={cn('text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase', labelClassName)}>
          {label}{required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {enhanced}
      {hint && !error && (
        <p className="text-[10px] text-muted-foreground/50">{hint}</p>
      )}
      {error && (
        <p className={cn('text-xs text-destructive', errorClassName)} role="alert">{error}</p>
      )}
    </div>
  );
}

export { FormField };
