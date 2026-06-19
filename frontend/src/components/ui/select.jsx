import { cn } from '@/lib/utils';

function Select({ className, children, ...props }) {
  return (
    <select
      data-slot="select"
      className={cn(
        'border-white/15 bg-[#0A1428] ring-offset-[#0A1428] placeholder:text-[#8BA0B0]/40 selection:bg-[#E8834A] selection:text-[#0A1428] flex h-10 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm text-white shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus:border-[#E8834A] focus:ring-4 focus:ring-[#E8834A]/15 focus:shadow-[0_0_15px_rgba(232,131,74,0.15)]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        'appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23E8834A%22%3E%3Cpath%20d%3D%22M5.23%207.23a.75.75%200%20011.06%200L10%2010.94l3.71-3.71a.75.75%200%20111.06%201.06l-4.24%204.24a.75.75%200%2001-1.06%200L5.23%208.29a.75.75%200%20010-1.06z%22%2F%3E%3C%2Fsvg%3E")] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };
