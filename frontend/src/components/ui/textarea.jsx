import { cn } from '@/lib/utils';

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-white/15 bg-[#0A1428] ring-offset-[#0A1428] placeholder:text-[#8BA0B0]/40 flex min-h-[80px] w-full rounded-lg border px-3.5 py-2 text-sm text-white shadow-xs transition-all duration-200 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus:border-[#E8834A] focus:ring-4 focus:ring-[#E8834A]/15 focus:shadow-[0_0_15px_rgba(232,131,74,0.15)]',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
