import React from 'react';
import { Text } from '../typography/Text';
import { Avatar } from './Avatar';
import { cn } from '@/lib/classMerge';

export const AvatarUserButton = React.forwardRef<
  HTMLDivElement,
  {
    username?: string;
    avatarUrl?: string;
    email?: string;
    className?: string;
  }
>(({ username, avatarUrl, email, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'hover:bg-item-hover active:bg-item-active flex w-full cursor-pointer items-center gap-x-2 rounded-md p-1',
        className
      )}>
      <Avatar size={28} fallbackClassName="text-base" image={avatarUrl} name={username} />
      <div className="flex w-full flex-col gap-y-0 overflow-hidden">
        <Text truncate className="flex-grow">
          {username}
        </Text>
        <Text truncate size={'sm'} variant={'secondary'}>
          {email}
        </Text>
      </div>
    </div>
  );
});

AvatarUserButton.displayName = 'AvatarUserButton';
