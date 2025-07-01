import type React from 'react';
import { forwardRef } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/classMerge';
import { BusterLoadingAvatar } from '@/components/ui/avatar/BusterLoadingAvatar';

interface MessageContainerProps {
  children: React.ReactNode;
  senderName?: string;
  senderId?: string;
  senderAvatar?: string | null;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  hideAvatar?: boolean;
  isCompletedStream: boolean;
  isFinishedReasoning: boolean;
  hasReasoningMessage: boolean;
}

export const MessageContainer = forwardRef<HTMLDivElement, MessageContainerProps>(
  (
    {
      children,
      senderName,
      senderId,
      senderAvatar,
      className = '',
      hideAvatar = false,
      hasReasoningMessage,
      isCompletedStream,
      isFinishedReasoning,
      onMouseEnter,
      onMouseLeave
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={'flex w-full space-x-2'}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <div className={cn('w-6 transition-opacity', hideAvatar ? 'opacity-0' : 'opacity-100')}>
          {senderName ? (
            <Avatar size={24} name={senderName} image={senderAvatar || ''} useToolTip={true} />
          ) : (
            <BusterLoadingAvatar
              loading={!isCompletedStream && !isFinishedReasoning}
              variant={hasReasoningMessage ? 'default' : 'gray'}
            />
          )}
        </div>
        <div className={cn('relative mt-1 w-full px-1', className)}>{children}</div>
      </div>
    );
  }
);

MessageContainer.displayName = 'MessageContainer';
