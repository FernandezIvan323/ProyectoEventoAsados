import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(function Input({ className, type, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'border-white/15 bg-[#0A1428] ring-offset-[#0A1428] placeholder:text-[#8BA0B0]/40 selection:bg-[#E8834A] selection:text-[#0A1428] flex h-10 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm text-white shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus:border-[#E8834A] focus:ring-4 focus:ring-[#E8834A]/15 focus:shadow-[0_0_15px_rgba(232,131,74,0.15)]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
});

export { Input };
