import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { cn } from '@/lib/classMerge';

export const GeneratingContent = ({
  messageId,
  className
}: {
  messageId: string;
  className?: string;
}) => {
  return (
    <div className={cn('right-0 bottom-0 left-0 -mt-68', className)}>
      <ShimmerText text="Generating..." className="text-lg" />
    </div>
  );
};
