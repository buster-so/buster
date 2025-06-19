import type React from 'react';
import { forwardRef } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/classMerge';

interface MessageContainerProps {
  children: React.ReactNode;
  senderName?: string;
  senderId?: string;
  senderAvatar?: string | null;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MessageContainer = forwardRef<HTMLDivElement, MessageContainerProps>(
  (
    { children, senderName, senderId, senderAvatar, className = '', onMouseEnter, onMouseLeave },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={'flex w-full space-x-2'}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        {senderName ? (
          <Avatar size={24} name={senderName} image={senderAvatar || ''} useToolTip={true} />
        ) : (
          <Avatar size={24} />
        )}
        <div className={cn('relative mt-1 w-full px-1', className)}>{children}</div>
      </div>
    );
  }
);

MessageContainer.displayName = 'MessageContainer';
