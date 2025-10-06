import { cn } from '@/lib/classMerge';

export const ErrorCard = ({ message, className }: { message: string; className?: string }) => {
  return (
    <div
      className={cn(
        'bg-danger-background flex min-h-28 items-center justify-center rounded border border-red-500',
        className
      )}
    >
      <span className="text-danger-foreground p-3 text-center">{message}</span>
    </div>
  );
};
