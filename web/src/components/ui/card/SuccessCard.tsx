import { cn } from '@/lib/classMerge';
import React from 'react';
import { CircleCheck } from '../icons/NucleoIconFilled';
import { Card, CardContent, CardTitle } from './CardBase';

interface SuccessCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The title of the success card
   */
  title: string;
  /**
   * The message to display in the success card
   */
  message: string;
  /**
   * Optional additional content to render below the message
   */
  extra?: React.ReactNode;
  /**
   * Optional className to apply to the card
   */
  className?: string;
}

export const SuccessCard = React.forwardRef<HTMLDivElement, SuccessCardProps>(
  ({ title, message, extra, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
        <CardContent className="flex flex-col items-center gap-y-4 text-center">
          <div className="text-success-foreground flex flex-col items-center justify-center gap-y-3.5 text-4xl">
            <CircleCheck title="Success Icon" />
            <CardTitle className="text-success-foreground text-xl">{title}</CardTitle>
          </div>

          <p className="text-md text-text-secondary">{message}</p>

          {extra && <div className="w-full">{extra}</div>}
        </CardContent>
      </Card>
    );
  }
);

SuccessCard.displayName = 'SuccessCard';
